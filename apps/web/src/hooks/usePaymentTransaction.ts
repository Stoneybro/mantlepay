import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/smartAccountProvider";
import AidraIntentRegistry from "@aidra/contracts/AidraIntentRegistry";
import { AidraRegistryAddress } from "@/lib/CA";
import { encodeFunctionData, parseEther } from "viem";

/**
 * @notice SINGLE TRANSFER HOOK
 * @dev This hook is used to execute a single ETH transfer to one recipient
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

        // Send single transaction (execute)
        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls: [
            {
              to: params.to,
              data: "0x", // Simple ETH transfer
              value: amountInWei,
            },
          ],
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({ hash });
        
        toast.success("Transfer sent successfully!");
        return receipt;
        
      } catch (error) {
        console.error("Error sending transfer:", error);
        toast.error("Failed to send transfer");
        throw error;
      }
    }
  });
}

/**
 * @notice BATCH TRANSFER HOOK
 * @dev This hook is used to execute a batch of ETH transfers to multiple recipients
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

        // Convert all amounts to wei
        const amountsInWei = params.amounts.map(amount => parseEther(amount));

        // Build batch calls (executeBatch)
        const calls = params.recipients.map((recipient, index) => ({
          to: recipient,
          data: "0x" as `0x${string}`, // Simple ETH transfer
          value: amountsInWei[index],
        }));

        // Send batch transaction
        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls, // Multiple calls in one transaction
        });

        const receipt = await smartAccountClient.waitForUserOperationReceipt({ hash });
        
        toast.success(`Batch transfer completed! Sent to ${params.recipients.length} recipients.`);
        return receipt;
        
      } catch (error) {
        console.error("Error sending batch transfer:", error);
        toast.error("Failed to send batch transfer");
        throw error;
      }
    }
  });
}

/**
 * @notice RECURRING PAYMENT HOOK
 * @dev This hook is used to execute a recurring payment to single or multiple recipients
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

        const amountsInWei = params.amounts.map(amount => parseEther(amount));

        const callData = encodeFunctionData({
          abi: AidraIntentRegistry,
          functionName: "createIntent",
          args: [
            params.name,
            params.recipients,
            amountsInWei,
            BigInt(params.duration),
            BigInt(params.interval),
            BigInt(params.transactionStartTime),
            params.revertOnFailure ?? true
          ]
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

        const receipt = await smartAccountClient.waitForUserOperationReceipt({ hash });
        
        toast.success("Recurring payment intent created successfully!");
        return receipt;
        
      } catch (error) {
        console.error("Error creating recurring payment intent:", error);
        toast.error("Failed to create recurring payment intent");
        throw error;
      }
    }
  });
}

// ============================================
// UNIFIED HOOK (Optional - for cleaner usage)
// ============================================

export type PaymentType = 'single' | 'batch' | 'recurring';

export function usePayment() {
  const singleTransfer = useSingleTransfer();
  const batchTransfer = useBatchTransfer();
  const recurringPayment = useRecurringPayment();

  const execute = (type: PaymentType, params: any) => {
    switch (type) {
      case 'single':
        return singleTransfer.mutateAsync(params);
      case 'batch':
        return batchTransfer.mutateAsync(params);
      case 'recurring':
        return recurringPayment.mutateAsync(params);
    }
  };

  return {
    execute,
    isPending: singleTransfer.isPending || batchTransfer.isPending || recurringPayment.isPending,
    isSuccess: singleTransfer.isSuccess || batchTransfer.isSuccess || recurringPayment.isSuccess,
    isError: singleTransfer.isError || batchTransfer.isError || recurringPayment.isError,
  };
}