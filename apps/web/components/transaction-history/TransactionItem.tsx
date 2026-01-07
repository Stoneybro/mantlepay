
import { TransactionItemProps } from '@/hooks/useWalletHistory';
import { ActivityType } from '@/lib/envio/client';
import { cn } from '@/lib/utils';
import { formatEther } from 'viem';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Format currency helper
const formatCurrency = (amount?: string, token?: string) => {
    if (!amount) return '-';
    // Simple check for raw values that need formatting
    // Assuming 18 decimals for simplicity if not provided. Ideally we fetch token decimals.
    // For this demo, let's just display what we have unless it's obviously raw big int
    const formatted = amount.length > 6 ? formatEther(BigInt(amount)) : amount;
    return `${Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token || 'ETH'}`;
};

export const TransactionItem = ({ item }: { item: TransactionItemProps }) => {
    const [expanded, setExpanded] = useState(false);

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'success': return 'outline'; // Green-ish usually, but shadcn standard is outline/default
            case 'failed': return 'destructive';
            case 'partial': return 'secondary';
            default: return 'outline';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-500 border-green-500/20';
            case 'failed': return 'text-red-500 border-red-500/20';
            case 'partial': return 'text-yellow-500 border-yellow-500/20';
            default: return '';
        }
    }

    return (
        <Card className="bg-card hover:bg-accent/50 transition-colors border-border/50 overflow-hidden">
            <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Icon removed as requested */}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-foreground truncate">{item.title}</h3>
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0 h-5 font-normal capitalize", getStatusClass(item.status))}>
                            {item.status}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>

                <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                </div>

                <div className="text-muted-foreground">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {expanded && (
                <div className="bg-muted/30 p-4 border-t border-border/50 space-y-3 text-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Tx Hash</span>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${item.id.split('-')[0]}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:text-primary/80 truncate block underline text-xs font-mono"
                            >
                                {item.id.split('-')[0].slice(0, 10)}...
                            </a>
                        </div>

                        {/* Dynamic fields based on activity details */}
                        {Object.entries(item.details).map(([key, value]) => {
                            if (key === 'txHash' || typeof value === 'object') return null;
                            return (
                                <div key={key}>
                                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-foreground text-xs font-medium">
                                        {key.toLowerCase().includes('amount') || key.toLowerCase().includes('value')
                                            ? formatCurrency(value as string)
                                            : String(value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Special sub-sections */}
                    {item.type === ActivityType.INTENT_CREATED && (
                        <div className="mt-2 p-3 bg-background/50 rounded-md border border-border/50">
                            <h4 className="font-medium text-foreground mb-2 text-[10px] uppercase">Configuration</h4>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Schedule</span>
                                <span className="text-foreground">{item.details.totalPlannedExecutions} executions total</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
