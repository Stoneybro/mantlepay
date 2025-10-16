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



export function AppSidebarRight({ ...props }: React.ComponentProps<typeof Sidebar>) {

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
        <SidebarHeader className="gap-3.5 p-4">
          <div className="flex w-full items-center justify-between">
        <div className="text-foreground text-base font-medium">
          
        </div>
          </div>
          {/* <SidebarInput placeholder="Type to search..." /> */}
        </SidebarHeader>
        <SidebarContent
          className="[&::-webkit-scrollbar]:hidden"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          <SidebarGroup className="px-0">
            <div className="px-4 flex flex-col gap-4">
        <Card className="@container/card gap-2">
        <CardHeader>
          <CardDescription>Available Balance</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-col items-start  text-sm">
          <div className=""></div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/Ethereum.svg"} height={30} width={30} alt="ethereum logo image" /></div>
            <div className="">ETH</div>
           </div>
           <div className="flex flex-col justify-center items-center  ">
          <div className="font-semibold">$2000</div>
          <div className="text-xs">1.5ETH</div>
           </div>
          </div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/Pyusd.svg"} height={30} width={30} alt="pyusd logo image" /></div>
            <div className="">PYUSD</div>
           </div>
           <div className="flex flex-col justify-center items-end ">
          <div className=" font-semibold">$2000</div>
          <div className="text-xs">2000 PYUSD</div>
           </div>
          </div>
        </CardContent>
      </Card>
        <Card className="@container/card gap-2">
        <CardHeader>
          <CardDescription>Available Balance</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-col items-start  text-sm">
          <div className=""></div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/Ethereum.svg"} height={30} width={30} alt="ethereum logo image" /></div>
            <div className="">ETH</div>
           </div>
           <div className="flex flex-col justify-center items-center  ">
          <div className="font-semibold">$2000</div>
          <div className="text-xs">1.5ETH</div>
           </div>
          </div>
          <div className=" flex items-center justify-between w-full">
           <div className="flex items-center ">
            <div className=""><Image src={"/Pyusd.svg"} height={30} width={30} alt="pyusd logo image" /></div>
            <div className="">PYUSD</div>
           </div>
           <div className="flex flex-col justify-center items-end ">
          <div className=" font-semibold">$2000</div>
          <div className="text-xs">2000 PYUSD</div>
           </div>
          </div>
        </CardContent>
      </Card>
            </div>
    

          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
