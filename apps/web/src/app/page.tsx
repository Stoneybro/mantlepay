import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function Home() {
  const techStack = [
    'Next.js', 'Viem', 'Permissionless (Pimlico)', 'Privy', 'Vercel AI SDK',
    'TanStack Query', 'Shadcn', 'Blockscout', 'Chainlink', 'Account Abstraction'
  ]

  const links = [
    { name: 'Live Demo', url: 'https://aidra.vercel.app' },
    { name: 'GitHub', url: 'https://github.com/stoneybro/aidra' },

  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Aidra Interactive ERC-4337 Smart Wallet
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
            Smart wallet that turns natural language into batch, single, and scheduled payments.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mt-20 lg:px-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none bg-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Natural Language Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Aidra converts plain text into executable ERC-4337 UserOperations.</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Gas-Sponsored Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Uses a paymaster-bundler stack for automated, gas-sponsored transactions.</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-background shadow-sm md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-xl">Versatile Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Ideal for payrolls, subscriptions, and both automatic and manual disbursements.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="mt-20">
          <h2 className="mb-6 text-center text-2xl font-semibold">Tech Stack</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {techStack.map((tech) => (
              <span key={tech} className="rounded-full bg-muted px-4 py-2 text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Links Section */}
        <section className="mt-20">
          <div className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline underline-offset-4 hover:text-primary"
              >
                {link.name}
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <Separator className="mx-auto mb-6 max-w-md" />
          <p>Built for ETHGlobal — by zion livingstone</p>
        </footer>
      </div>
    </main>
  )
}
