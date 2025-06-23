'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useVibeNFT } from '@/lib/hooks/useVibeNFT';
import { NFTGenerator } from '@/components/NFTGenerator';
import { ethers } from 'ethers'

  // Helper to ellipsize an address
  function ellipsizeAddress(address?: string) {
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-4);
  }

  // Helper to format token amount in ether
  function formatTokenAmount(amount: string | undefined) {
    if (!amount) return '';
    try {
      return ethers.formatUnits(amount, 18); // default to 18 decimals
    } catch {
      return amount;
    }
  }

  // Helper to convert IPFS URL to HTTP gateway URL
  function getImageUrl(ipfsUrl: string) {
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return ipfsUrl;
  }

export default function Home() {
  const { nfts, loading, error, tokenBalanceInfo, canMint } = useVibeNFT();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Vibe NFT</h1>
          <ConnectButton />
        </div>

        {/* Token Requirement Info */}
        {tokenBalanceInfo && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Token Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/5 rounded p-3">
                <p className="text-gray-300">Required Token:</p>
                <p className="text-white font-mono">
                  {tokenBalanceInfo.tokenName} ({tokenBalanceInfo.tokenSymbol})
                </p>
                <p className="text-gray-400 text-xs">{ellipsizeAddress(tokenBalanceInfo.requiredTokenAddress)}</p>
              </div>
              <div className="bg-white/5 rounded p-3">
                <p className="text-gray-300">Your Balance:</p>
                <p className="text-white font-mono">{formatTokenAmount(tokenBalanceInfo.requiredTokenBalance)} {tokenBalanceInfo.tokenSymbol}</p>
              </div>
              <div className="bg-white/5 rounded p-3">
                <p className="text-gray-300">Can Mint:</p>
                <p className={`font-semibold ${canMint ? 'text-green-400' : 'text-red-400'}`}>
                  {canMint ? 'Yes' : 'No'}
                </p>
                {!canMint && (
                  <p className="text-red-300 text-xs mt-1">
                    {nfts.length > 0 ? 'Already own an NFT' : 'Need to hold required token'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generate Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Generate NFT</h2>
            <NFTGenerator />
          </div>

          {/* Display Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Your NFTs</h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-white mt-2">Loading...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {!loading && nfts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-300">No NFTs found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {tokenBalanceInfo && !canMint 
                    ? 'You need to hold the required ERC-20 token to mint an NFT'
                    : 'Generate and mint your first NFT!'
                  }
                </p>
              </div>
            )}

            {!loading && nfts.length > 0 && (
              <div className="space-y-4">
                {nfts.map((nft) => (
                  <div key={nft.tokenId} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {/* NFT Image */}
                      <div className="flex-shrink-0">
                        {nft.imageUrl ? (
                          <img
                            src={getImageUrl(nft.imageUrl)}
                            alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                            className="w-24 h-24 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iOTYiIHkyPSI5NiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojOEI1RkZGO3N0b3Atb3BhY2l0eToxIi8+CjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0YwNzNGNjtzdG9wLW9wYWNpdHk6MSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg==';
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* NFT Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">
                            {nft.metadata?.name || `Token #${nft.tokenId}`}
                          </h3>
                          <span className="text-gray-400 text-xs">#{nft.tokenId}</span>
                        </div>
                        
                        {nft.metadata?.description && (
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                            {nft.metadata.description}
                          </p>
                        )}
                        
                        {/* Attributes */}
                        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                              <span
                                key={index}
                                className="inline-block bg-white/10 text-white text-xs px-2 py-1 rounded-full"
                                title={`${attr.trait_type}: ${attr.value}`}
                              >
                                {attr.trait_type}: {attr.value}
                              </span>
                            ))}
                            {nft.metadata.attributes.length > 3 && (
                              <span className="inline-block bg-white/10 text-white text-xs px-2 py-1 rounded-full">
                                +{nft.metadata.attributes.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="text-gray-400 text-xs">
                          Owner: {ellipsizeAddress(nft.owner)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
