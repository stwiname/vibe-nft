import { useState, useEffect, useMemo } from 'react';
import { useAccount, usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { getVibeNFTContractAddress, VIBE_NFT_ABI, ERC20_ABI } from '@/lib/contracts';
import { fetchNFTsFromSubQuery, SubQueryNFT } from '../subquery';

export interface NFTData {
  tokenId: string;
  uri: string;
  owner: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  imageUrl?: string;
}

export interface TokenBalanceInfo {
  canMint: boolean;
  requiredTokenBalance: string;
  requiredTokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
}

export function useVibeNFT() {
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalanceInfo, setTokenBalanceInfo] = useState<TokenBalanceInfo | null>(null);
  
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Get contract address
  const contractAddress = useMemo(() => chainId ? getVibeNFTContractAddress(chainId) : undefined, [chainId]);

  // Read contract data
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: contractAddress,
    abi: VIBE_NFT_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!contractAddress }
  });

  const { data: canMint, refetch: refetchCanMint } = useReadContract({
    address: contractAddress,
    abi: VIBE_NFT_ABI,
    functionName: 'canMint',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address }
  });

  const { data: requiredTokenBalance, refetch: refetchRequiredTokenBalance } = useReadContract({
    address: contractAddress,
    abi: VIBE_NFT_ABI,
    functionName: 'getRequiredTokenBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address }
  });

  const { data: requiredTokenAddress, refetch: refetchRequiredTokenAddress } = useReadContract({
    address: contractAddress,
    abi: VIBE_NFT_ABI,
    functionName: 'requiredToken',
    query: { enabled: !!contractAddress }
  });

  // Read ERC-20 token details
  const { data: tokenName } = useReadContract({
    address: requiredTokenAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'name',
    query: { enabled: !!requiredTokenAddress && requiredTokenAddress !== ethers.ZeroAddress }
  });

  const { data: tokenSymbol } = useReadContract({
    address: requiredTokenAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!requiredTokenAddress && requiredTokenAddress !== ethers.ZeroAddress }
  });

  const fetchNFTs = async () => {
    if (!address || !contractAddress || !publicClient) return;
    try {
      setLoading(true);
      setError(null);
      const subqueryNFTs: SubQueryNFT[] = await fetchNFTsFromSubQuery(address);
      const nftData: NFTData[] = await Promise.all(subqueryNFTs.map(async (nft) => {
        let uri = '';
        let metadata = undefined;
        let imageUrl = undefined;
        try {
          // Fetch tokenURI from contract
          uri = await publicClient.readContract({
            address: contractAddress,
            abi: VIBE_NFT_ABI,
            functionName: 'tokenURI',
            args: [BigInt(nft.id)]
          }) as string;
          // Fetch metadata from URI
          if (uri) {
            const response = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
            if (response.ok) {
              metadata = await response.json();
              if (metadata.image) {
                imageUrl = metadata.image.startsWith('ipfs://')
                  ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                  : metadata.image;
              }
            }
          }
        } catch (metadataError) {
          console.error(`Error fetching tokenURI or metadata for token ${nft.id}:`, metadataError);
        }
        return {
          tokenId: nft.id,
          uri,
          owner: nft.owner,
          metadata,
          imageUrl
        };
      }));
      setNfts(nftData);
    } catch (err) {
      console.error('Error fetching NFTs from SubQuery:', err);
      let errorMessage = 'Failed to fetch NFTs from SubQuery';
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
        if (err.stack) errorMessage += `\nStack: ${err.stack}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      } else {
        errorMessage += `: 'Unknown error'`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const mintNFT = async (uri: string, signature: string) => {
    if (!contractAddress || !address) {
      throw new Error('Wallet not connected or contract not available');
    }

    if (canMint === false) {
      throw new Error('Cannot mint: You must hold the required ERC-20 token and not already own an NFT');
    }

    try {
      setLoading(true);
      setError(null);

      writeContract({
        address: contractAddress,
        abi: VIBE_NFT_ABI,
        functionName: 'safeMint',
        args: [uri, signature]
      });
    } catch (err) {
      console.error('Error minting NFT:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update token balance info when data changes
  useEffect(() => {
    if (canMint !== undefined && requiredTokenBalance !== undefined && requiredTokenBalance !== null && requiredTokenAddress) {
      setTokenBalanceInfo({
        canMint: canMint as boolean,
        requiredTokenBalance: requiredTokenBalance.toString(),
        requiredTokenAddress: requiredTokenAddress as string,
        tokenName: tokenName as string | undefined,
        tokenSymbol: tokenSymbol as string | undefined
      });
    }
  }, [canMint, requiredTokenBalance, requiredTokenAddress, tokenName, tokenSymbol]);

  // Fetch NFTs when total supply changes
  useEffect(() => {
    if (totalSupply !== undefined) {
      fetchNFTs();
    }
  }, [totalSupply, contractAddress, publicClient]);

  // Reset data when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setNfts([]);
      setTokenBalanceInfo(null);
    }
  }, [isConnected]);

  // Refresh data after successful mint
  useEffect(() => {
    if (isSuccess) {
      fetchNFTs();
      refetchTotalSupply();
      refetchCanMint();
      refetchRequiredTokenBalance();
      refetchRequiredTokenAddress();
    }
  }, [isSuccess]);

  return {
    nfts,
    loading: loading || isConfirming,
    error,
    tokenBalanceInfo,
    mintNFT,
    fetchNFTs,
    canMint: canMint as boolean ?? false
  };
} 