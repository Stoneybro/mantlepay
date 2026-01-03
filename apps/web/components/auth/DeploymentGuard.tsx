"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useWalletDeployment from "@/hooks/useWalletDeployment";
import { Loader2 } from "lucide-react";

export default function DeploymentGuard({ children }: { children: React.ReactNode }) {
  const { data: isDeployed, isLoading } = useWalletDeployment();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      const onDeployPage = pathname.startsWith("/deploy");
      const onWalletPage = pathname.startsWith("/wallet");
      if (isDeployed && onDeployPage) {
        router.replace("/wallet");
      } else if (!isDeployed && onWalletPage) {
        router.replace("/deploy");
      }
    }
  }, [isDeployed, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">
            Verifying wallet status...
          </p>
        </div>
      </div>
    );
  }

  const onDeployPage = pathname.startsWith("/deploy");
  if ((isDeployed && onDeployPage) || (!isDeployed && !onDeployPage)) {
     return null;
  }

  return <>{children}</>;
}