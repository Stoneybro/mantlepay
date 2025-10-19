// hooks/useBlockscout.ts
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import {
  getAccountTransactions,
  getInternalTransactions,
  getTransaction,

  getUserOpExecutionLogs,
} from "@/lib/blockscout";

// Query key factory
export const blockscoutKeys = {
  all: ["blockscout"] as const,
  transactions: (address: Address) =>
    [...blockscoutKeys.all, "transactions", address] as const,
  internalTxs: (address: Address) =>
    [...blockscoutKeys.all, "internal", address] as const,
  tokenBalances: (address: Address) =>
    [...blockscoutKeys.all, "tokens", address] as const,
  tokenTransfers: (address: Address, type?: string) =>
    [...blockscoutKeys.all, "transfers", address, type] as const,
  transaction: (hash: string) =>
    [...blockscoutKeys.all, "tx", hash] as const,
  addressInfo: (address: Address) =>
    [...blockscoutKeys.all, "address", address] as const,
  tokenInfo: (address: Address) =>
    [...blockscoutKeys.all, "token-info", address] as const,
  userOpLogs: (accountAddress: Address, entryPoint: Address) =>
    [...blockscoutKeys.all, "userop-logs", accountAddress, entryPoint] as const,
};

/**
 * Get transaction history with infinite scroll
 */
export function useTransactionHistory(params: {
  address?: Address;
  enabled?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: blockscoutKeys.transactions(params.address!),
    queryFn: ({ pageParam = 1 }) =>
      getAccountTransactions({
        address: params.address!,
        page: pageParam,
        limit: 20,
      }),
    enabled: (params.enabled ?? true) && !!params.address,
    getNextPageParam: (lastPage) =>
      lastPage.next_page_params ? lastPage.next_page_params.page_number : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

/**
 * Get internal transactions (UserOp executions)
 */
export function useInternalTransactions(params: {
  address?: Address;
  enabled?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: blockscoutKeys.internalTxs(params.address!),
    queryFn: ({ pageParam = 1 }) =>
      getInternalTransactions({
        address: params.address!,
        page: pageParam,
        limit: 20,
      }),
    enabled: (params.enabled ?? true) && !!params.address,
    getNextPageParam: (lastPage, allPages) => {
      // If lastPage is empty or has fewer items than limit, no more pages
      return lastPage.length === 20 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

// /**
//  * Get all token balances (ERC20, NFTs, etc)
//  */
// export function useTokenBalances(params: {
//   address?: Address;
//   type?: "ERC-20" | "ERC-721" | "ERC-1155";
//   enabled?: boolean;
// }) {
//   return useQuery({
//     queryKey: blockscoutKeys.tokenBalances(params.address!),
//     queryFn: () =>
//       getTokenBalances({
//         address: params.address!,
//         type: params.type,
//       }),
//     enabled: (params.enabled ?? true) && !!params.address,
//     staleTime: 60_000, // Token balances don't change as frequently
//   });
// }

/**
 * Get token transfer history (for activity feed)
 */
// export function useTokenTransfers(params: {
//   address?: Address;
//   type?: "ERC-20" | "ERC-721" | "ERC-1155";
//   enabled?: boolean;
// }) {
//   return useInfiniteQuery({
//     queryKey: blockscoutKeys.tokenTransfers(params.address!, params.type),
//     queryFn: ({ pageParam = 1 }) =>
//       getTokenTransfers({
//         address: params.address!,
//         type: params.type,
//         page: pageParam,
//         limit: 20,
//       }),
//     enabled: (params.enabled ?? true) && !!params.address,
//     getNextPageParam: (lastPage) =>
//       lastPage.next_page_params ? lastPage.next_page_params.page_number : undefined,
//     initialPageParam: 1,
//     staleTime: 30_000,
//   });
// }

/**
 * Get single transaction details
 */
export function useTransaction(params: {
  hash?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: blockscoutKeys.transaction(params.hash!),
    queryFn: () => getTransaction(params.hash!),
    enabled: (params.enabled ?? true) && !!params.hash,
    staleTime: Infinity, // Transactions don't change once confirmed
  });
}

/**
 * Get address metadata (name, tags, etc from Blockscout)
 */
// export function useAddressInfo(params: {
//   address?: Address;
//   enabled?: boolean;
// }) {
//   return useQuery({
//     queryKey: blockscoutKeys.addressInfo(params.address!),
//     queryFn: () => getAddressInfo(params.address!),
//     enabled: (params.enabled ?? true) && !!params.address,
//     staleTime: 5 * 60_000, // Address info rarely changes
//   });
// }

/**
 * Get token metadata
 */
// export function useTokenInfo(params: {
//   address?: Address;
//   enabled?: boolean;
// }) {
//   return useQuery({
//     queryKey: blockscoutKeys.tokenInfo(params.address!),
//     queryFn: () => getTokenInfo(params.address!),
//     enabled: (params.enabled ?? true) && !!params.address,
//     staleTime: 5 * 60_000,
//   });
// }

/**
 * Track UserOperation executions via EntryPoint events
 */
export function useUserOpLogs(params: {
  accountAddress?: Address;
  entryPointAddress: Address;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: blockscoutKeys.userOpLogs(params.accountAddress!, params.entryPointAddress),
    queryFn: () =>
      getUserOpExecutionLogs({
        accountAddress: params.accountAddress!,
        entryPointAddress: params.entryPointAddress,
      }),
    enabled: (params.enabled ?? true) && !!params.accountAddress,
    staleTime: 15_000,
    refetchInterval: 30_000, // Poll for new UserOps
  });
}