
import { useQuery } from "@tanstack/react-query";
import { envioClient, ActivityType, GET_ALL_TRANSACTIONS } from "@/lib/envio/client";

export type ComplianceData = {
    date: Date;
    txHash: string;
    amount: string;
    currency: string;
    entityId: string;
    jurisdiction: string;
    category: string;
    periodId: string;
    reference: string;
    details: any; // Raw details
    recipientAddress: string;
};

export type ComplianceStats = {
    totalCategorized: number;
    totalUncategorized: number;
    byJurisdiction: Record<string, { count: number; amount: number }>;
    byCategory: Record<string, { count: number; amount: number }>;
    healthScore: number;
};

export const useComplianceData = (walletAddress?: string) => {
    return useQuery({
        queryKey: ["compliance-data", walletAddress],
        queryFn: async () => {
            if (!walletAddress) return { transactions: [], stats: null };

            // Fetch ALL transactions for this wallet
            const response = await envioClient.request(GET_ALL_TRANSACTIONS, {
                walletId: walletAddress.toLowerCase()
            });
            const data = (response as any).Transaction || [];

            const transactions: ComplianceData[] = [];
            const stats: ComplianceStats = {
                totalCategorized: 0,
                totalUncategorized: 0,
                byJurisdiction: {},
                byCategory: {},
                healthScore: 0
            };

            for (const tx of data) {
                if (!tx.details) continue;

                let details: any = {};
                try {
                    details = JSON.parse(tx.details);
                } catch (e) {
                    continue;
                }

                // --- Parsing Logic ---

                // 1. Single Execution
                if (tx.transactionType === ActivityType.EXECUTE) {
                    const compliance = details.compliance || {};
                    const entityId = compliance.entityIds?.[0] || "";
                    const jurisdiction = compliance.jurisdiction || "None";
                    const category = compliance.category || "None";

                    const item: ComplianceData = {
                        date: new Date(Number(tx.timestamp) * 1000),
                        txHash: tx.txHash,
                        amount: details.value || details.amount || "0",
                        currency: "MNT",
                        entityId,
                        jurisdiction,
                        category,
                        periodId: compliance.referenceId || "",
                        reference: details.functionCall || "Transfer",
                        details,
                        recipientAddress: details.target || details.recipient || ""
                    };
                    transactions.push(item);

                    // Stats
                    const amountVal = Number(item.amount) / 1e18;
                    const isCategorized = jurisdiction !== "None" || category !== "None";

                    if (isCategorized) stats.totalCategorized++;
                    else stats.totalUncategorized++;

                    if (jurisdiction !== "None") {
                        if (!stats.byJurisdiction[jurisdiction]) stats.byJurisdiction[jurisdiction] = { count: 0, amount: 0 };
                        stats.byJurisdiction[jurisdiction].count++;
                        stats.byJurisdiction[jurisdiction].amount += amountVal;
                    }

                    if (category !== "None") {
                        if (!stats.byCategory[category]) stats.byCategory[category] = { count: 0, amount: 0 };
                        stats.byCategory[category].count++;
                        stats.byCategory[category].amount += amountVal;
                    }
                }

                // 2. Batch Execution / Intent Execution
                else if (tx.transactionType === ActivityType.EXECUTE_BATCH || tx.transactionType === ActivityType.INTENT_EXECUTION) {
                    const recipients = details.recipients || details.calls || [];
                    const compliance = details.compliance || {}; // Global object with arrays

                    const entityIds = compliance.entityIds || [];

                    // Parsing the stored string arrays (from Intent)
                    let jurisdictions: string[] = [];
                    let categories: string[] = [];

                    if (typeof compliance.jurisdiction === 'string' && compliance.jurisdiction.includes(',')) {
                        jurisdictions = compliance.jurisdiction.split(',');
                    } else if (Array.isArray(compliance.jurisdiction)) {
                        jurisdictions = compliance.jurisdiction;
                    } else {
                        jurisdictions = [compliance.jurisdiction || ""];
                    }

                    if (typeof compliance.category === 'string' && compliance.category.includes(',')) {
                        categories = compliance.category.split(',');
                    } else if (Array.isArray(compliance.category)) {
                        categories = compliance.category;
                    } else {
                        categories = [compliance.category || ""];
                    }


                    recipients.forEach((r: any, index: number) => {
                        const amount = r.amount || r.value || "0";
                        const amountVal = Number(amount) / 1e18;

                        // Resolve per-recipient metadata
                        const entId = entityIds[index] || "";

                        let jur = "None";
                        if (jurisdictions.length === recipients.length) jur = jurisdictions[index];
                        else if (jurisdictions.length === 1) jur = jurisdictions[0]; // Broadcast

                        let cat = "None";
                        if (categories.length === recipients.length) cat = categories[index];
                        else if (categories.length === 1) cat = categories[0]; // Broadcast

                        // Clean up empty strings
                        if (!jur || jur === "undefined") jur = "None";
                        if (!cat || cat === "undefined") cat = "None";

                        const item: ComplianceData = {
                            date: new Date(Number(tx.timestamp) * 1000),
                            txHash: tx.txHash,
                            amount: amount,
                            currency: "MNT",
                            entityId: entId,
                            jurisdiction: jur,
                            category: cat,
                            periodId: compliance.referenceId || "",
                            reference: tx.title || "Batch Payment",
                            details,
                            recipientAddress: r.recipient || r.target || ""
                        };
                        transactions.push(item);

                        // Stats Aggregation
                        const isCategorized = jur !== "None" || cat !== "None" || !!entId;
                        if (isCategorized) stats.totalCategorized++;
                        else stats.totalUncategorized++;

                        if (jur !== "None") {
                            if (!stats.byJurisdiction[jur]) stats.byJurisdiction[jur] = { count: 0, amount: 0 };
                            stats.byJurisdiction[jur].count++;
                            stats.byJurisdiction[jur].amount += amountVal;
                        }

                        if (cat !== "None") {
                            if (!stats.byCategory[cat]) stats.byCategory[cat] = { count: 0, amount: 0 };
                            stats.byCategory[cat].count++;
                            stats.byCategory[cat].amount += amountVal;
                        }
                    });
                }
            }

            // Calculate Health Score (percentage of categorized transactions)
            const totalTx = stats.totalCategorized + stats.totalUncategorized;
            stats.healthScore = totalTx > 0 ? Math.round((stats.totalCategorized / totalTx) * 100) : 100;

            return { transactions, stats };
        },
        enabled: !!walletAddress
    });
};
