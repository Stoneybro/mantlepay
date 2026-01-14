import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData } from "viem";
import { MpIntentRegistryABI } from "@/lib/abi/MpIntentRegistry";
import { MpRegistryAddress } from "@/lib/CA";
import { CancelIntentParams } from "./types";

export function useCancelIntent() {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

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
                    abi: MpIntentRegistryABI,
                    functionName: "cancelIntent",
                    args: [params.intentId],
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

                toast.success("Intent cancelled successfully!");
                return receipt;
            } catch (error) {
                console.error("Error cancelling intent:", error);
                toast.error("Failed to cancel intent");
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
