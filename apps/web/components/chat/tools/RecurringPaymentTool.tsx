/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Loader2 } from 'lucide-react';
import { BsArrowRepeat } from "react-icons/bs";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { formatInterval, formatStartTime } from "@/utils/format";

type RecurringPaymentInput = {
    name: string;
    recipients: string[];
    amounts: string[];
    interval: number;
    duration: number;
    transactionStartTime: number;
    revertOnFailure?: boolean;
};

interface RecurringPaymentToolProps {
    part: any;
    callId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
    mutation: any;
    type: 'ETH' | 'MNEE';
}

export function RecurringPaymentTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation,
    type
}: RecurringPaymentToolProps) {
    const toolName = type === 'ETH' ? 'executeRecurringEthPayment' : 'executeRecurringMneePayment';
    const explorerUrl = "https://eth-sepolia.blockscout.com/tx/";

    if ('state' in part) {
        switch (part.state) {
            case 'input-streaming':
                return (
                    <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Preparing recurring {type} payment...</span>
                    </div>
                );

            case 'input-available':
                const recurringInput = part.input as RecurringPaymentInput;
                const totalPayments = Math.floor(recurringInput.duration / recurringInput.interval);
                const amountPerPayment = recurringInput.amounts.reduce((sum: number, amt: string) =>
                    sum + parseFloat(amt), 0
                );
                const grandTotal = (amountPerPayment * totalPayments).toFixed(type === 'ETH' ? 4 : 2);

                return (
                    <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <BsArrowRepeat />
                            <p className="font-medium">Recurring {type} Payment</p>
                        </div>

                        <div className="text-sm space-y-1 mb-4">
                            <p><strong>Name:</strong> {recurringInput.name}</p>
                            <p><strong>Recipients:</strong> {recurringInput.recipients.length}</p>
                            <p><strong>Amount per payment:</strong> {type === 'MNEE' ? '$' : ''}{amountPerPayment.toFixed(type === 'ETH' ? 4 : 2)} {type}</p>
                            <p><strong>Frequency:</strong> Every {formatInterval(recurringInput.interval)}</p>
                            <p><strong>Duration:</strong> {formatInterval(recurringInput.duration)}</p>
                            <p><strong>Total payments:</strong> {totalPayments}</p>
                            <p><strong>Total commitment:</strong> {type === 'MNEE' ? '$' : ''}{grandTotal} {type}</p>
                            <p><strong>Starts:</strong> {formatStartTime(recurringInput.transactionStartTime)}</p>
                            <p><strong>Failure handling:</strong> {recurringInput.revertOnFailure ? "Stop on failure" : "Skip failures"}</p>
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button
                                onClick={async () => {
                                    try {
                                        const result = await mutation.mutateAsync({
                                            name: recurringInput.name,
                                            recipients: recurringInput.recipients as `0x${string}`[],
                                            amounts: recurringInput.amounts,
                                            interval: recurringInput.interval,
                                            duration: recurringInput.duration,
                                            transactionStartTime: recurringInput.transactionStartTime,
                                            revertOnFailure: recurringInput.revertOnFailure
                                        });

                                        addToolResult({
                                            tool: toolName,
                                            toolCallId: callId,
                                            output: result.receipt.transactionHash
                                        });
                                    } catch (error: any) {
                                        addToolResult({
                                            tool: toolName,
                                            toolCallId: callId,
                                            state: 'output-error',
                                            errorText: error.message
                                        });
                                    }
                                }}
                                disabled={isTransactionPending}
                            >
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm & Create Intent'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    addToolResult({
                                        tool: toolName,
                                        toolCallId: callId,
                                        state: 'output-error',
                                        errorText: 'User cancelled'
                                    });
                                }}
                                disabled={isTransactionPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                );

            case 'output-available':
                return (
                    <div key={callId} className="my-2 text-sm flex flex-col">
                        <div className="flex items-center gap-1"><FaCheck /> Recurring {type} payment created</div>
                        <div>Hash: <a href={`${explorerUrl}${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
                    </div>
                );

            case 'output-error':
                return (
                    <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                        <FaTimes /> Error: {part.errorText}
                    </div>
                );
        }
    }
    return null;
}
