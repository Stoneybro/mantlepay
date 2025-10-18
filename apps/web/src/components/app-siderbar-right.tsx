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



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpen } = useSidebar();

  return (
    <Sidebar
      collapsible='icon'
      className='overflow-hidden *:data-[sidebar=sidebar]:flex-row'
      {...props}
    >
      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
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
              <div className='hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0'>
                <div className='flex justify-between items-center w-full'>
                  <div className='flex items-center gap-1'>
                    <span className=""><GrPowerCycle /></span>
                    <span className="font-semibold">Recurring Transfer</span>
                  </div>
                  <div className=''>0.0005ETH</div>
                </div>
                <div className='flex justify-between items-center w-full'>
                  <div className=''>
                    <span>To: </span>
                    <span>0xEdC45...8E71478e</span>
                  </div>
                  <div className=''>icon</div>
                </div>
                <div className=''>Fee: {`<0.01 ETH`}</div>
                <div className='flex justify-between items-center w-full text-xs'>
                  <div className=''>
                    <span></span>
                    <span className="">Oct 05, 2025 at 11:00 AM</span>
                  </div>
                  <div className=' flex items-center gap-1'><span>view</span><span><RiExternalLinkLine /></span></div>
                </div>
              </div>
              <div className='hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0'>
                <div className='flex justify-between items-center w-full'>
                  <div className='flex items-center gap-1'>
                    <span className=""><GrPowerCycle /></span>
                    <span className="font-semibold">Recurring Transfer</span>
                  </div>
                  <div className=''>0.0005ETH</div>
                </div>
                <div className='flex justify-between items-center w-full'>
                  <div className=''>
                    <span>To: </span>
                    <span>0xEdC45...8E71478e</span>
                  </div>
                  <div className=''>icon</div>
                </div>
                <div className=''>Fee: {`<0.01 ETH`}</div>
                <div className='flex justify-between items-center w-full text-xs'>
                  <div className=''>
                    <span></span>
                    <span className="">Oct 05, 2025 at 11:00 AM</span>
                  </div>
                  <div className=' flex items-center gap-1'><span>view</span><span><RiExternalLinkLine /></span></div>
                </div>
              </div>

            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
