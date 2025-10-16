import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarRight } from "@/components/app-siderbar-right";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ArrowUpIcon, CirclePlus } from "lucide-react";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className='bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4'>
          {/* <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          /> */}
        </header>

        <div className='w-full h-full flex justify-center items-center'>
          <div className=' w-lg '>
            <InputGroup>
              <InputGroupTextarea
                className=' '
                placeholder='Ask, Search or Chat...'
              />
              <InputGroupAddon align={"block-end"}>
                <InputGroupButton
                  variant='outline'
                  className='rounded-full'
                  size='icon-xs'
                >
                  <CirclePlus />
                </InputGroupButton>
                <InputGroupButton
                  variant='default'
                  className='rounded-full ml-auto'
                  size='icon-xs'
                  disabled
                >
                  <ArrowUpIcon />
                  <span className='sr-only'>Send</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

        </div>
      </SidebarInset>
      <AppSidebarRight side='right' />
    </SidebarProvider>
  );
}
