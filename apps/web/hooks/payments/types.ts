// Compliance metadata for contract calls (uses enum values as numbers)
// All array fields should match recipients.length for batch/recurring payments
export type ComplianceMetadata = {
    entityIds?: string[];       // Per-recipient identifiers (employee, vendor, customer ID)
    jurisdictions?: number[];   // Per-recipient enum values (see compliance-enums.ts)
    categories?: number[];      // Per-recipient enum values (see compliance-enums.ts)
    referenceId?: string;       // Shared: e.g., "2025-01", "INV-001", "PO-123"
};

// UI-friendly version with strings (for forms and display)
export type ComplianceMetadataUI = {
    entityIds?: string[];
    jurisdictions?: string[];   // e.g., ["US-CA", "UK", "NG"]
    categories?: string[];      // e.g., ["PAYROLL_W2", "CONTRACTOR"]
    referenceId?: string;
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
    compliance?: ComplianceMetadataUI;
};

export type BatchTransferParams = {
    recipients: `0x${string}`[];
    amounts: string[];
    compliance?: ComplianceMetadataUI;
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
