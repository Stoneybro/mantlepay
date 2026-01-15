/*
 * MantlePay Indexer - Event Handlers
 * Indexes wallet activity, payments, intents, and compliance data
 */
import {
  MpSmartWallet,
  MpSmartWalletFactory,
  MpIntentRegistry,
  Transaction,
  TransactionType,
  Wallet,
  Intent,
} from "generated";

// Function selector mappings
const SELECTORS: Record<string, string> = {
  "0xa9059cbb": "transfer",
  "0x095ea7b3": "approve",
  "0x23b872dd": "transferFrom",
};

// Helper to format timestamp
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

// GLOBAL STORE for Batch Calls in the same block/tx
let batchCallsCache: Map<string, any[]> = new Map();

// GLOBAL STORE for Compliance data in the same tx
let complianceCache: Map<string, {
  entityIds: string[];
  jurisdiction: string;
  category: string;
  referenceId: string;
}> = new Map();

let currentWalletAction: {
  selector: string;
  actionType: string;
  txHash: string;
} | null = null;

// ============================================
// FACTORY EVENTS
// ============================================

MpSmartWalletFactory.AccountCreated.contractRegister(async ({ event, context }) => {
  const walletId = event.params.account.toString().toLowerCase();
  context.addMpSmartWallet(walletId);
});

MpSmartWalletFactory.AccountCreated.handler(async ({ event, context }) => {
  const walletId = event.params.account.toString().toLowerCase();

  // Create Wallet entity
  const wallet: Wallet = {
    id: walletId,
    owner: event.params.owner.toString(),
    deployedAt: BigInt(event.block.timestamp),
    deployedBlock: BigInt(event.block.number),
    deployedTx: event.transaction.hash,
    totalTransactionCount: 0,
  };
  context.Wallet.set(wallet);

  // Create WALLET_CREATED transaction
  const details = JSON.stringify({
    walletAddress: walletId,
    owner: event.params.owner.toString(),
    deployedBy: "Factory"
  });

  const transaction: Transaction = {
    id: event.transaction.hash,
    wallet_id: walletId,
    transactionType: "WALLET_CREATED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Account Activated",
    details: details
  };
  context.Transaction.set(transaction);
});

// ============================================
// SMART WALLET EVENTS
// ============================================

MpSmartWallet.WalletAction.handler(async ({ event }) => {
  currentWalletAction = {
    selector: event.params.selector,
    actionType: event.params.actionType,
    txHash: event.transaction.hash
  };

  // Aggregate for Batch Calls
  if (!batchCallsCache.has(event.transaction.hash)) {
    batchCallsCache.set(event.transaction.hash, []);
  }

  const actions = batchCallsCache.get(event.transaction.hash);
  if (actions) {
    actions.push({
      target: event.params.target.toString(),
      value: event.params.value.toString(),
      selector: event.params.selector,
      actionType: event.params.actionType
    });
  }
});

// GLOBAL STORE for linking ComplianceExecuted to the main Transaction
// Map<txHash, transactionEntityId>
let pendingComplianceTxCache: Map<string, string> = new Map();

MpSmartWallet.ComplianceExecuted.handler(async ({ event, context }) => {
  const txHash = event.transaction.hash;
  const transactionId = pendingComplianceTxCache.get(txHash);

  if (transactionId) {
    // Fetch the already-created transaction
    const transaction = await context.Transaction.get(transactionId);

    if (transaction) {
      console.log(`[ComplianceExecuted] Updating Transaction ${transactionId} with compliance data.`);

      const detailsObj = JSON.parse(transaction.details);

      detailsObj.compliance = {
        entityIds: event.params.entityIds || [],
        jurisdiction: event.params.jurisdictions ? event.params.jurisdictions.map((x: any) => x.toString()).join(",") : "",
        category: event.params.categories ? event.params.categories.map((x: any) => x.toString()).join(",") : "",
        referenceId: event.params.referenceId || ""
      };

      const updatedTransaction: Transaction = {
        ...transaction,
        details: JSON.stringify(detailsObj)
      };

      context.Transaction.set(updatedTransaction);
    } else {
      console.warn(`[ComplianceExecuted] Transaction ${transactionId} not found in context (race condition?).`);
    }

    // Cleanup
    pendingComplianceTxCache.delete(txHash);
  } else {
    console.log(`[ComplianceExecuted] No pending transaction found for ${txHash}. (Maybe indexer restarted or event order mismatch?)`);
  }
});

MpSmartWallet.Executed.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);

  if (wallet) {
    const txHash = event.transaction.hash;
    const selector = event.params.data.slice(0, 10);
    const logIndex = event.logIndex;
    const transactionId = `${txHash}-${logIndex}`;

    let title = "Single Payment";
    let detailsObj: any = {
      target: event.params.target.toString(),
      value: event.params.value.toString(),
      functionCall: SELECTORS[selector] || "native_transfer",
      selector: selector,
    };

    // For native MNT transfers (no data or 0x)
    if (event.params.data === "0x" || event.params.data.length <= 10) {
      detailsObj.functionCall = "Native MNT Transfer";
      detailsObj.amount = event.params.value.toString();
      detailsObj.recipient = event.params.target.toString();
    }

    // Register this transaction for potential compliance update
    pendingComplianceTxCache.set(txHash, transactionId);

    const transaction: Transaction = {
      id: transactionId,
      wallet_id: walletId,
      transactionType: "EXECUTE",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: txHash,
      logIndex: logIndex,
      title: title,
      details: JSON.stringify(detailsObj)
    };

    context.Transaction.set(transaction);

    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });
  }
});

MpSmartWallet.ExecutedBatch.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);

  if (wallet) {
    const txHash = event.transaction.hash;
    const logIndex = event.logIndex;
    const transactionId = `${txHash}-${logIndex}`;

    // Get wallet actions from cache
    const walletActions = batchCallsCache.get(txHash) || [];

    // Build calls array from wallet actions (native MNT transfers)
    const calls = walletActions.map(action => ({
      target: action.target,
      value: action.value,
      recipient: action.target,
      functionCall: "Native MNT Transfer",
    }));

    // Calculate total value
    const totalValue = walletActions.reduce((sum, a) => sum + BigInt(a.value), 0n);

    // Register this transaction for potential compliance update
    pendingComplianceTxCache.set(txHash, transactionId);

    const detailsObj: any = {
      batchSize: Number(event.params.batchSize),
      totalValue: totalValue.toString(),
      calls: calls
    };

    const transaction: Transaction = {
      id: transactionId,
      wallet_id: walletId,
      transactionType: "EXECUTE_BATCH",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: txHash,
      logIndex: logIndex,
      title: "Batch Payment",
      details: JSON.stringify(detailsObj)
    };

    context.Transaction.set(transaction);

    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });

    // Clean up cache
    batchCallsCache.delete(txHash);
  }
});

MpSmartWallet.TransferFailed.handler(async ({ event, context }) => {
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);

  const details = JSON.stringify({
    scheduleName: intent ? intent.name : "Unknown Schedule",
    executionNumber: Number(event.params.transactionCount),
    recipient: event.params.recipient.toString(),
    token: "MNT",
    amount: event.params.amount.toString(),
    reason: "Transfer Failed"
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: event.srcAddress.toString().toLowerCase(),
    transactionType: "TRANSFER_FAILED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Payment Failed",
    details: details
  };

  context.Transaction.set(transaction);
});

// ============================================
// INTENT REGISTRY EVENTS
// ============================================

MpIntentRegistry.IntentCreated.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();

  // Extract compliance metadata from event tuple
  // compliance is (string[], uint8[], uint8[], string)
  // uint8[] comes as BigInt[] or number[] depending on codegen, usually BigInt for arrays in envio
  const complianceTuple = event.params.compliance;

  // Helper to convert potential empty/undefined to valid arrays
  const entityIds = complianceTuple[0] ? [...complianceTuple[0]] : [];
  // Enum arrays might be BigInt[] or number[], convert to string for storage if needed, or keep as is?
  // Our schema probably expects string or int? 
  // Let's check schema.graphql? The Intent entity uses string for jurisdiction/category in the code below.
  // "jurisdiction: compliance.jurisdiction" (which was string before).
  // Now it's an array of enums. We should probably serialize it to string for the entity if the entity expects string.
  // The Intent entity definition in Schema is likely just "jurisdiction: String!"?
  // Let's assume we want to store it as a JSON string or comma-separated string if the Entity field is String.

  // Checking previous code: "jurisdiction: complianceTuple[1] || """
  // Meaning it expected a single string. 
  // But Solidity has Jurisdiction[] (array).

  // We need to serialize the arrays to store in the string fields on the Intent entity.
  const jurisdictionStr = complianceTuple[1] ? complianceTuple[1].map(x => x.toString()).join(",") : "";
  const categoryStr = complianceTuple[2] ? complianceTuple[2].map(x => x.toString()).join(",") : "";

  const compliance = {
    entityIds: entityIds,
    jurisdiction: jurisdictionStr,
    category: categoryStr,
    referenceId: complianceTuple[3] || ""
  };

  // Create Intent helper entity
  const intent: Intent = {
    id: intentId,
    wallet: walletId,
    token: event.params.token.toString(),
    name: event.params.name,
    totalTransactionCount: event.params.totalTransactionCount,
    recipients: event.params.recipients.map(r => r.toString().toLowerCase()),
    amounts: event.params.amounts,
    interval: event.params.interval,
    duration: event.params.duration,
    entityIds: compliance.entityIds,
    jurisdiction: compliance.jurisdiction,
    category: compliance.category,
    referenceId: compliance.referenceId
  };
  context.Intent.set(intent);

  // Build transaction details
  const details = JSON.stringify({
    scheduleName: event.params.name,
    intentId: intentId,
    token: "MNT",
    totalCommitment: event.params.totalCommitment.toString(),
    recipientCount: event.params.recipients.length,
    recipients: event.params.recipients.map((r, i) => ({
      address: r.toString(),
      amount: event.params.amounts[i].toString(),
      entityId: compliance.entityIds[i] || ""
    })),
    frequency: `Every ${event.params.interval} seconds`,
    duration: `${event.params.duration} seconds`,
    totalExecutions: Number(event.params.totalTransactionCount),
    startDate: formatTimestamp(Number(event.params.transactionStartTime)),
    endDate: formatTimestamp(Number(event.params.transactionEndTime)),
    compliance: compliance
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: walletId,
    transactionType: "INTENT_CREATED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Payment Schedule Created",
    details: details
  };
  context.Transaction.set(transaction);
});

MpIntentRegistry.IntentExecuted.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();

  const intent = await context.Intent.get(intentId);

  const recipientsList = intent ? intent.recipients.map((r, i) => ({
    address: r,
    amount: intent.amounts[i].toString(),
    status: "success",
    entityId: intent.entityIds && intent.entityIds[i] ? intent.entityIds[i] : ""
  })) : [];

  const details = JSON.stringify({
    scheduleName: event.params.name,
    executionNumber: Number(event.params.transactionCount),
    totalExecutions: intent ? Number(intent.totalTransactionCount) : 0,
    recipientCount: intent ? intent.recipients.length : 0,
    token: "MNT",
    totalAmount: event.params.totalAmount.toString(),
    successfulTransfers: recipientsList.length,
    failedTransfers: 0,
    recipients: recipientsList,
    compliance: intent ? {
      entityIds: intent.entityIds || [],
      jurisdiction: intent.jurisdiction || "",
      category: intent.category || "",
      referenceId: intent.referenceId || ""
    } : undefined
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: walletId,
    transactionType: "INTENT_EXECUTION",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Scheduled Payment",
    details: details
  };
  context.Transaction.set(transaction);
});

MpIntentRegistry.IntentCancelled.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);

  const details = JSON.stringify({
    scheduleName: event.params.name,
    token: "MNT",
    amountRefunded: event.params.amountRefunded.toString(),
    failedAmountRecovered: event.params.failedAmountRecovered.toString(),
    executionsCompleted: intent ? Math.floor(Number(intent.duration) / Number(intent.interval)) : 0,
    totalExecutions: intent ? Number(intent.totalTransactionCount) : 0
  });

  const transaction: Transaction = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    wallet_id: walletId,
    transactionType: "INTENT_CANCELLED",
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
    title: "Scheduled Payment Canceled",
    details: details
  };
  context.Transaction.set(transaction);
});
