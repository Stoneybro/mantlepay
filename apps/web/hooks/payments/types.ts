export type BalanceCheckParams = {
    availableBalance: string;
    requiredAmount: string;
    token: "ETH" | "MNEE";
};

export type SingleTransferParams = {
    to: `0x${string}`;
    amount: string;
};

export type SingleTokenTransferParams = {
    to: `0x${string}`;
    amount: string;
};

export type BatchTransferParams = {
    recipients: `0x${string}`[];
    amounts: string[];
};

export type BatchTokenTransferParams = {
    recipients: `0x${string}`[];
    amounts: string[];
};

export type RecurringPaymentParams = {
    name: string;
    recipients: `0x${string}`[];
    amounts: string[];
    duration: number;
    interval: number;
    transactionStartTime: number;
    revertOnFailure?: boolean;
};

export type RecurringTokenPaymentParams = {
    name: string;
    recipients: `0x${string}`[];
    amounts: string[];
    duration: number;
    interval: number;
    transactionStartTime: number;
    revertOnFailure?: boolean;
};

export type CancelIntentParams = {
    intentId: `0x${string}`;
};

export type PaymentType =
    | "single-eth"
    | "single-token"
    | "batch-eth"
    | "batch-token"
    | "recurring-eth"
    | "recurring-token"
    | "cancel-intent";

export type PaymentParams = {
    "single-eth": SingleTransferParams;
    "single-token": SingleTokenTransferParams;
    "batch-eth": BatchTransferParams;
    "batch-token": BatchTokenTransferParams;
    "recurring-eth": RecurringPaymentParams;
    "recurring-token": RecurringTokenPaymentParams;
    "cancel-intent": CancelIntentParams;
};
