"use client";

import { GrPowerCycle } from "react-icons/gr";
import { RiExternalLinkLine } from "react-icons/ri";
import { truncateAddress, formatNumber, formatDate } from "@/utils/format";
import { BlockscoutTransaction } from "@/lib/blockscout";

type TxCategory =
  | "received"
  | "sent"
  | "deployed wallet"
  | "deployed contract"
  | "self destruct"
  | "reward"
  | "delegate call"
  | "static call"
  | "unknown";

const txTypeMap: Record<string, TxCategory> = {
  call: "sent",
  create: "deployed contract",
  create2: "deployed wallet",
  suicide: "self destruct",
  delegatecall: "delegate call",
  staticcall: "static call",
  reward: "reward",
  legacy: "sent",
  eip2930: "sent",
  eip1559: "sent",
};

function getTxCategory(
  tx: BlockscoutTransaction,
  walletAddress: `0x${string}`
): TxCategory {
  const lowerWallet = walletAddress.toLowerCase();

  if (tx.to && tx.to.toLowerCase() === lowerWallet) return "received";
  if (tx.from && tx.from.toLowerCase() === lowerWallet) return "sent";
  if (!tx.to) return "deployed contract";

  const mapped = txTypeMap[tx.type?.toLowerCase() || ""];
  return mapped || "unknown";
}

export default function TransactionItem({
  tx,
  walletAddress,
}: {
  tx: BlockscoutTransaction;
  walletAddress: `0x${string}`;
}) {
  const category = getTxCategory(tx, walletAddress);
  const label = category.replace(/\b\w/g, (c) => c.toUpperCase());
  const valueEth = formatNumber(BigInt(tx.value || "0"));
  const feeEth = formatNumber(BigInt(tx.gasUsed || "0"));
  const timestamp = formatDate(BigInt(tx.timeStamp || "0"));
  const explorerUrl = `https://base-sepolia.blockscout.com/tx/${tx.hash || tx.transactionHash}`;

  return (
    <div className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-1">
          <GrPowerCycle />
          <span className="font-semibold">{label}</span>
        </div>
        <div>{valueEth} ETH</div>
      </div>

      <div className="flex justify-between items-center w-full">
        {category === "received" && tx.from ? (
          <span>From: {truncateAddress(tx.from)}</span>
        ) : category === "sent" && tx.to ? (
          <span>To: {truncateAddress(tx.to)}</span>
        ) : tx.to ? (
          <span>To: {truncateAddress(tx.to)}</span>
        ) : null}
      </div>

      <div>Fee: {feeEth}</div>

      <div className="flex justify-between items-center w-full text-xs">
        <div>{timestamp}</div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:underline"
        >
          <span>view</span>
          <RiExternalLinkLine />
        </a>
      </div>
    </div>
  );
}
