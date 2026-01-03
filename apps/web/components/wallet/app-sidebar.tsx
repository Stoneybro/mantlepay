"use client";

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

import TransactionItem from "./TxItem";


type AppSidebarProps = {
  walletAddress: `0x${string}`;
};



export function AppSidebar({
  walletAddress,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {




  return (
    <Sidebar className='w-[calc(var(--sidebar-width))] border-r'>
      <SidebarHeader className='gap-3.5 border-b p-4'>
        <div className='flex w-full items-center justify-between'>
          <div className='relative text-foreground text-base font-medium'>
            Transactions
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"} aria-label='Open menu' size='icon-sm'>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56'>
              <DropdownMenuGroup>

              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
      </SidebarHeader>

      <SidebarContent
        className='[&::-webkit-scrollbar]:hidden'
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <SidebarGroup className='px-0'>
          <SidebarGroupContent>

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}