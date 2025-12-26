"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useLogin, usePrivy } from "@privy-io/react-auth"
import { FcGoogle } from "react-icons/fc"
import { SiGmail } from "react-icons/si"
import { FaGithub, FaWallet } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import LoginFormSkeleton from "./LoginSkeleton"

// Handles user authentication via Privy (Google, GitHub, Email)
export default function LoginForm() {
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin();
  const router = useRouter();
  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/deploy")
    }
  }, [ready, authenticated, router])
  type LoginMethod = "google" | "github" | "email" 
  const [loadingProvider, setLoadingProvider] = useState<LoginMethod | null>(null)

  const handleLogin = async (method: LoginMethod) => {
    try {
      setLoadingProvider(method)
      login({ loginMethods: [method] })
    } catch (error) {
      console.error(`Login failed for ${method}:`, error)
    } finally {
      setLoadingProvider(null)
    }
  }



  if (!ready) {
    return <LoginFormSkeleton />
  }

  const loginMethods: { id: LoginMethod; label: string; icon: ReactNode }[] = [
    { id: "google", label: "Login with Google", icon: <FcGoogle /> },
    { id: "github", label: "Login with GitHub", icon: <FaGithub /> },
    { id: "email", label: "Email", icon: <SiGmail /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold">Welcome Back!</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Choose your preferred method to continue.
        </p>
      </div>

      <div className="grid gap-4">
        {loginMethods.map((method) => (
          <Button
            key={method.id}
            type="button"
            onClick={() => handleLogin(method.id)}
            variant="outline"
            className="w-full"
            aria-label={`Continue with ${method.id}`}
            disabled={loadingProvider !== null}
          >
            <span className="mr-2 inline-flex items-center" aria-hidden>
              {method.icon}
            </span>
            {loadingProvider === method.id ? 'Loading…' : method.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
