import { readContract } from "@/lib/server";
import { zeroAddress, formatUnits } from "viem";
import { MneeSmartWalletABI } from "@/lib/abi/MneeSmartWalletAbi";
import { formatNumber } from "./format";

/**
 * Fetches wallet balances :
 * - availableBalance: spendable funds
 * - committedFunds: locked rewards
 * - totalBalance: total ETH in smart account
 */

export async function fetchWalletBalance(smartAccountAddress: `0x${string}`,address: `0x${string}`) {
  const [availableEthBalance, committedEthBalance, availablePyusdBalance, committedPyuBalance] = await Promise.all([
    readContract({
      address: smartAccountAddress,
      abi:  MneeSmartWalletABI,
      functionName: "getAvailableBalance",
      args: [zeroAddress],
    }),
    readContract({
      address: smartAccountAddress,
      abi:  MneeSmartWalletABI,
      functionName: "s_committedFunds",
      args: [zeroAddress],
    }),
    readContract({
      address: smartAccountAddress,
      abi:  MneeSmartWalletABI,
      functionName: "getAvailableBalance",
      args: [address],
    }),
    readContract({
      address: smartAccountAddress,
      abi:  MneeSmartWalletABI,
      functionName: "s_committedFunds",
      args: [address],
    }),
  ]);

  return {
    availableEthBalance: formatNumber(availableEthBalance as bigint),
    committedEthBalance: formatNumber(committedEthBalance as bigint),
    availablePyusdBalance: formatUnits(availablePyusdBalance as bigint,6),
    committedPyusdBalance: formatUnits(committedPyuBalance as bigint,6),
  };
}