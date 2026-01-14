import { readContract } from "@/lib/server";
import { formatUnits, formatEther } from "viem";
import { MpSmartWalletABI } from "@/lib/abi/MpSmartWalletAbi";
import { zeroAddress } from "viem";
import { getPublicClient } from "@/lib/client";

/**
 * Fetches wallet balances for native MNT:
 * - availableBalance: spendable funds
 * - committedFunds: locked in scheduled payments
 */

export async function fetchWalletBalance(smartAccountAddress: `0x${string}`) {
  const publicClient = getPublicClient();

  // Get native MNT balance directly from the chain
  const nativeBalance = await publicClient.getBalance({ address: smartAccountAddress });

  // Get committed funds for native token (zeroAddress represents native MNT)
  const committedFunds = await readContract({
    address: smartAccountAddress,
    abi: MpSmartWalletABI,
    functionName: "s_committedFunds",
    args: [zeroAddress],
  }) as bigint;

  // Available = total balance - committed
  const availableBalance = nativeBalance - committedFunds;

  return {
    availableMntBalance: formatEther(availableBalance > 0n ? availableBalance : 0n),
    committedMntBalance: formatEther(committedFunds),
    totalMntBalance: formatEther(nativeBalance),
  };
}