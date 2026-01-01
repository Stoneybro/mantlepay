import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseEther } from "viem";
import { SingleTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";

export function useSingleTransfer(availableEthBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: SingleTransferParams) => {
            try {
                // Balance check
                if (availableEthBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableEthBalance,
                        requiredAmount: params.amount,
                        token: "ETH"
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

                toast.success("ETH transfer sent successfully!");
                return receipt;
            } catch (error) {
                console.error("Error sending ETH transfer:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to send transfer";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
