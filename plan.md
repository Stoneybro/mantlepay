Looking at your requirements and the current indexer setup, here's my plan to achieve the desired transaction history structure:
Analysis of Current Issues

Batch recipients missing - No WalletAction event exists in the contracts
Intent recipients unknown at creation - Event doesn't include recipients/amounts arrays
Transaction type confusion - Need better differentiation logic

Proposed Solution
1. Contract Modifications (Required)
Add to MneeSmartWallet.sol:
solidityevent ExecutedWithDetails(
    address indexed target,
    uint256 value,
    bytes4 indexed selector,
    address tokenRecipient,  // extracted if token transfer
    uint256 tokenAmount
);

event BatchExecutedWithDetails(
    uint256 indexed batchSize,
    uint256 totalValue,
    BatchCallDetail[] calls
);

struct BatchCallDetail {
    address target;
    uint256 value;
    bytes4 selector;
    address tokenRecipient;
    uint256 tokenAmount;
}
Add to MneeIntentRegistry.sol:
solidityevent IntentCreated(
    // ... existing params ...
    address[] recipients,  // ADD THIS
    uint256[] amounts      // ADD THIS
);
2. Indexer Schema Changes
Flatten the structure - remove separate detail entities, embed everything in Transaction:
graphqltype Transaction @entity {
  id: ID!
  wallet_id: String!
  type: TransactionType!
  timestamp: BigInt!
  blockNumber: BigInt!
  txHash: String!
  
  # Universal fields
  title: String!
  token: String  # "ETH" | "USDC" | address
  
  # Type-specific JSON fields (stringified)
  intentCreatedData: String  # JSON of intent creation details
  intentExecutionData: String  # JSON of execution details
  intentCancelledData: String
  executeData: String
  batchData: String
  transferFailedData: String
  walletCreatedData: String
}

enum TransactionType {
  WALLET_CREATED
  EXECUTE
  EXECUTE_BATCH
  INTENT_CREATED
  INTENT_EXECUTION
  INTENT_CANCELLED
  TRANSFER_FAILED
}
3. Alternative: Contract Read Approach (No contract changes needed)
If modifying contracts isn't feasible, use contract reads in event handlers:
typescript// In IntentCreated handler
const intentData = await context.contracts.MneeIntentRegistry.read.getIntent([
  event.params.wallet,
  event.params.intentId
]);

const recipients = intentData.recipients;
const amounts = intentData.amounts;
Pros: No contract redeployment needed
Cons: Higher RPC costs, slower indexing, may hit rate limits
4. Event Handler Strategy

Detect transaction type early using event signature + context
Build complete JSON object matching your template
Store as stringified JSON in appropriate field
Frontend just parses JSON - zero transformation needed

5. Handling Batch Calls
Without WalletAction events, two options:
Option A: Decode calldata in the handler
typescript// Parse each call's calldata to extract recipients
function decodeBatchCall(calldata: string): {
  target: string;
  selector: string;
  recipient?: string;
  amount?: bigint;
}
Option B: Add batch detail events to contract (preferred)
Questions for You:

Can you modify and redeploy the contracts? If yes, adding the enhanced events is cleanest. If no, we'll use contract reads.
Token symbol resolution - Your template shows "USDC" | "ETH". Should I:

Hardcode a mapping of known token addresses?
Make contract reads to get symbol?
Just use address and let frontend handle it?


Batch call decoding - If we can't modify contracts, should I:

Parse calldata (complex, might fail for some calls)?
Only show batch size + total value without individual call details?
Recommend adding events (breaking change)?


Transaction classification - For EXECUTE events, how should I differentiate:

Regular transfers vs intent-related transfers?
Is there a pattern in the target or selector I can use?


Failed transfer recovery - Should TRANSFER_FAILED be a standalone transaction, or embedded in INTENT_EXECUTION details?

Let me know your answers and I'll provide the exact implementation!yes and i would do thatuse address i'll figure it out on the frontendthere is a walletaction event in the mnee smart wallet, it is emitted for both batch and single executionscan i just generate selectors for all the important functions and events from my contracts?what do you recommend?4:35 PMUpdated Plan Based on Your Answers
1. Contract Modifications
MneeIntentRegistry.sol - Add recipients to IntentCreated event:
solidityevent IntentCreated(
    address indexed wallet,
    bytes32 indexed intentId,
    address indexed token,
    string name,
    uint256 totalCommitment,
    uint256 totalTransactionCount,
    uint256 interval,
    uint256 duration,
    uint256 transactionStartTime,
    uint256 transactionEndTime,
    address[] recipients,  // ADD
    uint256[] amounts      // ADD
);
Update the emit statement in createIntent():
solidityemit IntentCreated(
    wallet,
    intentId,
    token,
    name,
    totalCommitment,
    totalTransactionCount,
    interval,
    duration,
    actualStartTime,
    actualEndTime,
    recipients,  // ADD
    amounts      // ADD
);
2. Schema Design
graphqltype Transaction @entity {
  id: ID!
  wallet_id: String!
  type: TransactionType!
  timestamp: BigInt!
  blockNumber: BigInt!
  txHash: String!
  logIndex: Int!
  
  # Title for display
  title: String!
  
  # Store complete details as JSON string (matches your frontend template exactly)
  details: String!  # Stringified JSON matching your templates
}

enum TransactionType {
  WALLET_CREATED
  EXECUTE
  EXECUTE_BATCH
  INTENT_CREATED
  INTENT_EXECUTION
  INTENT_CANCELLED
  TRANSFER_FAILED
}

# Keep Wallet entity for aggregates
type Wallet @entity {
  id: ID!
  owner: String!
  deployedAt: BigInt!
  deployedBlock: BigInt!
  deployedTx: String!
  totalTransactionCount: Int!
  transactions: [Transaction!]! @derivedFrom(field: "wallet_id")
}
3. Using WalletAction Event
Since WalletAction exists, I'll use it to enrich both single and batch executions:
typescript// Correlation strategy:
// 1. WalletAction fires BEFORE Executed/ExecutedBatch in same tx
// 2. Store WalletAction data in memory map keyed by txHash
// 3. When Executed/ExecutedBatch fires, lookup and merge data
```

### 4. Function Selector Generation

I'll generate selectors for:

**From MneeSmartWallet:**
- `execute(address,uint256,bytes)`
- `executeBatch(Call[])`
- `executeBatchIntentTransfer(address,address[],uint256[],bytes32,uint256,bool)`
- `increaseCommitment(address,uint256)`
- `decreaseCommitment(address,uint256)`

**From MneeIntentRegistry:**
- `createIntent(...)`
- `cancelIntent(bytes32)`
- `executeIntent(address,bytes32)`

**Common ERC20:**
- `transfer(address,uint256)` - 0xa9059cbb
- `approve(address,uint256)` - 0x095ea7b3
- `transferFrom(address,address,uint256)` - 0x23b872dd

### 5. Failed Transfer Recommendation

**I recommend: Standalone + Embedded approach**

- Create standalone `TRANSFER_FAILED` transaction for visibility in main history
- ALSO embed failed transfer details in the parent `INTENT_EXECUTION` transaction's details JSON

**Why?**
- Users can see failures at a glance in timeline
- Parent intent execution still shows complete picture
- Easier to filter "show me all failures"

**Example flow:**
```
Intent Execution #3 → 3 transfers
├─ 2 succeed → included in INTENT_EXECUTION details
└─ 1 fails → BOTH:
   ├─ Shows in INTENT_EXECUTION.details.recipients[2].status = "failed"
   └─ Creates separate TRANSFER_FAILED transaction
```

### Implementation Approach

1. **Event Handler Order:**
```
   WalletAction → Store in Map
   ↓
   Executed/ExecutedBatch → Merge with WalletAction data → Create Transaction
   ↓
   IntentBatchTransferExecuted → Create Transaction
   ↓
   IntentTransferSuccess/Failed → Update Transaction + optionally create TRANSFER_FAILED

JSON Building:
Each handler builds the exact JSON structure you specified, stringify it, store in details field
Title Generation:

typescript   function generateTitle(type: TransactionType, details: any): string {
     switch(type) {
       case "INTENT_CREATED": return `Created Intent: ${details.intentName}`;
       case "INTENT_EXECUTION": return `Intent Executed: ${details.intentName}`;
       case "EXECUTE": return details.functionCall === "transfer" ? "Direct Transfer" : "Contract Call";
       // etc...
     }
   }
Files to Modify

✅ packages/contracts/src/MneeIntentRegistry.sol - Add recipients to event
✅ packages/indexer/schema.graphql - New simplified schema
✅ packages/indexer/config.yaml - Add WalletAction event
✅ packages/indexer/src/EventHandlers.ts - Complete rewrite with:

Selector mappings
WalletAction correlation logic
JSON builders for each transaction type
Title generators



Does this approach work for you? If yes, I'll start with the contract modification, then the schema, then the handlers.yes, but leave the contract modifications i can work on them myself4:37 PM2 / 2Perfect! I'll start with the schema and event handlers then.
Implementation Order

Schema - New simplified structure
Config - Add WalletAction event
Event Handlers - Complete rewrite with:

Function selector mappings
WalletAction correlation
JSON builders per transaction type
Title generators



Quick Clarifications Before I Code:

WalletAction correlation - Looking at your contract, WalletAction emits for both single and batch. Should I:

Collect ALL WalletActions in a transaction
Match them to Executed/ExecutedBatch by txHash
For batch: use actionType="BATCH" to identify batch calls


Intent name fallback - When intent doesn't have a user-provided name, should I generate like:

"Payment to 3 recipients (0x1234...)"
Or use the name parameter from event (which might be empty)?


Transaction ordering in history - Should I use:

timestamp DESC (most recent first)?
blockNumber DESC, logIndex DESC?


For EXECUTE transactions - When it's a token transfer, title should be:

"Direct Transfer" (generic)?
"Token Transfer" (specific)?
"Transfer to 0xabc..." (with recipient)?


Batch call details - For each call in batch, if I can't decode the recipient (complex calldata), should I:

Show just target + value + selector?
Mark as "type: Unknown"?



Let me know and I'll generate the code!yes do thatuse the name parameter, i'll handle that, but make provisions if there is a need, because it may be emptytimestamptoken transfer, also you need to find a way to differentiate between contract calls and transfers for executedoesnt the wallet action give you enough to work with? why do you need the calldata?4:42 PMGood point on #5! The WalletAction event has:
solidityevent WalletAction(
    address indexed initiator,
    address indexed target,
    uint256 value,
    bytes4 indexed selector,
    bool success,
    bytes32 actionType
);
So for batch calls, I get target, value, selector, and success for each call - that's everything I need!
Final Clarifications
For #4 (differentiating contract calls vs transfers in EXECUTE):
Should I use this logic?
typescriptfunction classifyExecuteType(selector: string, target: string, value: bigint) {
  // Token transfer if selector is transfer/transferFrom
  if (selector === "0xa9059cbb" || selector === "0x23b872dd") {
    return "Token Transfer";
  }
  // ETH transfer if value > 0 and selector is 0x00000000
  if (value > 0n && selector === "0x00000000") {
    return "ETH Transfer";
  }
  // Otherwise it's a contract call
  return "Contract Call";
}
And then title would be:

"Token Transfer" for ERC20 transfers
"ETH Transfer" for native transfers
"Contract Call" for other interactions (approve, custom functions, etc.)

Does this logic work for you?

yes