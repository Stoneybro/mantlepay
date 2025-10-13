import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16 sm:px-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
          Authenticate your dapps fast
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-balance text-base md:text-lg">

        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Learn More</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
