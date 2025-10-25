
import { readContract } from "@/lib/server";
import { zeroAddress, type Abi } from "viem";
import AidraSmartWalletABI from "@aidra/contracts/AidraSmartWallet";
import { formatNumber } from "./format";




export const PYUSDAddress = "0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1";
/**
 * Fetches wallet balances :
 * - availableBalance: spendable funds
 * - committedFunds: locked rewards
 * - totalBalance: total ETH in smart account
 */

export async function fetchWalletBalance(smartAccountAddress: `0x${string}`) {
  const [availableEthBalance, committedEthBalance, availablePyusdBalance, committedPyuBalance] = await Promise.all([
    readContract({
      address: smartAccountAddress,
      abi:  AidraSmartWalletABI as Abi,
      functionName: "getAvailableBalance",
      args: [zeroAddress],
    }),
    readContract({
      address: smartAccountAddress,
      abi:  AidraSmartWalletABI as Abi,
      functionName: "s_committedFunds",
      args: [zeroAddress],
    }),
    readContract({
      address: smartAccountAddress,
      abi:  AidraSmartWalletABI as Abi,
      functionName: "getAvailableBalance",
      args: [PYUSDAddress],
    }),
    readContract({
      address: smartAccountAddress,
      abi:  AidraSmartWalletABI as Abi,
      functionName: "s_committedFunds",
      args: [PYUSDAddress],
    }),
  ]);

  return {
    availableEthBalance: formatNumber(availableEthBalance as bigint),
    committedEthBalance: formatNumber(committedEthBalance as bigint),
    availablePyusdBalance: formatNumber(availablePyusdBalance as bigint),
    committedPyusdBalance: formatNumber(committedPyuBalance as bigint),
  };
}