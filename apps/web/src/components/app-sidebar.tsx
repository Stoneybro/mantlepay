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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAggregatedTransactions } from "@/lib/blockscout/useBlockScout";
import TransactionItem from "./TxItem";
import { type TransactionCategory } from "@/lib/blockscout/transactionAggregator";
import { Badge } from "./ui/badge";

type AppSidebarRightProps = {
  walletAddress: `0x${string}`;
};

// Filter options - Updated to match new categories
const TX_TYPE_FILTERS: { value: TransactionCategory | "all"; label: string }[] =
  [
    { value: "all", label: "All" },
    { value: "deposit", label: "Deposits" },
    { value: "execute_single", label: "Single Payments" },
    { value: "execute_batch", label: "Batch Payments" },
    { value: "intent_created", label: "Intents Created" },
    { value: "intent_cancelled", label: "Intents Cancelled" },
    { value: "intent_recurring_single", label: "Automated Payments" },
    { value: "intent_recurring_batch", label: "Automated Batch Payments" },
    { value: "wallet_deployed", label: "Wallet Deployed" },
  ];

export function AppSidebar({
  walletAddress,
  ...props
}: AppSidebarRightProps & React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar();
  const [txTypeFilter, setTxTypeFilter] = React.useState<
    TransactionCategory | "all"
  >("all");

  // Fetch aggregated transactions
  const {
    transactions,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAggregatedTransactions({
    address: walletAddress,
  });

  console.log(transactions);

  // Filter transactions based on selected filter
  const filteredTxs = React.useMemo(() => {
    if (txTypeFilter === "all") return transactions;
    return transactions.filter((tx) => tx.category === txTypeFilter);
  }, [transactions, txTypeFilter]);

  // Infinite scroll handler
  const observerTarget = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
   <Sidebar

        className="w-[calc(var(--sidebar-width))] border-r"
      >
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
                    key={`${tx.hash}-${i}`}
                    tx={tx}
                    walletAddress={walletAddress}
                  />
                ))}

                {/* Infinite scroll trigger */}
                <div ref={observerTarget} className='h-4' />

                {/* Loading indicator */}
                {isFetchingNextPage && (
                  <div className='flex items-center justify-center p-4'>
                    <AiOutlineLoading3Quarters className='animate-spin text-lg text-muted-foreground' />
                  </div>
                )}
              </>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
