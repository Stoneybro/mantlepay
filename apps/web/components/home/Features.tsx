import { MessageSquare, Users, Split, Shield, RefreshCw } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Conversational Payment Definition',
      description: 'Define payrolls, subscriptions, batch payouts, and revenue splits using natural language.',
      details: 'MneePay extracts recipients, amounts, weights, frequency, and duration, then generates on-chain payment logic.',
      examples: [
        'Pay my engineering team 6,000 dollars each every two weeks starting February 1st',
        'Send 20,000 dollars split 50% to Alice, 30% to Bob, and 20% to Carol',
        'Pay 500 dollars each to these 40 contributors',
      ],
      value: 'Complex payment logic from a single instruction.',
    },
    {
      icon: Users,
      title: 'Native Batch Payments',
      description: 'Execute multi-recipient payouts directly from the smart account in a single operation.',
      details: 'No extra contracts. No multisend tools. No repeated approvals.',
      value: 'One transaction instead of dozens, with clean on-chain accounting.',
    },
    {
      icon: Split,
      title: 'Flexible Split Payments',
      description: 'Support arbitrary splits by percentage or fixed amount.',
      details: 'Splits can be: One-time, Recurring, Tied to payroll or subscriptions',
      useCases: ['Revenue sharing', 'Partner payouts', 'Team distributions', 'DAO rewards'],
      value: 'Programmable value distribution without custom contracts.',
    },
    {
      icon: Shield,
      title: 'ERC-4337 Smart Accounts',
      description: 'Every MneePay wallet is a non-custodial smart account.',
      details: 'This enables: Batch execution, Split logic, Gas sponsorship, Programmable rules',
      additional: 'Users retain full custody at all times.',
      value: 'Advanced payment logic with self-custody guarantees.',
    },
    {
      icon: RefreshCw,
      title: 'Decentralized Payment Automation',
      description: 'Payment schedules execute automatically using Chainlink Automation.',
      details: 'No centralized servers. No cron jobs. No manual execution.',
      additional: 'Once configured, payments run without further interaction.',
      value: 'True set-and-forget on-chain payments.',
    },
  ];

  return (
    <section id="features" className="py-20 px-6 lg:px-8 ">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl font-semibold text-gray-900 mb-6">
            Built for automated and multi-party payments
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            MneePay combines conversational intent, smart accounts, and decentralized automation to handle payroll, subscriptions, batch payments, and split payments as first-class on-chain workflows.
          </p>
        </div>

        <div className="space-y-12">
          {features.map((feature, index) => (
            <div key={index} className="border-t border-gray-200 pt-12">
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <feature.icon className="w-8 h-8 text-gray-900 mb-4" strokeWidth={1.5} />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <p className="text-gray-700">{feature.details}</p>

                  {feature.examples && (
                    <div className="space-y-3 py-4">
                      <p className="text-sm font-medium text-gray-900">Examples</p>
                      {feature.examples.map((example, i) => (
                        <div key={i} className="border-l-2 border-gray-300 pl-4">
                          <p className="text-sm text-gray-600">{example}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {feature.useCases && (
                    <div className="py-2">
                      <p className="text-sm font-medium text-gray-900 mb-2">Use cases</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {feature.useCases.map((useCase, i) => (
                          <div key={i} className="flex items-start">
                            <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                            <span className="text-sm text-gray-600">{useCase}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {feature.additional && (
                    <p className="text-gray-700">{feature.additional}</p>
                  )}

                  <div className="pt-2">
                    <p className="text-sm font-medium text-gray-900">Value</p>
                    <p className="text-sm text-gray-600">{feature.value}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
