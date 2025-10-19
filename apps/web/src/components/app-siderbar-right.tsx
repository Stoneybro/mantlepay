"use client"

import * as React from "react"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button";
import { truncateAddress } from "@/utils/format";
import CopyText from "./ui/copy"
import { fetchWalletBalance } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
type AppSidebarRightProps = {
  walletAddress: `0x${string}`;
}


export function AppSidebarRight({ walletAddress,...props }: AppSidebarRightProps & React.ComponentProps<typeof Sidebar>) {
      const { data: wallet, isLoading: walletIsLoading } = useQuery({
    queryKey: ["walletBalance", walletAddress],
    queryFn: () => fetchWalletBalance(walletAddress),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });
  
  const { setOpen } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar
        collapsible="none"
        className="hidden flex-1 md:flex"
        style={{ scrollbarWidth: "none" }}
      >
        <SidebarHeader className=" p-3 bg-background border-b">
          <div className="flex  w-full items-center justify-center gap-2">
      
           <Button variant={"outline"} className="bg-accent flex justify-center items-center h-8 w-8 text-xs rounded-full">?</Button><div className="">{truncateAddress(walletAddress)}</div> < CopyText text={walletAddress} />

          </div>
          {/* <SidebarInput placeholder="Type to search..." /> */}
        </SidebarHeader>
        <SidebarContent
          className="[&::-webkit-scrollbar]:hidden"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          <SidebarGroup className="px-0">
            <div className="px-4 pt-4 flex flex-col gap-4">
        <Card className="@container/card gap-2">
        <CardHeader>
          <CardDescription>Available Balance</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {wallet?.availableBalance} ETH
          </CardTitle>
        </CardHeader>
        {/* <CardContent className="flex-col items-start  text-sm">
          <div className=""></div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/ethereum.svg"} height={30} width={30} alt="ethereum logo image" /></div>
            <div className="">ETH</div>
           </div>
           <div className="flex flex-col justify-center items-center  ">
          <div className="font-semibold">$2000</div>
          <div className="text-xs">1.5ETH</div>
           </div>
          </div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/pyusd.svg"} height={30} width={30} alt="pyusd logo image" /></div>
            <div className="">PYUSD</div>
           </div>
           <div className="flex flex-col justify-center items-end ">
          <div className=" font-semibold">$2000</div>
          <div className="text-xs">2000 PYUSD</div>
           </div>
          </div>
        </CardContent> */}
      </Card>
        <Card className="@container/card gap-2">
        <CardHeader>
          <CardDescription>Locked balance</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
           {wallet?.committedFunds} ETH
          </CardTitle>
        </CardHeader>
        {/* <CardContent className="flex-col items-start  text-sm">
          <div className=""></div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/ethereum.svg"} height={30} width={30} alt="ethereum logo image" /></div>
            <div className="">ETH</div>
           </div>
           <div className="flex flex-col justify-center items-center  ">
          <div className="font-semibold">$2000</div>
          <div className="text-xs">1.5ETH</div>
           </div>
          </div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/pyusd.svg"} height={30} width={30} alt="pyusd logo image" /></div>
            <div className="">PYUSD</div>
           </div>
           <div className="flex flex-col justify-center items-end ">
          <div className=" font-semibold">$2000</div>
          <div className="text-xs">2000 PYUSD</div>
           </div>
          </div>
        </CardContent> */}
      </Card>
            </div>
    

          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
