import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseEther, encodeFunctionData } from "viem";
import { BatchTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { MpSmartWalletABI } from "@/lib/abi/MpSmartWalletAbi";

export function useBatchTransfer(availableEthBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: BatchTransferParams) => {
            try {
                // Calculate total amount
                const totalAmount = params.amounts.reduce((sum, amount) => sum + parseFloat(amount), 0).toString();

                // Balance check
                if (availableEthBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableEthBalance,
                        requiredAmount: totalAmount,
                        token: "MNT"
                    });

                    if (!balanceCheck.sufficient) {
                        throw new Error(balanceCheck.message);
                    }
                }

                const smartAccountClient = await getClient();
                if (!smartAccountClient) {
                    throw new Error("Smart Account Client is not initialized");
                }
                if (!owner?.address) {
                    throw new Error("No connected wallet found");
                }

                const amountsInWei = params.amounts.map((amount) => parseEther(amount));

                // Prepare calls
                const calls = params.recipients.map((recipient, index) => ({
                    target: recipient, // specific struct field name for MpSmartWallet
                    to: recipient,     // for standard permissionless calls
                    data: "0x" as `0x${string}`,
                    value: amountsInWei[index],
                }));

                // Check if we have active compliance data
                const hasCompliance = params.compliance && (
                    (params.compliance.entityIds && params.compliance.entityIds.length > 0) ||
                    (params.compliance.jurisdictions && params.compliance.jurisdictions.length > 0) ||
                    (params.compliance.categories && params.compliance.categories.length > 0) ||
                    (params.compliance.referenceId && params.compliance.referenceId.length > 0)
                );

                let hash;

                if (hasCompliance && params.compliance) {
                    // Encode custom execution for compliance
                    const complianceData = {
                        entityIds: params.compliance.entityIds || [],
                        jurisdictions: params.compliance.jurisdictions || [],
                        categories: params.compliance.categories || [],
                        referenceId: params.compliance.referenceId || ""
                    };

                    // We need to map calls to the exact struct format for the ABI
                    const abiCalls = calls.map(c => ({
                        target: c.target,
                        value: c.value,
                        data: c.data
                    }));

                    const encodedData = encodeFunctionData({
                        abi: MpSmartWalletABI,
                        functionName: 'executeBatchWithCompliance',
                        args: [abiCalls, complianceData]
                    });

                    hash = await smartAccountClient.sendUserOperation({
                        account: smartAccountClient.account,
                        callData: encodedData
                    });
                } else {
                    // Standard execution
                    hash = await smartAccountClient.sendUserOperation({
                        account: smartAccountClient.account,
                        calls: calls.map(c => ({
                            to: c.to,
                            value: c.value,
                            data: c.data
                        })),
                    });
                }

                const receipt = await smartAccountClient.waitForUserOperationReceipt({
                    hash,
                });

                toast.success(
                    `Batch MNT transfer completed! Sent to ${params.recipients.length} recipients.`
                );
                return receipt;
            } catch (error) {
                console.error("Error sending batch MNT transfer:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to send batch transfer";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
