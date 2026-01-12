const useCases = [
  {
    title: "Remote Team Payroll",
    instruction: "Pay my 15-person engineering team 6,000 dollars each every two weeks",
    outcomes: [
      "90,000 MNEE per cycle",
      "26 automated executions per year",
      "No approvals or gas management",
    ],
  },
  {
    title: "DAO Contributor Batch Payments",
    instruction: "Send 500 MNEE each to these 50 contributors",
    outcomes: [
      "One batch execution",
      "Significant gas savings",
      "Transparent on-chain record",
    ],
  },
  {
    title: "Revenue Split Distribution",
    instruction: "Split 100,000 MNEE monthly, 60% to core team, 25% to partners, 15% to treasury",
    outcomes: [
      "Automatic enforcement",
      "No manual calculations",
      "Fully on-chain distribution",
    ],
  },
];

export default function UseCases() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">Designed for real business workflows</h2>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-background rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4">{useCase.title}</h3>

              <div className="mb-6">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Instruction</span>
                <p className="text-sm italic text-muted-foreground mt-1">"{useCase.instruction}"</p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Outcome</span>
                <ul className="mt-2 space-y-2">
                  {useCase.outcomes.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
