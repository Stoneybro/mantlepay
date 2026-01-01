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
        singlePyusdTransfer: any;
        batchEthTransfer: any;
        batchPyusdTransfer: any;
        recurringEthPayment: any;
        recurringPyusdPayment: any;
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

    if (part.type === "tool-executeSinglePyusdTransfer") {
        return (
            <SingleTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.singlePyusdTransfer}
                type="PYUSD"
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

    if (part.type === "tool-executeBatchPyusdTransfer") {
        return (
            <BatchTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.batchPyusdTransfer}
                type="PYUSD"
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

    if (part.type === "tool-executeRecurringPyusdPayment") {
        return (
            <RecurringPaymentTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.recurringPyusdPayment}
                type="PYUSD"
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
