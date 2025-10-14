"use client";

import { type ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { privyConfig } from "@/lib/privyConfig";
import { Toaster } from "sonner";
import { DeploymentStatusSync } from "@/lib/auth/deploymentStatusSync";
import { SmartAccountProvider } from "@/lib/smartAccountProvider";

interface ProviderProps {
  children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    throw new Error("NEXT_PRIVY_APP_ID is not set");
  }
  const [queryClient] = useState(() => new QueryClient());
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <SmartAccountProvider>
          <Toaster position='top-center' />
          <DeploymentStatusSync />
          {children}
        </SmartAccountProvider>
      </QueryClientProvider>
    </PrivyProvider>

  );
}
