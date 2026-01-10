"use client";

import * as React from "react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { WalletQR } from "@/components/wallet/qrcode";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchWalletBalance } from "@/utils/helper";
import { truncateAddress } from "@/utils/format";
import CopyText from "@/components/ui/copy";
import { Button } from "@/components/ui/button";
import { BalanceCards } from "./Balancecard";
import { InfoCards } from "./InfoCard";

type WalletOverviewProps = {
    walletAddress?: string;
};

export function WalletOverview({ walletAddress }: WalletOverviewProps) {
    const { data: wallet, isLoading: walletIsLoading } = useQuery({
        queryKey: ["walletBalance", walletAddress],
        queryFn: () => fetchWalletBalance(walletAddress as `0x${string}`),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        enabled: !!walletAddress,
    });

    return (
        // <div className="flex flex-col gap-6 w-full max-w-md">
        //     <div className='flex items-center justify-start gap-2'>
        //         <div className='text-lg font-semibold'>{walletAddress ? truncateAddress(walletAddress) : "No Wallet"}</div>
        //         {walletAddress && <CopyText text={walletAddress} />}
        //     </div>

        //     <div className="flex flex-col gap-4">
        //         <Card className="@container/card gap-2">
        //             <CardContent className="flex-col items-start text-sm">
        //                 <CardDescription>Available Balance</CardDescription>
        //                 <div className="flex items-center justify-between w-full">
        //                     <div className="flex items-center">
        //                         <div className="">ETH</div>
        //                     </div>
        //                     <div className="flex flex-col justify-center items-center">
        //                         <div className="text-xs">
        //                             {walletIsLoading ? (
        //                                 <Skeleton className="w-6" />
        //                             ) : (
        //                                 wallet?.availableEthBalance
        //                             )}{" "}
        //                             ETH
        //                         </div>
        //                     </div>
        //                 </div>
        //                 <div className="flex items-center justify-between w-full">
        //                     <div className="flex items-center">
        //                         <div className="">MNEE</div>
        //                     </div>
        //                     <div className="flex flex-col justify-center items-end">
        //                         <div className="text-xs">
        //                             {walletIsLoading ? (
        //                                 <Skeleton className="w-6" />
        //                             ) : (
        //                                 wallet?.availableMneeBalance
        //                             )}{" "}
        //                             MNEE
        //                         </div>
        //                     </div>
        //                 </div>
        //             </CardContent>
        //         </Card>

        //         <Card className="@container/card gap-2">
        //             <CardContent className="flex-col items-start text-sm">
        //                 <CardDescription>Locked balance</CardDescription>
        //                 <div className="flex items-center justify-between w-full">
        //                     <div className="flex items-center">
        //                         <div className="">ETH</div>
        //                     </div>
        //                     <div className="flex flex-col justify-center items-center">
        //                         <div className="text-xs">
        //                             {walletIsLoading ? (
        //                                 <Skeleton className="w-6" />
        //                             ) : (
        //                                 wallet?.committedEthBalance
        //                             )}{" "}
        //                             ETH
        //                         </div>
        //                     </div>
        //                 </div>
        //                 <div className="flex items-center justify-between w-full">
        //                     <div className="flex items-center">
        //                         <div className="">MNEE</div>
        //                     </div>
        //                     <div className="flex flex-col justify-center items-end">
        //                         <div className="text-xs">
        //                             {walletIsLoading ? (
        //                                 <Skeleton className="w-6" />
        //                             ) : (
        //                                 wallet?.committedMneeBalance
        //                             )}{" "}
        //                             MNEE
        //                         </div>
        //                     </div>
        //                 </div>
        //             </CardContent>
        //         </Card>
        //     </div>

        //     {walletAddress && <WalletQR walletAddress={walletAddress} />}
        // </div>
        <>
            <div className="@container/main flex flex-col gap-4  md:gap-6 ">
                <BalanceCards />
            </div>
            <div className="@container/main flex flex-col gap-4  md:gap-6 ">
                <InfoCards />
            </div>
        </>
    );
}
