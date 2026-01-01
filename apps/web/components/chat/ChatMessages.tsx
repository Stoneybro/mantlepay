/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Loader2, XCircle } from "lucide-react";
import { ToolRenderer } from './ToolRenderer';

interface ChatMessagesProps {
    messages: any[];
    addToolResult: (result: any) => void;
    status: string;
    error: any;
    isTransactionPending: boolean;
    isLoading: boolean;
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

export function ChatMessages({
    messages,
    addToolResult,
    status,
    error,
    isTransactionPending,
    isLoading,
    hooks
}: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto pb-4 pr-2 mb-4">
            <div className="space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`break-words ${message.role === "user" ? "ml-auto" : ""} bg-accent px-4 py-2 rounded w-fit`}
                    >
                        <span className="font-medium">
                            {message.role === "user" ? "" : "Aidra: "}
                        </span>
                        <span className="text-foreground/90">
                            {message.parts.map((part: any, i: number) => {
                                // Render text parts
                                if (part.type === "text") {
                                    return <span key={`${message.id}-${i}`}>{part.text}</span>;
                                }

                                // Render tool UI
                                const toolCallId = 'toolCallId' in part ? part.toolCallId : '';
                                return (
                                    <ToolRenderer
                                        key={`${message.id}-${i}`}
                                        part={part}
                                        toolCallId={toolCallId}
                                        addToolResult={addToolResult}
                                        isTransactionPending={isTransactionPending}
                                        hooks={hooks}
                                    />
                                );
                            })}
                        </span>
                    </div>
                ))}

                {/* Global Transaction Status */}
                {isTransactionPending && (
                    <div className="flex items-center gap-2 text-sm animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Waiting for wallet signature...</span>
                    </div>
                )}

                {/* API Status */}
                {status === 'error' && error && (
                    <div className="flex items-center gap-2 text-sm ">
                        <XCircle className="h-4 w-4" />
                        <span>Error: {error.message}</span>
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Aidra is thinking...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
