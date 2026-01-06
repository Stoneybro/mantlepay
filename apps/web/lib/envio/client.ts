import { GraphQLClient, gql } from 'graphql-request';

// TODO: Move to env var
const ENVIO_API_URL = 'http://localhost:8080/v1/graphql';

export const envioClient = new GraphQLClient(ENVIO_API_URL);

export interface WalletTransaction {
  id: string;
  walletAddress: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
  transactionType: string;
  token?: string;
  value?: string;
  toAddress?: string;
  recipientCount?: number;
  intentId?: string;
  intentName?: string;
  status: string;
}

export const GET_TRANSACTIONS = gql`
  query GetTransactions($walletAddress: String!, $limit: Int = 20, $offset: Int = 0) {
    WalletTransaction(
      where: { walletAddress: { _eq: $walletAddress } }
      order_by: { timestamp: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      walletAddress
      txHash
      blockNumber
      timestamp
      transactionType
      token
      value
      toAddress
      recipientCount
      intentId
      intentName
      status
    }

  }
`;
