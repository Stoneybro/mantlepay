const steps = [
  {
    number: "01",
    title: "Define",
    description: "User defines payments in natural language",
  },
  {
    number: "02",
    title: "Generate",
    description: "MneePay generates an ERC-4337 UserOperation",
  },
  {
    number: "03",
    title: "Commit",
    description: "Smart account commits funds on chain",
  },
  {
    number: "04",
    title: "Execute",
    description: "Chainlink Automation executes on schedule",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 lg:py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">How MneePay works</h2>

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
