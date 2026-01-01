import {
  PaymentParams,
  PaymentType,
  SingleTransferParams,
  SingleTokenTransferParams,
  BatchTransferParams,
  BatchTokenTransferParams,
  RecurringPaymentParams,
  RecurringTokenPaymentParams,
  CancelIntentParams
} from "./types";
import { useSingleTransfer } from "./useSingleTransfer";
import { useSingleTokenTransfer } from "./useSingleTokenTransfer";
import { useBatchTransfer } from "./useBatchTransfer";
import { useBatchTokenTransfer } from "./useBatchTokenTransfer";
import { useRecurringPayment } from "./useRecurringPayment";
import { useRecurringTokenPayment } from "./useRecurringTokenPayment";
import { useCancelIntent } from "./useCancelIntent";

// Export everything so existing imports don't break
export * from "./types";
export * from "./useSingleTransfer";
export * from "./useSingleTokenTransfer";
export * from "./useBatchTransfer";
export * from "./useBatchTokenTransfer";
export * from "./useRecurringPayment";
export * from "./useRecurringTokenPayment";
export * from "./useCancelIntent";

export function usePayment() {
  const singleTransfer = useSingleTransfer();
  const singleTokenTransfer = useSingleTokenTransfer();
  const batchTransfer = useBatchTransfer();
  const batchTokenTransfer = useBatchTokenTransfer();
  const recurringPayment = useRecurringPayment();
  const recurringTokenPayment = useRecurringTokenPayment();
  const cancelIntent = useCancelIntent();

  const execute = <T extends PaymentType>(type: T, params: PaymentParams[T]) => {
    switch (type) {
      case "single-eth":
        return singleTransfer.mutateAsync(params as SingleTransferParams);
      case "single-token":
        return singleTokenTransfer.mutateAsync(params as SingleTokenTransferParams);
      case "batch-eth":
        return batchTransfer.mutateAsync(params as BatchTransferParams);
      case "batch-token":
        return batchTokenTransfer.mutateAsync(params as BatchTokenTransferParams);
      case "recurring-eth":
        return recurringPayment.mutateAsync(params as RecurringPaymentParams);
      case "recurring-token":
        return recurringTokenPayment.mutateAsync(params as RecurringTokenPaymentParams);
      case "cancel-intent":
        return cancelIntent.mutateAsync(params as CancelIntentParams);
    }
  };

  return {
    execute,
    isPending:
      singleTransfer.isPending ||
      singleTokenTransfer.isPending ||
      batchTransfer.isPending ||
      batchTokenTransfer.isPending ||
      recurringPayment.isPending ||
      recurringTokenPayment.isPending ||
      cancelIntent.isPending,
    isSuccess:
      singleTransfer.isSuccess ||
      singleTokenTransfer.isSuccess ||
      batchTransfer.isSuccess ||
      batchTokenTransfer.isSuccess ||
      recurringPayment.isSuccess ||
      recurringTokenPayment.isSuccess ||
      cancelIntent.isSuccess,
    isError:
      singleTransfer.isError ||
      singleTokenTransfer.isError ||
      batchTransfer.isError ||
      batchTokenTransfer.isError ||
      recurringPayment.isError ||
      recurringTokenPayment.isError ||
      cancelIntent.isError
  };
}