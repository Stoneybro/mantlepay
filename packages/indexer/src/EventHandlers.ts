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
} from "generated";

MneeSmartWallet.Executed.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_Executed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    target: event.params.target,
    value: event.params.value,
    data: event.params.data,
  };

  context.MneeSmartWallet_Executed.set(entity);
});

MneeSmartWallet.ExecutedBatch.handler(async ({ event, context }) => {
  const entity: MneeSmartWallet_ExecutedBatch = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    batchSize: event.params.batchSize,
    totalValue: event.params.totalValue,
  };

  context.MneeSmartWallet_ExecutedBatch.set(entity);
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
});
