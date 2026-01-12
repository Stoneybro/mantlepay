import { readContract } from "@/lib/server";
import { formatUnits } from "viem";
import { MneeSmartWalletABI } from "@/lib/abi/MneeSmartWalletAbi";
import { zeroAddress } from "viem";

/**
 * Fetches wallet balances :
 * - availableBalance: spendable funds
 * - committedFunds: locked rewards
 */

export async function fetchWalletBalance(smartAccountAddress: `0x${string}`) {
  const [availablePyusdBalance, committedPyuBalance] = await Promise.all([
    readContract({
      address: smartAccountAddress,
      abi: MneeSmartWalletABI,
      functionName: "getAvailableBalance",
      args: [MneeAddress],
    }),
    readContract({
      address: smartAccountAddress,
      abi: MneeSmartWalletABI,
      functionName: "s_committedFunds",
      args: [MneeAddress],
    }),
  ]);

  return {
    availableMneeBalance: formatUnits(availablePyusdBalance as bigint, 6),
    committedMneeBalance: formatUnits(committedPyuBalance as bigint, 6),
  };
}

export const MneeAddress = "0x19b2124fCb1B156284EE2C28f97e3c873f415bc5";