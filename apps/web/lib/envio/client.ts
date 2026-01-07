import { GraphQLClient, gql } from 'graphql-request';

// TODO: Move to env var
const ENVIO_API_URL = 'http://localhost:8080/v1/graphql';

export const envioClient = new GraphQLClient(ENVIO_API_URL);

export enum ActivityType {
  WALLET_CREATED = "WALLET_CREATED",
  EXECUTE = "EXECUTE",
  EXECUTE_BATCH = "EXECUTE_BATCH",
  INTENT_CREATED = "INTENT_CREATED",
  INTENT_EXECUTED = "INTENT_EXECUTED",
  INTENT_CANCELLED = "INTENT_CANCELLED",
  TRANSFER_FAILED = "TRANSFER_FAILED"
}

export interface WalletActivity {
  id: string;
  activityType: ActivityType;
  timestamp: string;
  txHash: string;
  primaryToken?: string;
  primaryAmount?: string;
  tags: string[];

  executeDetails?: {
    target: string;
    value: string;
    decodedFunction?: string;
    isTokenTransfer: boolean;
    tokenTransferRecipient?: string;
    tokenTransferAmount?: string;
  };

  batchDetails?: {
    callCount: number;
    totalValue: string;
    calls: any[]; // refined in query if needed
  };

  intentCreatedDetails?: {
    intent: {
      displayName: string;
      token: string;
      totalPlannedExecutions: number;
    };
    recipientCount: number;
    totalCommitment: string;
    scheduleDescription: string;
  };

  intentExecutionDetails?: {
    intent: {
      displayName: string;
    };
    executionNumber: number;
    totalExecutions: number;
    successCount: number;
    failureCount: number;
  };

  intentCancellationDetails?: {
    intent: {
      displayName: string;
    };
    refundedAmount: string;
    recoveredFailedAmount: string;
    executionsCompleted: number;
  };
}

export const GET_WALLET_ACTIVITY = gql`
  query GetWalletActivityFeed(
    $walletId: String, 
    $limit: Int = 50, 
    $offset: Int = 0
  ) {
    Wallet(where: { id: { _eq: $walletId } }) {
      owner
      deployedAt
      totalActivityCount
      totalValueTransferred
      
      activity(
        limit: $limit
        offset: $offset
        order_by: { timestamp: desc }
      ) {
        id
        activityType
        timestamp
        txHash
        primaryToken
        primaryAmount
        tags
        
        executeDetails {
          target
          value
          decodedFunction
          isTokenTransfer
          tokenTransferRecipient
          tokenTransferAmount
        }
        
        batchDetails {
          callCount
          totalValue
          calls {
            target
            value
            decodedFunction
          }
        }
        
        intentCreatedDetails {
          intent {
            displayName
            token
            totalPlannedExecutions
          }
          recipientCount
          totalCommitment
          scheduleDescription
        }
        
        intentExecutionDetails {
          intent {
            displayName
          }
          executionNumber
          totalExecutions
          successCount
          failureCount
        }
        
        intentCancellationDetails {
          intent {
            displayName
          }
          refundedAmount
          recoveredFailedAmount
          executionsCompleted
        }
      }
    }
  }
`;
