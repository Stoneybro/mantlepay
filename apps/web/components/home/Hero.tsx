import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-4xl">
          <h1 className="text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight mb-6">
            Automated payroll and subscriptions built on programmable money
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-12 max-w-3xl">
            MneePay lets businesses pay teams, vendors, and services automatically using MNEE stablecoin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/wallet" className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="https://github.com/Stoneybro/mneepaymenthub" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-gray-300 text-gray-900 font-medium hover:border-gray-400 transition-colors text-center">
              View on GitHub
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">Gas-sponsored transactions via ERC-4337</p>
            </div>
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">Non-custodial smart accounts</p>
            </div>
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">Native batch and split payments</p>
            </div>
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">Powered by MNEE stablecoin</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
