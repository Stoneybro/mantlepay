# MantlePay

> **The first AI-powered, compliance-ready payment platform on Mantle.**

MantlePay is an intent-centric smart wallet that transforms how teams handle crypto payments. Using natural language processing and account abstraction (ERC-4337), it enables payroll, subscriptions, batch transfers, and split payments through simple conversational commands—all executed automatically on-chain.

[![Built on Mantle](https://img.shields.io/badge/Built%20on-Mantle-blue)](https://mantle.xyz)
[![ERC-4337](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-green)](https://eips.ethereum.org/EIPS/eip-4337)
[![Chainlink Automation](https://img.shields.io/badge/Chainlink-Automation-blue)](https://chain.link/automation)

---

## 🎯 The Problem

Crypto payroll is broken:

| Pain Point | Impact |
|------------|--------|
| **No categorization** | Salary, bonus, and contractor payments look identical on-chain |
| **No jurisdiction tracking** | US W-2, UK PAYE, EU contractors—impossible to filter |
| **No reporting** | Export transactions, manually categorize each one |
| **No audit trail** | "Prove you paid Alice $5000 in Q3" = hours of work |
| **Clunky UX** | Multiple clicks, approvals, and technical knowledge required |

**Existing solutions fall short:**

| Tool | Payroll Support |
|------|-----------------|
| MetaMask | ❌ None |
| Gnosis Safe | ❌ None |
| Request Network | ⚠️ Invoicing only |
| Generic wallets | ❌ Zero compliance features |
| **MantlePay** | ✅ Native on-chain payroll with compliance metadata |

---

## 💡 The Solution

MantlePay combines three powerful technologies:

1. **AI-Powered Intent Resolution** — Natural language commands become executable on-chain transactions
2. **ERC-4337 Smart Accounts** — Batching, gas sponsorship, and programmable payment logic
3. **Chainlink Automation** — Decentralized, trustless execution of recurring payments

### Just Type What You Want

```
"Pay my engineering team 6,000 MNT each every two weeks starting February 1st"

"Send 20,000 MNT split 50% to Alice, 30% to Bob, and 20% to Carol"

"Create a recurring payment of 500 MNT to contractors weekly for 3 months"
```

MantlePay extracts recipients, amounts, frequency, and duration—then generates the on-chain logic automatically.

---

## 🚀 Features

### 1. 🗣️ Conversational Payment Definition

Define complex payment workflows using natural language:

- **Payroll**: "Pay Alice, Bob, and Charlie 5000 MNT each on the 1st and 15th"
- **Subscriptions**: "Pay 100 MNT to our hosting provider every month"
- **Batch payouts**: "Distribute 50,000 MNT equally to these 20 addresses"
- **Split payments**: "Send 10,000 MNT with 40% to treasury, 30% to team, 30% to reserves"

### 2. 📦 Native Batch Payments

Execute multi-recipient payouts in a single transaction:
- No external contracts
- No multisend tools
- No repeated approvals
- Gas-efficient on Mantle's low-fee network

### 3. 🔄 Automated Recurring Payments ("Intents")

Powered by `MpIntentRegistry` and Chainlink Automation:

- **Payroll automation**: Set once, payments execute on schedule
- **Subscription management**: Never miss a payment
- **DCA strategies**: Scheduled transfers for dollar-cost averaging

Intents continue executing until completion—no manual intervention required.

### 4. ⛽ Gasless Transactions (Paymaster)

Sponsored gas means:
- Users don't need MNT for gas
- Seamless onboarding for new users
- Frictionless payment experience

### 5. 📊 Compliance-Ready Metadata

Every transaction can include jurisdiction-aware metadata:

```typescript
ComplianceMetadata {
  jurisdiction: "US-CA"       // Where recipient is located
  taxCategory: "W2"           // Employment type (W2, 1099, CONTRACTOR, BONUS)
  periodId: "2025-01"         // Payroll period
  entityId: "employee@co.com" // Recipient identifier
}
```

**Enables:**
- Categorized payment dashboards
- One-click CSV exports for accountants
- Per-jurisdiction reporting (US, UK, EU)
- Audit-ready transaction history

### 6. 🔍 Enhanced Transaction History

Powered by [Envio](https://envio.dev/) indexer:
- All wallet actions indexed and searchable
- Intent execution tracking
- Batch transfer breakdowns
- Human-readable transaction descriptions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MantlePay Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌──────────────────┐    │
│  │  Next.js App  │───▶│   AI (NLP)    │───▶│   Smart Wallet   │    │
│  │   (Frontend)  │    │ Intent Parser │    │   (ERC-4337)     │    │
│  └───────────────┘    └───────────────┘    └────────┬─────────┘    │
│                                                      │              │
│                                                      ▼              │
│  ┌───────────────┐    ┌───────────────┐    ┌──────────────────┐    │
│  │ Envio Indexer │◀───│    Mantle     │◀───│ Intent Registry  │    │
│  │   (GraphQL)   │    │   Network     │    │ + Chainlink Auto │    │
│  └───────────────┘    └───────────────┘    └──────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| `MpSmartWallet.sol` | ERC-4337 compliant account with batch execution, compliance metadata, and intent support |
| `MpIntentRegistry.sol` | Central registry for automated payment intents with Chainlink Automation integration |
| `MpSmartWalletFactory.sol` | Deterministic deployment of smart wallet accounts |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: Tailwind CSS + Shadcn UI
- **State**: TanStack Query
- **AI/NLP**: Vercel AI SDK
- **Auth**: [Privy](https://privy.io/) (Embedded Wallets)

### Smart Contracts
- **Language**: Solidity (Foundry)
- **Account Abstraction**: [Permissionless.js](https://docs.pimlico.io/permissionless) + Pimlico
- **Automation**: Chainlink Automation
- **Library**: [Viem](https://viem.sh/)

### Infrastructure
- **Indexing**: [Envio](https://envio.dev/)
- **Network**: [Mantle](https://mantle.xyz/)

---

## 📂 Project Structure

```
.
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── app/                # App router pages
│       ├── components/         # React components
│       │   ├── chat/           # AI chat interface
│       │   ├── home/           # Landing page sections
│       │   └── wallet/         # Wallet dashboard
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Utilities and configurations
│       └── db/                 # Database schema (Drizzle)
│
├── packages/
│   ├── contracts/              # Solidity smart contracts (Foundry)
│   │   ├── src/                # Contract source files
│   │   ├── script/             # Deployment scripts
│   │   └── abi/                # Generated ABIs
│   │
│   └── indexer/                # Envio GraphQL indexer
│       ├── src/                # Event handlers
│       └── config.yaml         # Indexer configuration
│
└── docs/                       # Documentation
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js v18+
- pnpm v8+
- Foundry (for contracts)
- Docker (for indexer)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/stoneybro/MantlePay.git
cd MantlePay
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```bash
# Copy example env files
cp apps/web/.env.example apps/web/.env.local
cp packages/indexer/.env.example packages/indexer/.env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID |
| `PIMLICO_API_KEY` | Pimlico bundler API key |
| `OPENAI_API_KEY` | OpenAI API key for NLP |
| `DATABASE_URL` | PostgreSQL connection string |

### Running Locally

**Start the web application:**

```bash
pnpm dev
# or specifically
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000)

**Run the indexer (requires Docker):**

```bash
cd packages/indexer
pnpm dev
```

GraphQL playground at [http://localhost:8080](http://localhost:8080)

**Run contract tests:**

```bash
pnpm contracts:test
```

---

## 📜 Contract Details

### MpIntentRegistry

The backbone of the recurring payment system:

```solidity
struct Intent {
    bytes32 id;
    address wallet;
    address token;               // address(0) for native MNT
    string name;
    address[] recipients;
    uint256[] amounts;
    uint256 interval;            // Seconds between executions
    uint256 transactionCount;
    uint256 totalTransactionCount;
    bool active;
    ComplianceMetadata compliance;
}
```

**Key Features:**
- Multi-recipient payment schedules
- Chainlink Automation integration for trustless execution
- Fund commitment tracking to prevent double-spending
- Compliance metadata for jurisdiction-aware payments

### MpSmartWallet

ERC-4337 compliant smart account:

**Execution Methods:**
- `execute()` — Single call
- `executeBatch()` — Multiple calls in one tx
- `executeWithCompliance()` — With compliance metadata
- `executeBatchIntentTransfer()` — Registry-triggered batch payments

**Security Features:**
- Only owner or EntryPoint can execute
- Reentrancy protection
- Commitment tracking for intent funds

---

## 🎯 Use Cases

### 1. Crypto Payroll for Remote Teams

```
"Set up monthly payroll:
 - Alice and Bob: $6000 each, W-2, California
 - Charlie: £4000, contractor, UK
 Run for 12 months starting February 1st"
```

### 2. DAO Treasury Operations

```
"Distribute 100,000 MNT to grant recipients:
 - 40% to Protocol Development
 - 35% to Community Growth
 - 25% to Security Audits"
```

### 3. Investor Vesting

```
"Release 10,000 MNT to investor wallet every month for 24 months"
```

### 4. Subscription Payments

```
"Pay 500 MNT to hosting provider on the 1st of every month"
```

---

## 🌟 Why Mantle?

| Benefit | Impact |
|---------|--------|
| **Ultra-low fees** | Batch payments to 10 recipients cost ~$0.05 |
| **Fast finality** | Transactions confirm in seconds |
| **Native MNT** | No wrapped tokens, direct native transfers |
| **EVM compatible** | Standard Solidity, familiar tooling |

---

## 🔐 Security Considerations

- **Non-custodial**: Users maintain full control of their smart accounts
- **Audited patterns**: Built on OpenZeppelin and account-abstraction standards
- **Decentralized automation**: Chainlink ensures trustless execution
- **Fund commitments**: Intent funds are locked until execution

---

## 🗺️ Roadmap

- [x] Core smart wallet contracts
- [x] Intent registry with Chainlink Automation
- [x] AI-powered payment parsing
- [x] Batch and recurring payments
- [x] Transaction history indexing
- [ ] Payroll compliance dashboard
- [ ] CSV export for accountants
- [ ] Multi-signature support
- [ ] Invoice management
- [ ] Mobile app

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- Website: [mantlepay.xyz](https://mantlepay.xyz)
- Documentation: Coming soon
- Twitter: [@MantlePay](https://twitter.com/mantlepay)

---

Built with ❤️ for the Mantle ecosystem.