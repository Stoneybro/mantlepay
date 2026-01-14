// Universal compliance metadata for jurisdiction-aware payment tracking
// Supports: payroll, contractor, invoice, vendor, grant, and other categories
export type ComplianceMetadata = {
    entityIds?: string[];    // Per-recipient identifiers (employee, vendor, customer ID)
    jurisdiction?: string;   // e.g., "US-CA", "UK", "EU-DE", "NG"
    category?: string;       // e.g., "PAYROLL_W2", "CONTRACTOR", "INVOICE", "VENDOR", "GRANT"
    referenceId?: string;    // e.g., "2025-01", "INV-001", "PO-123"
};

// Legacy alias for backward compatibility
export type PayrollMetadata = ComplianceMetadata;

export type BalanceCheckParams = {
    availableBalance: string;
    requiredAmount: string;
    token: "MNT";
};

export type SingleTransferParams = {
    to: `0x${string}`;
    amount: string;
    compliance?: ComplianceMetadata;
};

export type BatchTransferParams = {
    recipients: `0x${string}`[];
    amounts: string[];
    compliance?: ComplianceMetadata;
};

export type RecurringPaymentParams = {
    name: string;
    recipients: `0x${string}`[];
    amounts: string[];
    duration: number;
    interval: number;
    transactionStartTime: number;
    revertOnFailure?: boolean;
    compliance?: ComplianceMetadata;
};

export type CancelIntentParams = {
    intentId: `0x${string}`;
};

export type PaymentType =
    | "single"
    | "batch"
    | "recurring"
    | "cancel-intent";

export type PaymentParams = {
    "single": SingleTransferParams;
    "batch": BatchTransferParams;
    "recurring": RecurringPaymentParams;
    "cancel-intent": CancelIntentParams;
};
