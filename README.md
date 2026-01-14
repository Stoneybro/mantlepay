# MantlePay

> **Compliance-ready payment infrastructure for global businesses on-chain.**

MantlePay is a jurisdiction-aware smart wallet platform that transforms how businesses handle crypto payments. Using AI-powered natural language processing and ERC-4337 account abstraction, it enables automated payroll, contractor payments, vendor invoices, and subscriptions with built-in compliance metadata—all executed automatically on Mantle Network.

[![Built on Mantle](https://img.shields.io/badge/Built%20on-Mantle-blue)](https://mantle.xyz)
[![ERC-4337](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-green)](https://eips.ethereum.org/EIPS/eip-4337)
[![Chainlink Automation](https://img.shields.io/badge/Chainlink-Automation-blue)](https://chain.link/automation)

---

## 🎯 The Problem: Compliance Complexity

Crypto payments for businesses face a fundamental challenge: **there's no native way to track jurisdiction, tax categories, or audit metadata on-chain.**

### Current State of Crypto Business Payments

| Pain Point | Impact |
|------------|--------|
| **No compliance metadata** | W2 salaries, 1099 contractors, and international payments look identical on-chain |
| **No jurisdiction tracking** | US-CA vs UK vs EU-DE payments are indistinguishable in block explorers |
| **Manual categorization hell** | Export transactions → manually tag each one → reconcile in spreadsheets |
| **No audit trail** | "Prove you paid Alice $5000 in Q3 as a W2 employee in California" = hours of forensic work |
| **Clunky multi-step UX** | Multiple approvals, gas token management, and technical knowledge required |

### Why Existing Solutions Fall Short

| Tool | Compliance Support | Automation | Multi-Jurisdiction |
|------|-------------------|------------|-------------------|
| MetaMask | ❌ None | ❌ Manual only | ❌ No tracking |
| Gnosis Safe | ❌ None | ❌ Manual execution | ❌ No metadata |
| Request Network | ⚠️ Invoicing only | ⚠️ Limited | ⚠️ Client-side only |
| Sablier | ❌ Streaming only | ✅ Automated | ❌ No compliance |
| Traditional Payroll (Gusto, Deel) | ✅ Full compliance | ✅ Automated | ✅ Multi-jurisdiction |
| **MantlePay** | ✅ **Native on-chain compliance with jurisdiction metadata** | ✅ **Chainlink-powered automation** | ✅ **Built-in multi-jurisdiction support** |

---

## 💡 The Solution: Compliance as a First-Class Primitive

MantlePay makes **compliance metadata a native part of every on-chain payment** by combining three key technologies:

### 1. 🗣️ AI-Powered Intent Resolution
Natural language commands → executable on-chain transactions with compliance data

```
"Pay my California W2 employees Alice and Bob $6,000 each biweekly starting February 1st"

MantlePay extracts:
- Recipients: Alice (0x...), Bob (0x...)
- Amounts: $6,000 each
- Frequency: Biweekly (1,209,600 seconds)
- Duration: Ongoing until cancelled
- Jurisdiction: US-CA
- Tax Category: PAYROLL_W2
- Period: Auto-generated (2025-02-01, 2025-02-15, etc.)
```

### 2. 🏗️ ERC-4337 Smart Accounts with Compliance Metadata
Every payment includes structured compliance data stored on-chain

```solidity
struct ComplianceMetadata {
    string[] entityIds;      // ["EMP-001", "EMP-002"] - employee/vendor IDs
    string jurisdiction;     // "US-CA", "UK", "EU-DE", "NG"
    string category;         // "PAYROLL_W2", "CONTRACTOR", "INVOICE", "VENDOR"
    string referenceId;      // "2025-01", "INV-12345", "PO-789"
}
```

### 3. ⚡ Chainlink Automation for Trustless Execution
Decentralized network executes scheduled payments with compliance preservation

---

## 🚀 Key Features

### 1. Universal Compliance Metadata Schema

MantlePay supports a **taxonomy of business payment types** with jurisdiction awareness:

**Tax Categories:**
- `PAYROLL_W2` - US W2 employees
- `PAYROLL_1099` - US 1099 contractors
- `CONTRACTOR` - International contractors
- `BONUS` - Performance bonuses
- `INVOICE` - Vendor invoices
- `VENDOR` - Recurring vendor payments
- `GRANT` - Grants and disbursements
- `SUBSCRIPTION` - Service subscriptions

**Jurisdiction Codes:**
- US States: `US-CA`, `US-NY`, `US-TX`
- International: `UK`, `EU-DE`, `EU-FR`, `NG`, etc.

**Additional Metadata:**
- `entityIds[]` - Per-recipient identifiers (employee numbers, vendor codes)
- `referenceId` - Links to payroll periods, invoice numbers, PO numbers
- `periodId` - Time period tracking (2025-01, 2025-Q1)

### 2. Conversational Payment Definition

Define complex payment workflows using natural language:

**Examples:**
```
# Multi-jurisdiction payroll
"Pay monthly: Alice $6k W2 California, Bob £4k contractor UK, Charlie ₦800k contractor Nigeria"

# Quarterly 1099 payments
"Pay 1099 contractors $15,000 each quarterly for 2025, label as Q1/Q2/Q3/Q4"

# Invoice batch processing
"Process vendor invoices: UK hosting £500, Nigerian design ₦200k, German legal €2000"

# Subscription management
"Pay $500 to our SaaS provider monthly, categorize as subscription"
```

### 3. Native Batch Payments with Per-Recipient Compliance

Execute multi-recipient payouts in a single transaction with individual compliance tagging:

```typescript
// Each recipient gets their own compliance metadata
executeBatchWithCompliance([
  { to: alice, amount: "6000", entityId: "EMP-001", jurisdiction: "US-CA", category: "W2" },
  { to: bob, amount: "4000", entityId: "CTR-001", jurisdiction: "UK", category: "CONTRACTOR" },
  { to: charlie, amount: "800000", entityId: "CTR-002", jurisdiction: "NG", category: "CONTRACTOR" }
])
```

- No external multisend contracts required
- Single gas-efficient transaction on Mantle
- Each transfer preserves individual compliance data
- Immutable on-chain audit trail

### 4. Automated Recurring Payments with Compliance Preservation

Powered by `MpIntentRegistry` and Chainlink Automation:

```solidity
function createIntent(
    address token,
    string memory name,
    address[] memory recipients,
    uint256[] memory amounts,
    uint256 interval,
    uint256 duration,
    ComplianceMetadata memory compliance  // Preserved across ALL executions
) external returns (bytes32 intentId)
```

**Key Features:**
- Compliance metadata stored once, applied to every execution
- Jurisdiction and category tracking across entire payment schedule
- Automatic period ID generation for each execution
- Failed payment tracking for recovery
- Cancellation with proper fund release and metadata preservation

### 5. Real-Time Compliance Dashboard

**Jurisdiction View:**
- Filter by region: US-CA, UK, EU-DE, NG, etc.
- See total payments per jurisdiction
- Track jurisdiction-specific compliance requirements

**Category View:**
- Filter by tax type: W2, 1099, Contractor, Invoice, etc.
- Aggregate spending per category
- Prepare category-specific tax reports

**Period View:**
- Filter by time: Monthly, Quarterly, Annually
- Generate period-specific reports
- Track spending trends over time

**Export Capabilities:**
- One-click CSV export for accountants
- Jurisdiction-filtered exports (e.g., "All US-CA W2 payments in Q1 2025")
- Category-filtered exports (e.g., "All 1099 payments in 2025")
- Custom date range exports

### 6. Gasless Transactions via Paymaster

All transactions sponsored by MantlePay paymaster:
- Users don't need MNT for gas
- Seamless onboarding for non-crypto teams
- Business pays gas fees in bulk
- Frictionless payment experience

---

## 🏗️ Architecture Deep Dive

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MantlePay Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌──────────────────┐    │
│  │  Next.js App  │───▶│ AI NLP Parser │───▶│ Smart Wallet     │    │
│  │  (Frontend)   │    │ (Gemini 2.0)  │    │ (ERC-4337)       │    │
│  └───────────────┘    └───────────────┘    └────────┬─────────┘    │
│                                                      │              │
│                    Extracts:                         │              │
│                    - Recipients                      ▼              │
│                    - Amounts                ┌──────────────────┐    │
│                    - Jurisdiction           │ Compliance Data  │    │
│                    - Category               │ (On-Chain)       │    │
│                    - Frequency              └────────┬─────────┘    │
│                    - Duration                        │              │
│                                                      ▼              │
│  ┌───────────────┐    ┌───────────────┐    ┌──────────────────┐    │
│  │ Envio Indexer │◀───│ Mantle Network│◀───│ Intent Registry  │    │
│  │  (GraphQL)    │    │ (Testnet)     │    │ + Chainlink      │    │
│  └───────────────┘    └───────────────┘    └──────────────────┘    │
│         │                                                           │
│         ▼                                                           │
│  ┌───────────────┐                                                  │
│  │  Dashboard    │ ← Compliance-filtered views                      │
│  │  + CSV Export │                                                  │
│  └───────────────┘                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Smart Contract Layer

#### 1. **MpSmartWallet.sol** - ERC-4337 Compliant Account

The core smart account implementing ERC-4337 with compliance extensions:

**Key Functions:**
```solidity
// Single execution with compliance
function executeWithCompliance(
    address target,
    uint256 value,
    bytes calldata data,
    ComplianceMetadata calldata compliance
) external payable

// Batch execution with compliance
function executeBatchWithCompliance(
    Call[] calldata calls,
    ComplianceMetadata calldata compliance
) external payable

// Intent-triggered batch transfer (called by registry)
function executeBatchIntentTransfer(
    address token,
    address[] calldata recipients,
    uint256[] calldata amounts,
    bytes32 intentId,
    uint256 transactionCount,
    bool revertOnFailure,
    ComplianceMetadata calldata compliance
) external returns (uint256 failedAmount)
```

**Commitment Tracking:**
```solidity
// Prevents double-spending of funds locked in intents
mapping(address => uint256) public s_committedFunds;

function increaseCommitment(address token, uint256 amount) external onlyRegistry
function decreaseCommitment(address token, uint256 amount) external onlyRegistry
function getAvailableBalance(address token) external view returns (uint256)
```

**Security Features:**
- Reentrancy protection on all payment functions
- Commitment checks prevent spending locked funds
- Only owner or EntryPoint can execute
- Intent registry has isolated permissions

#### 2. **MpIntentRegistry.sol** - Decentralized Payment Scheduler

Central registry managing all automated payment intents with Chainlink integration:

**Intent Structure:**
```solidity
struct Intent {
    bytes32 id;                          // Unique identifier
    address wallet;                       // Owner wallet
    address token;                        // Payment token (address(0) for MNT)
    string name;                          // Human-readable name
    address[] recipients;                 // Payment recipients
    uint256[] amounts;                    // Per-recipient amounts
    uint256 interval;                     // Seconds between payments
    uint256 duration;                     // Total duration in seconds
    uint256 transactionCount;             // Current execution count
    uint256 totalTransactionCount;        // Total planned executions
    uint256 transactionStartTime;         // Start timestamp
    uint256 transactionEndTime;           // End timestamp
    uint256 latestTransactionTime;        // Last execution timestamp
    bool active;                          // Active status
    bool revertOnFailure;                 // Atomic vs skip mode
    uint256 failedAmount;                 // Accumulated failed transfers
    ComplianceMetadata compliance;        // Compliance data
}
```

**Chainlink Automation Integration:**
```solidity
// Called by Chainlink nodes to check if any intent needs execution
function checkUpkeep(bytes calldata)
    external view
    returns (bool upkeepNeeded, bytes memory performData)

// Called by Chainlink when upkeep is needed
function performUpkeep(bytes calldata performData) external

// Internal logic to determine execution readiness
function shouldExecuteIntent(Intent storage intent)
    internal view
    returns (bool)
```

**Intent Lifecycle:**
1. **Creation** - `createIntent()` locks funds, stores compliance data
2. **Execution** - Chainlink calls `performUpkeep()` → triggers wallet transfer
3. **Tracking** - Each execution decrements commitment, preserves compliance
4. **Completion** - Auto-deactivates when `transactionCount >= totalTransactionCount`
5. **Cancellation** - `cancelIntent()` releases remaining funds, clears failed amounts

**Compliance Preservation:**
- Compliance metadata stored once at intent creation
- Applied to every execution automatically
- Indexed by Envio for dashboard filtering
- Exported in CSV with jurisdiction/category columns

#### 3. **MpSmartWalletFactory.sol** - Deterministic Account Deployment

Factory for creating ERC-1167 minimal proxy clones:

```solidity
function createSmartAccount(address owner)
    public
    returns (address account)
{
    bytes32 salt = keccak256(abi.encodePacked(owner));
    address predicted = Clones.predictDeterministicAddress(
        implementation,
        salt,
        address(this)
    );
    
    // Return existing if already deployed
    if (predicted.code.length != 0) return predicted;
    
    // Deploy new clone
    account = Clones.cloneDeterministic(implementation, salt);
    MpSmartWallet(payable(account)).initialize(owner);
    
    userClones[owner] = account;
    emit AccountCreated(account, owner);
}
```

**Benefits:**
- Deterministic addresses (one wallet per owner address)
- Gas-efficient clones (~$0.10 deployment on Mantle)
- Compatible with ERC-4337 initCode
- Factory-based recovery mechanism

---

### Frontend Layer

#### AI Intent Parser

**Technology:** Google Gemini 2.5 Flash Lite via Vercel AI SDK

**System Prompt Design:**
The AI is trained to extract structured payment data from natural language:

```typescript
// Input: "Pay California W2 employees Alice and Bob $5000 monthly for 6 months"

// Extracted:
{
  recipients: ["0xAlice...", "0xBob..."],
  amounts: ["5000", "5000"],
  interval: 2592000, // 30 days in seconds
  duration: 15552000, // 6 months in seconds
  compliance: {
    jurisdiction: "US-CA",
    category: "PAYROLL_W2",
    entityIds: ["EMP-001", "EMP-002"],
    referenceId: "2025-01" // Auto-generated period
  }
}
```

**Key Features:**
- Validates all parameters before tool execution
- Asks for missing data incrementally (never overwhelms user)
- Supports contacts (saved recipient names)
- Detects jurisdiction from context ("California" → "US-CA")
- Infers category from keywords ("W2", "contractor", "invoice")
- Never fabricates data or uses defaults

**Tool Architecture:**
```typescript
tools: {
  execute_single_mp_token_transfer: { /* Single payment */ },
  execute_batch_mp_token_transfer: { /* Multi-recipient */ },
  execute_recurring_mp_token_payment: { /* Scheduled payments */ }
}
```

#### Contact Management System

**Schema:**
```typescript
type Contact = {
  id: string;
  userId: string;           // Wallet address
  name: string;             // "Alice", "Engineering Team"
  type: 'individual' | 'group';
  addresses: Array<{
    id: string;
    address: string;
    label?: string;
  }>;
}
```

**Integration with AI:**
When user says "pay Alice", AI checks contacts first before asking for address:

```typescript
// Contact resolution in system prompt
if (name in contacts) {
  use contacts[name].addresses
} else {
  ask "What's Alice's wallet address?"
}
```

#### Dashboard & Reporting

**Real-Time Aggregation:**
```graphql
query WalletActivity($walletId: String!) {
  Wallet(where: { id: { _eq: $walletId } }) {
    transactions(
      order_by: { timestamp: desc }
      where: { 
        transactionType: { _in: [INTENT_CREATED, INTENT_EXECUTION] }
      }
    ) {
      details # JSON string with compliance data
    }
  }
}
```

**Client-Side Filtering:**
```typescript
// Filter by jurisdiction
const caPayments = transactions.filter(tx => 
  tx.details.compliance?.jurisdiction === "US-CA"
);

// Filter by category
const w2Payments = transactions.filter(tx =>
  tx.details.compliance?.category === "PAYROLL_W2"
);

// Generate CSV
const csv = transactions.map(tx => [
  tx.timestamp,
  tx.details.scheduleName,
  tx.details.totalAmount,
  tx.details.compliance?.jurisdiction,
  tx.details.compliance?.category
]).join('\n');
```

---

### Indexer Layer (Envio)

**Event Handlers:**

The indexer transforms raw events into queryable transaction history:

```typescript
// MpIntentRegistry.IntentCreated
MpIntentRegistry.IntentCreated.handler(async ({ event, context }) => {
  // Extract compliance tuple from event
  const compliance = {
    entityIds: event.params.compliance[0],
    jurisdiction: event.params.compliance[1],
    category: event.params.compliance[2],
    referenceId: event.params.compliance[3]
  };

  // Store Intent entity for future execution correlation
  context.Intent.set({
    id: event.params.intentId,
    compliance: compliance,
    // ... other fields
  });

  // Create Transaction entity
  context.Transaction.set({
    id: event.transaction.hash,
    wallet_id: event.params.wallet,
    transactionType: "INTENT_CREATED",
    details: JSON.stringify({
      scheduleName: event.params.name,
      compliance: compliance,
      // ... other fields
    })
  });
});

// MpIntentRegistry.IntentExecuted
MpIntentRegistry.IntentExecuted.handler(async ({ event, context }) => {
  // Lookup original intent to get compliance data
  const intent = await context.Intent.get(event.params.intentId);

  // Create execution transaction with preserved compliance
  context.Transaction.set({
    transactionType: "INTENT_EXECUTION",
    details: JSON.stringify({
      scheduleName: event.params.name,
      executionNumber: event.params.transactionCount,
      compliance: intent.compliance, // Compliance preserved!
      // ... other fields
    })
  });
});
```

**Schema Design:**

```graphql
type Transaction {
  id: ID!
  wallet_id: String!
  transactionType: TransactionType!
  
  # Complete transaction details as JSON
  # Includes compliance data for filtering
  details: String!
}

type Intent {
  # Helper entity for correlation
  id: ID!
  compliance: ComplianceMetadata
}
```

**Why JSON Details?**
- Flexible schema (can add fields without migration)
- Client-side filtering is fast with modern browsers
- Preserves exact structure from contracts
- Easy CSV export generation

---

## 🎯 Use Cases & Examples

### Use Case 1: Multi-Jurisdiction Payroll

**Scenario:** Global startup with team across US, UK, and Nigeria

**Input:**
```
"Run monthly payroll for 12 months starting February 1st:
 - Alice $6000 W2 California
 - Bob £4000 contractor UK  
 - Charlie ₦800,000 contractor Nigeria"
```

**Execution:**
1. AI extracts 3 recipients with individual compliance data
2. Creates intent with compliance array:
   ```typescript
   {
     recipients: [alice, bob, charlie],
     amounts: ["6000", "4000", "800000"],
     compliance: {
       entityIds: ["EMP-001", "CTR-001", "CTR-002"],
       jurisdiction: "US-CA", // Applied to Alice
       category: "PAYROLL_W2"
     }
     // Bob and Charlie get their own jurisdiction/category via per-recipient tracking
   }
   ```
3. Chainlink executes monthly for 12 months
4. Each execution preserves jurisdiction/category
5. Dashboard shows:
   - US-CA: $72,000 (W2)
   - UK: £48,000 (Contractor)
   - NG: ₦9,600,000 (Contractor)

**Export:**
```csv
Date,Name,Amount,Currency,Jurisdiction,Category,Entity
2025-02-01,Alice,6000,USD,US-CA,PAYROLL_W2,EMP-001
2025-02-01,Bob,4000,GBP,UK,CONTRACTOR,CTR-001
2025-02-01,Charlie,800000,NGN,NG,CONTRACTOR,CTR-002
...
```

### Use Case 2: Quarterly 1099 Contractor Payments

**Scenario:** Software company with 10 US-based 1099 contractors

**Input:**
```
"Pay 10 contractors $15,000 each quarterly for 2025:
 - Mark, Sarah, Tom (California)
 - Lisa, John (New York)
 - Others (Texas)
 
Label as 1099 payments with quarterly periods"
```

**Execution:**
1. Creates 4 intents (Q1, Q2, Q3, Q4) with:
   ```typescript
   {
     category: "PAYROLL_1099",
     jurisdiction: "US-CA" | "US-NY" | "US-TX",
     referenceId: "2025-Q1" | "2025-Q2" | "2025-Q3" | "2025-Q4",
     entityIds: ["CTR-001", "CTR-002", ...]
   }
   ```
2. Executes automatically each quarter
3. Dashboard aggregates:
   - Total 1099: $600,000 (10 contractors × $15k × 4 quarters)
   - By state: CA $180k, NY $120k, TX $300k

**Tax Season:**
- Filter: `category=PAYROLL_1099 AND year=2025`
- Export → CSV with contractor IDs and state codes
- Hand to accountant → Ready for 1099 form generation

### Use Case 3: Invoice & Vendor Management

**Scenario:** Agency managing multiple international vendors

**Input:**
```
"Process monthly vendor payments:
 - UK hosting provider £500 (invoice INV-2025-001)
 - Nigerian design agency ₦200,000 (invoice INV-2025-002)  
 - German legal services €2000 (PO-2025-003)"
```

**Execution:**
1. Creates 3 separate recurring intents:
   ```typescript
   [
     { category: "INVOICE", jurisdiction: "UK", referenceId: "INV-2025-001" },
     { category: "INVOICE", jurisdiction: "NG", referenceId: "INV-2025-002" },
     { category: "VENDOR", jurisdiction: "EU-DE", referenceId: "PO-2025-003" }
   ]
   ```
2. Executes monthly automatically
3. Dashboard tracks:
   - Invoices vs recurring vendors
   - Spending by jurisdiction
   - Reference ID correlation

**Audit Time:**
- Filter: `referenceId=INV-2025-001`
- See entire payment history for that invoice
- Immutable on-chain proof of payment
- Export with jurisdiction for international accounting

---

## 🛠️ Tech Stack

### Smart Contracts
- **Language:** Solidity 0.8.28
- **Framework:** Foundry
- **Standards:** ERC-4337 (Account Abstraction), ERC-1167 (Minimal Proxies)
- **Dependencies:**
  - OpenZeppelin Contracts v5.5.0
  - Account Abstraction v0.9.0
  - Chainlink Brownie Contracts v1.3.0

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + Shadcn UI
- **State Management:** TanStack Query v5
- **AI/NLP:** Vercel AI SDK + Google Gemini 2.5 Flash Lite
- **Auth:** Privy v3 (Embedded Wallets)
- **Web3:** Viem v2 + Permissionless.js v0.2

### Infrastructure
- **Network:** Mantle Sepolia Testnet (Chain ID 5003)
- **Bundler:** Pimlico (ERC-4337 bundler + paymaster)
- **Automation:** Chainlink Automation
- **Indexing:** Envio HyperIndex (GraphQL)
- **Database:** Neon Postgres + Drizzle ORM

---

## 📂 Project Structure

```
mantlepay/
├── apps/
│   └── web/                          # Next.js frontend
│       ├── app/
│       │   ├── (protected)/          # Auth-gated routes
│       │   │   ├── deploy/           # Wallet activation
│       │   │   └── wallet/           # Main dashboard
│       │   ├── api/
│       │   │   ├── chat/             # AI endpoint
│       │   │   ├── chats/            # Chat history
│       │   │   └── contacts/         # Contact CRUD
│       │   └── login/                # Auth page
│       ├── components/
│       │   ├── chat/                 # AI chat interface
│       │   │   ├── chat.tsx          # Main chat component
│       │   │   ├── ChatInput.tsx
│       │   │   ├── ChatMessages.tsx
│       │   │   ├── ToolRenderer.tsx  # Displays payment UIs
│       │   │   └── tools/            # Individual payment tools
│       │   ├── dashboard/            # Analytics & reporting
│       │   │   ├── ComplianceSummary.tsx  # Jurisdiction view
│       │   │   ├── PayrollDashboard.tsx   # Compliance dashboard
│       │   │   └── PaymentTable.tsx       # Active intents
│       │   ├── contacts/             # Contact management
│       │   └── wallet/               # Wallet UI components
│       ├── hooks/
│       │   ├── payments/             # Payment execution hooks
│       │   │   ├── types.ts          # ComplianceMetadata types
│       │   │   ├── useSingleTransfer.ts
│       │   │   ├── useBatchTransfer.ts
│       │   │   └── useRecurringPayment.ts
│       │   ├── useContacts.ts
│       │   └── useWalletHistory.ts   # GraphQL queries
│       ├── lib/
│       │   ├── abi/                  # Contract ABIs
│       │   ├── chat-store.ts         # Chat persistence
│       │   ├── contact-store.ts      # Contact persistence
│       │   ├── customSmartAccount.ts # ERC-4337 account impl
│       │   ├── smartAccountClient.ts # Permissionless client
│       │   └── envio/
│       │       └── client.ts         # GraphQL client
│       └── db/
│           ├── schema.ts             # Drizzle schema
│           └── migrations/
│
├── packages/
│   ├── contracts/                    # Foundry workspace
│   │   ├── src/
│   │   │   ├── MpSmartWallet.sol           # ERC-4337 account
│   │   │   ├── MpIntentRegistry.sol        # Payment scheduler
│   │   │   ├── MpSmartWalletFactory.sol    # Clone factory
│   │   │   └── IMpSmartWallet.sol          # Interface
│   │   ├── script/                   # Deployment scripts
│   │   ├── test/                     # Foundry tests
│   │   └── abi/                      # Generated ABIs
│   │
│   └── indexer/                      # Envio indexer
│       ├── config.yaml               # Contract config
│       ├── schema.graphql            # GraphQL schema
│       └── src/
│           └── EventHandlers.ts      # Event processing logic
│
└── docs/                             # Documentation
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
git clone https://github.com/Stoneybro/MantlePay.git
cd MantlePay
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```bash
# Web app
cp apps/web/.env.example apps/web/.env.local

# Indexer
cp packages/indexer/.env.example packages/indexer/.env
```

**Required variables:**

```env
# apps/web/.env.local
NEXT_PUBLIC_PRIVY_APP_ID=           # Privy app ID
PIMLICO_API_KEY=                     # Pimlico bundler key
NEXT_PUBLIC_PIMPLICO_SPONSOR_ID=     # Paymaster policy ID
OPENAI_API_KEY=                      # For AI (or use Gemini)
DATABASE_URL=                        # Postgres connection string

# packages/indexer/.env
ENVIO_API_TOKEN=                     # Envio API token
```

### Running Locally

**1. Start the web application:**

```bash
pnpm dev
# or
pnpm --filter web dev
```

Visit [http://localhost:3000](http://localhost:3000)

**2. Run the indexer (requires Docker):**

```bash
cd packages/indexer
pnpm dev
```

GraphQL playground at [http://localhost:8080](http://localhost:8080)

**3. Run contract tests:**

```bash
pnpm contracts:test
```

---

## 📜 Contract Deployment

### Deployed Addresses (Mantle Sepolia)

```
MpIntentRegistry:        0x6A0C73162c20Bc56212D643112c339f654C45198
MpSmartWalletFactory:    0x43e0BC90661dAF20C6fFbae1079d6E07E88
e403A
MpSmartWallet (impl):    0x6c6b5c86752D8B5330Cb055A967E2f6253D09195
```

### Deployment Steps

```bash
cd packages/contracts

# 1. Deploy Intent Registry
forge script script/DeployMpIntentRegistry.s.sol:DeployMpIntentRegistry \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast

# 2. Deploy Wallet Implementation
forge script script/DeployMpSmartWalletImplementation.s.sol:DeployMpSmartWalletImplementation \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast

# 3. Deploy Factory
forge script script/DeployMpSmartWalletFactory.s.sol:DeployMpSmartWalletFactory \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## 🔐 Security Considerations

### Smart Contract Security

- **Reentrancy Protection:** All payment functions use OpenZeppelin's `ReentrancyGuard`
- **Commitment Tracking:** Prevents double-spending of funds locked in intents
- **Access Control:**
  - Only owner or EntryPoint can execute transactions
  - Only registry can modify commitments
  - Factory-based deterministic deployment
- **Signature Validation:** EIP-191 + EIP-1271 support for off-chain tooling
- **Fund Safety:**
  - Failed transfers tracked separately
  - Cancellation releases remaining funds
  - Available balance checks prevent overcommitment

### User Security

- **Non-Custodial:** Users maintain full control via Privy embedded wallets
- **Audited Patterns:** Built on OpenZeppelin and account-abstraction standards
- **Decentralized Automation:** Chainlink ensures trustless execution
- **Immutable Records:** All compliance data stored on-chain permanently

---

## 🗺️ Roadmap

### ✅ Completed (Hackathon MVP)
- [x] ERC-4337 smart wallet with compliance metadata
- [x] Intent registry with Chainlink Automation
- [x] AI-powered payment parsing
- [x] Multi-recipient batch payments
- [x] Recurring payment schedules
- [x] Transaction history indexing
- [x] Basic compliance dashboard
- [x] Contact management system

### 🚧 In Progress
- [ ] Enhanced compliance dashboard with advanced filtering
- [ ] One-click CSV exports for accountants
- [ ] Multi-jurisdiction tax report templates
- [ ] Payroll calendar view
- [ ] Failed payment recovery UI

### 🔮 Future Plans
- [ ] Multi-signature approval workflows
- [ ] Invoice management integration
- [ ] PDF tax form generation (1099, W2)
- [ ] Fiat on/off-ramps
- [ ] Mobile app (React Native)
- [ ] Multi-chain support (Arbitrum, Optimism)
- [ ] QuickBooks/Xero integration
- [ ] Accountant role with read-only access

---

## 🤝 Contributing

We welcome contributions! This is an open-source project built for the Mantle Global Hackathon 2025.

**Areas for Contribution:**
- Additional jurisdiction support
- Tax category expansion
- UI/UX improvements
- Documentation
- Testing

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Live Demo:** [mantlepay.vercel.app](https://mantlepay.vercel.app) *(coming soon)*
- **Documentation:** [docs.mantlepay.xyz](https://docs.mantlepay.xyz) *(coming soon)*
- **Twitter:** [@MantlePay](https://twitter.com/mantlepay) *(coming soon)*
- **Mantle Network:** [mantle.xyz](https://mantle.xyz)
- **Hackathon:** [Mantle Global Hackathon 2025](https://dorahacks.io/hackathon/mantle-2025)

---

## 🏆 Built For

**Mantle Global Hackathon 2025** - RWA/RealFi Track

MantlePay demonstrates how **compliance metadata can become a first-class primitive in Web3 payments**, enabling businesses to operate globally with the same audit-ready infrastructure they expect from traditional finance—but with the transparency, automation, and cost-efficiency of blockchain technology.

---

**Built with ❤️ by [Zion Livingstone](https://github.com/Stoneybro)**