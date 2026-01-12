export default function Technology() {
  const layers = [
    {
      title: 'Interface Layer',
      items: ['AI-driven intent parsing', 'Natural language to structured logic'],
    },
    {
      title: 'Authentication',
      items: ['Embedded wallets via Privy', 'Email and social login', 'No seed phrases'],
    },
    {
      title: 'Smart Accounts',
      items: ['ERC-4337 compliant', 'Batch and split execution', 'Gas sponsorship', 'Built with Foundry'],
    },
    {
      title: 'Automation',
      items: ['On-chain intent registry', 'Chainlink Automation', 'No centralized servers'],
    },
  ];

  return (
    <section id="technology" className="py-20 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-semibold text-gray-900 mb-16">
          Built on modern Web3 infrastructure
        </h2>

        <div className="space-y-12">
          {layers.map((layer, index) => (
            <div key={index} className="border-t border-gray-200 pt-8">
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <h3 className="text-xl font-semibold text-gray-900">{layer.title}</h3>
                </div>
                <div className="lg:col-span-8">
                  <ul className="space-y-3">
                    {layer.items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
