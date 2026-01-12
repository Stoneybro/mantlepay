import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";

import { MneeSmartWalletFactoryABI } from "@/lib/abi/MneeSmartWalletFactoryAbi";
import { readContract } from "@/lib/server";
import type { Abi } from "viem";
import { MneeSmartWalletFactoryAddress } from "@/lib/CA";

const ZERO = "0x0000000000000000000000000000000000000000";

async function checkWalletDeployment(address: string): Promise<boolean> {
  // Check localStorage first - fast and works offline
  const cached = localStorage.getItem("wallet-deployed");
  if (cached && cached !== ZERO && cached.startsWith("0x")) {
    console.log("Using cached wallet address:", cached);
    return true;
  }

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
    // If we have cache, trust it during network errors
    if (cached && cached !== ZERO) {
      console.log("Network error, using cached value");
      return true;
    }
    // No cache and network failed - throw error to be handled by UI
    throw new Error("Network error while checking wallet deployment");
  }

  if (typeof rawRes === "string" && rawRes.startsWith("0x") && rawRes != ZERO) {
    localStorage.setItem("wallet-deployed", rawRes.toString());
    return true;
  } else {
    // Wallet genuinely not deployed - clear any stale cache
    localStorage.removeItem("wallet-deployed");
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
    refetchOnWindowFocus: true, // Enable refetch on focus to refresh after inactivity
    refetchOnMount: true, // Enable refetch on mount
    refetchInterval: false, // Don't poll
    refetchIntervalInBackground: false,
  });

  return {
    ...query,
    // Keep loading true if Privy isn't ready OR query is loading
    // This prevents showing stale/error states during session refresh
    isLoading: !ready || query.isLoading,
  };
}

export default useWalletDeployment;
