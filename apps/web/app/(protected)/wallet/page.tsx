"use client";
import { AppSidebar } from "@/components/wallet/app-sidebar";
import { AppSidebarRight } from "@/components/wallet/app-sidebar-right";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Chat from "@/components/chat/chat";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateId } from "ai";
import { UIMessage } from "ai";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chatId, setChatId] = useState<string>("");
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | undefined>(undefined);


  useEffect(() => {
    const saved = localStorage.getItem("wallet-deployed");
    if (saved) setWalletAddress(saved as `0x${string}`);
  }, []);

  useEffect(() => {
    const loadChatData = async () => {
      setIsLoading(true);

      // Get chatId from URL or generate new one
      let currentChatId = searchParams.get("chatId");

      if (!currentChatId) {
        // Generate new chat ID and update URL without reload
        currentChatId = generateId();
        router.replace(`/wallet?chatId=${currentChatId}`, { scroll: false });
      }

      setChatId(currentChatId);

      try {
        // Load chat history if chatId exists
        if (currentChatId) {
          const response = await fetch(`/api/chat/${currentChatId}`);
          if (response.ok) {
            const data = await response.json();
            setInitialMessages(data.messages || []);
          }
        }

        // Load chat list
        if (walletAddress) {
          const chatsResponse = await fetch(`/api/chats?userId=${walletAddress}`);
          if (chatsResponse.ok) {
            const chatsData = await chatsResponse.json();
            setChats(chatsData.chats || []);
          }
        }
      } catch (error) {
        console.error("Error loading chat data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [searchParams, router, walletAddress]);

  if (isLoading || !chatId) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar walletAddress={walletAddress} chats={chats} />
      <SidebarInset>
        <header className='bg-background sticky top-0 flex shrink-0 items-center gap-2 p-4'>
          {/* Header content */}
        </header>

        <Chat
          walletAddress={walletAddress}
          id={chatId}
          initialMessages={initialMessages}
        />
      </SidebarInset>
      <AppSidebarRight side='right' walletAddress={walletAddress} />
    </SidebarProvider>
  );
}