"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Users } from "lucide-react";
import type { BaseToolProps, BatchTransferInput } from "./types";

interface BatchEthTransferToolProps extends BaseToolProps {
    mutation: any;
}

export function BatchEthTransferTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation
}: BatchEthTransferToolProps) {
    if (!('state' in part)) return null;

    switch (part.state) {
        case 'input-streaming':
            return (
                <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Preparing batch ETH transfer...</span>
                </div>
            );

        case 'input-available': {
            const batchInput = part.input as BatchTransferInput;
            const totalAmount = batchInput.amounts.reduce((sum: number, amt: string) =>
                sum + parseFloat(amt), 0
            ).toFixed(4);

            return (
                <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5" />
                        <p className="font-medium">Batch ETH Transfer</p>
                    </div>

                    <div className="text-sm space-y-1 mb-4">
                        <p><strong>Recipients:</strong> {batchInput.recipients.length}</p>
                        <p><strong>Total:</strong> {totalAmount} ETH</p>
                        <div className="mt-2 space-y-1 pl-2 max-h-40 overflow-y-auto">
                            {batchInput.recipients.map((addr: string, idx: number) => (
                                <p key={idx} className="text-xs">• {addr}: {batchInput.amounts[idx]} ETH</p>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button
                            onClick={async () => {
                                try {
                                    const result = await mutation.mutateAsync({
                                        recipients: batchInput.recipients as `0x${string}`[],
                                        amounts: batchInput.amounts
                                    });

                                    addToolResult({
                                        tool: 'executeBatchEthTransfer',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                    });
                                } catch (error: any) {
                                    addToolResult({
                                        tool: 'executeBatchEthTransfer',
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
                                    tool: 'executeBatchEthTransfer',
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
                    <div className="flex items-center gap-1"><Check className="h-4 w-4" /> Batch ETH transfer confirmed</div>
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
