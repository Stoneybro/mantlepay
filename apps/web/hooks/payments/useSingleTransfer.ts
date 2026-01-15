import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseEther, encodeFunctionData } from "viem";
import { SingleTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { MpSmartWalletABI } from "@/lib/abi/MpSmartWalletAbi";

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

                const amountInWei = parseEther(params.amount);

                // Check for compliance data (checking for meaningful data inside)
                const hasCompliance = params.compliance && (
                    (params.compliance.entityIds && params.compliance.entityIds.length > 0) ||
                    (params.compliance.jurisdictions && params.compliance.jurisdictions.length > 0) ||
                    (params.compliance.categories && params.compliance.categories.length > 0)
                );

                let hash;

                if (hasCompliance && params.compliance) {
                    const complianceData = {
                        entityIds: params.compliance.entityIds || [],
                        jurisdictions: params.compliance.jurisdictions || [],
                        categories: params.compliance.categories || [],
                        referenceId: params.compliance.referenceId || ""
                    };

                    const encodedData = encodeFunctionData({
                        abi: MpSmartWalletABI,
                        functionName: 'executeWithCompliance',
                        args: [
                            params.to,
                            amountInWei,
                            "0x", // data
                            complianceData
                        ]
                    });

                    hash = await smartAccountClient.sendUserOperation({
                        account: smartAccountClient.account,
                        callData: encodedData
                    });
                } else {
                    hash = await smartAccountClient.sendUserOperation({
                        account: smartAccountClient.account,
                        calls: [
                            {
                                to: params.to,
                                data: "0x",
                                value: amountInWei,
                            },
                        ],
                    });
                }

                const receipt = await smartAccountClient.waitForUserOperationReceipt({
                    hash,
                });

                toast.success("MNT transfer sent successfully!");
                return receipt;
            } catch (error) {
                console.error("Error sending MNT transfer:", error);
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
