"use client";
import { AppSidebar } from "@/components/wallet/app-sidebar";
import { Dashboard } from "@/components/dashboard/dashboard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Chat from "@/components/chat/chat";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateId } from "ai";
import { Separator } from "@radix-ui/react-separator";
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
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
          <SidebarTrigger className="-ml-1" />
          <div className="text-center font-bold w-full text-xl">MNEEPAY</div>
        </header>
        <div className="flex  flex-1 flex-col gap-4 p-4">
          <div className="h-full w-full">
          <Tabs defaultValue="chat" className="h-full w-full">
            <TabsList className="flex justify-center mx-auto">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
            <TabsContent value="chat">
              <Chat
                walletAddress={walletAddress}
                id={chatId || undefined}
              />
            </TabsContent>
            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}