// Shared TypeScript types for all tool components

export type SingleTransferInput = {
    to: string;
    amount: string;
};

export type BatchTransferInput = {
    recipients: string[];
    amounts: string[];
};

export type RecurringPaymentInput = {
    name: string;
    recipients: string[];
    amounts: string[];
    interval: number;
    duration: number;
    transactionStartTime: number;
    revertOnFailure?: boolean;
};

export type CancelIntentInput = {
    intentId: string;
};

export type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';

export interface ToolPart {
    type: string;
    state?: ToolState;
    input?: any;
    output?: any;
    errorText?: string;
}

export interface BaseToolProps {
    part: ToolPart;
    callId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
}
