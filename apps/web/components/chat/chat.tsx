/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
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

function Chat(walletAddress: { walletAddress: string }) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [input, setInput] = useState("");
  const { data: wallet } = useQuery({
    queryKey: ["walletBalance", walletAddress],
    queryFn: () => fetchWalletBalance(walletAddress.walletAddress as `0x${string}`),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    enabled: !!walletAddress,
  });


  // AI SDK hook
  const { messages, sendMessage, addToolResult, status, error } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ text: input });
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
      {/* TEMPLATES OVERLAY */}
      {showOverlay && (
        <div className="absolute w-full h-full top-0 left-0 flex flex-col gap-16 py-4 mx-auto md:gap-6 md:py-6">
          <Image src={"/Aidra.svg"} className="items-center self-center" width={100} height={100} alt="Aidra logo" />
          <div className="text-2xl font-semibold text-center">Aidra smart wallet ready</div>
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 px-16 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-16 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <BsArrowUpRight />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Single Payment
                </div>
                <div className="text-muted-foreground">
                  Send one payment to one recipient
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <FaUsers />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Batch Payment
                </div>
                <div className="text-muted-foreground">
                  Send one transaction to multiple recipients
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <BsArrowRepeat />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Single Recurring Payment
                </div>
                <div className="text-muted-foreground">
                  Automate repeated transfers to one address
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <FaUsersGear />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Batch Recurring Payment
                </div>
                <div className="text-muted-foreground text-xs">
                  Schedule recurring payments for teams or groups
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

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