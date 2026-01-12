export default function WhyTeams() {
  const reasons = [
    'Automation-first by design',
    'Non-custodial by default',
    'Efficient at scale',
    'Global from day one',
  ];

  return (
    <section className="py-20 px-6 lg:px-8 ">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-semibold text-gray-900 mb-6">
            Why teams choose MneePay
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Traditional wallets require constant attention. MneePay runs in the background.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {reasons.map((reason, index) => (
              <div key={index} className="border-l-2 border-gray-900 pl-4">
                <p className="text-gray-900 font-medium">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
