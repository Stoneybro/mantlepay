import { useQuery } from '@tanstack/react-query';
import { envioClient, GET_WALLET_ACTIVITY, WalletActivity, ActivityType } from '@/lib/envio/client';
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

const mapActivityToTransactionItem = (activity: WalletActivity): TransactionItemProps => {
    const base = {
        id: activity.id,
        timestamp: new Date(Number(activity.timestamp) * 1000).toISOString(),
        status: 'success' as const,
    };

    switch (activity.activityType) {
        case ActivityType.INTENT_CREATED:
            const createdDetails = activity.intentCreatedDetails!;
            return {
                ...base,
                type: ActivityType.INTENT_CREATED,
                title: `Created Intent: ${createdDetails.intent.displayName}`,
                description: createdDetails.scheduleDescription,
                details: {
                    intentName: createdDetails.intent.displayName,
                    token: createdDetails.intent.token, // Address, UI can resolve symbol
                    totalCommitment: createdDetails.totalCommitment,
                    recipientCount: createdDetails.recipientCount,
                    totalPlannedExecutions: createdDetails.intent.totalPlannedExecutions,
                },
                icon: '🎯'
            };

        case ActivityType.INTENT_EXECUTED:
            const execDetails = activity.intentExecutionDetails!;
            // Partial success logic
            let execStatus: 'success' | 'partial' | 'failed' = 'success';
            if (execDetails.failureCount > 0) {
                execStatus = execDetails.successCount > 0 ? 'partial' : 'failed';
            }

            return {
                ...base,
                type: ActivityType.INTENT_EXECUTED,
                title: `Intent Executed: ${execDetails.intent.displayName}`,
                description: `Execution #${execDetails.executionNumber} of ${execDetails.totalExecutions}`,
                details: {
                    intentName: execDetails.intent.displayName,
                    executionNumber: execDetails.executionNumber,
                    totalExecutions: execDetails.totalExecutions,
                    // token: activity.primaryToken,
                    totalAmount: activity.primaryAmount,
                    successfulTransfers: execDetails.successCount,
                    failedTransfers: execDetails.failureCount
                },
                status: execStatus,
                icon: '⚡'
            };

        case ActivityType.INTENT_CANCELLED:
            const cancelDetails = activity.intentCancellationDetails!;
            return {
                ...base,
                type: ActivityType.INTENT_CANCELLED,
                title: `Cancelled Intent: ${cancelDetails.intent.displayName}`,
                description: `Intent cancelled after ${cancelDetails.executionsCompleted} executions`,
                details: {
                    intentName: cancelDetails.intent.displayName,
                    amountRefunded: cancelDetails.refundedAmount,
                    failedAmountRecovered: cancelDetails.recoveredFailedAmount,
                    executionsCompleted: cancelDetails.executionsCompleted
                },
                icon: '🚫'
            };

        case ActivityType.EXECUTE:
            const exec = activity.executeDetails!;
            return {
                ...base,
                type: ActivityType.EXECUTE,
                title: exec.decodedFunction ? `Executed: ${exec.decodedFunction}` : 'Direct Transaction',
                description: exec.isTokenTransfer
                    ? `Transferred to ${exec.tokenTransferRecipient?.slice(0, 6)}...`
                    : `Called ${exec.target.slice(0, 6)}...`,
                details: {
                    target: exec.target,
                    value: exec.value,
                    functionSelector: exec.decodedFunction || 'unknown',
                    isTokenTransfer: exec.isTokenTransfer
                },
                icon: '💸'
            };

        case ActivityType.EXECUTE_BATCH:
            const batch = activity.batchDetails!;
            return {
                ...base,
                type: ActivityType.EXECUTE_BATCH,
                title: 'Batch Transaction',
                description: `Executed ${batch.callCount} calls in batch`,
                details: {
                    batchSize: batch.callCount,
                    totalValue: batch.totalValue,
                },
                icon: '📦'
            };

        case ActivityType.TRANSFER_FAILED:
            return {
                ...base,
                type: ActivityType.TRANSFER_FAILED,
                title: 'Transfer Failed',
                description: 'Failed to send funds',
                details: {
                    token: activity.primaryToken,
                    amount: activity.primaryAmount,
                    reason: 'See block explorer'
                },
                status: 'failed',
                icon: '❌'
            };

        case ActivityType.WALLET_CREATED:
            return {
                ...base,
                type: ActivityType.WALLET_CREATED,
                title: 'Wallet Created',
                description: 'Smart wallet deployed successfully',
                details: {
                    txHash: activity.txHash
                },
                icon: '🎉'
            };

        default:
            return {
                ...base,
                type: activity.activityType,
                title: 'Unknown Activity',
                description: activity.activityType,
                details: {},
                icon: '❓'
            };
    }
};

export const useWalletHistory = (walletAddress?: string) => {
    const query = useQuery({
        queryKey: ['walletHistory', walletAddress],
        queryFn: async () => {
            if (!walletAddress) return null;
            // Indexer stores addresses in lowercase
            const variables = { walletId: walletAddress.toLowerCase() };
            const data: any = await envioClient.request(GET_WALLET_ACTIVITY, variables);
            return data.Wallet?.[0]; // Get the first wallet match
        },
        enabled: !!walletAddress,
        refetchInterval: 5000, // Poll every 5s for updates
    });

    const transactions = useMemo(() => {
        if (!query.data?.activity) return [];
        return query.data.activity.map(mapActivityToTransactionItem);
    }, [query.data]);

    return {
        ...query,
        transactions,
        walletStats: {
            totalActivity: query.data?.totalActivityCount || 0,
            totalValue: query.data?.totalValueTransferred || 0,
        }
    };
};
