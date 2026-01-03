import { AppSidebar } from "@/components/wallet/app-sidebar";
import { AppSidebarRight } from "@/components/wallet/app-sidebar-right";
import { cookies } from "next/headers";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import Chat from "@/components/chat/chat";
import { zeroAddress } from "viem";

export default async function Page() {
  const walletAddress =zeroAddress
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar walletAddress={walletAddress}/>
      <SidebarInset>
        <header className='bg-background sticky top-0 flex shrink-0 items-center gap-2  p-4'>
          {/* <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          /> */}
        </header>

        <Chat walletAddress={walletAddress} />
      </SidebarInset>
      <AppSidebarRight side='right' walletAddress={walletAddress} />
    </SidebarProvider>
  );
}
