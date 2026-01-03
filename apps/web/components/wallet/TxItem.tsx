"use client";

import { RiExternalLinkLine } from "react-icons/ri";
import CopyText from "./ui/copy";
import {
  formatEth,
  formatNumber,
  formatTimestamp,
  truncateAddress,
} from "@/utils/format";
import { BsArrowRepeat, BsArrowUpRight } from "react-icons/bs";
import { FaUsers } from "react-icons/fa6";
import { MdOutlineNoteAdd, MdSettings, MdDeleteOutline } from "react-icons/md";
import { CiWallet } from "react-icons/ci";

import { TransactionType, UnifiedTransaction } from "@/lib/index/indexTypes";

interface TransactionItemProps {
  tx: UnifiedTransaction;
  walletAddress: `0x${string}`;
}

const getTxTypeLabel = (type: TransactionType): string => {
  switch (type) {
    case TransactionType.CONTRACT_CALL:
      return "Contract Call";
    case TransactionType.EXECUTE:
      return "Payment";
    case TransactionType.EXECUTE_BATCH:
      return "Batch Payment";
    case TransactionType.INTENT_EXECUTED:
      return "Recurring Payment";
    case TransactionType.INTENT_CREATED:
      return "Schedule Created";
    case TransactionType.INTENT_CANCELLED:
      return "Schedule Cancelled";
    case TransactionType.WALLET_DEPLOYED:
      return "Wallet Deployed";
    default:
      return "Transaction";
  }
};

const getTxTypeIcon = (type: TransactionType): React.ReactNode => {
  switch (type) {
    case TransactionType.CONTRACT_CALL:
      return <MdSettings />;
    case TransactionType.EXECUTE:
      return <BsArrowUpRight />;
    case TransactionType.EXECUTE_BATCH:
      return <FaUsers />;
    case TransactionType.INTENT_EXECUTED:
      return <BsArrowRepeat />;
    case TransactionType.INTENT_CREATED:
      return <MdOutlineNoteAdd />;
    case TransactionType.INTENT_CANCELLED:
      return <MdDeleteOutline />;
    case TransactionType.WALLET_DEPLOYED:
      return <CiWallet />;
    default:
      return <RiExternalLinkLine />;
  }
};

const formatDuration = (seconds: bigint): string => {
  const num = Number(seconds);
  if (num === 0) return "0s";
  if (num < 60) return `${num}s`;
  if (num < 3600) return `${Math.floor(num / 60)}m`;
  if (num < 86400) return `${Math.floor(num / 3600)}h`;
  return `${Math.floor(num / 86400)}d`;
};

export default function TransactionItem({ tx }: TransactionItemProps) {
  const label = getTxTypeLabel(tx.type);
  const icon = getTxTypeIcon(tx.type);
  const formattedDate = formatTimestamp(tx.timestamp);
  const explorerUrl = `https://eth-sepolia.blockscout.com/tx/${tx.transactionHash}`;
  console.log(tx);
  const renderDetails = () => {
    switch (tx.type) {
      case TransactionType.WALLET_DEPLOYED:
        return (
          <div className='space-y-1.5'>
            <div className='text-xs text-muted-foreground flex items-center gap-1'>
              <span className='text-muted-foreground/70'>Wallet:</span>
              <span>{truncateAddress(tx.walletAddress)}</span>
              <CopyText text={tx.walletAddress} />
            </div>
            <div className='text-xs text-muted-foreground'>
              Block: {tx.blockNumber.toString()}
            </div>
          </div>
        );

      case TransactionType.EXECUTE:
        return (
          <div className='space-y-1.5'>
            <div className='text-xs text-muted-foreground flex items-center gap-1'>
              <span className='text-muted-foreground/70'>To:</span>
              <span>{truncateAddress(tx.to)}</span>
              <CopyText text={tx.to} />
            </div>
            <div className='text-sm font-medium'>
              {formatEth(tx.value)} {tx.token?.toUpperCase()}
            </div>
            <div className='text-xs'>
              <span className={`px-1.5 py-0.5 rounded text-[10px]`}></span>
            </div>
          </div>
        );

      case TransactionType.CONTRACT_CALL:
        return (
          <div className='space-y-1.5'>
            <div className='text-xs text-muted-foreground flex items-center gap-1'>
              <span className='text-muted-foreground/70'>Contract:</span>
              <span>{truncateAddress(tx.to)}</span>
              <CopyText text={tx.to} />
            </div>
            {tx?.label && (
              <div className='text-xs text-muted-foreground'>
                <span className='text-muted-foreground/70'>Type:</span>{" "}
                {tx.label}
              </div>
            )}
            {tx.value > 0n && (
              <div className='text-xs font-medium'>
                Value: {formatEth(tx.value)} {tx.token?.toUpperCase()}
              </div>
            )}
            <div className='text-xs'>
              <span className={`px-1.5 py-0.5 rounded text-[10px] `}></span>
            </div>
          </div>
        );

      case TransactionType.EXECUTE_BATCH:
        return (
          <div className='space-y-1.5'>
            <div className='text-xs text-muted-foreground'>
              <span className='text-muted-foreground/70'>Recipient count:</span>{" "}
              {tx.batchSize.toString()}
            </div>
            <div className='text-sm font-medium'>
              Total: {formatEth(tx.totalValue)} {tx.token?.toUpperCase()}
            </div>
          </div>
        );

      case TransactionType.INTENT_CREATED:
        return (
          <div className='space-y-1.5'>
            <div className='text-sm font-semibold'>
              name:{tx.intentName || "Unnamed Schedule"}
            </div>
            <div className='text-xs text-muted-foreground flex items-center gap-1'>
              <span className='text-muted-foreground/70'>ID:</span>
              <span>{truncateAddress(tx.intentId)}</span>
              <CopyText className='w-2!' text={tx.intentId} />
            </div>
            <div className='text-xs text-muted-foreground'>
              <span className='text-muted-foreground/70'>Recipients:</span>{" "}
              {tx.recipientCount}
            </div>

            <div className='mt-2 space-y-1 rounded-md border px-3 py-2 bg-muted/30'>
              <div className='text-xs'>
                <span className='text-muted-foreground/70'>
                  Total Payments:
                </span>{" "}
                {tx.totalTransactionCount.toString()}
              </div>
              <div className='text-xs'>
                <span className='text-muted-foreground/70'>Duration:</span>{" "}
                {formatDuration(tx.duration)}
              </div>
              <div className='text-xs'>
                <span className='text-muted-foreground/70'>Interval:</span>{" "}
                {formatDuration(tx.interval)}
              </div>
            </div>
          </div>
        );

      case TransactionType.INTENT_CANCELLED:
        return (
          <div className='space-y-1.5'>
            <div className='text-sm font-semibold'>
              {tx.intentName || "Unnamed Schedule"}
            </div>
            <div className='text-xs text-muted-foreground flex items-center gap-1'>
              <span className='text-muted-foreground/70'>ID:</span>
              <span>{truncateAddress(tx.intentId)}</span>
              <CopyText className='w-2!' text={tx.intentId} />
            </div>
            <div className='text-xs text-muted-foreground'>
              <span className='text-muted-foreground/70'>Recipients:</span>{" "}
              {tx.recipientCount}
            </div>
          </div>
        );

      case TransactionType.INTENT_EXECUTED:
        return (
          <div className='space-y-1.5'>
            <div className='text-sm font-semibold'>
              Payment Name: {tx.intentName || "Unnamed Schedule"}
            </div>

            <div className='mt-2 space-y-2 rounded-md border px-3 py-2 bg-muted/30'>
              <div className='text-xs font-medium text-muted-foreground'>
                Recipients: {tx.recipients.length}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
        flex flex-col gap-2.5 border-b p-4 text-sm leading-tight
        last:border-b-0 transition-colors`}
    >
      {/* Header Row */}
      <div className='flex justify-between items-start w-full gap-2'>
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <div className='flex flex-col min-w-0 flex-1'>
            <div className='flex items-center gap-1.5'>
              <span className='text-base'>{icon}</span>
              <span className='font-semibold truncate'>{label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      {renderDetails()}

      {/* Footer Row */}
      <div className='flex justify-between items-center w-full text-xs text-muted-foreground pt-1 border-t'>
        <div>{formattedDate}</div>
        <a
          href={explorerUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-1 hover:text-foreground transition-colors'
        >
          <span>Explorer</span>
          <RiExternalLinkLine className='h-3 w-3' />
        </a>
      </div>
    </div>
  );
}
