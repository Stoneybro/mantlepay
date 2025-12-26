import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { AidraSmartWalletFactoryABI } from "@/lib/abi/AidraSmartWalletFactoryAbi";
import { readContract } from "@/lib/server";
import type { Abi } from "viem";
import { AidraSmartWalletFactoryAddress } from "@/lib/CA";

const ZERO = "0x0000000000000000000000000000000000000000";

async function checkWalletDeployment(address: string): Promise<boolean> {
  let rawRes;
  try {
    rawRes = await readContract({
      address: AidraSmartWalletFactoryAddress,
      abi: AidraSmartWalletFactoryABI as Abi,
      functionName: "getUserClone",
      args: [address],
    });
  } catch (e) {
    console.error("Chain read error:", e);
  }
  if (typeof rawRes === "string" && rawRes.startsWith("0x") && rawRes != ZERO) {
    Cookies.set("wallet-deployed", rawRes.toString(), {
      expires: 7,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return true;
  } else {
    console.log("Wallet not deployed");
    return false;
  }
}

function useWalletDeployment() {
  const { user, authenticated, ready } = usePrivy();
  const address = user?.wallet?.address;
  return useQuery({
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
}

export default useWalletDeployment;
