
import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/smartAccountProvider";
import AidraIntentRegistry from "@aidra/contracts/AidraIntentRegistry";
import { AidraRegistryAddress } from "@/lib/CA";
import {
  encodeFunctionData,
  parseEther,
  parseUnits,
  zeroAddress,
  erc20Abi,
} from "viem";
import { PYUSDAddress } from "@/utils/helpers";

/**
 * @notice SINGLE ETH TRANSFER HOOK
 */
type SingleTransferParams = {
  to: `0x${string}`;
  amount: string; // in ETH
};

export function useSingleTransfer() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  return useMutation({
    mutationFn: async (params: SingleTransferParams) => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient) {
          throw new Error("Smart Account Client is not initialized");
        }
        if (!owner?.address) {
          throw new Error("No connected wallet found");
        }

        const amountInWei = parseEther(params.amount);

        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls: [
            {
              to: params.to,
              data: "0x",
              value: amountInWei,
            },
          ],
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({
          hash,
        });

        toast.success("Transfer sent successfully!");
        return receipt;
      } catch (error) {
        console.error("Error sending transfer:", error);
        toast.error("Failed to send transfer");
        throw error;
      }
    },
  });
}

/**
 * @notice SINGLE ERC20 TRANSFER HOOK
 * @dev Defaults to PYUSD token for easier usage
 */
type SingleTokenTransferParams = {
  to: `0x${string}`;
  amount: string;
};

export function useSingleTokenTransfer() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  return useMutation({
    mutationFn: async (params: SingleTokenTransferParams) => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient) {
          throw new Error("Smart Account Client is not initialized");
        }
        if (!owner?.address) {
          throw new Error("No connected wallet found");
        }

        // Default to PYUSD
        const token = PYUSDAddress;
        const decimals =  6; // PYUSD has 6 decimals
        const amountInUnits = parseUnits(params.amount, decimals);

        // Encode ERC20 transfer call
        const transferData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [params.to, amountInUnits],
        });

        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls: [
            {
              to: token,
              data: transferData,
              value: 0n,
            },
          ],
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({
          hash,
        });

        toast.success("PYUSD transfer sent successfully!");
        return receipt;
      } catch (error) {
        console.error("Error sending token transfer:", error);
        toast.error("Failed to send token transfer");
        throw error;
      }
    },
  });
}

/**
 * @notice BATCH ETH TRANSFER HOOK
 */
type BatchTransferParams = {
  recipients: `0x${string}`[];
  amounts: string[]; // in ETH
};

export function useBatchTransfer() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  return useMutation({
    mutationFn: async (params: BatchTransferParams) => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient) {
          throw new Error("Smart Account Client is not initialized");
        }
        if (!owner?.address) {
          throw new Error("No connected wallet found");
        }

        const amountsInWei = params.amounts.map((amount) => parseEther(amount));

        const calls = params.recipients.map((recipient, index) => ({
          to: recipient,
          data: "0x" as `0x${string}`,
          value: amountsInWei[index],
        }));

        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls,
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({
          hash,
        });

        toast.success(
          `Batch transfer completed! Sent to ${params.recipients.length} recipients.`
        );
        return receipt;
      } catch (error) {
        console.error("Error sending batch transfer:", error);
        toast.error("Failed to send batch transfer");
        throw error;
      }
    },
  });
}

/**
 * @notice BATCH ERC20 TRANSFER HOOK
 */
type BatchTokenTransferParams = {
  recipients: `0x${string}`[];
  amounts: string[];
};

export function useBatchTokenTransfer() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  return useMutation({
    mutationFn: async (params: BatchTokenTransferParams) => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient) {
          throw new Error("Smart Account Client is not initialized");
        }
        if (!owner?.address) {
          throw new Error("No connected wallet found");
        }
        const token= PYUSDAddress;
        const decimals =6;
        const amountsInUnits = params.amounts.map((amount) =>
          parseUnits(amount, decimals)
        );

        // Build batch calls for ERC20 transfers
        const calls = params.recipients.map((recipient, index) => {
          const transferData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [recipient, amountsInUnits[index]],
          });

          return {
            to: token,
            data: transferData,
            value: 0n,
          };
        });

        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const receipt = await smartAccountClient.waitForUserOperationReceipt({
          hash,
        });

        toast.success(
          `Batch token transfer completed! Sent to ${params.recipients.length} recipients.`
        );
        return receipt;
      } catch (error) {
        console.error("Error sending batch token transfer:", error);
        toast.error("Failed to send batch token transfer");
        throw error;
      }
    },
  });
}

/**
 * @notice RECURRING PAYMENT HOOK (ETH)
 */
type RecurringPaymentParams = {
  name: string;
  recipients: `0x${string}`[];
  amounts: string[];
  duration: number;
  interval: number;
  transactionStartTime: number;
  revertOnFailure?: boolean;
};

export function useRecurringPayment() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  return useMutation({
    mutationFn: async (params: RecurringPaymentParams) => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient) {
          throw new Error("Smart Account Client is not initialized");
        }
        if (!owner?.address) {
          throw new Error("No connected wallet found");
        }

        const amountsInWei = params.amounts.map((amount) => parseEther(amount));

        const callData = encodeFunctionData({
          abi: AidraIntentRegistry,
          functionName: "createIntent",
          args: [
            zeroAddress, // ETH
            params.name,
            params.recipients,
            amountsInWei,
            BigInt(params.duration),
            BigInt(params.interval),
            BigInt(params.transactionStartTime),
            params.revertOnFailure ?? true,
          ],
        });

        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls: [
            {
              to: AidraRegistryAddress,
              data: callData,
              value: 0n,
            },
          ],
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({
          hash,
        });

        toast.success("Recurring payment intent created successfully!");
        return receipt;
      } catch (error) {
        console.error("Error creating recurring payment intent:", error);
        toast.error("Failed to create recurring payment intent");
        throw error;
      }
    },
  });
}

/**
 * @notice RECURRING TOKEN PAYMENT HOOK
 */
type RecurringTokenPaymentParams = {
  name: string;
  recipients: `0x${string}`[];
  amounts: string[];
  duration: number;
  interval: number;
  transactionStartTime: number;
  revertOnFailure?: boolean;
};

export function useRecurringTokenPayment() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  return useMutation({
    mutationFn: async (params: RecurringTokenPaymentParams) => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient) {
          throw new Error("Smart Account Client is not initialized");
        }
        if (!owner?.address) {
          throw new Error("No connected wallet found");
        }
        const token = PYUSDAddress;
        const decimals = 6;
        const amountsInUnits = params.amounts.map((amount) =>
          parseUnits(amount, decimals)
        );

        const callData = encodeFunctionData({
          abi: AidraIntentRegistry,
          functionName: "createIntent",
          args: [
            token,
            params.name,
            params.recipients,
            amountsInUnits,
            BigInt(params.duration),
            BigInt(params.interval),
            BigInt(params.transactionStartTime),
            params.revertOnFailure ?? true,
          ],
        });

        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls: [
            {
              to: AidraRegistryAddress,
              data: callData,
              value: 0n,
            },
          ],
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({
          hash,
        });

        toast.success("Recurring token payment intent created successfully!");
        return receipt;
      } catch (error) {
        console.error("Error creating recurring token payment intent:", error);
        toast.error("Failed to create recurring token payment intent");
        throw error;
      }
    },
  });
}

/**
 * @notice CANCEL INTENT HOOK
 */
type CancelIntentParams = {
  intentId: `0x${string}`;
};

export function useCancelIntent() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  return useMutation({
    mutationFn: async (params: CancelIntentParams) => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient) {
          throw new Error("Smart Account Client is not initialized");
        }
        if (!owner?.address) {
          throw new Error("No connected wallet found");
        }

        const callData = encodeFunctionData({
          abi: AidraIntentRegistry,
          functionName: "cancelIntent",
          args: [params.intentId],
        });

        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls: [
            {
              to: AidraRegistryAddress,
              data: callData,
              value: 0n,
            },
          ],
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({
          hash,
        });

        toast.success("Intent cancelled successfully!");
        return receipt;
      } catch (error) {
        console.error("Error cancelling intent:", error);
        toast.error("Failed to cancel intent");
        throw error;
      }
    },
  });
}

export type PaymentType =
  | "single-eth"
  | "single-token"
  | "batch-eth"
  | "batch-token"
  | "recurring-eth"
  | "recurring-token"
  | "cancel-intent";

export type PaymentParams = {
  "single-eth": SingleTransferParams;
  "single-token": SingleTokenTransferParams;
  "batch-eth": BatchTransferParams;
  "batch-token": BatchTokenTransferParams;
  "recurring-eth": RecurringPaymentParams;
  "recurring-token": RecurringTokenPaymentParams;
  "cancel-intent": CancelIntentParams;
};

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
      cancelIntent.isSuccess ,
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
