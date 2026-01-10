/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import {
    useSingleTransfer,
    useSingleTokenTransfer,
    useBatchTransfer,
    useBatchTokenTransfer,
    useRecurringPayment,
    useRecurringTokenPayment,
    useCancelIntent
} from "@/hooks/payments/usePayment";
import { fetchWalletBalance } from "@/utils/helper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface ChatProps {
    walletAddress?: string;
    id?: string;
}

function Chat({ walletAddress, id }: ChatProps) {
    const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);

    useEffect(() => {
        const loadMessages = async () => {
            if (!id) {
                setInitialMessages([]);
                return;
            }

            try {
                // If it's a new generated ID (long string), checking API is fine.
                // If API returns 404 or empty, we start with empty messages.
                const response = await fetch(`/api/chat/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setInitialMessages(data.messages || []);
                } else {
                    setInitialMessages([]);
                }
            } catch (error) {
                console.error("Error loading chat:", error);
                setInitialMessages([]);
            }
        };

        setInitialMessages(null); // Reset while loading new ID
        loadMessages();
    }, [id]);

    if (!initialMessages && id) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-muted-foreground">Loading specific chat...</div>
            </div>
        );
    }

    // If no ID, we are in a "new chat" state conceptually, but usually app redirects to a generated ID.
    // If we have ID and messages loaded, render ChatInner.
    return (
        <ChatInner
            key={id} // Force re-mount when ID changes to reset useChat
            id={id}
            initialMessages={initialMessages || []}
            walletAddress={walletAddress}
        />
    );
}

function ChatInner({
    walletAddress,
    id,
    initialMessages
}: {
    walletAddress?: string,
    id?: string,
    initialMessages: UIMessage[]
}) {
    const [input, setInput] = useState("");
    const queryClient = useQueryClient();

    const { data: wallet } = useQuery({
        queryKey: ["walletBalance", walletAddress],
        queryFn: () => fetchWalletBalance(walletAddress as `0x${string}`),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        enabled: !!walletAddress,
    });


    // AI SDK hook
    const { messages, sendMessage, status, error, addToolResult } = useChat({
        id,
        messages: initialMessages || [],
        onFinish: () => {
            // Invalidate chats list to show new chat or title update
            queryClient.invalidateQueries({ queryKey: ['chats', walletAddress] });
        },
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest({ messages, id }) {
                return {
                    body: {
                        message: messages[messages.length - 1],
                        chatId: id,
                        walletAddress
                    }
                };
            },
        }),

    });

    // Transaction hooks
    const singleEthTransfer = useSingleTransfer(wallet?.availableEthBalance);
    const singleMneeTransfer = useSingleTokenTransfer(wallet?.availableMneeBalance);
    const batchEthTransfer = useBatchTransfer(wallet?.availableEthBalance);
    const batchMneeTransfer = useBatchTokenTransfer(wallet?.availableMneeBalance);
    const recurringEthPayment = useRecurringPayment(wallet?.availableEthBalance);
    const recurringMneePayment = useRecurringTokenPayment(wallet?.availableMneeBalance);
    const cancelIntent = useCancelIntent();

    const hooks = {
        singleEthTransfer,
        singleMneeTransfer,
        batchEthTransfer,
        batchMneeTransfer,
        recurringEthPayment,
        recurringMneePayment,
        cancelIntent,
    };

    const handleSubmit = () => {
        if (!input.trim()) return;
        sendMessage({ text: input });
        setInput("");
    };

    // Check if any transaction is pending
    const isTransactionPending =
        singleEthTransfer.isPending ||
        singleMneeTransfer.isPending ||
        batchEthTransfer.isPending ||
        batchMneeTransfer.isPending ||
        recurringEthPayment.isPending ||
        recurringMneePayment.isPending ||
        cancelIntent.isPending;

    const isLoading = status === 'submitted' || status === 'streaming';

    return (
        <div className='w-full h-full p-4 md:p-8 relative flex flex-col justify-center'>
            <ChatMessages
                messages={messages}
                addToolResult={addToolResult}
                status={status}
                error={error}
                isTransactionPending={isTransactionPending}
                isLoading={isLoading}
                hooks={hooks}
            />
            <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isTransactionPending={isTransactionPending}
                isLoading={isLoading}
            />
        </div>
    );
}

export default Chat;