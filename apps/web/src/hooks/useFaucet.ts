"use client";

import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/smartAccountProvider";
import { AidraFaucetAbi } from "@/lib/abi/AidraFaucetAbi"; 
import { AidraFaucet } from "@/lib/CA";
import { encodeFunctionData } from "viem";

export function useFaucet() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const smartAccountClient = await getClient();
      if (!smartAccountClient) {
        throw new Error("Smart Account Client is not initialized");
      }
      if (!owner?.address) {
        throw new Error("No connected wallet found");
      }

      const dripData = encodeFunctionData({
        abi: AidraFaucetAbi,
        functionName: "claim",
      });

      const hash = await smartAccountClient.sendUserOperation({
        account: smartAccountClient.account,
        calls: [
          {
            to: AidraFaucet,
            data: dripData,
            value: 0n,
          },
        ],
      });

      const receipt = await smartAccountClient.waitForUserOperationReceipt({
        hash,
      });
      if (!receipt) {
        throw new Error();
      }
      return smartAccountClient?.account?.address;
    },
    onSuccess: (walletAddress) => {
      toast.success("Faucet Claimed successfully!");
      localStorage.setItem("FaucetClaimed", "true");
      queryClient.invalidateQueries({
        queryKey: ["walletBalance", walletAddress],
      });
    },
    onError: (error: Error) => {
        console.error("Error receiving funds from faucet:", error);
        toast.error(error.message || "Failed to receive funds from faucet");
    }
  });
}
