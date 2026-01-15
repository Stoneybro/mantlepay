
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceStats } from "@/hooks/useComplianceData";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ComplianceOverview({ stats }: { stats: ComplianceStats | null }) {
    if (!stats) return <div>Loading insights...</div>;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount).replace('$', '') + ' MNT';

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Health Score Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Health</CardTitle>
                    {stats.healthScore > 80 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.healthScore}%</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.totalCategorized} categorized / {stats.totalUncategorized} pending
                    </p>
                    <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full ${stats.healthScore > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${stats.healthScore}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Jurisdiction Breakdown */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">By Jurisdiction</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(stats.byJurisdiction)
                            .sort(([, a], [, b]) => b.amount - a.amount)
                            .slice(0, 4)
                            .map(([jur, data]) => (
                                <div key={jur} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{jur}</span>
                                        <span className="text-xs text-muted-foreground">({data.count})</span>
                                    </div>
                                    <span>{formatCurrency(data.amount)}</span>
                                </div>
                            ))}
                        {Object.keys(stats.byJurisdiction).length === 0 && (
                            <p className="text-xs text-muted-foreground">No data available</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">By Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(stats.byCategory)
                            .sort(([, a], [, b]) => b.amount - a.amount)
                            .slice(0, 4)
                            .map(([cat, data]) => (
                                <div key={cat} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{cat}</span>
                                        <span className="text-xs text-muted-foreground">({data.count})</span>
                                    </div>
                                    <span>{formatCurrency(data.amount)}</span>
                                </div>
                            ))}
                        {Object.keys(stats.byCategory).length === 0 && (
                            <p className="text-xs text-muted-foreground">No data available</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
