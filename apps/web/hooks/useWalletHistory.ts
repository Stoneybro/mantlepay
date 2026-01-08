import { useQuery } from '@tanstack/react-query';
import { envioClient, GET_WALLET_ACTIVITY, Transaction, ActivityType } from '@/lib/envio/client';
import { useMemo } from 'react';

export interface TransactionItemProps {
    type: ActivityType;
    id: string;
    timestamp: string;
    title: string;
    description: string;
    details: any;
    status: 'success' | 'failed' | 'partial';
    icon: string;
}

const mapTransactionToItem = (tx: Transaction): TransactionItemProps => {
    const base = {
        id: tx.id,
        timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
        status: 'success' as const,
        title: tx.title,
    };

    let details: any = {};
    try {
        details = JSON.parse(tx.details);
    } catch (e) {
        console.error("Failed to parse transaction details", e);
    }

    switch (tx.transactionType) {
        case ActivityType.INTENT_CREATED:
            return {
                ...base,
                type: ActivityType.INTENT_CREATED,
                description: details.frequency || 'Scheduled Payment',
                details: details,
                icon: '🎯'
            };

        case ActivityType.INTENT_EXECUTED:
            // Determine status based on transfers
            let status: 'success' | 'failed' | 'partial' = 'success';
            if (details.failedTransfers > 0) {
                status = details.successfulTransfers > 0 ? 'partial' : 'failed';
            }

            return {
                ...base,
                type: ActivityType.INTENT_EXECUTED,
                description: `Execution #${details.executionNumber} of ${details.totalExecutions}`,
                details: details,
                status: status,
                icon: '⚡'
            };

        case ActivityType.INTENT_CANCELLED:
            return {
                ...base,
                type: ActivityType.INTENT_CANCELLED,
                description: `Intent cancelled`,
                details: details,
                icon: '🚫'
            };

        case ActivityType.EXECUTE:
            return {
                ...base,
                type: ActivityType.EXECUTE,
                description: details.functionCall === 'Token Transfer' || details.functionCall === 'ETH Transfer'
                    ? `Transfer to ${details.target?.slice(0, 6)}...`
                    : `Contract Call: ${details.functionCall}`,
                details: details,
                icon: '💸'
            };

        case ActivityType.EXECUTE_BATCH:
            return {
                ...base,
                type: ActivityType.EXECUTE_BATCH,
                description: `Executed batch of ${details.batchSize} calls`,
                details: details,
                icon: '📦'
            };

        case ActivityType.TRANSFER_FAILED:
            return {
                ...base,
                type: ActivityType.TRANSFER_FAILED,
                description: details.reason || 'Transfer failed',
                details: details,
                status: 'failed',
                icon: '❌'
            };

        case ActivityType.WALLET_CREATED:
            return {
                ...base,
                type: ActivityType.WALLET_CREATED,
                description: 'Smart wallet deployed',
                details: details,
                icon: '🎉'
            };

        default:
            return {
                ...base,
                type: tx.transactionType,
                title: tx.title || 'Unknown Activity',
                description: 'Unknown transaction type',
                details: details,
                icon: '❓'
            };
    }
};

export const useWalletHistory = (walletAddress?: string) => {
    const query = useQuery({
        queryKey: ['walletHistory', walletAddress],
        queryFn: async () => {
            if (!walletAddress) return null;
            const variables = { walletId: walletAddress.toLowerCase() };
            const data: any = await envioClient.request(GET_WALLET_ACTIVITY, variables);
            return data.Wallet?.[0] || null;
        },
        enabled: !!walletAddress,
        refetchInterval: 10000,
    });
 console.log(`transactions: ${query.data?.transactions}`)
  console.log(`wallet address: ${walletAddress}`)
    const transactions = useMemo(() => {
       
        if (!query.data?.transactions) return [];
        return query.data.transactions.map(mapTransactionToItem);
    }, [query.data]);

    return {
        ...query,
        transactions,
        walletStats: {
            totalActivity: query.data?.totalTransactionCount || 0,
            // totalValue is no longer easy to aggregate on the client side without specific fields
            // We can leave it as 0 or remove it if not used widely
            totalValue: 0,
        }
    };
};
