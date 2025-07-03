import { NFTData } from './hooks/useVibeNFT';

export interface SubQueryNFT {
  id: string;
  owner: string;
  lastTransferBlock: string;
  lastTransferTx: string;
  lastTransferredTimestamp: string;
}


export async function fetchNFTsFromSubQuery(owner: string): Promise<SubQueryNFT[]> {
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

  const response = await fetch('http://localhost:3000/', {
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