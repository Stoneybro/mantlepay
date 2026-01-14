export default function Footer() {
  return (
    <footer className="py-16 px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">MantlePay</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Automated financial operating system for on-chain businesses.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#use-cases" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Use Cases
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Ecosystem</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Mantle Network
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  MNT Stablecoin
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://twitter.com/0xMantle" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://github.com/Stoneybro/mneepaymenthub" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-gray-600">© 2026 MantlePay</p>
          <p className="text-sm text-gray-600">Built by Zion Livingstone</p>
        </div>
      </div>
    </footer>
  );
}
