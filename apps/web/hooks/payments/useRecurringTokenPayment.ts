import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData, parseUnits } from "viem";
import { AidraIntentRegistry } from "@/lib/abi/AidraIntentRegistry";
import { AidraRegistryAddress } from "@/lib/CA";
import { PYUSDAddress } from "@/utils/helpers";
import { RecurringTokenPaymentParams } from "./types";
import { checkSufficientBalance } from "./utils";

export function useRecurringTokenPayment(availablePyusdBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: RecurringTokenPaymentParams) => {
            try {
                // Calculate total commitment
                const amountPerPayment = params.amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
                const totalPayments = Math.floor(params.duration / params.interval);
                const totalCommitment = (amountPerPayment * totalPayments).toString();

                // Balance check
                if (availablePyusdBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availablePyusdBalance,
                        requiredAmount: totalCommitment,
                        token: "PYUSD"
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

                toast.success("Recurring PYUSD payment intent created successfully!");
                return receipt;
            } catch (error) {
                console.error("Error creating recurring PYUSD payment intent:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to create recurring token payment intent";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
