
"use client";

import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceOverview } from "@/components/compliance/ComplianceOverview";
import { TaxReportGenerator } from "@/components/compliance/TaxReportGenerator";
import { AuditTrail } from "@/components/compliance/AuditTrail";
import { useComplianceData } from "@/hooks/useComplianceData";

export default function CompliancePage() {
    const { address } = useAccount();
    const { data, isLoading } = useComplianceData(address);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
                <p className="text-muted-foreground">
                    Monitor compliance health, generate tax reports, and audit payment history.
                </p>
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">Loading compliance data...</div>
            ) : (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="reports">Tax Reports</TabsTrigger>
                        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <ComplianceOverview stats={data?.stats || null} />
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4 h-[600px]">
                        <TaxReportGenerator data={data?.transactions || []} />
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-4 h-[600px]">
                        <AuditTrail data={data?.transactions || []} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
