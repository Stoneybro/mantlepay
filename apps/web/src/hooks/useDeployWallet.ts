"use client";
import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { encodeFunctionData } from "viem";
import AidraSmartWalletABI from "@aidra/contracts/AidraSmartWallet";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/smartAccountProvider";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import type { Abi } from "viem";
// Custom Hook that returns an activation handler for the smart account
export function useDeployWallet() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy"); // pick Privy wallet
  const queryClient = useQueryClient();
  const router=useRouter()

  return useMutation({
    mutationFn: async () => {
      try {
        const smartAccountClient = await getClient();
        if (!smartAccountClient)
          throw new Error("Smart Account Client is not initialized");

        // prepare calldata for SmartAccount "execute"
        const callData = encodeFunctionData({
          abi: AidraSmartWalletABI as Abi,
          functionName: "execute",
          args: [owner?.address as `0x${string}`, 0n, "0x"],
        });

        // send user operation through bundler/paymaster
        const hash = await smartAccountClient.sendUserOperation({
          account: smartAccountClient.account,
          calls: [
            {
              to: owner?.address as `0x${string}`,
              data: callData,
              value: 0n,
            },
          ],
        });

        // wait for inclusion & confirm
        await smartAccountClient.waitForUserOperationReceipt({ hash });


        return true;
      } catch (error) {
        console.log("Error deploying wallet", error);
        toast.error("Failed to deploy wallet");
        return false;
      }
    },onSuccess: () => {
      // Update cookie immediately
      Cookies.set('wallet-deployed', 'true', { 
        expires: 7,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['walletDeployment',owner?.address] });
      
      // Navigate to dashboard - middleware will allow it now
      router.push('/wallet');
    },
    onError: (error) => {
      console.error('Deployment failed:', error);
    }
  });
}

