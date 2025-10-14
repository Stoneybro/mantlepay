"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { getSmartAccountClient } from "@/lib/smartAccountClient";
import CustomSmartAccount from "@/lib/customSmartAccount";
import type { SmartAccountClient } from "permissionless";

// Context shape for smart account state
type ContextValue = {
  client: SmartAccountClient | null;
  isInitializing: boolean;
  error: Error | null;
  getClient: () => Promise<SmartAccountClient>;
};

const SmartAccountContext = createContext<ContextValue | undefined>(undefined);

export function SmartAccountProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");

  const { initCustomAccount, isLoading: isCustomLoading, error: customError } =
    CustomSmartAccount();

  const [client, setClient] = useState<SmartAccountClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // refs for retries and backoff
  const initPromiseRef = useRef<Promise<SmartAccountClient | null> | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const backoffRef = useRef<number>(1000); // start at 1s, double up to 1 min

  // reset retry state
  const clearRetry = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    backoffRef.current = 1000;
  };

  // main initializer (idempotent with backoff retries)
  const initialize = useCallback(
    async (force = false): Promise<SmartAccountClient | null> => {
      if (initPromiseRef.current && !force) return initPromiseRef.current;

      const promise = (async () => {
        setError(null);

        if (!ready || !authenticated || !embeddedWallet) {
          setError(new Error("User not authenticated or Privy not ready"));
          return null;
        }

        if (customError) {
          setError(new Error("Custom account initialization error"));
          return null;
        }

        // reuse client if valid
        if (client && !force) {
          try {
            if (client.account && typeof client.sendUserOperation === "function") {
              return client;
            }
          } catch {
            setClient(null); // reset on failure
          }
        }

        setIsInitializing(true);
        try {
          const custom = await initCustomAccount();
          if (!custom) throw new Error("Custom smart account unavailable");
          const c = await getSmartAccountClient(custom);
          setClient(c);
          clearRetry();
          return c;
        } catch (err) {
          const thrown = err instanceof Error ? err : new Error(String(err));
          setError(thrown);

          // schedule retry with backoff
          clearRetry();
          const delay = backoffRef.current;
          retryTimerRef.current = window.setTimeout(() => {
            initialize(true).catch(() => {});
          }, delay);
          backoffRef.current = Math.min(backoffRef.current * 2, 60_000);
          return null;
        } finally {
          setIsInitializing(false);
          initPromiseRef.current = null;
        }
      })();

      initPromiseRef.current = promise;
      return promise;
    },
    [ready, authenticated, embeddedWallet, customError, client, initCustomAccount]
  );

  // getter for client, throws if unavailable
  const getClient = useCallback(async (): Promise<SmartAccountClient> => {
    const c = await initialize();
    if (!c) throw new Error("Smart account client not available. Reconnect or try again.");
    return c;
  }, [initialize]);

  // init when auth/wallet ready
  useEffect(() => {
    if (ready && authenticated && embeddedWallet) {
      initialize().catch(() => {});
    } else {
      setClient(null);
      setError(null);
      clearRetry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, embeddedWallet?.address]);

  // retry init when window regains focus
  useEffect(() => {
    const onFocus = () => {
      if (!client && ready && authenticated && embeddedWallet) {
        initialize().catch(() => {});
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, ready, authenticated, embeddedWallet?.address]);

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  return (
    <SmartAccountContext.Provider
      value={{
        client,
        isInitializing,
        error,
        getClient,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
}

// hook for accessing smart account context
export function useSmartAccountContext() {
  const ctx = useContext(SmartAccountContext);
  if (!ctx) throw new Error("useSmartAccountContext must be used inside SmartAccountProvider");
  return ctx;
}
