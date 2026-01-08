"use client";

import * as React from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { truncateAddress } from "@/utils/format";
import CopyText from "../ui/copy";
import { fetchWalletBalance } from "@/utils/helper";
import { useQuery } from "@tanstack/react-query";
import { WalletQR } from "./qrcode";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import { zeroAddress } from "viem";
import { TransactionList } from "@/components/transaction-history/TransactionList";

type AppSidebarRightProps = {
  walletAddress: `0x${string}`;
};

export function AppSidebarRight({
  walletAddress,
  ...props
}: AppSidebarRightProps & React.ComponentProps<typeof Sidebar>) {
  const { data: wallet, isLoading: walletIsLoading } = useQuery({
    queryKey: ["walletBalance", walletAddress],
    queryFn: () => fetchWalletBalance(walletAddress),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });



  const { setOpen } = useSidebar();
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    const faucetClaimed = localStorage.getItem("FaucetClaimed");
    if (faucetClaimed === "true") {
      setIsClaimed(true);
    }
  }, []);




  return (
    <Sidebar {...props} className='w-[calc(var(--sidebar-width))] border-r'>
      <SidebarHeader className=' p-3 bg-background border-b'>
        <div className='flex  w-full items-center justify-center gap-2'>
          <Button
            variant={"outline"}
            className='bg-accent flex justify-center items-center h-8 w-8 text-xs rounded-full'
          >
            ?
          </Button>
          <div className=''>{truncateAddress(walletAddress)}</div>{" "}
          <CopyText text={walletAddress} />
        </div>
        {/* <SidebarInput placeholder="Type to search..." /> */}
      </SidebarHeader>
      <SidebarContent
        className='[&::-webkit-scrollbar]:hidden'
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <SidebarGroup className='px-4 gap-4'>
          <div className=' pt-4 flex flex-col gap-4'>
            <Card className='@container/card gap-2'>
              <CardContent className='flex-col items-start  text-sm'>
                <CardDescription>Available Balance</CardDescription>
                <div className=' flex items-center justify-between w-full'>
                  <div className='flex items-center '>
                    <div className=''>
                      {/* <Image
                        src={"/Ethereum.svg"}
                        height={30}
                        width={30}
                        alt='ethereum logo image'
                      /> */}
                    </div>
                    <div className=''>ETH</div>
                  </div>
                  <div className='flex flex-col justify-center items-center  '>
                    <div className='text-xs'>
                      {walletIsLoading ? (
                        <Skeleton className='w-6' />
                      ) : (
                        wallet?.availableEthBalance
                      )}{" "}
                      ETH
                    </div>
                  </div>
                </div>
                <div className=' flex items-center justify-between w-full'>
                  <div className='flex items-center '>
                    <div className=''>
                      {/* <Image
                        src={"/Pyusd.svg"}
                        height={30}
                        width={30}
                        alt='pyusd logo image'
                      /> */}
                    </div>
                    <div className=''>MNEE</div>
                  </div>
                  <div className='flex flex-col justify-center items-end '>
                    <div className='text-xs'>
                      {walletIsLoading ? (
                        <Skeleton className='w-6' />
                      ) : (
                        wallet?.availableMneeBalance
                      )}{" "}
                      MNEE
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className='@container/card gap-2'>
              <CardContent className='flex-col items-start  text-sm'>
                <CardDescription>Locked balance</CardDescription>
                <div className=' flex items-center justify-between w-full'>
                  <div className='flex items-center '>
                    <div className=''>
                      {/* <Image
                        src={"/ethereum.svg"}
                        height={30}
                        width={30}
                        alt='ethereum logo image'
                      /> */}
                    </div>
                    <div className=''>ETH</div>
                  </div>
                  <div className='flex flex-col justify-center items-center  '>
                    <div className='text-xs'>
                      {walletIsLoading ? (
                        <Skeleton className='w-6' />
                      ) : (
                        wallet?.committedEthBalance
                      )}{" "}
                      ETH
                    </div>
                  </div>
                </div>
                <div className=' flex items-center justify-between w-full'>
                  <div className='flex items-center '>
                    <div className=''>
                      {/* <Image
                        src={"/pyusd.svg"}
                        height={30}
                        width={30}
                        alt='pyusd logo image'
                      /> */}
                    </div>
                    <div className=''>MNEE</div>
                  </div>
                  <div className='flex flex-col justify-center items-end '>
                    <div className='text-xs'>
                      {walletIsLoading ? (
                        <Skeleton className='w-6' />
                      ) : (
                        wallet?.committedMneeBalance
                      )}{" "}
                      MNEE
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <WalletQR walletAddress={walletAddress} />
        </SidebarGroup>

        <SidebarGroup className='px-4 gap-4 mt-4'>
          <h3 className="text-sm font-semibold text-gray-400 px-2">Recent Activity</h3>
          <TransactionList walletAddress={walletAddress} />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
