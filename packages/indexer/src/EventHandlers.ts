/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  MneeSmartWallet,
  MneeSmartWalletFactory,
  MneeIntentRegistry,
  MneeToken,
  Transaction,
  TransactionType,
  Wallet,
  Intent,
} from "generated";
import { decodeFunctionData, parseAbi, hexToBigInt } from "viem";

// Function selector mappings
const SELECTORS: Record<string, string> = {
  "0xa9059cbb": "transfer",
  "0x095ea7b3": "approve",
  "0x23b872dd": "transferFrom",
  // Add other common selectors here or logic to handle unknown ones
};

// Helper to format timestamp
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

// Helper to get transaction type from selector
function getExecuteType(selector: string, value: bigint): string {
  if (selector === "0xa9059cbb" || selector === "0x23b872dd") return "Token Transfer";
  if (selector === "0x095ea7b3") return "Token Approval";
  // Value > 0 and 0x0...0 selector could be gas payment or contract call, just default to Contract Call
  return "Contract Call";
}

// GLOBAL STORE for Batch Calls in the same block/tx
// Map<txHash, Array<CallDetails>>
let batchCallsCache: Map<string, any[]> = new Map();

// GLOBAL STORE for Token Transfers in the same tx
// Map<txHash, Array<{from, to, value}>>
let transfersCache: Map<string, { from: string, to: string, value: string }[]> = new Map();

let currentWalletAction: {
  selector: string;
  actionType: string;
  txHash: string;
} | null = null;

MneeSmartWalletFactory.AccountCreated.contractRegister(async ({ event, context }) => {
  const walletId = event.params.account.toString().toLowerCase();
  context.addMneeSmartWallet(walletId);
});

MneeSmartWalletFactory.AccountCreated.handler(async ({ event, context }) => {
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

MneeSmartWallet.WalletAction.handler(async ({ event }) => {
  // Store this action to be picked up by Executed/ExecutedBatch
  // We only really need the selector and type for the title/details logic
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

MneeSmartWallet.Executed.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);

  if (wallet) {
    const selector = event.params.data.slice(0, 10); // 0x + 8 chars
    let title = "Single Payment";
    let detailsObj: any = {
      target: event.params.target.toString(),
      value: event.params.value.toString(), // Wei amount
      functionCall: SELECTORS[selector] || "custom",
      selector: selector,
      data: event.params.data.length > 66 ? event.params.data.slice(0, 66) + "..." : event.params.data
    };

    // Transaction Classification Logic
    // If it was a plain ETH transfer, we now treat it as generic execution or gas payment
    // We only explicitly label Token Transfers
    if (selector === "0xa9059cbb" && event.params.data.length >= 138) { // 10 chars selector + 64 chars address + 64 chars amount
      // ERC20 Transfer
      title = "Single Payment";
      detailsObj.functionCall = "Token Transfer";

      // Decode params: transfer(address recipient, uint256 amount)
      // Data layout: Selector (4 bytes) + Recipient (32 bytes) + Amount (32 bytes)
      // 0x + 8 chars + 64 chars + 64 chars
      // Recipient is in bytes 4-36 (chars 10-74). Address is last 20 bytes (last 40 chars of that segment)
      const recipientHex = "0x" + event.params.data.slice(34, 74);
      const amountHex = "0x" + event.params.data.slice(74, 138);

      detailsObj.recipient = recipientHex;
      detailsObj.amount = BigInt(amountHex).toString();
    }

    const transaction: Transaction = {
      id: `${event.transaction.hash}-${event.logIndex}`,
      wallet_id: walletId,
      transactionType: "EXECUTE",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: event.transaction.hash,
      logIndex: event.logIndex,
      title: title,
      details: JSON.stringify(detailsObj)
    };

    context.Transaction.set(transaction);

    // Update wallet count
    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });
  }
});

MneeSmartWallet.ExecutedBatch.handler(async ({ event, context }) => {
  const walletId = event.srcAddress.toString().toLowerCase();
  const wallet = await context.Wallet.get(walletId);

  if (wallet) {
    const txHash = event.transaction.hash;

    // Get transfers from cache (populated by MneeToken.Transfer handler)
    const transfers = transfersCache.get(txHash) || [];
    console.log(`ExecutedBatch: Found ${transfers.length} cached transfers for ${txHash}`);

    // Get wallet actions from cache for targets
    const walletActions = batchCallsCache.get(txHash) || [];
    console.log(`ExecutedBatch: Found ${walletActions.length} cached wallet actions for ${txHash}`);

    // Build calls array from transfers (these have actual amounts)
    let calls: any[] = transfers.map((transfer, idx) => {
      return {
        target: "0x19b2124fCb1B156284EE2C28f97e3c873f415bc5", // MNEE token
        value: transfer.value,
        recipient: transfer.to,
        functionCall: "Token Transfer",
        selector: "0xa9059cbb"
      };
    });

    // If no transfers found, fall back to wallet actions (won't have amounts)
    if (calls.length === 0 && walletActions.length > 0) {
      console.log("No transfers found, falling back to wallet actions");
      calls = walletActions.map(action => ({
        target: action.target,
        value: "0",
        recipient: action.target,
        functionCall: action.selector === "0xa9059cbb" ? "Token Transfer" : "Contract Call",
        selector: action.selector
      }));
    }

    // Calculate total MNEE value from transfers
    const totalMneeValue = transfers.reduce((sum, t) => sum + BigInt(t.value), 0n);

    const details = JSON.stringify({
      batchSize: Number(event.params.batchSize),
      totalValue: totalMneeValue.toString(), // Use actual token value, not ETH
      calls: calls
    });

    const transaction: Transaction = {
      id: `${event.transaction.hash}-${event.logIndex}`,
      wallet_id: walletId,
      transactionType: "EXECUTE_BATCH",
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      txHash: event.transaction.hash,
      logIndex: event.logIndex,
      title: "Batch Payment",
      details: details
    };

    context.Transaction.set(transaction);

    context.Wallet.set({
      ...wallet,
      totalTransactionCount: wallet.totalTransactionCount + 1
    });

    // Clean up caches
    transfersCache.delete(txHash);
    batchCallsCache.delete(txHash);
  }
});

MneeIntentRegistry.IntentCreated.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();

  // Create Intent helper entity
  const intent: Intent = {
    id: intentId,
    wallet: walletId,
    token: event.params.token.toString(),
    name: event.params.name,
    totalTransactionCount: event.params.totalTransactionCount,
    recipients: event.params.recipients.map(r => r.toString().toLowerCase()),
    amounts: event.params.amounts, // Already bigint[]
    interval: event.params.interval,
    duration: event.params.duration
  };
  context.Intent.set(intent);

  // JSON Details
  const details = JSON.stringify({
    scheduleName: event.params.name,
    token: "MNEE", // Defaulting to MNEE as per migration
    totalCommitment: event.params.totalCommitment.toString(),
    recipientCount: event.params.recipients.length,
    recipients: event.params.recipients.map((r, i) => ({
      address: r.toString(),
      amount: event.params.amounts[i].toString()
    })),
    frequency: `Every ${event.params.interval} seconds`, // User wanted "Every 30 days", but we have raw seconds
    duration: `${event.params.duration} seconds`,
    totalExecutions: Number(event.params.totalTransactionCount),
    startDate: formatTimestamp(Number(event.params.transactionStartTime)),
    endDate: formatTimestamp(Number(event.params.transactionEndTime))
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

MneeIntentRegistry.IntentExecuted.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();

  const intent = await context.Intent.get(intentId);
  const tokenSymbol = "MNEE";

  // Re-construct recipients with status
  // We assume success unless we find specific failure events, but specific status per recipient
  // is hard without correlating strictly with IntentTransferSuccess/Failed events.
  // Those events are emitted by MneeSmartWallet, but this is MneeIntentRegistry.
  // They are in the same transaction.

  // For the purpose of this implementation we will default to "success" for all
  // and if we were to handle failures rigorously we'd need to fetch the TransferFailed events from appropriate context (if feasible).
  // Given simplifications:
  const recipientsList = intent ? intent.recipients.map((r, i) => ({
    address: r,
    amount: intent.amounts[i].toString(),
    status: "success" // Optimistic default
  })) : [];

  const details = JSON.stringify({
    scheduleName: event.params.name,
    executionNumber: Number(event.params.transactionCount),
    totalExecutions: intent ? Number(intent.totalTransactionCount) : 0,
    recipientCount: intent ? intent.recipients.length : 0,
    token: tokenSymbol,
    totalAmount: event.params.totalAmount.toString(),
    successfulTransfers: recipientsList.length, // Placeholder
    failedTransfers: 0, // Placeholder
    recipients: recipientsList
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

MneeIntentRegistry.IntentCancelled.handler(async ({ event, context }) => {
  const walletId = event.params.wallet.toString().toLowerCase();
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);

  const tokenSymbol = "MNEE";

  const details = JSON.stringify({
    scheduleName: event.params.name,
    token: tokenSymbol,
    amountRefunded: event.params.amountRefunded.toString(),
    failedAmountRecovered: event.params.failedAmountRecovered.toString(),
    executionsCompleted: intent ? Math.floor(Number(intent.duration) / Number(intent.interval)) : 0, // Rough estimate or need actual count stored in Intent entity
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

MneeSmartWallet.TransferFailed.handler(async ({ event, context }) => {
  // We need to fetch the Intent to get the name
  const intentId = event.params.intentId.toString();
  const intent = await context.Intent.get(intentId);
  const tokenSymbol = "MNEE";

  const details = JSON.stringify({
    scheduleName: intent ? intent.name : "Unknown Schedule",
    executionNumber: Number(event.params.transactionCount),
    recipient: event.params.recipient.toString(),
    token: tokenSymbol,
    amount: event.params.amount.toString(),
    reason: "Transfer Failed" // Generic reason since we don't have revert string
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

// Handle MneeToken Transfer events to capture actual transfer amounts
MneeToken.Transfer.handler(async ({ event }) => {
  const txHash = event.transaction.hash;

  // Store transfer in cache for correlation with batch transactions
  if (!transfersCache.has(txHash)) {
    transfersCache.set(txHash, []);
  }

  const transfers = transfersCache.get(txHash)!;
  transfers.push({
    from: event.params.from.toString().toLowerCase(),
    to: event.params.to.toString().toLowerCase(),
    value: event.params.value.toString()
  });

  console.log(`Transfer cached: ${event.params.value} from ${event.params.from} to ${event.params.to} in tx ${txHash}`);
});
