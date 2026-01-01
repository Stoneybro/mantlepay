import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData, parseUnits, erc20Abi } from "viem";
import { PYUSDAddress } from "@/utils/helpers";
import { BatchTokenTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";

export function useBatchTokenTransfer(availablePyusdBalance?: string) {
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
                if (availablePyusdBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availablePyusdBalance,
                        requiredAmount: totalAmount,
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
                } as never);

                const receipt = await smartAccountClient.waitForUserOperationReceipt({
                    hash,
                });

                toast.success(
                    `Batch PYUSD transfer completed! Sent to ${params.recipients.length} recipients.`
                );
                return receipt;
            } catch (error) {
                console.error("Error sending batch PYUSD transfer:", error);
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
