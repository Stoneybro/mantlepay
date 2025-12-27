"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { BsArrowUpRight } from "react-icons/bs";
import type { BaseToolProps, SingleTransferInput } from "./types";

interface SingleEthTransferToolProps extends BaseToolProps {
    mutation: any;
}

export function SingleEthTransferTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation
}: SingleEthTransferToolProps) {
    if (!('state' in part)) return null;

    switch (part.state) {
        case 'input-streaming':
            return (
                <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Preparing ETH transfer...</span>
                </div>
            );

        case 'input-available': {
            const input = part.input as SingleTransferInput;

            return (
                <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <BsArrowUpRight />
                        <p className="font-medium">Single ETH Transfer</p>
                    </div>
                    <div className="text-sm space-y-1 mb-4">
                        <p><strong>To:</strong> {input.to}</p>
                        <p><strong>Amount:</strong> {input.amount} ETH</p>
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
                                        tool: 'executeSingleEthTransfer',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                    });
                                } catch (error: any) {
                                    addToolResult({
                                        tool: 'executeSingleEthTransfer',
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
                                    tool: 'executeSingleEthTransfer',
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
                    <div className="flex items-center gap-1"><Check className="h-4 w-4" /> ETH transfer confirmed</div>
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
