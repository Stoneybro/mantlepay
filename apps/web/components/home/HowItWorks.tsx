const steps = [
  {
    number: "01",
    title: "Define",
    description: "User defines payments in natural language",
  },
  {
    number: "02",
    title: "Generate",
    description: "MantlePay generates an ERC-4337 UserOperation",
    icon: (
      <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Funds Committed",
    description: "Smart contract locks funds for future payments",
    icon: (
      <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )
  },
  {
    title: "Auto-Execution",
    description: "Network executes transfers exactly when due",
    icon: (
      <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">How MantlePay works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-light text-border mb-4">{step.number}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 w-full h-px bg-border transform translate-x-1/2" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-2 text-sm text-muted-foreground">
          <span>Simple.</span>
          <span>Deterministic.</span>
          <span>Trustless.</span>
        </div>
      </div>
    </section>
  );
}
