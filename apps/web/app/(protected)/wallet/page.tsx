import { AppSidebar } from "@/components/wallet/app-sidebar";
import { AppSidebarRight } from "@/components/wallet/app-sidebar-right";
import { cookies } from "next/headers";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import Chat from "@/components/chat/chat";


import { loadChat, getChats } from "@/lib/chat-store";
import { generateId } from "ai";
import { redirect } from "next/navigation";

export default async function Page(props: {
  searchParams: Promise<{ chatId?: string }>;
}) {
  const searchParams = await props.searchParams;
  let { chatId } = searchParams;

  if (!chatId) {
    chatId = generateId();
    redirect(`/wallet?chatId=${chatId}`);
  }

  const initialMessages = await loadChat(chatId);
  const walletAddress = (await cookies()).get("wallet-deployed")?.value as `0x${string}`;
  const chats = await getChats(walletAddress);

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
        <header className='bg-background sticky top-0 flex shrink-0 items-center gap-2  p-4'>
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
