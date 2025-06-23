import { useState, useEffect, useMemo } from 'react';
import { useAccount, usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { getVibeNFTContractAddress, VIBE_NFT_ABI, ERC20_ABI } from '@/lib/contracts';

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
  const { data: totalSupply } = useReadContract({
    address: contractAddress,
    abi: VIBE_NFT_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!contractAddress }
  });

  const { data: canMint } = useReadContract({
    address: contractAddress,
    abi: VIBE_NFT_ABI,
    functionName: 'canMint',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address }
  });

  const { data: requiredTokenBalance } = useReadContract({
    address: contractAddress,
    abi: VIBE_NFT_ABI,
    functionName: 'getRequiredTokenBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address }
  });

  const { data: requiredTokenAddress } = useReadContract({
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
    if (!contractAddress || !publicClient || !totalSupply) return;

    try {
      setLoading(true);
      setError(null);
      
      const nftData: NFTData[] = [];
      const supply = Number(totalSupply);
      
      // Fetch all NFTs
      for (let i = 0; i < supply; i++) {
        try {
          const [tokenId, owner, uri] = await Promise.all([
            publicClient.readContract({
              address: contractAddress,
              abi: VIBE_NFT_ABI,
              functionName: 'tokenByIndex',
              args: [BigInt(i)]
            }),
            publicClient.readContract({
              address: contractAddress,
              abi: VIBE_NFT_ABI,
              functionName: 'ownerOf',
              args: [BigInt(i)]
            }),
            publicClient.readContract({
              address: contractAddress,
              abi: VIBE_NFT_ABI,
              functionName: 'tokenURI',
              args: [BigInt(i)]
            })
          ]);
          
          // Fetch metadata from URI
          let metadata;
          let imageUrl;
          try {
            const metadataUri = uri as string;
            const response = await fetch(metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
            if (response.ok) {
              metadata = await response.json();
              // Extract image URL and convert IPFS to HTTP if needed
              if (metadata.image) {
                imageUrl = metadata.image.startsWith('ipfs://') 
                  ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                  : metadata.image;
              }
            }
          } catch (metadataError) {
            console.error(`Error fetching metadata for token ${i}:`, metadataError);
          }
          
          nftData.push({
            tokenId: (tokenId as bigint).toString(),
            uri: uri as string,
            owner: owner as string,
            metadata,
            imageUrl
          });
        } catch (err) {
          console.error(`Error fetching token ${i}:`, err);
        }
      }
      
      setNfts(nftData);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Failed to fetch NFTs');
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