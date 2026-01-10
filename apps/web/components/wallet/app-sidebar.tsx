"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { generateId } from "ai";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Chat = {
  id: string;
  title: string | null;
  createdAt: Date;
  userId: string | null;
};

type AppSidebarProps = {
  walletAddress?: string;
};

export function AppSidebar({ walletAddress }: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentChatId = searchParams.get("chatId");
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['chats', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const response = await fetch(`/api/chats?userId=${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      return data.chats as Chat[];
    },
    enabled: !!walletAddress,
  });

  const handleNewChat = () => {
    const newChatId = generateId();
    router.replace(`/wallet?chatId=${newChatId}`);
  };

  const handleSelectChat = (chatId: string) => {
    router.push(`/wallet?chatId=${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      toast.success('Chat deleted');
      queryClient.invalidateQueries({ queryKey: ['chats', walletAddress] });

      if (chatId === currentChatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  return (
    <Sidebar className='w-[calc(var(--sidebar-width))] border-r'>
      <SidebarHeader className='gap-3.5 border-b p-4'>
        <div className='flex w-full items-center justify-between'>
          <div className='relative text-foreground text-base font-medium'>
            Chats
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleNewChat}
            className="h-8 w-8"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="sr-only">New Chat</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent
        className='[&::-webkit-scrollbar]:hidden'
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <SidebarGroup className='px-0'>
          <SidebarGroupContent className="h-full">
            <div className="flex flex-col gap-1 p-2">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Loading chats...
                </div>
              ) : chats.length > 0 ? (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 p-2 text-sm rounded hover:bg-muted cursor-pointer ${chat.id === currentChatId ? 'bg-muted' : ''
                      }`}
                  >
                    <div
                      className="flex-1 truncate"
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <div className="font-medium truncate">
                        {chat.title || "Untitled Chat"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(chat.createdAt).toLocaleDateString()} {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteChat(chat.id)}
                          className="text-destructive"
                        >
                          Delete chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No chat history
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNewChat}
                      className="w-full"
                    >
                      Start a conversation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}