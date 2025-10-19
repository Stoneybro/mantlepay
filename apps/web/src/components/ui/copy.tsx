"use client";
import { Check, Copy } from "lucide-react";
import React from "react";
interface CopyTextProps {
  text: string;
}
export default function CopyText(text:CopyTextProps) {
  const [copied, setCopied] = React.useState(false);
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };
  return (
    <button onClick={() => copyToClipboard(text.text)}>
     {!copied? <Copy className='w-4 h-4  cursor-pointer hover:text-foreground ' />:<Check className='w-4 h-4  cursor-pointer hover:text-foreground ' />}
    </button>
  );
}
