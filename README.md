## MVP Transaction History Implementation Plan

### **Tech Stack (Final)**
- **Database**: Vercel Postgres (free tier, 256MB, 60 hours compute/month)
- **Indexer**: Envio (already set up)
- **Backend**: Next.js API routes
- **Frontend**: React with TanStack Query (already in use)
- **Real-time**: Polling every 10s when on transaction page

---

## **Phase 1: Database Setup** 

### 1.1 Install Dependencies
```bash
# In apps/web
pnpm add @vercel/postgres
pnpm add -D drizzle-orm drizzle-kit
```

### 1.2 Database Schema (Simplified for MVP)
```typescript
// apps/web/lib/db/schema.ts

// Minimal schema focusing on what UI needs
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,                    -- chainId_blockNumber_logIndex
  wallet_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  
  -- Transaction Type
  type TEXT NOT NULL,                     -- EXECUTE, BATCH, INTENT_CREATED, etc.
  
  -- Financial Data  
  token TEXT NOT NULL,                    -- address(0) for ETH
  value NUMERIC NOT NULL,
  
  -- Recipients (for display)
  to_address TEXT,                        -- single recipient
  recipient_count INTEGER,                -- for batch/intents
  
  -- Intent specific
  intent_id TEXT,
  intent_name TEXT,
  
  -- Status
  status TEXT DEFAULT 'SUCCESS',          -- SUCCESS, FAILED
  
  -- Indexes
  INDEX idx_wallet_time (wallet_address, timestamp DESC),
  INDEX idx_hash (tx_hash)
);

-- Simplified intents table
CREATE TABLE intents (
  intent_id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  name TEXT,
  token TEXT,
  total_count INTEGER,
  executed_count INTEGER DEFAULT 0,
  status TEXT,                            -- ACTIVE, COMPLETED, CANCELLED
  created_at TIMESTAMP,
  last_executed_at TIMESTAMP
);
```

---

## **Phase 2: Enhanced Envio Indexer** 

### 2.1 Update Envio Schema
```graphql
// packages/indexer/schema.graphql

# Add unified transaction entity
type Transaction {
  id: ID!
  walletAddress: String!
  txHash: String!
  blockNumber: BigInt!
  timestamp: BigInt!
  type: String!
  token: String!
  value: BigInt!
  toAddress: String
  recipientCount: Int
  intentId: String
  intentName: String
  status: String!
}

type Intent {
  id: ID!
  intentId: String!
  walletAddress: String!
  name: String
  token: String!
  totalCount: Int!
  executedCount: Int!
  status: String!
  createdAt: BigInt!
  lastExecutedAt: BigInt
}
```

### 2.2 Event Handlers Strategy
Transform all events into unified `Transaction` entities:

```typescript
// packages/indexer/src/EventHandlers.ts

// Map each event to transaction type:
Executed → SINGLE_ETH or SINGLE_TOKEN
ExecutedBatch → BATCH_ETH or BATCH_TOKEN  
IntentCreated → INTENT_CREATED
IntentBatchTransferExecuted → INTENT_EXECUTED
IntentCancelled → INTENT_CANCELLED
AccountCreated → WALLET_DEPLOYED
```

---

## **Phase 3: Sync Service** 

### 3.1 Envio → Postgres Sync Worker
```typescript
// apps/web/lib/sync/indexer-sync.ts

// Polls Envio GraphQL API every 20s
// Fetches new transactions since last sync
// Inserts into Vercel Postgres
// Keeps local DB in sync with indexer

Key functions:
- fetchLatestTransactions(walletAddress, afterTimestamp)
- syncTransactionsToDb(transactions)
- getLastSyncTimestamp(walletAddress)
```

### 3.2 Trigger Options
On-demand sync 
```typescript
// apps/web/app/api/sync/[walletAddress]/route.ts
// Triggered when user visits transaction page
// Syncs only their wallet
```

---

## **Phase 4: API Routes**

### 4.1 Core Endpoints
```typescript
// apps/web/app/api/transactions/[walletAddress]/route.ts
GET /api/transactions/[walletAddress]
  Query params: 
    - limit (default 20)
    - offset (default 0)
    - type (filter by transaction type)
  
  Returns:
    - transactions[]
    - total count
    - hasMore boolean

// apps/web/app/api/transactions/[walletAddress]/sync/route.ts  
POST /api/transactions/[walletAddress]/sync
  Triggers on-demand sync from Envio
  Returns: { synced: number, latestBlock: number }

// apps/web/app/api/intents/[walletAddress]/route.ts
GET /api/intents/[walletAddress]
  Returns active intents with execution counts
```

---

## **Phase 5: Frontend Components**

### 5.1 Transaction List Component
```typescript
// apps/web/components/wallet/TransactionList.tsx

Features:
- Infinite scroll (TanStack Query useInfiniteQuery)
- Auto-refresh every 10s when mounted
- Loading skeleton (already have Skeleton component)
- Empty state
- Transaction type icons (reuse from your overlay)
- Click to expand for details
```

### 5.2 Transaction Item
```typescript
// apps/web/components/wallet/TransactionItem.tsx

Display:
- Icon based on type
- To/From addresses (with truncation)
- Amount + token symbol
- Timestamp (formatted)
- Status badge
- Link to Blockscout

For intents:
- Show "Payment 3 of 10" 
- Progress indicator
```

### 5.3 Integration into Sidebar
```typescript
// apps/web/components/wallet/app-sidebar.tsx

Replace the empty <SidebarGroupContent> with:
<TransactionList walletAddress={walletAddress} />
```

---

## **Phase 6: Real-time Updates** (30 mins)

### 6.1 Polling Strategy
```typescript
// In TransactionList component
useQuery({
  queryKey: ['transactions', walletAddress],
  queryFn: fetchTransactions,
  refetchInterval: 10000, // 10s when page is visible
  refetchIntervalInBackground: false
})

// Also trigger manual sync on mount
useMutation({
  mutationFn: () => fetch(`/api/transactions/${walletAddress}/sync`, { method: 'POST' })
})
```

---

## **File Structure**

```
apps/web/
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── client.ts          # Vercel Postgres client
│   │   └── migrations/        # SQL migrations
│   └── sync/
│       ├── envio-client.ts    # GraphQL queries to Envio
│       └── indexer-sync.ts    # Sync logic
├── app/
│   └── api/
│       ├── transactions/
│       │   └── [walletAddress]/
│       │       ├── route.ts       # GET transactions
│       │       └── sync/
│       │           └── route.ts   # POST sync
│       └── intents/
│           └── [walletAddress]/
│               └── route.ts       # GET intents
└── components/
    └── wallet/
        ├── TransactionList.tsx
        ├── TransactionItem.tsx
        └── IntentBadge.tsx

packages/indexer/
├── schema.graphql             # Enhanced with Transaction/Intent
└── src/
    └── EventHandlers.ts       # Transform events → unified entities
```

---

## **Implementation Order**

### **Step 1**: Database Setup (you can do this now in Vercel dashboard)
1. Create Vercel Postgres database
2. Run schema migrations
3. Test connection

### **Step 2**: Update Envio Indexer
1. Add Transaction/Intent entities to schema
2. Update event handlers to create unified transactions
3. Redeploy indexer
4. Verify data in Envio dashboard

### **Step 3**: Sync Service
1. Create Envio GraphQL client
2. Build sync logic (Envio → Postgres)
3. Create sync API endpoint
4. Test with your wallet

### **Step 4**: Transaction API
1. Build GET /transactions endpoint
2. Add pagination
3. Test with Postman/curl

### **Step 5**: Frontend
1. Create TransactionList component
2. Create TransactionItem component
3. Integrate into sidebar
4. Add auto-refresh

### **Step 6**: Polish
1. Add loading states
2. Add error handling
3. Test with various transaction types
4. Fix styling

---

## **Success Criteria**

✅ User can see all their transactions in sidebar  
✅ Transactions auto-update when new ones occur  
✅ Can distinguish between single/batch/intent transactions  
✅ Can click to view on Blockscout  
✅ Loads fast (< 1s for 20 transactions)  
✅ Works with your existing wallet deployment flow  


---

## **Risks & Mitigation**

1. **Vercel Postgres limits** (256MB, 60h compute)
   - Mitigation: Clean up old transactions if needed
   - For hackathon demo, this is plenty

2. **Envio → Postgres sync lag**
   - Mitigation: Show "syncing" indicator
   - Acceptable for MVP (< 20s lag)