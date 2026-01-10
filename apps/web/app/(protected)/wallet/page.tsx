"use client";
import { AppSidebar } from "@/components/wallet/app-sidebar";
import { AppSidebarRight } from "@/components/wallet/app-sidebar-right";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Chat from "@/components/chat/chat";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateId } from "ai";

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
        <header className='bg-background sticky top-0 flex shrink-0 items-center gap-2 p-4'>
          {/* Header content */}
        </header>

        <Chat
          walletAddress={walletAddress}
          id={chatId || undefined}
        />
      </SidebarInset>
      <AppSidebarRight side='right' walletAddress={walletAddress} />
    </SidebarProvider>
  );
}