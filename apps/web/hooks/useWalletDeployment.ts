import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";

import { MneeSmartWalletFactoryABI } from "@/lib/abi/MneeSmartWalletFactoryAbi";
import { readContract } from "@/lib/server";
import type { Abi } from "viem";
import { MneeSmartWalletFactoryAddress } from "@/lib/CA";

const ZERO = "0x0000000000000000000000000000000000000000";

async function checkWalletDeployment(address: string): Promise<boolean> {
  let rawRes;
  try {
    rawRes = await readContract({
      address: MneeSmartWalletFactoryAddress,
      abi: MneeSmartWalletFactoryABI as Abi,
      functionName: "getUserClone",
      args: [address],
    });
  } catch (e) {
    console.error("Chain read error:", e);
  }
  if (typeof rawRes === "string" && rawRes.startsWith("0x") && rawRes != ZERO) {
    localStorage.setItem("wallet-deployed", rawRes.toString());
    return true;
  } else {
    console.log("Wallet not deployed");
    return false;
  }
}

function useWalletDeployment() {
  const { user, authenticated, ready } = usePrivy();
  const address = user?.wallet?.address;
  const query = useQuery({
    queryKey: ["deploymentStatus", address],
    queryFn: () => checkWalletDeployment(address!),
    enabled: ready && authenticated && !!address,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    ...query,
    isLoading: !ready || query.isLoading,
  };
}

export default useWalletDeployment;
