"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { TransactionItemProps } from "@/hooks/useWalletHistory";
import { ActivityType } from "@/lib/envio/client";

interface PayrollSummaryProps {
    transactions?: TransactionItemProps[];
    isLoading?: boolean;
}

// Jurisdiction display config
const JURISDICTION_CONFIG: Record<string, { label: string; flag: string }> = {
    "US-CA": { label: "California", flag: "🇺🇸" },
    "US-NY": { label: "New York", flag: "🇺🇸" },
    "US-TX": { label: "Texas", flag: "🇺🇸" },
    "UK": { label: "UK", flag: "🇬🇧" },
    "EU-DE": { label: "Germany", flag: "🇩🇪" },
    "EU-FR": { label: "France", flag: "🇫🇷" },
    "NG": { label: "Nigeria", flag: "🇳🇬" },
};

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    "W2": { label: "W2", color: "bg-blue-100 text-blue-800" },
    "CONTRACTOR": { label: "1099", color: "bg-orange-100 text-orange-800" },
    "BONUS": { label: "Bonus", color: "bg-purple-100 text-purple-800" },
};

export function PayrollSummary({ transactions = [], isLoading }: PayrollSummaryProps) {
    // Extract payroll-related transactions
    const payrollData = useMemo(() => {
        const payrollTxs = transactions.filter((tx) =>
            tx.type === ActivityType.INTENT_CREATED ||
            tx.type === ActivityType.INTENT_EXECUTION
        );

        const byJurisdiction: Record<string, { count: number; total: number }> = {};
        const byCategory: Record<string, { count: number; total: number }> = {};

        payrollTxs.forEach((tx) => {
            const details = tx.details || {};
            const jurisdiction = details.payroll?.jurisdiction || details.jurisdiction || "";
            const category = details.payroll?.taxCategory || details.taxCategory || "";
            const amount = parseFloat(details.totalAmount || "0");

            if (jurisdiction) {
                if (!byJurisdiction[jurisdiction]) byJurisdiction[jurisdiction] = { count: 0, total: 0 };
                byJurisdiction[jurisdiction].count++;
                byJurisdiction[jurisdiction].total += amount;
            }

            if (category) {
                if (!byCategory[category]) byCategory[category] = { count: 0, total: 0 };
                byCategory[category].count++;
                byCategory[category].total += amount;
            }
        });

        return {
            transactions: payrollTxs,
            byJurisdiction,
            byCategory,
            jurisdictionCount: Object.keys(byJurisdiction).length,
            categoryCount: Object.keys(byCategory).length,
        };
    }, [transactions]);

    // Export to CSV
    const handleExport = () => {
        const headers = ["Date", "Name", "Amount", "Tax Category", "Jurisdiction", "Period"];
        const rows = payrollData.transactions.map((tx) => {
            const details = tx.details || {};
            return [
                new Date(tx.timestamp).toISOString().split("T")[0],
                details.scheduleName || "Untitled",
                parseFloat(details.totalAmount || "0").toFixed(2),
                details.payroll?.taxCategory || details.taxCategory || "",
                details.payroll?.jurisdiction || details.jurisdiction || "",
                details.payroll?.periodId || details.periodId || "",
            ];
        });

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payroll-report-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasPayrollData = payrollData.jurisdictionCount > 0 || payrollData.categoryCount > 0;

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2">
            {/* Jurisdiction Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Payroll by Jurisdiction</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            `${payrollData.jurisdictionCount} Regions`
                        )}
                    </CardTitle>
                    <CardAction>
                        <Button variant="ghost" size="sm" onClick={handleExport} disabled={!hasPayrollData}>
                            <Download className="h-4 w-4" />
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    {payrollData.jurisdictionCount > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(payrollData.byJurisdiction).slice(0, 3).map(([key, data]) => {
                                const config = JURISDICTION_CONFIG[key] || { label: key, flag: "🌍" };
                                return (
                                    <Badge key={key} variant="secondary" className="text-xs">
                                        {config.flag} {config.label} ({data.count})
                                    </Badge>
                                );
                            })}
                            {Object.keys(payrollData.byJurisdiction).length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{Object.keys(payrollData.byJurisdiction).length - 3} more
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            No jurisdiction data yet - use payroll metadata
                        </div>
                    )}
                </CardFooter>
            </Card>

            {/* Category Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Payroll by Category</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            `${payrollData.categoryCount} Types`
                        )}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">RWA</Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    {payrollData.categoryCount > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(payrollData.byCategory).map(([key, data]) => {
                                const config = CATEGORY_CONFIG[key] || { label: key, color: "bg-gray-100 text-gray-800" };
                                return (
                                    <Badge key={key} className={config.color}>
                                        {config.label}: ${data.total.toFixed(0)}
                                    </Badge>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            No category data yet - W2, Contractor, Bonus
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
