/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { SingleTransferTool } from './tools/SingleTransferTool';
import { BatchTransferTool } from './tools/BatchTransferTool';
import { RecurringPaymentTool } from './tools/RecurringPaymentTool';

interface ToolRendererProps {
    part: any;
    toolCallId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
    hooks: {
        singleMneeTransfer: any;
        batchMneeTransfer: any;
        recurringMneePayment: any;
    };
}

export function ToolRenderer({
    part,
    toolCallId,
    addToolResult,
    isTransactionPending,
    hooks
}: ToolRendererProps) {

    if (part.type === "tool-execute_single_mnee_transfer") {
        return (
            <SingleTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.singleMneeTransfer}
                type="MNEE"
            />
        );
    }

    if (part.type === "tool-execute_batch_mnee_transfer") {
        return (
            <BatchTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.batchMneeTransfer}
                type="MNEE"
            />
        );
    }

    if (part.type === "tool-execute_recurring_mnee_payment") {
        return (
            <RecurringPaymentTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.recurringMneePayment}
                type="MNEE"
            />
        );
    }

    return null;
}
