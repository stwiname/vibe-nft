import { NFTData } from './hooks/useVibeNFT';

export interface SubQueryNFT {
  id: string;
  owner: string;
  lastTransferBlock: string;
  lastTransferTx: string;
  lastTransferredTimestamp: string;
}

const SUBQUERY_URLS: Record<number, string> = {
  8453: process.env.NEXT_PUBLIC_SUBQUERY_URL_BASE || '',
  84532: process.env.NEXT_PUBLIC_SUBQUERY_URL_BASE_SEPOLIA || '',
}

export async function fetchNFTsFromSubQuery(owner: string, network: number): Promise<SubQueryNFT[]> {
  const query = `
    query GetUserNFTs($owner: String!) {
      nFTs(filter: { owner: { equalTo: $owner } }) {
        nodes {
          id
          owner
          lastTransferBlock
          lastTransferTx
          lastTransferredTimestamp
        }
      }
    }
  `;

  const response = await fetch(SUBQUERY_URLS[network], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { owner } }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch NFTs from SubQuery');
  }

  const { data } = await response.json();
  return data?.nFTs?.nodes || [];
} 