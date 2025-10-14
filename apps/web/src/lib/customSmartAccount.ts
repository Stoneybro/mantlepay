import { useCallback, useEffect, useState } from "react";
import { toSmartAccount, entryPoint06Abi } from "viem/account-abstraction";
import { encodeFunctionData, decodeFunctionData } from "viem";
import AidraSmartWalletFactoryABI from "@aidra/contracts/AidraSmartWalletFactory";
import AidraSmartWalletABI from "@aidra/contracts/AidraSmartWallet";
import {
  useWallets,
  useSignMessage,
  useSignTypedData,
} from "@privy-io/react-auth";
import { publicClient } from "./pimlico";
import type { SmartAccount } from "viem/account-abstraction";

export type CustomSmartAccount = SmartAccount;
// function for initializing and managing a custom Smart Account (ERC-4337 style)
export default function CustomSmartAccount() {
  const [customSmartAccount, setCustomSmartAccount] =
    useState<CustomSmartAccount | null>(null);
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
  const { signMessage: privySignMessage } = useSignMessage();
  const { signTypedData: privySignTypedData } = useSignTypedData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Reset account state when owner changes
  useEffect(() => {
    setCustomSmartAccount(null);
    setError(null);
    setIsLoading(false);
  }, [owner?.address]);

  // ----------------- CONFIG -----------------
  const ENTRY_POINT_ADDR = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // v0.6 entry point
  const ENTRY_POINT_VERSION = "0.6";
  const AidraSmartWalletFactoryAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  // Predict smart account address (factory call)
  async function predictAddress(ownerAddress: `0x${string}`) {
    return publicClient.readContract({
      address: AidraSmartWalletFactoryAddress,
      abi: AidraSmartWalletFactoryABI,
      functionName: "getPredictedAddress",
      args: [ownerAddress],
    }) as Promise<`0x${string}`>;
  }

  // Initialize custom smart account
  const initCustomAccount = useCallback(async () => {
    setError(null);

    if (!owner || !owner.address) {
      const err = new Error("Owner address is undefined. Ensure a valid wallet is connected.");
      setError(err);
      throw err;
    }

    if (customSmartAccount) return customSmartAccount;

    setIsLoading(true);
    try {
      const account = await toSmartAccount({
        client: publicClient,
        entryPoint: {
          address: ENTRY_POINT_ADDR,
          version: ENTRY_POINT_VERSION,
          abi: entryPoint06Abi,
        },
        // Adapter for encoding/decoding calls (supports single and batch)
        async decodeCalls(data) {
          try {
            // Try to decode as batch call first
            const decoded = decodeFunctionData({
              abi: AidraSmartWalletABI,
              data: data as `0x${string}`,
            });

            if (decoded.functionName === "executeBatch" && decoded.args) {
              const batchCalls = decoded.args[0] as Array<{
                target: `0x${string}`;
                value: bigint;
                data: `0x${string}`;
              }>;
              return batchCalls.map((call) => ({
                to: call.target,
                value: call.value,
                data: call.data,
              }));
            } else if (decoded.functionName === "execute" && decoded.args) {
              const [target, value, callData] = decoded.args as [
                `0x${string}`,
                bigint,
                `0x${string}`,
              ];
              return [{ to: target, value, data: callData }];
            }
          } catch (e) {
            // Fallback for unknown format
            console.warn("Failed to decode calls:", e);
          }
          return [{ to: "0x0000000000000000000000000000000000000000", value: 0n, data }];
        },
        async encodeCalls(calls) {
          // Single call - use execute()
          if (calls.length === 1) {
            const call = calls[0];
            return encodeFunctionData({
              abi: AidraSmartWalletABI,
              functionName: "execute",
              args: [call.to, call.value || 0n, call.data || "0x"],
            });
          }
          
          // Multiple calls - use executeBatch()
          const batchCalls = calls.map((call) => ({
            target: call.to,
            value: call.value || 0n,
            data: call.data || "0x",
          }));
          
          return encodeFunctionData({
            abi: AidraSmartWalletABI,
            functionName: "executeBatch",
            args: [batchCalls],
          });
        },
        // Account factory + nonce helpers
        async getAddress() {
          return predictAddress(owner.address as `0x${string}`);
        },
        async getFactoryArgs() {
          return {
            factory: AidraSmartWalletFactoryAddress,
            factoryData: encodeFunctionData({
              abi: AidraSmartWalletFactoryABI,
              functionName: "createSmartAccount",
              args: [],
            }),
          };
        },
        async getNonce() {
          const sender = await predictAddress(owner.address as `0x${string}`);
          return publicClient.readContract({
            address: ENTRY_POINT_ADDR,
            abi: entryPoint06Abi,
            functionName: "getNonce",
            args: [sender, 0n],
          }) as Promise<bigint>;
        },
        async getStubSignature() {
          return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c" as `0x${string}`;
        },
        // Message + typedData signing (via Privy)
        async signMessage({ message }) {
          const msgStr = typeof message === "string" ? message : (message.raw as `0x${string}`);
          const { signature } = await privySignMessage({ message: msgStr });
          return signature as `0x${string}`;
        },
        async signTypedData(typedData) {
          const { signature } = await privySignTypedData({
            types: typedData.types as Record<string, Array<{ name: string; type: string }>>,
            primaryType: typedData.primaryType as string,
            domain: typedData.domain as {
              name?: string;
              version?: string;
              chainId?: number;
              verifyingContract?: string;
              salt?: ArrayBuffer;
            },
            message: typedData.message as Record<string, unknown>,
          });
          return signature as `0x${string}`;
        },
        // UserOperation signing for EntryPoint
        async signUserOperation(userOperation) {


          // Build hash for signing
          const uoForHash = {
            sender: userOperation.sender as `0x${string}`,
            nonce: userOperation.nonce,
            initCode: userOperation.initCode ?? "0x",
            callData: userOperation.callData,
            callGasLimit: userOperation.callGasLimit!,
            verificationGasLimit: userOperation.verificationGasLimit!,
            preVerificationGas: userOperation.preVerificationGas!,
            maxFeePerGas: userOperation.maxFeePerGas!,
            maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas!,
            paymasterAndData: userOperation.paymasterAndData ?? "0x",
            signature: "0x",
          } as const;

          // Get userOpHash from EntryPoint
          const userOpHash = await publicClient.readContract({
            address: ENTRY_POINT_ADDR,
            abi: entryPoint06Abi,
            functionName: "getUserOpHash",
            args: [uoForHash],
          });



          const { signature } = await privySignMessage({message: userOpHash});

          return signature as `0x${string}`;
        },
      });
      setCustomSmartAccount(account);
      return account;
    } catch (err) {
      console.error("custom account error", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [owner?.address, privySignMessage, customSmartAccount]);

  // Reset state manually if needed
  const resetCustomAccount = useCallback(() => {
    setCustomSmartAccount(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { initCustomAccount, isLoading, error, resetCustomAccount };
}
