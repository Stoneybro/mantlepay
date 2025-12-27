/* eslint-disable @typescript-eslint/no-explicit any */
"use client";
import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import Image from "next/image";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, Loader2 } from "lucide-react";
import {
  useSingleTransfer,
  useSingleTokenTransfer,
  useBatchTransfer,
  useBatchTokenTransfer,
  useRecurringPayment,
  useRecurringTokenPayment,
  useCancelIntent
} from "@/hooks/usePaymentTransaction";
import { Button } from "@/components/ui/button";
import { BsArrowRepeat, BsArrowUpRight } from "react-icons/bs";
import { FaUsers, FaUsersGear } from "react-icons/fa6";
import { Card, CardAction, CardFooter, CardHeader } from "./ui/card";
import { fetchWalletBalance } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import {
  SingleEthTransferTool,
  SinglePyusdTransferTool,
  BatchEthTransferTool,
  BatchPyusdTransferTool,
  RecurringEthPaymentTool,
  RecurringPyusdPaymentTool,
  CancelIntentTool,
} from "./tools";

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
  const singlePyusdTransfer = useSingleTokenTransfer(wallet?.availablePyusdBalance);
  const batchEthTransfer = useBatchTransfer(wallet?.availableEthBalance);
  const batchPyusdTransfer = useBatchTokenTransfer(wallet?.availablePyusdBalance);
  const recurringEthPayment = useRecurringPayment(wallet?.availableEthBalance);
  const recurringPyusdPayment = useRecurringTokenPayment(wallet?.availablePyusdBalance);
  const cancelIntent = useCancelIntent();

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
    singlePyusdTransfer.isPending ||
    batchEthTransfer.isPending ||
    batchPyusdTransfer.isPending ||
    recurringEthPayment.isPending ||
    recurringPyusdPayment.isPending ||
    cancelIntent.isPending;

  const isLoading = status === 'submitted' || status === 'streaming';

  // Render tool confirmation UI
  const renderToolUI = (part: any, callId: string) => {
    const baseProps = { part, callId, addToolResult, isTransactionPending };

    switch (part.type) {
      case "tool-executeSingleEthTransfer":
        return <SingleEthTransferTool {...baseProps} mutation={singleEthTransfer} />;

      case "tool-executeSinglePyusdTransfer":
        return <SinglePyusdTransferTool {...baseProps} mutation={singlePyusdTransfer} />;

      case "tool-executeBatchEthTransfer":
        return <BatchEthTransferTool {...baseProps} mutation={batchEthTransfer} />;

      case "tool-executeBatchPyusdTransfer":
        return <BatchPyusdTransferTool {...baseProps} mutation={batchPyusdTransfer} />;

      case "tool-executeRecurringEthPayment":
        return <RecurringEthPaymentTool {...baseProps} mutation={recurringEthPayment} />;

      case "tool-executeRecurringPyusdPayment":
        return <RecurringPyusdPaymentTool {...baseProps} mutation={recurringPyusdPayment} />;

      case "tool-cancelRecurringPayment":
        return <CancelIntentTool {...baseProps} mutation={cancelIntent} />;

      default:
        return null;
    }
  };

  return (
    <div className='w-full h-full p-4 md:p-8 relative flex flex-col justify-center'>
      {/* TEMPLATES OVERLAY */}
      {showOverlay && (
        <div className="absolute w-full h-full top-0 left-0 flex flex-col gap-16 py-4 mx-auto md:gap-6 md:py-6">
          <Image src={"/Aidra.svg"} className="items-center self-center" width={100} height={100} alt="Aidra logo" />
          <div className="text-2xl font-semibold text-center">Aidra smart wallet ready</div>
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 px-16 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-16 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
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

            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
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
                  Send payments to multiple people at once
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
              <CardHeader>
                <CardAction>
                  <BsArrowRepeat />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Recurring Payment
                </div>
                <div className="text-muted-foreground">
                  Set up automated recurring payments
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
              <CardHeader>
                <CardAction>
                  <FaUsersGear />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Manage Intent
                </div>
                <div className="text-muted-foreground">
                  Cancel or modify your recurring payments
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className='flex-grow overflow-y-auto mb-4 max-h-[calc(100vh-300px)]'>
        {messages.length === 0 && !showOverlay && (
          <div className="text-muted-foreground text-center mt-8">
            Start a conversation to make payments...
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="my-2">
            {message.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                  {message.parts?.map((part: any, idx: number) => (
                    part.type === 'text' ? part.text : null
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="rounded-lg max-w-[80%]">
                  {message.parts?.map((part: any, idx: number) => {
                    const callId = `${message.id}-${idx}`;

                    if (part.type === 'text') {
                      return (
                        <div key={idx} className="prose dark:prose-invert mb-2">
                          {part.text}
                        </div>
                      );
                    }

                    // Handle tool parts
                    if (part.type.startsWith('tool-')) {
                      return (
                        <div key={callId}>
                          {renderToolUI(part, callId)}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="text-destructive text-sm mt-2">
            Error: {error.message}
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className='sticky bottom-0 w-full'>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <InputGroupTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your payment..."
              disabled={isLoading || isTransactionPending}
              rows={3}
            />
            <InputGroupAddon>
              <InputGroupButton
                type="submit"
                disabled={isLoading || isTransactionPending || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpIcon />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </div>
  );
}

export default Chat;