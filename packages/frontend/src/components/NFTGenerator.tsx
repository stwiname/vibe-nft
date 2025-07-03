'use client';

import { useState } from 'react';
import { useVibeNFT } from '@/lib/hooks/useVibeNFT';
import { useAccount } from 'wagmi';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  [key: string]: unknown;
}

interface NFTGenerationResult {
  imageCid: string;
  imageUrl: string;
  originalImageUrl?: string;
  metadataCid: string;
  metadataUrl: string;
  signature: string;
  metadata: NFTMetadata;
}

export function NFTGenerator() {
  const [prompt, setPrompt] = useState('Elegant flowers with glassmorphism effects, purple and blue gradient petals, ethereal light reflections, black background, cyberpunk digital art style');
  const [style, setStyle] = useState('cyberpunk digital art with glassmorphism effects');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<NFTGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullSize, setShowFullSize] = useState(false);
  
  const { mintNFT, loading: isMinting, canMint } = useVibeNFT();
  const { address, chainId } = useAccount();

  const generateNFT = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      if (!address) {
        setError('Connect your wallet to generate an NFT.');
        setIsGenerating(false);
        return;
      }

      if (!chainId) {
        setError('Please connect to a supported network (Base or Base Sepolia).');
        setIsGenerating(false);
        return;
      }

      const response = await fetch(
        `/api/generate-nft?prompt=${encodeURIComponent(prompt)}&style=${encodeURIComponent(style)}&account=${address}&chainId=${chainId}`
      );
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate NFT');
      }
      
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMint = async () => {
    if (!result) {
      alert('Please generate an NFT first');
      return;
    }

    if (!canMint) {
      alert('You cannot mint: You must hold the required ERC-20 token and not already own an NFT');
      return;
    }
    
    try {
      await mintNFT(result.metadataUrl, result.signature);
    } catch (error) {
      console.error('Mint failed:', error);
      alert('Mint failed. Check console for details.');
    }
  };

  // Convert IPFS URL to HTTP gateway URL for image display
  const getImageUrl = (ipfsUrl: string) => {
    if (ipfsUrl.startsWith('ipfs://')) {
      // Try multiple IPFS gateways for better reliability
      const cid = ipfsUrl.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${cid}`;
    }
    return ipfsUrl;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-white">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
          placeholder="Describe the image you want to generate..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-white">
          Style
        </label>
        <input
          type="text"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., modern digital art, oil painting, watercolor..."
        />
      </div>
      
      <button
        onClick={generateNFT}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200"
      >
        {isGenerating ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Generating NFT...
          </div>
        ) : (
          'Generate NFT'
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 text-white">✨ Your Generated NFT</h3>
            <p className="text-gray-300 text-sm">AI-generated masterpiece ready to mint!</p>
          </div>
          
          {/* Image Preview */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-center text-white">Generated Image</h4>
            <div className="relative group">
              <img
                src={result.originalImageUrl || getImageUrl(result.imageUrl)}
                alt="Generated NFT"
                className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Fallback to IPFS image if originalImageUrl fails
                  if (result.originalImageUrl && target.src !== getImageUrl(result.imageUrl)) {
                    target.src = getImageUrl(result.imageUrl);
                  } else {
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMjAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4QjVGRkY7c3RvcC1vcGFjaXR5OjEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRjA3M0Y2O3N0b3Atb3BhY2l0eToxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+';
                  }
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', result.originalImageUrl || getImageUrl(result.imageUrl));
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setShowFullSize(true)}
                  className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-white transition-colors duration-200"
                >
                  View Full Size
                </button>
              </div>
            </div>
          </div>

          {/* Full Size Image Modal */}
          {showFullSize && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="relative w-full h-full flex items-center justify-center">
                <button
                  onClick={() => setShowFullSize(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-bold z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition-colors duration-200"
                >
                  ×
                </button>
                <img
                  src={getImageUrl(result.imageUrl)}
                  alt="Generated NFT - Full Size"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (result.originalImageUrl) {
                      target.src = result.originalImageUrl;
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* NFT Details */}
          <div className="grid gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium mb-3 text-white">NFT Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Name:</span>
                  <span className="font-medium text-white">{result.metadata.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Prompt:</span>
                  <span className="font-medium max-w-[200px] truncate text-white" title={result.metadata.attributes?.[0]?.value || ''}>
                    {result.metadata.attributes?.[0]?.value || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Style:</span>
                  <span className="font-medium text-white">{result.metadata.attributes?.[1]?.value || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Generator:</span>
                  <span className="font-medium text-white">{result.metadata.attributes?.[2]?.value || ''}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium mb-3 text-white">Technical Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Image CID:</span>
                  <span className="font-mono text-xs max-w-[150px] truncate text-white" title={result.imageCid}>
                    {result.imageCid}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Metadata CID:</span>
                  <span className="font-mono text-xs max-w-[150px] truncate text-white" title={result.metadataCid}>
                    {result.metadataCid}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Signature:</span>
                  <span className="font-mono text-xs max-w-[150px] truncate text-white" title={result.signature}>
                    {result.signature.slice(0, 10)}...{result.signature.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mint Button */}
          <div className="space-y-3">
            <button
              onClick={handleMint}
              disabled={isMinting || !canMint}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isMinting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Minting NFT...
                </div>
              ) : !canMint ? (
                'Cannot Mint - Check Requirements'
              ) : (
                '🚀 Mint This NFT'
              )}
            </button>
            
            {!canMint && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <p className="text-yellow-300 text-sm">
                  You need to hold the required ERC-20 token to mint an NFT
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 