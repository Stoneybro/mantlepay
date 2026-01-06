"use client";
import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { envioClient, GET_TRANSACTIONS, WalletTransaction } from '@/lib/envio/client';
import { TransactionItem } from './TransactionItem';
import { Loader2 } from 'lucide-react';

interface TransactionListProps {
    walletAddress: string;
}

interface TransactionResponse {
    WalletTransaction: WalletTransaction[];
}

const PAGE_SIZE = 20;

export const TransactionList: React.FC<TransactionListProps> = ({ walletAddress }) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error
    } = useInfiniteQuery({
        queryKey: ['transactions', walletAddress],
        queryFn: async ({ pageParam = 0 }) => {
            return envioClient.request<TransactionResponse>(GET_TRANSACTIONS, {
                walletAddress,
                limit: PAGE_SIZE,
                offset: pageParam
            });
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const currentCount = lastPage.WalletTransaction.length;
            return currentCount === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined;
        },
        refetchInterval: 10000, // Poll every 10s
    });

    if (status === 'pending') {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="p-4 text-center text-red-500 text-sm">
                Error loading transactions: {(error as Error).message}
            </div>
        );
    }

    const transactions = data?.pages.flatMap((page) => page.WalletTransaction) || [];

    if (transactions.length === 0) {
        return (
            <div className="p-8 text-center text-gray-400 text-sm">
                No transactions found
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                {transactions.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                ))}

                {hasNextPage && (
                    <div className="p-4 text-center">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="text-xs text-blue-500 hover:underline disabled:opacity-50"
                        >
                            {isFetchingNextPage ? 'Loading more...' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
