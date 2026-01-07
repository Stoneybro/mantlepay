import {
  MneeSmartWalletFactory,
  MneeSmartWallet,
  MneeIntentRegistry
} from "../generated";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a human-readable name for an intent
 */
function generateIntentName(intentId: string, recipientCount: number, token: string): string {
  const shortId = intentId.slice(0, 8);
  const tokenSymbol = token === "0x0000000000000000000000000000000000000000" ? "ETH" : "USDC";
  return `Payment to ${recipientCount} ${recipientCount === 1 ? 'recipient' : 'recipients'} (${shortId})`;
}

/**
 * Decode common function selectors
 */
function decodeFunctionSelector(selector: string): string {
  const selectorMap: Record<string, string> = {
    "0xa9059cbb": "transfer",
    "0x095ea7b3": "approve",
    "0x23b872dd": "transferFrom",
    "0x00000000": "direct_eth_transfer"
  };
  return selectorMap[selector] || "unknown";
}

/**
 * Extract token transfer details from calldata
 */
function extractTokenTransfer(selector: string, calldata: string): {
  isTransfer: boolean;
  recipient?: string;
  amount?: bigint;
} {
  if (selector === "0xa9059cbb" && calldata.length >= 74) {
    // transfer(address,uint256)
    const recipient = "0x" + calldata.slice(34, 74);
    const amount = BigInt("0x" + calldata.slice(74, 138));
    return { isTransfer: true, recipient, amount };
  }
  return { isTransfer: false };
}

/**
 * Calculate progress percentage
 */
function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.floor((completed / total) * 100);
}

/**
 * Format interval as human-readable string
 */
function formatInterval(seconds: bigint): string {
  const secs = Number(seconds);
  if (secs >= 86400) return `every ${Math.floor(secs / 86400)} day(s)`;
  if (secs >= 3600) return `every ${Math.floor(secs / 3600)} hour(s)`;
  return `every ${secs} second(s)`;
}

/**
 * Update wallet's daily activity
 */
async function updateDailyActivity(
  context: any,
  walletId: string,
  timestamp: bigint,
  activityType: string,
  value: bigint
) {
  const date = new Date(Number(timestamp) * 1000).toISOString().split('T')[0];
  const dailyId = `${walletId}-${date}`;

  let daily = await context.DailyWalletActivity.get(dailyId);
  if (!daily) {
    daily = {
      id: dailyId,
      wallet_id: walletId,
      date,
      totalActivities: 0,
      totalValueTransferred: 0n,
      executionCount: 0,
      intentExecutionCount: 0,
      activityTypes: [],
      activityCounts: []
    };
  }

  daily.totalActivities++;
  daily.totalValueTransferred += value;

  if (activityType === "EXECUTE" || activityType === "EXECUTE_BATCH") {
    daily.executionCount++;
  } else if (activityType === "INTENT_EXECUTED") {
    daily.intentExecutionCount++;
  }

  // Update activity type counts
  const typeIndex = daily.activityTypes.indexOf(activityType);
  if (typeIndex === -1) {
    daily.activityTypes.push(activityType);
    daily.activityCounts.push(1);
  } else {
    daily.activityCounts[typeIndex]++;
  }

  context.DailyWalletActivity.set(daily);
}

// ============================================
// FACTORY HANDLERS
// ============================================

MneeSmartWalletFactory.AccountCreated.contractRegister(({ event, context }) => {
  context.addMneeSmartWallet(event.params.account);
});

MneeSmartWalletFactory.AccountCreated.handler(async ({ event, context }) => {
  const walletId = event.params.account.toLowerCase();
  const ownerId = event.params.owner.toLowerCase();
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);

  // Create Wallet entity
  context.Wallet.set({
    id: walletId,
    owner: ownerId,
    deployedAt: timestamp,
    deployedBlock: BigInt(event.block.number),
    deployedTx: txHash,
    totalActivityCount: 0,
    totalValueTransferred: 0n
  });

  // Create Activity entry
  const activityId = `${txHash}-${event.logIndex}-created`;
  context.Activity.set({
    id: activityId,
    wallet_id: walletId,
    activityType: "WALLET_CREATED",
    timestamp,
    blockNumber: BigInt(event.block.number),
    txHash,
    logIndex: event.logIndex,
    initiator: event.params.owner.toLowerCase(),
    primaryToken: undefined,
    primaryAmount: undefined,
    executeDetails_id: undefined,
    batchDetails_id: undefined,
    intentCreatedDetails_id: undefined,
    intentExecutionDetails_id: undefined,
    intentCancellationDetails_id: undefined,
    involvedAddresses: [walletId, ownerId],
    tags: ["wallet", "deployment", "created"]
  });

  context.log.info(`✅ Wallet created: ${walletId} by ${ownerId}`);
});

// ============================================
// EXECUTE HANDLERS
// ============================================

MneeSmartWallet.Executed.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toLowerCase();
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);

  const target = event.params.target.toLowerCase();
  const value = event.params.value;
  const calldata = event.params.data;
  const selector = calldata.length >= 10 ? calldata.slice(0, 10) : "0x00000000";
  const decodedFunction = decodeFunctionSelector(selector);

  // Extract token transfer details if applicable
  const transferDetails = extractTokenTransfer(selector, calldata);

  // Create ExecuteDetails
  const detailsId = `${txHash}-${event.logIndex}-execute-details`;
  context.ExecuteDetails.set({
    id: detailsId,
    activity_id: `${txHash}-${event.logIndex}-execute`,
    target,
    value,
    calldata: calldata.length > 1000 ? calldata.slice(0, 1000) : calldata,
    functionSelector: selector,
    decodedFunction,
    isTokenTransfer: transferDetails.isTransfer,
    tokenTransferRecipient: transferDetails.recipient,
    tokenTransferAmount: transferDetails.amount
  });

  // Determine primary token and amount
  let primaryToken: string | undefined;
  let primaryAmount: bigint | undefined;
  const involvedAddresses = [walletId, target];

  if (transferDetails.isTransfer && transferDetails.recipient) {
    primaryToken = target; // Token contract
    primaryAmount = transferDetails.amount;
    involvedAddresses.push(transferDetails.recipient);
  } else if (value > 0n) {
    primaryToken = "0x0000000000000000000000000000000000000000"; // ETH
    primaryAmount = value;
  }

  // Create Activity
  const activityId = `${txHash}-${event.logIndex}-execute`;
  context.Activity.set({
    id: activityId,
    wallet_id: walletId,
    activityType: "EXECUTE",
    timestamp,
    blockNumber: BigInt(event.block.number),
    txHash,
    logIndex: event.logIndex,
    initiator: walletId,
    primaryToken,
    primaryAmount,
    executeDetails_id: detailsId,
    batchDetails_id: undefined,
    intentCreatedDetails_id: undefined,
    intentExecutionDetails_id: undefined,
    intentCancellationDetails_id: undefined,
    involvedAddresses,
    tags: ["execute", decodedFunction, transferDetails.isTransfer ? "transfer" : "call"]
  });

  // Update wallet aggregates
  const wallet = await context.Wallet.get(walletId);
  if (wallet) {
    context.Wallet.set({
      ...wallet,
      totalActivityCount: wallet.totalActivityCount + 1,
      totalValueTransferred: wallet.totalValueTransferred + (value || 0n)
    });
  }

  // Update daily activity
  await updateDailyActivity(context, walletId, timestamp, "EXECUTE", value || 0n);
});

MneeSmartWallet.ExecutedBatch.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toLowerCase();
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);

  const batchSize = Number(event.params.batchSize);
  const totalValue = event.params.totalValue;

  // Create BatchDetails
  const detailsId = `${txHash}-${event.logIndex}-batch-details`;
  context.BatchDetails.set({
    id: detailsId,
    activity_id: `${txHash}-${event.logIndex}-batch`,
    callCount: batchSize,
    totalValue
  });

  // Note: Individual BatchCall entities would need to be created
  // by listening to individual WalletAction events with actionType="BATCH"
  // Since Mnee doesn't have WalletAction, we can't populate individual calls
  // This is a limitation we document

  // Create Activity
  const activityId = `${txHash}-${event.logIndex}-batch`;
  context.Activity.set({
    id: activityId,
    wallet_id: walletId,
    activityType: "EXECUTE_BATCH",
    timestamp,
    blockNumber: BigInt(event.block.number),
    txHash,
    logIndex: event.logIndex,
    initiator: walletId,
    primaryToken: "0x0000000000000000000000000000000000000000",
    primaryAmount: totalValue,
    executeDetails_id: undefined,
    batchDetails_id: detailsId,
    intentCreatedDetails_id: undefined,
    intentExecutionDetails_id: undefined,
    intentCancellationDetails_id: undefined,
    involvedAddresses: [walletId],
    tags: ["batch", "execute", `${batchSize}_calls`]
  });

  // Update wallet
  const wallet = await context.Wallet.get(walletId);
  if (wallet) {
    context.Wallet.set({
      ...wallet,
      totalActivityCount: wallet.totalActivityCount + 1,
      totalValueTransferred: wallet.totalValueTransferred + totalValue
    });
  }

  await updateDailyActivity(context, walletId, timestamp, "EXECUTE_BATCH", totalValue);

  context.log.info(`📦 Batch executed: ${batchSize} calls, ${totalValue} value`);
});

// ============================================
// INTENT REGISTRY HANDLERS
// ============================================

MneeIntentRegistry.IntentCreated.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toLowerCase();
  const intentId = event.params.intentId;
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);

  const token = event.params.token.toLowerCase();
  const totalCommitment = event.params.totalCommitment;
  const totalExecutions = Number(event.params.totalTransactionCount);
  const interval = event.params.interval;
  const duration = event.params.duration;
  const startTime = event.params.transactionStartTime;
  const endTime = event.params.transactionEndTime;

  // We don't have recipients/amounts in the event, so we'll need to:
  // 1. Wait for first execution to populate them, OR
  // 2. Do a contract read (more expensive)
  // For now, use empty arrays and populate on first execution

  const displayName = generateIntentName(intentId, 0, token);

  // Create Intent
  context.Intent.set({
    id: intentId,
    wallet_id: walletId,
    displayName,
    token,
    recipients: [], // Will populate on first execution
    amountPerRecipient: [],
    startTime,
    endTime,
    intervalSeconds: interval,
    totalPlannedExecutions: totalExecutions,
    totalCommitted: totalCommitment,
    totalTransferred: 0n,
    totalFailed: 0n,
    status: "ACTIVE",
    createdAt: timestamp,
    createdTx: txHash,
    lastExecutedAt: undefined,
    completedAt: undefined,
    cancelledAt: undefined,
    cancelledTx: undefined,
    executionCount: 0,
    progressPercent: 0,
    nextExecutionDue: startTime
  });

  // Create IntentCreatedDetails
  const detailsId = `${txHash}-${event.logIndex}-intent-created-details`;
  const scheduleDescription = `${formatInterval(interval)} for ${Math.floor(Number(duration) / 86400)} days`;

  context.IntentCreatedDetails.set({
    id: detailsId,
    activity_id: `${txHash}-${event.logIndex}-intent-created`,
    intent_id: intentId,
    recipientCount: 0, // Will update on first execution
    totalCommitment,
    scheduleDescription
  });

  // Create Activity
  const activityId = `${txHash}-${event.logIndex}-intent-created`;
  context.Activity.set({
    id: activityId,
    wallet_id: walletId,
    activityType: "INTENT_CREATED",
    timestamp,
    blockNumber: BigInt(event.block.number),
    txHash,
    logIndex: event.logIndex,
    initiator: walletId,
    primaryToken: token,
    primaryAmount: totalCommitment,
    executeDetails_id: undefined,
    batchDetails_id: undefined,
    intentCreatedDetails_id: detailsId,
    intentExecutionDetails_id: undefined,
    intentCancellationDetails_id: undefined,
    involvedAddresses: [walletId],
    tags: ["intent", "created", "schedule"]
  });

  // Update wallet
  const wallet = await context.Wallet.get(walletId);
  if (wallet) {
    context.Wallet.set({
      ...wallet,
      totalActivityCount: wallet.totalActivityCount + 1
    });
  }

  await updateDailyActivity(context, walletId, timestamp, "INTENT_CREATED", 0n);

  context.log.info(`🎯 Intent created: ${displayName} (${intentId})`);
});

// ============================================
// INTENT EXECUTION HANDLERS
// ============================================

MneeSmartWallet.IntentBatchTransferExecuted.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toLowerCase();
  const intentId = event.params.intentId;
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);

  const executionNumber = Number(event.params.transactionCount);
  const token = event.params.token.toLowerCase();
  const recipientCount = Number(event.params.recipientCount);
  const totalValue = event.params.totalValue;
  const failedAmount = event.params.failedAmount;
  const successfulAmount = totalValue - failedAmount;

  // Create IntentExecution
  const executionId = `${intentId}-${executionNumber}`;

  // Count successes/failures by waiting for individual transfer events
  // We'll initialize with estimates and update as transfers come in
  const estimatedSuccessCount = failedAmount === 0n ? recipientCount : 0;
  const estimatedFailureCount = recipientCount - estimatedSuccessCount;

  context.IntentExecution.set({
    id: executionId,
    intent_id: intentId,
    executionNumber,
    timestamp,
    blockNumber: BigInt(event.block.number),
    txHash,
    attemptedAmount: totalValue,
    successfulAmount,
    failedAmount,
    successCount: estimatedSuccessCount,
    failureCount: estimatedFailureCount
  });

  // Update Intent
  const intent = await context.Intent.get(intentId);
  if (intent) {
    const newExecutionCount = intent.executionCount + 1;
    const newProgress = calculateProgress(newExecutionCount, intent.totalPlannedExecutions);
    const isComplete = newExecutionCount >= intent.totalPlannedExecutions;

    context.Intent.set({
      ...intent,
      executionCount: newExecutionCount,
      totalTransferred: intent.totalTransferred + successfulAmount,
      totalFailed: intent.totalFailed + failedAmount,
      lastExecutedAt: timestamp,
      completedAt: isComplete ? timestamp : intent.completedAt,
      status: isComplete ? "COMPLETED" : intent.status,
      progressPercent: newProgress,
      nextExecutionDue: isComplete ? undefined : timestamp + intent.intervalSeconds
    });

    // Create IntentExecutionDetails
    const detailsId = `${txHash}-${event.logIndex}-intent-exec-details`;
    context.IntentExecutionDetails.set({
      id: detailsId,
      activity_id: `${txHash}-${event.logIndex}-intent-exec`,
      intent_id: intentId,
      execution_id: executionId,
      executionNumber: executionNumber + 1, // 1-indexed for display
      totalExecutions: intent.totalPlannedExecutions,
      successCount: estimatedSuccessCount,
      failureCount: estimatedFailureCount
    });

    // Create Activity
    const activityId = `${txHash}-${event.logIndex}-intent-exec`;
    context.Activity.set({
      id: activityId,
      wallet_id: walletId,
      activityType: "INTENT_EXECUTED",
      timestamp,
      blockNumber: BigInt(event.block.number),
      txHash,
      logIndex: event.logIndex,
      initiator: walletId,
      primaryToken: token,
      primaryAmount: totalValue,
      executeDetails_id: undefined,
      batchDetails_id: undefined,
      intentCreatedDetails_id: undefined,
      intentExecutionDetails_id: detailsId,
      intentCancellationDetails_id: undefined,
      involvedAddresses: [walletId], // Recipients added by transfer events
      tags: [
        "intent",
        "executed",
        `execution_${executionNumber + 1}`,
        failedAmount > 0n ? "partial_failure" : "success"
      ]
    });

    // Update wallet
    const wallet = await context.Wallet.get(walletId);
    if (wallet) {
      context.Wallet.set({
        ...wallet,
        totalActivityCount: wallet.totalActivityCount + 1,
        totalValueTransferred: wallet.totalValueTransferred + successfulAmount
      });
    }

    await updateDailyActivity(context, walletId, timestamp, "INTENT_EXECUTED", successfulAmount);
  }
});

MneeSmartWallet.IntentTransferSuccess.handler(async ({ event, context }) => {
  const intentId = event.params.intentId;
  const executionNumber = Number(event.params.transactionCount);
  const recipient = event.params.recipient.toLowerCase();
  const token = event.params.token.toLowerCase();
  const amount = event.params.amount;
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);

  const executionId = `${intentId}-${executionNumber}`;
  const transferId = `${executionId}-${recipient}`;

  // Create IntentTransfer
  context.IntentTransfer.set({
    id: transferId,
    execution_id: executionId,
    recipientIndex: 0, // We don't know the index without contract read
    recipient,
    token,
    amount,
    success: true,
    timestamp,
    txHash,
    logIndex: event.logIndex
  });

  // Update Intent recipients if not already there
  const intent = await context.Intent.get(intentId);
  if (intent && !intent.recipients.includes(recipient)) {
    context.Intent.set({
      ...intent,
      recipients: [...intent.recipients, recipient],
      amountPerRecipient: [...intent.amountPerRecipient, amount]
    });
  }

  // Add recipient to activity's involved addresses
  const activityId = `${txHash}-${event.logIndex}-intent-exec`;
  const activity = await context.Activity.get(activityId);
  if (activity && !activity.involvedAddresses.includes(recipient)) {
    context.Activity.set({
      ...activity,
      involvedAddresses: [...activity.involvedAddresses, recipient]
    });
  }
});

MneeSmartWallet.TransferFailed.handler(async ({ event, context }) => {
  const intentId = event.params.intentId;
  const executionNumber = Number(event.params.transactionCount);
  const recipient = event.params.recipient.toLowerCase();
  const token = event.params.token.toLowerCase();
  const amount = event.params.amount;
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);
  const executionId = `${intentId}-${executionNumber}`;
  const transferId = `${executionId}-${recipient}-failed`;
  // Create IntentTransfer
  context.IntentTransfer.set({
    id: transferId,
    execution_id: executionId,
    recipientIndex: 0,
    recipient,
    token,
    amount,
    success: false,
    timestamp,
    txHash,
    logIndex: event.logIndex
  });
  // Create a separate Activity for the failure (for visibility)
  const activityId = `${txHash}-${event.logIndex}-transfer-failed`;
  context.Activity.set({
    id: activityId,
    wallet_id: event.srcAddress.toLowerCase(),
    activityType: "TRANSFER_FAILED",
    timestamp,
    blockNumber: BigInt(event.block.number),
    txHash,
    logIndex: event.logIndex,
    initiator: event.srcAddress.toLowerCase(),
    primaryToken: token,
    primaryAmount: amount,
    executeDetails_id: undefined,
    batchDetails_id: undefined,
    intentCreatedDetails_id: undefined,
    intentExecutionDetails_id: undefined,
    intentCancellationDetails_id: undefined,
    involvedAddresses: [event.srcAddress.toLowerCase(), recipient],
    tags: ["intent", "transfer", "failed", "error"]
  });
});
// ============================================
// INTENT CANCELLATION
// ============================================
MneeIntentRegistry.IntentCancelled.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toLowerCase();
  const intentId = event.params.intentId;
  const txHash = event.transaction.hash;
  const timestamp = BigInt(event.block.timestamp);
  const token = event.params.token.toLowerCase();
  const refundedAmount = event.params.amountRefunded;
  const recoveredAmount = event.params.failedAmountRecovered;
  // Update Intent
  const intent = await context.Intent.get(intentId);
  if (intent) {
    const executionsRemaining = intent.totalPlannedExecutions - intent.executionCount;
    context.Intent.set({
      ...intent,
      status: "CANCELLED",
      cancelledAt: timestamp,
      cancelledTx: txHash,
      nextExecutionDue: undefined
    });

    // Create IntentCancellationDetails
    const detailsId = `${txHash}-${event.logIndex}-intent-cancel-details`;
    context.IntentCancellationDetails.set({
      id: detailsId,
      activity_id: `${txHash}-${event.logIndex}-intent-cancel`,
      intent_id: intentId,
      refundedAmount,
      recoveredFailedAmount: recoveredAmount,
      executionsCompleted: intent.executionCount,
      executionsRemaining
    });

    // Create Activity
    const activityId = `${txHash}-${event.logIndex}-intent-cancel`;
    context.Activity.set({
      id: activityId,
      wallet_id: walletId,
      activityType: "INTENT_CANCELLED",
      timestamp,
      blockNumber: BigInt(event.block.number),
      txHash,
      logIndex: event.logIndex,
      initiator: walletId,
      primaryToken: token,
      primaryAmount: refundedAmount + recoveredAmount,
      executeDetails_id: undefined,
      batchDetails_id: undefined,
      intentCreatedDetails_id: undefined,
      intentExecutionDetails_id: undefined,
      intentCancellationDetails_id: detailsId,
      involvedAddresses: [walletId],
      tags: ["intent", "cancelled", "refund"]
    });

    // Update wallet
    const wallet = await context.Wallet.get(walletId);
    if (wallet) {
      context.Wallet.set({
        ...wallet,
        totalActivityCount: wallet.totalActivityCount + 1
      });
    }

    await updateDailyActivity(context, walletId, timestamp, "INTENT_CANCELLED", 0n);

    context.log.info(` Intent cancelled: ${intent.displayName}`);
  }
});




// query GetWalletActivityFeed($walletId: ID!, $limit: Int = 50, $offset: Int = 0) {
//   Wallet(id: $walletId) {
//     owner
//     deployedAt
//     totalActivityCount
//     totalValueTransferred
    
//     activity(
//       orderBy: "timestamp"
//       orderDirection: "desc"
//       limit: $limit
//       offset: $offset
//     ) {
//       id
//       type
//       timestamp
//       txHash
//       primaryToken
//       primaryAmount
//       tags
      
//       # Load relevant details based on type
//       executeDetails {
//         target
//         value
//         decodedFunction
//         isTokenTransfer
//         tokenTransferRecipient
//         tokenTransferAmount
//       }
      
//       batchDetails {
//         callCount
//         totalValue
//         calls {
//           target
//           value
//           decodedFunction
//         }
//       }
      
//       intentCreatedDetails {
//         intent {
//           displayName
//           token
//           totalPlannedExecutions
//         }
//         recipientCount
//         totalCommitment
//         scheduleDescription
//       }
      
//       intentExecutionDetails {
//         intent {
//           displayName
//         }
//         executionNumber
//         totalExecutions
//         successCount
//         failureCount
//       }
      
//       intentCancellationDetails {
//         intent {
//           displayName
//         }
//         refundedAmount
//         recoveredFailedAmount
//         executionsCompleted
//       }
//     }
//   }
// }

// # Get intent details with full execution history
// query GetIntentDetails($intentId: ID!) {
//   Intent(id: $intentId) {
//     displayName
//     token
//     status
//     recipients
//     amountPerRecipient
//     startTime
//     endTime
//     intervalSeconds
//     totalPlannedExecutions
//     executionCount
//     progressPercent
//     totalCommitted
//     totalTransferred
//     totalFailed
    
//     executions(orderBy: "executionNumber", orderDirection: "asc") {
//       executionNumber
//       timestamp
//       attemptedAmount
//       successfulAmount
//       failedAmount
//       successCount
//       failureCount
      
//       transfers {
//         recipient
//         amount
//         success
//       }
//     }
//   }
// }

// # Get daily activity chart data
// query GetDailyActivity($walletId: ID!, $startDate: String!, $endDate: String!) {
//   DailyWalletActivity_collection(
//     where: {
//       wallet_id: $walletId
//       date_gte: $startDate
//       date_lte: $endDate
//     }
//     orderBy: "date"
//     orderDirection: "asc"
//   ) {
//     date
//     totalActivities
//     totalValueTransferred
//     executionCount
//     intentExecutionCount
//     activityTypes
//     activityCounts
//   }
// }
