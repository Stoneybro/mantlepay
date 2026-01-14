# Mantle Payment Hub

**Mantle Payment Hub** is an interactive, intent-centric Smart Wallet designed to streamline crypto payments using Natural Language Processing (NLP) and Account Abstraction (ERC-4337).

Built for the **Mantle** ecosystem, it allows users to manage single transfers, batch payments, and recurring schedules simply by chatting with the interface.

---

## 💡 The Idea

Traditional crypto wallets are clunky. Executing complex actions like "pay my team every Friday" or "send 50 MNT to these 3 people" requires multiple clicks, approvals, and technical know-how.

**MantlePay** changes this by combining:
1.  **AI-Powered Intent Resolution**: Converts natural language requests into executable on-chain actions.
2.  **Smart Accounts (ERC-4337)**: Enables batching, gas sponsorship, and programmable logic.
3.  **Automated Intents**: A registry for scheduling recurring payments without manual intervention.

---

## 🚀 Features

### 1. 🗣️ Natural Language Processing
Forget complex forms. Just type what you want to do:
> *"Send 100 MNT to alice.eth"*
> *"Create a recurring payment of 50 MNT to bob.eth every week for 3 months"*
> *"Split 300 MNT equally between Alice, Bob, and Charlie"*

The system parses these intents and constructs the necessary UserOperations for you to sign.

### 2. 🔄 Recurring & Scheduled Payments ("Intents")
Powered by the `MpIntentRegistry` and **Chainlink Automation**, users can define "Intents" — robust, on-chain rules for future transactions.
- **Subscriptions**: Pay for services specifically in MNT.
- **Payrolls**: Automate salary disbursements.
- **DCA**: Scheduled transfers for investment.

### 3. 📦 Batch Transactions
Send tokens to multiple recipients in a single transaction. Thanks to ERC-4337, multiple actions are bundled into one UserOp, saving gas and time.

### 4. ⛽ Gas Sponsorship (Paymaster)
Enjoy a seamless experience with sponsored transactions. Users don't always need native ETH to pay for gas, making onboarding significantly easier.

### 5. 🔍 Enhanced Transaction History
A dedicated indexer (powered by **Envio**) catalogs all interactions—including complex intents and batch transfers—providing a clear, human-readable history of your financial activity.

---

## 🛠 Tech Stack

### Frontend & App
- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: TanStack Query
- **AI/NLP**: Vercel AI SDK (Generative UI)
- **Auth/Embedded Wallets**: [Privy](https://privy.io/)

### Blockchain & Smart Contracts
- **Account Abstraction SDK**: [Permissionless.js](https://docs.pimlico.io/permissionless) (with Pimlico)
- **Library**: [Viem](https://viem.sh/)
- **Contracts**: Solidity (Foundry)
  - `MpSmartWallet.sol`: ERC-4337 compliant account.
  - `MpIntentRegistry.sol`: Logic for managing recurring intents.
  - `MpSmartWalletFactory.sol`: Deterministic deployment of accounts.
- **Automation**: Chainlink Automation (for executing intents).
- **Indexing**: [Envio](https://envio.dev/)

---

## 📂 Project Structure

This is a monorepo managed with `pnpm`.

```bash
.
├── apps
│   └── web            # Next.js Frontend Application
├── packages
│   ├── contracts      # Solidity Smart Contracts (Foundry)
│   └── indexer        # Envio Indexer
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm
- Foundry (for contracts)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/stoneybro/MantlePay.git
   cd mantlepaymenthub
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in `apps/web` and `packages/indexer`.
   - Fill in necessary keys (Privy App ID, Pimlico API Key, MNT Token Address, etc.).

### Running Locally

To start the web application:
```bash
pnpm dev
# or specifically for the web app
pnpm --filter web dev
```

To run contract tests:
```bash
pnpm contracts:test
```

---

## 📜 Contract Architecture

### `MpIntentRegistry.sol`
The backbone of the recurring payment system.
- **Role**: Stores intent parameters (recipient, amount, interval, duration).
- **Automation**: Checks `checkLog` via Chainlink to see if a payment is due.
- **Security**: Ensures wallets have committed funds before effectively creating a liability.

### `MpSmartWallet.sol`
The user's identity on-chain.
- **Functionality**: Executives `UserOps`, supports batch execution, and interacts with the Intent Registry to `register` or `revoke` payment streams.

---

## 📄 License
MIT