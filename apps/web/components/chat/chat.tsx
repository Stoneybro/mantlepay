/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import Image from "next/image";
import {
    useSingleTransfer,
    useSingleTokenTransfer,
    useBatchTransfer,
    useBatchTokenTransfer,
    useRecurringPayment,
    useRecurringTokenPayment,
    useCancelIntent
} from "@/hooks/payments/usePayment";
import { BsArrowRepeat, BsArrowUpRight } from "react-icons/bs";
import { FaUsers, FaUsersGear } from "react-icons/fa6";
import { Card, CardAction, CardFooter, CardHeader } from "../ui/card";
import { fetchWalletBalance } from "@/utils/helper";
import { useQuery } from "@tanstack/react-query";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { zeroAddress } from "viem";

interface ChatProps {
    walletAddress: string;
    id?: string;
    initialMessages?: UIMessage[];
}

function Chat({ walletAddress, id, initialMessages }: ChatProps) {
    const [showOverlay, setShowOverlay] = useState(!initialMessages || initialMessages.length === 0);
    const [input, setInput] = useState("");
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
        initialMessages,
        body: { walletAddress },
    } as any) as any;

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

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        sendMessage({ role: 'user', content: input });
        setInput("");
        setShowOverlay(false);
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