import React from 'react'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { BsArrowUpRight, BsArrowRepeat } from "react-icons/bs";
import { FaUsers, FaUsersGear } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
interface OverlayProps {
  setInput: (value: string) => void;
}

function Overlay({ setInput }: OverlayProps) {
  return (

    <div className="absolute left-1/2 -translate-x-1/2 top-10 w-[90%] md:w-[80%] lg:w-[70%]  flex flex-col gap-6">
      <div className="text-2xl font-semibold text-center">what would you like to do?</div>
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs w-full">
        <Card
          className="@container/card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setInput("Send [AMOUNT] ETH to [ADDRESS]")}
        >
          <CardHeader>
            <CardTitle>
              <Badge variant="outline">
                Send
              </Badge>
            </CardTitle>
            <CardAction>
              <BsArrowUpRight />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              single payment
            </div>
            <div className="text-muted-foreground">
              transfer funds to a single recipient
            </div>
          </CardFooter>
        </Card>

        <Card
          className="@container/card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setInput("Send a batch payment of [AMOUNT] ETH to [ADDRESS_1], [AMOUNT] ETH to [ADDRESS_2]")}
        >
          <CardHeader>
            <CardTitle>
              <Badge variant="outline">
                bulk send
              </Badge>
            </CardTitle>
            <CardAction>
              <FaUsers />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Batch Payment
            </div>
            <div className="text-muted-foreground">
              distribute payment to multiple people at once
            </div>
          </CardFooter>
        </Card>

        <Card
          className="@container/card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setInput("Create a subscription named [NAME], sending [AMOUNT] ETH to [ADDRESS] every [INTERVAL] days for [DURATION] days")}
        >
          <CardHeader>
            <CardTitle>
              <Badge variant="outline">
                create subscription
              </Badge>
            </CardTitle>
            <CardAction>
              <BsArrowRepeat />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Single Recurring Payment
            </div>
            <div className="text-muted-foreground">
              Set up a recurring transfer to one address
            </div>
          </CardFooter>
        </Card>

        <Card
          className="@container/card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setInput("Create a payroll named [NAME], sending [AMOUNT] ETH to [ADDRESS_1], [AMOUNT] ETH to [ADDRESS_2] every [INTERVAL] days for [DURATION] days")}
        >
          <CardHeader>
            <CardTitle>
              <Badge variant="outline">
                run payroll
              </Badge>
            </CardTitle>
            <CardAction>
              <FaUsersGear />
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Batch Recurring Payment
            </div>
            <div className="text-muted-foreground text-xs">
              Set up recurring payments for teams or groups
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>

  )
}


export default Overlay