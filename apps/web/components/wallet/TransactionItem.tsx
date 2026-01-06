import React from 'react';
import { WalletTransaction } from '@/lib/envio/client';
import { formatEther } from 'viem';
import { ExternalLink, ArrowRight, Layers, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TransactionItemProps {
    transaction: WalletTransaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
    const date = new Date(Number(transaction.timestamp) * 1000);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isFailed = transaction.status !== 'SUCCESS';

    const getIcon = () => {
        switch (transaction.transactionType) {
            case 'BATCH':
                return <Layers className="w-4 h-4 text-blue-500" />;
            case 'INTENT_EXECUTED':
                return <Clock className="w-4 h-4 text-purple-500" />;
            case 'WALLET_DEPLOYED':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            default:
                return <ArrowRight className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTitle = () => {
        switch (transaction.transactionType) {
            case 'BATCH':
                return `Batch Execution (${transaction.recipientCount} txs)`;
            case 'INTENT_EXECUTED':
                return transaction.intentName || `Intent Execution`;
            case 'WALLET_DEPLOYED':
                return 'Wallet Deployed';
            default:
                return 'Transaction';
        }
    };

    const amount = transaction.value ? formatEther(BigInt(transaction.value)) : '0';
    const symbol = 'ETH'; // TODO: token symbol resolution

    return (
        <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isFailed ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {isFailed ? <XCircle className="w-4 h-4 text-red-500" /> : getIcon()}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{getTitle()}</span>
                    <span className="text-xs text-gray-500">{formattedDate}</span>
                </div>
            </div>

            <div className="flex flex-col items-end">
                {transaction.value && (
                    <span className="text-sm font-semibold text-gray-900">
                        {amount} {symbol}
                    </span>
                )}
                <a
                    href={`https://sepolia.etherscan.io/tx/${transaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 flex items-center gap-1 hover:underline"
                >
                    View <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
};
