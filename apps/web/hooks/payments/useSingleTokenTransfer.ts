import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData, parseUnits, erc20Abi, zeroAddress } from "viem";

import { SingleTokenTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";

import { MneeAddress } from "@/utils/helper";

export function useSingleTokenTransfer(availableMneeBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: SingleTokenTransferParams) => {
            try {
                // Balance check
                if (availableMneeBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableMneeBalance,
                        requiredAmount: params.amount,
                        token: "MNEE"
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

                const token = MneeAddress;
                const decimals = 6;
                const amountInUnits = parseUnits(params.amount, decimals);

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

                toast.success("MNEE transfer sent successfully!");
                return receipt;
            } catch (error) {
                console.error("Error sending MNEE transfer:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to send token transfer";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
