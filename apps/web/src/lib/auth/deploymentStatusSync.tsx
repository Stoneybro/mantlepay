import { useEffect } from "react";
import useWalletDeployment from "@/hooks/useWalletDeployment";
import { usePrivy } from "@privy-io/react-auth";

export function DeploymentStatusSync() {
  const { authenticated, ready } = usePrivy();
  const { data: isDeployed, isLoading: isDeploymentCheckLoading } =
    useWalletDeployment();
  useEffect(() => {
    if (ready && authenticated && !isDeploymentCheckLoading) {
      console.log("Deployment status synced:", isDeployed);
    }
  }, [ready, isDeployed, isDeploymentCheckLoading, authenticated]);

  return null;
}
