import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData, parseEther, zeroAddress } from "viem";
import { MpIntentRegistryABI } from "@/lib/abi/MpIntentRegistryABI";
import { MpRegistryAddress } from "@/lib/CA";
import { RecurringPaymentParams } from "./types";
import { checkSufficientBalance } from "./utils";

export function useRecurringPayment(availableEthBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: RecurringPaymentParams) => {
            try {
                // Calculate total commitment
                const amountPerPayment = params.amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
                const totalPayments = Math.floor(params.duration / params.interval);
                const totalCommitment = (amountPerPayment * totalPayments).toString();

                // Balance check
                if (availableEthBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableEthBalance,
                        requiredAmount: totalCommitment,
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

                const callData = encodeFunctionData({
                    abi: MpIntentRegistryABI,
                    functionName: "createIntent",
                    args: [
                        zeroAddress, // MNT (native token)
                        params.name,
                        params.recipients,
                        amountsInWei,
                        BigInt(params.duration),
                        BigInt(params.interval),
                        BigInt(params.transactionStartTime),
                        params.revertOnFailure ?? true,
                        {
                            entityIds: params.compliance?.entityIds ?? [],
                            jurisdiction: params.compliance?.jurisdiction ?? "",
                            category: params.compliance?.category ?? "",
                            referenceId: params.compliance?.referenceId ?? "",
                        },
                    ],
                });

                const hash = await smartAccountClient.sendUserOperation({
                    account: smartAccountClient.account,
                    calls: [
                        {
                            to: MpRegistryAddress,
                            data: callData,
                            value: 0n,
                        },
                    ],
                });

                const receipt = await smartAccountClient.waitForUserOperationReceipt({
                    hash,
                });

                toast.success("Recurring MNT payment intent created successfully!");
                return receipt;
            } catch (error) {
                console.error("Error creating recurring MNT payment intent:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to create recurring payment intent";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
