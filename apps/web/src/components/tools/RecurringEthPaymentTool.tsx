"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { BsArrowRepeat } from "react-icons/bs";
import type { BaseToolProps, RecurringPaymentInput } from "./types";
import { formatInterval, formatStartTime } from "./utils";

interface RecurringEthPaymentToolProps extends BaseToolProps {
    mutation: any;
}

export function RecurringEthPaymentTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation
}: RecurringEthPaymentToolProps) {
    if (!('state' in part)) return null;

    switch (part.state) {
        case 'input-streaming':
            return (
                <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Preparing recurring ETH payment...</span>
                </div>
            );

        case 'input-available': {
            const recurringInput = part.input as RecurringPaymentInput;
            const totalPayments = Math.floor(recurringInput.duration / recurringInput.interval);
            const amountPerPayment = recurringInput.amounts.reduce((sum: number, amt: string) =>
                sum + parseFloat(amt), 0
            );
            const grandTotal = (amountPerPayment * totalPayments).toFixed(4);

            return (
                <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <BsArrowRepeat />
                        <p className="font-medium">Recurring ETH Payment</p>
                    </div>

                    <div className="text-sm space-y-1 mb-4">
                        <p><strong>Name:</strong> {recurringInput.name}</p>
                        <p><strong>Recipients:</strong> {recurringInput.recipients.length}</p>
                        <p><strong>Amount per payment:</strong> {amountPerPayment.toFixed(4)} ETH</p>
                        <p><strong>Frequency:</strong> Every {formatInterval(recurringInput.interval)}</p>
                        <p><strong>Duration:</strong> {formatInterval(recurringInput.duration)}</p>
                        <p><strong>Total payments:</strong> {totalPayments}</p>
                        <p><strong>Total commitment:</strong> {grandTotal} ETH</p>
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
                                        tool: 'executeRecurringEthPayment',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                    });
                                } catch (error: any) {
                                    addToolResult({
                                        tool: 'executeRecurringEthPayment',
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
                                    tool: 'executeRecurringEthPayment',
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
        }

        case 'output-available':
            return (
                <div key={callId} className="my-2 text-sm flex flex-col">
                    <div className="flex items-center gap-1"><Check className="h-4 w-4" /> Recurring ETH payment created</div>
                    <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
                </div>
            );

        case 'output-error':
            return (
                <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                    <X className="h-4 w-4" /> Error: {part.errorText}
                </div>
            );

        default:
            return null;
    }
}
