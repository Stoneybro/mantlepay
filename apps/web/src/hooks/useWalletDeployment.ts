import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import AidraSmartWalletFactoryABI from "@aidra/contracts/AidraSmartWalletFactory";
import { readContract } from "@/lib/server";
import type { Abi } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000";
const AIDRA_SMART_WALLET_FACTORY_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // Update with your actual factory address

async function checkWalletDeployment(address: string): Promise<boolean> {
  let rawRes;
  try {
    rawRes = await readContract({
      address: AIDRA_SMART_WALLET_FACTORY_ADDRESS,
      abi: AidraSmartWalletFactoryABI as Abi,
      functionName: "getPredictedAddress",
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
