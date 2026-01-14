import {
  PaymentParams,
  PaymentType,
  SingleTransferParams,
  BatchTransferParams,
  RecurringPaymentParams,
  CancelIntentParams
} from "./types";
import { useSingleTransfer } from "./useSingleTransfer";
import { useBatchTransfer } from "./useBatchTransfer";
import { useRecurringPayment } from "./useRecurringPayment";
import { useCancelIntent } from "./useCancelIntent";

// Export everything so existing imports don't break
export * from "./types";
export * from "./useSingleTransfer";
export * from "./useBatchTransfer";
export * from "./useRecurringPayment";
export * from "./useCancelIntent";

export function usePayment() {
  const singleTransfer = useSingleTransfer();
  const batchTransfer = useBatchTransfer();
  const recurringPayment = useRecurringPayment();
  const cancelIntent = useCancelIntent();

  const execute = <T extends PaymentType>(type: T, params: PaymentParams[T]) => {
    switch (type) {
      case "single":
        return singleTransfer.mutateAsync(params as SingleTransferParams);
      case "batch":
        return batchTransfer.mutateAsync(params as BatchTransferParams);
      case "recurring":
        return recurringPayment.mutateAsync(params as RecurringPaymentParams);
      case "cancel-intent":
        return cancelIntent.mutateAsync(params as CancelIntentParams);
    }
  };

  return {
    execute,
    isPending:
      singleTransfer.isPending ||
      batchTransfer.isPending ||
      recurringPayment.isPending ||
      cancelIntent.isPending,
    isSuccess:
      singleTransfer.isSuccess ||
      batchTransfer.isSuccess ||
      recurringPayment.isSuccess ||
      cancelIntent.isSuccess,
    isError:
      singleTransfer.isError ||
      batchTransfer.isError ||
      recurringPayment.isError ||
      cancelIntent.isError
  };
}