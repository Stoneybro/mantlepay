/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  MneeSmartWallet,
  MneeSmartWallet_Executed,
  MneeSmartWallet_ExecutedBatch,
  MneeSmartWallet_Initialized,
  MneeSmartWallet_IntentBatchTransferExecuted,
  MneeSmartWallet_IntentTransferSuccess,
  MneeSmartWallet_TransferFailed,
  MneeSmartWalletFactory,
  MneeSmartWalletFactory_AccountCreated,
  WalletTransaction,
  Intent
} from "generated";

MneeSmartWallet.Executed.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_Executed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    target: event.params.target,
    value: event.params.value,
    data: event.params.data,
  };
  context.MneeSmartWallet_Executed.set(entity);

  const tx: WalletTransaction = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    walletAddress: event.srcAddress,
    txHash: (event.transaction as any)?.hash || "",
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionType: 'EXECUTE',
    token: '0x0000000000000000000000000000000000000000', // Native ETH
    value: event.params.value,
    toAddress: event.params.target,
    recipientCount: 1,
    status: 'SUCCESS',
    intentId: undefined,
    intentName: undefined
  };
  context.WalletTransaction.set(tx);
});

MneeSmartWallet.ExecutedBatch.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_ExecutedBatch = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    batchSize: event.params.batchSize,
    totalValue: event.params.totalValue,
  };
  context.MneeSmartWallet_ExecutedBatch.set(entity);

  const tx: WalletTransaction = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    walletAddress: event.srcAddress,
    txHash: (event.transaction as any)?.hash || "",
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionType: 'BATCH',
    token: '0x0000000000000000000000000000000000000000', // Native ETH
    value: event.params.totalValue,
    recipientCount: Number(event.params.batchSize),
    status: 'SUCCESS',
    intentId: undefined,
    intentName: undefined,
    toAddress: undefined
  };
  context.WalletTransaction.set(tx);
});

MneeSmartWallet.Initialized.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_Initialized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    version: event.params.version,
  };
  context.MneeSmartWallet_Initialized.set(entity);
});

MneeSmartWallet.IntentBatchTransferExecuted.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_IntentBatchTransferExecuted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    intentId: event.params.intentId,
    transactionCount: event.params.transactionCount,
    token: event.params.token,
    recipientCount: event.params.recipientCount,
    totalValue: event.params.totalValue,
    failedAmount: event.params.failedAmount,
  };
  context.MneeSmartWallet_IntentBatchTransferExecuted.set(entity);

  // Unified Transaction
  const tx: WalletTransaction = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    walletAddress: event.srcAddress,
    txHash: (event.transaction as any)?.hash || "",
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionType: 'INTENT_EXECUTED',
    token: event.params.token,
    value: event.params.totalValue,
    intentId: event.params.intentId,
    recipientCount: Number(event.params.recipientCount),
    status: event.params.failedAmount > 0n ? 'PARTIAL_FAILURE' : 'SUCCESS',
    intentName: undefined,
    toAddress: undefined
  };
  context.WalletTransaction.set(tx);

  // Intent Entity Logic
  const existingIntent = await context.Intent.get(event.params.intentId);

  let newIntent: Intent;

  if (existingIntent) {
    newIntent = {
      ...existingIntent,
      executedCount: existingIntent.executedCount + Number(event.params.recipientCount),
      lastExecutedAt: BigInt(event.block.timestamp)
    };
  } else {
    newIntent = {
      id: event.params.intentId,
      intentId: event.params.intentId,
      walletAddress: event.srcAddress,
      token: event.params.token,
      totalCount: 0,
      executedCount: Number(event.params.recipientCount),
      status: 'ACTIVE',
      createdAt: BigInt(event.block.timestamp),
      lastExecutedAt: BigInt(event.block.timestamp),
      name: undefined
    };
  }

  context.Intent.set(newIntent);
});

MneeSmartWallet.IntentTransferSuccess.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_IntentTransferSuccess = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    intentId: event.params.intentId,
    transactionCount: event.params.transactionCount,
    recipient: event.params.recipient,
    token: event.params.token,
    amount: event.params.amount,
  };
  context.MneeSmartWallet_IntentTransferSuccess.set(entity);
});

MneeSmartWallet.TransferFailed.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_TransferFailed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    intentId: event.params.intentId,
    transactionCount: event.params.transactionCount,
    recipient: event.params.recipient,
    token: event.params.token,
    amount: event.params.amount,
  };
  context.MneeSmartWallet_TransferFailed.set(entity);
});

MneeSmartWalletFactory.AccountCreated.handler(async ({ event, context }) => {
  const entity: MneeSmartWalletFactory_AccountCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    owner: event.params.owner,
  };
  context.MneeSmartWalletFactory_AccountCreated.set(entity);

  const tx: WalletTransaction = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    walletAddress: event.params.account,
    txHash: (event.transaction as any)?.hash || "",
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionType: 'WALLET_DEPLOYED',
    token: undefined,
    value: undefined,
    status: 'SUCCESS',
    recipientCount: undefined,
    intentId: undefined,
    intentName: undefined,
    toAddress: undefined
  };
  context.WalletTransaction.set(tx);
});
