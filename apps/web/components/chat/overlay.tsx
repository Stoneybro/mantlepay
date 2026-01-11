import React from 'react'
import { Card, CardAction, CardFooter, CardHeader } from "@/components/ui/card";
import Image from 'next/image';
import { BsArrowUpRight, BsArrowRepeat } from "react-icons/bs";
import { FaUsers, FaUsersGear } from "react-icons/fa6";
function Overlay() {
  return (
    <div> <div className="absolute w-full h-full top-0 left-0 flex flex-col gap-16 py-4 mx-auto md:gap-6 md:py-6">
          <div className="text-2xl font-semibold text-center">Mneepay is Active</div>
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 px-16 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-16 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <BsArrowUpRight />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Send Payment
                </div>
                <div className="text-muted-foreground">
                  Send one payment to one recipient
                </div>
              </CardFooter>
            </Card>
            
            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <FaUsers />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Batch Payment
                </div>
                <div className="text-muted-foreground">
                  Send one transaction to multiple recipients
                </div>
              </CardFooter>
            </Card>
            
            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <BsArrowRepeat />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Single Recurring Payment
                </div>
                <div className="text-muted-foreground">
                  Automate repeated transfers to one address
                </div>
              </CardFooter>
            </Card>
            
            <Card className="@container/card">
              <CardHeader>
                <CardAction>
                  <FaUsersGear/>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Batch Recurring Payment
                </div>
                <div className="text-muted-foreground text-xs">
                  Schedule recurring payments for teams or groups
                </div>
              </CardFooter>
            </Card>
          </div>
        </div></div>
  )
}

export default Overlay