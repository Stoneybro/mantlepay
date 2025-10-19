"use client";

import * as React from "react";
import { GrPowerCycle } from "react-icons/gr";
import { RiExternalLinkLine } from "react-icons/ri";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTransactionHistory, useInternalTransactions } from "@/lib/useBlockScout";
import TransactionItem from "./TxItem";
import { getInternalTransactions } from "@/lib/blockscout";
type AppSidebarRightProps = {
  walletAddress: `0x${string}`;
}


export function AppSidebar({ walletAddress, ...props }: AppSidebarRightProps & React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar();
  const {
    data: txHistory,
    fetchNextPage,
    hasNextPage,
    isLoading: txLoading
  } = useTransactionHistory({ address: walletAddress });
  const {
    data: internalTxs,
    fetchNextPage: fetchInternalTxs,
    hasNextPage: hasInternalTxs,
    isLoading: internalTxsLoading
  } = useInternalTransactions({ address: walletAddress });

  //This is the implementation contract for the wallets, so we exclude it from the list because all calls are just delegate calls
const EXCLUDED_ADDRESS = "0x738daf8cb17b3eb9a09c8d996420ec4c0c4532d9".toLowerCase();

const allTransactions = [
  ...(internalTxs?.pages.flat() || []),
  ...(txHistory?.pages.flat() || []),
]
  .filter(
    (tx) =>
      tx.to?.toLowerCase() !== EXCLUDED_ADDRESS &&
      tx.from?.toLowerCase() !== EXCLUDED_ADDRESS
  )
  .sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp));


  return (
    <Sidebar
      collapsible='icon'
      className='overflow-hidden *:data-[sidebar=sidebar]:flex-row'
      {...props}
    >
      <Sidebar
        collapsible='none'
        className='hidden flex-1 md:flex'
        style={{ scrollbarWidth: "none" }}
      >
        <SidebarHeader className='gap-3.5 border-b p-4'>
          <div className='flex w-full items-center justify-between'>
            <div className='text-foreground text-base font-medium'>
              Transactions
            </div>
          </div>
          {/* <SidebarInput placeholder="Type to search..." /> */}
        </SidebarHeader>
        <SidebarContent
          className='[&::-webkit-scrollbar]:hidden'
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          <SidebarGroup className='px-0'>
            <SidebarGroupContent>
              {allTransactions.map((tx,i) => (
                <TransactionItem key={i} tx={tx} walletAddress={walletAddress} />
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
