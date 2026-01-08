
import { TransactionList } from "@/components/transaction-history/TransactionList";

import * as React from "react";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// import TransactionItem from "./TxItem";


type Chat = {
  id: string;
  title: string | null;
  createdAt: Date;
  userId: string | null;
};

type AppSidebarProps = {
  walletAddress: `0x${string}`;
  chats?: Chat[];
};

export function AppSidebar({
  walletAddress,
  chats,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className='w-[calc(var(--sidebar-width))] border-r'>
      <SidebarHeader className='gap-3.5 border-b p-4'>
        <div className='flex w-full items-center justify-between'>
          <div className='relative text-foreground text-base font-medium'>
            Chats
          </div>

          {/* New Chat Button or Filter */}
          <a href="/wallet" className="text-sm text-muted-foreground hover:text-foreground">New Chat</a>
        </div>
      </SidebarHeader>

      <SidebarContent
        className='[&::-webkit-scrollbar]:hidden'
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <SidebarGroup className='px-0'>
          <SidebarGroupContent className="h-full">
            <div className="flex flex-col gap-1 p-2">
              {chats?.map((chat) => (
                <a
                  key={chat.id}
                  href={`/wallet?chatId=${chat.id}`}
                  className="block p-2 text-sm rounded hover:bg-muted truncate"
                >
                  {chat.title || "Untitled Chat"}
                  <div className="text-xs text-muted-foreground">
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </div>
                </a>
              ))}
              {(!chats || chats.length === 0) && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No chat history
                </div>
              )}
            </div>
            {/* <TransactionList walletAddress={walletAddress} /> */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}