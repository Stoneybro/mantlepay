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
import { TransactionType } from "@/lib/index/indexTypes";
import { useUnifiedWalletHistory } from "@/lib/index/query";

type AppSidebarProps = {
  walletAddress: `0x${string}`;
};

// Filter options - Updated to match new categories
const TX_TYPE_FILTERS: { value: TransactionType | "all"; label: string }[] =
  [
    { value: "all", label: "All" },
    { value: TransactionType.EXECUTE, label: "Single Payment" },
    { value: TransactionType.EXECUTE_BATCH, label: "Batch Payments" },
    { value: TransactionType.INTENT_CREATED, label: "Recurring payments" },
    { value: TransactionType.INTENT_EXECUTED, label: "Recurring Payment Executed" },
    { value: TransactionType.INTENT_CANCELLED, label: "Recurring Payment Cancelled" },
    { value: TransactionType.WALLET_DEPLOYED, label: "Wallet Deployed" },
    { value: TransactionType.CONTRACT_CALL, label: "Contract Calls" },
  ];

export function AppSidebar({
  walletAddress,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const { data, isLoading, isError } = useUnifiedWalletHistory(walletAddress);
  const transactions = React.useMemo(() => data ?? [], [data]);

  const [txTypeFilter, setTxTypeFilter] = React.useState<
    TransactionType | "all"
  >("all");

  // Filter transactions based on selected filter
  const filteredTxs = React.useMemo(() => {
    if (txTypeFilter === "all") return transactions;
    return transactions.filter((tx) => tx.type === txTypeFilter);
  }, [transactions, txTypeFilter]);



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
                {TX_TYPE_FILTERS.map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onSelect={() => setTxTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
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
            {isLoading ? (
              <div className='flex items-center justify-center p-8'>
                <AiOutlineLoading3Quarters className='animate-spin text-2xl text-muted-foreground' />
              </div>
            ) : isError ? (
              <div className='p-4 text-center text-sm text-red-600'>
                Failed to load transactions
              </div>
            ) : filteredTxs.length === 0 ? (
              <div className='p-4 text-center text-sm text-muted-foreground'>
                No transactions found
              </div>
            ) : (
              <>
                {filteredTxs.map((tx, i) => (
                  <TransactionItem
                    key={`${tx.id}-${i}`}
                    tx={tx}
                    walletAddress={walletAddress}
                  />
                ))}
              </>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}