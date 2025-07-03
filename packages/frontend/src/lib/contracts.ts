// import { ethers } from 'ethers'; // (removed, not used)
import { Abi, parseAbi } from 'viem';

// ERC-20 interface for balance checking
export const ERC20_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
]) as Abi;

// VibeNFT Contract ABI - only the functions we need for the frontend
export const VIBE_NFT_ABI = parseAbi([
  "function safeMint(string uri, bytes signature)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function canMint(address user) view returns (bool)",
  "function getRequiredTokenBalance(address user) view returns (uint256)",
  "function requiredToken() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
]) as Abi;

// Contract addresses - these will need to be updated after deployment
export const CONTRACT_ADDRESSES = {
  base: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE || '',
  baseSepolia: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_SEPOLIA || '',
} as const;

export function getContractAddress(chainId: number): string {
  switch (chainId) {
    case 8453: // Base mainnet
      return CONTRACT_ADDRESSES.base;
    case 84532: // Base Sepolia testnet
      return CONTRACT_ADDRESSES.baseSepolia;
    default:
      return CONTRACT_ADDRESSES.baseSepolia; // Default to testnet
  }
}

export function getVibeNFTContractAddress(chainId: number): `0x${string}` {
  const address = getContractAddress(chainId);
  if (!address) {
    throw new Error(`No contract address configured for chain ${chainId}`);
  }
  console.log("VIBE NFT CONTRACT ADDRESS", address);
  return address as `0x${string}`;
}

export function getERC20Contract(tokenAddress: string) {
  return {
    target: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
  };
} 