/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { SingleTransferTool } from './tools/SingleTransferTool';
import { BatchTransferTool } from './tools/BatchTransferTool';
import { RecurringPaymentTool } from './tools/RecurringPaymentTool';
import { CancelIntentTool } from './tools/CancelIntentTool';

interface ToolRendererProps {
    part: any;
    toolCallId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
    hooks: {
        singleEthTransfer: any;
        singleMneeTransfer: any;
        batchEthTransfer: any;
        batchMneeTransfer: any;
        recurringEthPayment: any;
        recurringMneePayment: any;
        cancelIntent: any;
    };
}

export function ToolRenderer({
    part,
    toolCallId,
    addToolResult,
    isTransactionPending,
    hooks
}: ToolRendererProps) {

    if (part.type === "tool-executeSingleEthTransfer") {
        return (
            <SingleTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.singleEthTransfer}
                type="ETH"
            />
        );
    }

    if (part.type === "tool-executeSingleMneeTransfer") {
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

    if (part.type === "tool-executeBatchEthTransfer") {
        return (
            <BatchTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.batchEthTransfer}
                type="ETH"
            />
        );
    }

    if (part.type === "tool-executeBatchMneeTransfer") {
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

    if (part.type === "tool-executeRecurringEthPayment") {
        return (
            <RecurringPaymentTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.recurringEthPayment}
                type="ETH"
            />
        );
    }

    if (part.type === "tool-executeRecurringMneePayment") {
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

    if (part.type === "tool-cancelRecurringPayment") {
        return (
            <CancelIntentTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.cancelIntent}
            />
        );
    }

    return null;
}
