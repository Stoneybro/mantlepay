"use client";
import { AppSidebar } from "@/components/wallet/app-sidebar";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ComplianceDashboard } from "@/components/compliance/ComplianceDashboard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Chat from "@/components/chat/chat";
import { PaymentForm } from "@/components/payment-form/PaymentForm";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateId } from "ai";
import { Separator } from "@radix-ui/react-separator";
import Image from "next/image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem("wallet-deployed");
    if (saved) setWalletAddress(saved as `0x${string}`);
  }, []);

  const chatId = searchParams.get("chatId");

  useEffect(() => {
    if (!chatId) {
      const newId = generateId();
      router.replace(`/wallet?chatId=${newId}`, { scroll: false });
    }
  }, [chatId, router]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar walletAddress={walletAddress} />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-20">
          <SidebarTrigger className="-ml-1" />
          <div className="flex justify-center w-full mr-4">
            <Image src="/mantlepay.svg" alt="MantlePay" width={120} height={32} className="h-8 w-auto" />
          </div>
        </header>
        <div className="flex  flex-1 flex-col gap-4 p-4">
          <div className="h-full w-full">
            <Tabs defaultValue="chat" className="h-full w-full">
              <TabsList className="flex justify-center mx-auto">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>
              <TabsContent value="chat">
                <Chat
                  walletAddress={walletAddress}
                  id={chatId || undefined}
                />
              </TabsContent>
              <TabsContent value="form">
                <PaymentForm walletAddress={walletAddress} />
              </TabsContent>
              <TabsContent value="dashboard">
                <Dashboard walletAddress={walletAddress!} />
              </TabsContent>
              <TabsContent value="compliance">
                <ComplianceDashboard walletAddress={walletAddress!} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}