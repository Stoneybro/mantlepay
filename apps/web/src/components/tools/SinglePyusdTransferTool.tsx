"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, DollarSign } from "lucide-react";
import type { BaseToolProps, SingleTransferInput } from "./types";

interface SinglePyusdTransferToolProps extends BaseToolProps {
    mutation: any;
}

export function SinglePyusdTransferTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation
}: SinglePyusdTransferToolProps) {
    if (!('state' in part)) return null;

    switch (part.state) {
        case 'input-streaming':
            return (
                <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Preparing PYUSD transfer...</span>
                </div>
            );

        case 'input-available': {
            const input = part.input as SingleTransferInput;

            return (
                <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-5 w-5" />
                        <p className="font-medium">Single PYUSD Transfer</p>
                    </div>
                    <div className="text-sm space-y-1 mb-4">
                        <p><strong>To:</strong> {input.to}</p>
                        <p><strong>Amount:</strong> ${input.amount} PYUSD</p>
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button
                            onClick={async () => {
                                try {
                                    const result = await mutation.mutateAsync({
                                        to: input.to as `0x${string}`,
                                        amount: input.amount
                                    });

                                    addToolResult({
                                        tool: 'executeSinglePyusdTransfer',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                    });
                                } catch (error: any) {
                                    addToolResult({
                                        tool: 'executeSinglePyusdTransfer',
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
                                'Confirm'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                addToolResult({
                                    tool: 'executeSinglePyusdTransfer',
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
                    <div className="flex items-center gap-1"><Check className="h-4 w-4" /> PYUSD transfer confirmed</div>
                    <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
                </div>
            );

        case 'output-error':
            return (
                <div key={callId} className="my-2 flex items-center gap-1 text-sm ">
                    <X className="h-4 w-4" /> Error: {part.errorText}
                </div>
            );

        default:
            return null;
    }
}
