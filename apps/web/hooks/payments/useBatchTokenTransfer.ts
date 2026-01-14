import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData, parseUnits, erc20Abi, zeroAddress } from "viem";

import { BatchTokenTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";

import { MpTokenAddress } from "@/utils/helper";
import { MpSmartWalletABI } from "@/lib/abi/MpSmartWallet";

export function useBatchTokenTransfer(availableMpTokenBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: BatchTokenTransferParams) => {
            try {
                // Calculate total amount
                const totalAmount = params.amounts.reduce((sum, amount) => sum + parseFloat(amount), 0).toString();

                // Balance check
                if (availableMpTokenBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableMpTokenBalance,
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

                const token = MpTokenAddress;
                const decimals = 6;
                const amountsInUnits = params.amounts.map((amount) =>
                    parseUnits(amount, decimals)
                );

                const transferCalls = params.recipients.map((recipient, index) => {
                    const transferData = encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [recipient, amountsInUnits[index]],
                    });

                    return {
                        target: token as `0x${string}`,
                        value: 0n,
                        data: transferData as `0x${string}`,
                    };
                });

                // Check if compliance metadata is provided
                const hasCompliance = params.compliance && (
                    (params.compliance.entityIds && params.compliance.entityIds.length > 0) ||
                    params.compliance.jurisdiction ||
                    params.compliance.category ||
                    params.compliance.referenceId
                );

                let hash;
                if (hasCompliance) {
                    // Use executeBatchWithCompliance to emit ComplianceExecuted event
                    const complianceData = {
                        entityIds: params.compliance?.entityIds || [],
                        jurisdiction: params.compliance?.jurisdiction || "",
                        category: params.compliance?.category || "",
                        referenceId: params.compliance?.referenceId || ""
                    };

                    const executeBatchWithComplianceData = encodeFunctionData({
                        abi: MpSmartWalletABI,
                        functionName: "executeBatchWithCompliance",
                        args: [transferCalls, complianceData],
                    });

                    hash = await smartAccountClient.sendUserOperation({
                        account: smartAccountClient.account,
                        calls: [
                            {
                                to: smartAccountClient.account!.address,
                                data: executeBatchWithComplianceData,
                                value: 0n,
                            },
                        ],
                    });
                } else {
                    // Standard batch transfer without compliance
                    const calls = transferCalls.map(c => ({
                        to: c.target,
                        data: c.data,
                        value: 0n,
                    }));

                    hash = await smartAccountClient.sendUserOperation({
                        account: smartAccountClient.account,
                        calls,
                    } as never);
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
                const errorMessage = error instanceof Error ? error.message : "Failed to send batch token transfer";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}

