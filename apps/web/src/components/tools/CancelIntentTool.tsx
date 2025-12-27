"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, XCircle } from "lucide-react";
import type { BaseToolProps, CancelIntentInput } from "./types";

interface CancelIntentToolProps extends BaseToolProps {
    mutation: any;
}

export function CancelIntentTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation
}: CancelIntentToolProps) {
    if (!('state' in part)) return null;

    switch (part.state) {
        case 'input-streaming':
            return (
                <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Preparing to cancel intent...</span>
                </div>
            );

        case 'input-available': {
            const cancelInput = part.input as CancelIntentInput;

            return (
                <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle className="h-5 w-5" />
                        <p className="font-medium">Cancel Recurring Payment</p>
                    </div>

                    <div className="text-sm space-y-1 mb-4">
                        <p><strong>Intent ID:</strong></p>
                        <p className="text-xs break-all font-mono bg-muted p-2 rounded">{cancelInput.intentId}</p>
                        <p className=" mt-2">⚠️ This action cannot be undone. The recurring payment will stop immediately.</p>
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                try {
                                    const result = await mutation.mutateAsync({
                                        intentId: cancelInput.intentId as `0x${string}`
                                    });

                                    addToolResult({
                                        tool: 'cancelRecurringPayment',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                    });
                                } catch (error: any) {
                                    addToolResult({
                                        tool: 'cancelRecurringPayment',
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
                                    Cancelling...
                                </>
                            ) : (
                                'Confirm Cancellation'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                addToolResult({
                                    tool: 'cancelRecurringPayment',
                                    toolCallId: callId,
                                    state: 'output-error',
                                    errorText: 'User cancelled'
                                });
                            }}
                            disabled={isTransactionPending}
                        >
                            Keep Intent
                        </Button>
                    </div>
                </div>
            );
        }

        case 'output-available':
            return (
                <div key={callId} className="my-2 text-sm flex flex-col">
                    <div className="flex items-center gap-1"><Check className="h-4 w-4" /> Intent cancelled successfully</div>
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
