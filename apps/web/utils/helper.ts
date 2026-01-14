import { readContract } from "@/lib/server";
import { formatUnits } from "viem";
import { MpSmartWalletABI } from "@/lib/abi/MpSmartWalletAbi";
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
      abi: MpSmartWalletABI,
      functionName: "getAvailableBalance",
      args: [MpTokenAddress],
    }),
    readContract({
      address: smartAccountAddress,
      abi: MpSmartWalletABI,
      functionName: "s_committedFunds",
      args: [MpTokenAddress],
    }),
  ]);

  return {
    availableMpTokenBalance: formatUnits(availablePyusdBalance as bigint, 6),
    committedMpTokenBalance: formatUnits(committedPyuBalance as bigint, 6),
  };
}

export const MpTokenAddress = "0x19b2124fCb1B156284EE2C28f97e3c873f415bc5";