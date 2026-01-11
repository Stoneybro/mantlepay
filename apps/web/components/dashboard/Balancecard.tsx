

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface BalanceCardsProps {
  availableEth?: string;
  committedEth?: string;
  isLoading?: boolean;
}

export function BalanceCards({ availableEth = "0", committedEth = "0", isLoading }: BalanceCardsProps) {
  const totalBalance = (parseFloat(availableEth) + parseFloat(committedEth)).toFixed(4);
  const safeTotal = isNaN(Number(totalBalance)) ? "0" : totalBalance;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${safeTotal} ETH`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {parseFloat(safeTotal) > 0 ? "Balance is active" : "No activity this month"}
          </div>
          <div className="text-muted-foreground">
            sum of committed balance and free balance
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Committed Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${committedEth} ETH`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {parseFloat(committedEth) > 0 ? "Funds currently reserved" : "No activity this month"}
          </div>
          <div className="text-muted-foreground">
            Value locked in payrolls and subscriptions
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Free Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${availableEth} ETH`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {parseFloat(availableEth) > 0 ? "Liquidity available" : "No activity this month"}
          </div>
          <div className="text-muted-foreground">Value available for use and withdrawal</div>
        </CardFooter>
      </Card>

    </div>
  )
}
