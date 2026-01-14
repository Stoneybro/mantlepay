export default function WhyMantlePay() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-secondary">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight max-w-2xl mx-auto">
          MantlePay turns payroll and subscriptions into on-chain primitives
        </h2>

        <div className="mt-10 space-y-4 text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
          <p>
            Define payments once in plain English.
          </p>
          <p>
            Execution happens automatically on chain.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-foreground font-medium">
          <span>No approvals.</span>
          <span>No handholding.</span>
          <span>No intermediaries.</span>
        </div>
      </div>
    </section>
  );
}
