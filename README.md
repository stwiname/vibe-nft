# Vibe NFT Project

A Next.js frontend with smart contracts for generating and minting AI-powered NFTs on Base network.

## Features

- **AI-Powered NFT Generation**: Generate unique NFTs using OpenAI's DALL-E 3
- **IPFS Storage**: Images and metadata stored on IPFS via Pinata
- **ERC-20 Token Requirement**: Users must hold a specific ERC-20 token to mint NFTs
- **Signature Verification**: Secure minting with EIP-712 signatures
- **Base Network Support**: Deployed on Base Sepolia testnet and Base mainnet
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## Smart Contract Features

### VibeNFT Contract
- **ERC-721 NFT**: Standard NFT implementation with metadata
- **ERC-20 Balance Check**: Users must hold > 0 balance of specified ERC-20 token
- **One NFT Per Address**: Each wallet can only mint one NFT
- **Owner Signature Required**: Only the contract owner can sign valid mint requests
- **Enumerable**: Supports enumeration of all minted NFTs

### TestToken Contract
- **ERC-20 Test Token**: Simple test token for development
- **Public Minting**: Anyone can call `getTestTokens()` to receive test tokens
- **Owner Minting**: Contract owner can mint tokens to any address

## Prerequisites

- Node.js 18+ and pnpm
- MetaMask or compatible wallet
- Base Sepolia testnet configured in wallet
- OpenAI API key
- Pinata JWT key
- WalletConnect Project ID
- Basescan API key (for contract verification)

## Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd vibe-project
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   # Copy example files
   cp packages/frontend/env.example packages/frontend/.env.local
   
   # Create contracts environment file
   touch packages/contracts/.env
   ```

3. **Set up contracts environment** (`packages/contracts/.env`):
   ```env
   # Required
   PRIVATE_KEY=your_private_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   PINATA_JWT_KEY=your_pinata_jwt_key_here
   BASESCAN_API_KEY=your_basescan_api_key_here
   
   # Optional - ERC-20 Token Address
   # If provided, this existing ERC-20 token will be used
   # If not provided, a new TestToken will be deployed
   REQUIRED_TOKEN_ADDRESS=your_existing_erc20_token_address_here
   ```

4. **Deploy contracts**:
   ```bash
   cd packages/contracts
   pnpm run deploy:base-sepolia
   ```

5. **Update frontend environment**:
   - Copy the deployed contract addresses to `packages/frontend/.env.local`
   - Set the required token address

6. **Start the frontend**:
   ```bash
   cd packages/frontend
   pnpm dev
   ```

## Deployment Options

### Option 1: Use Existing ERC-20 Token
If you want to use an existing ERC-20 token (e.g., USDC, WETH, or your own token):

1. Set the token address in `packages/contracts/.env`:
   ```env
   REQUIRED_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
   ```

2. Deploy contracts:
   ```bash
   pnpm run deploy:base-sepolia
   ```

The deployment script will:
- Verify the token exists and is a valid ERC-20
- Use it as the requirement for minting NFTs
- **Note**: Users must already have this token to mint

### Option 2: Deploy New Test Token
If you don't specify `REQUIRED_TOKEN_ADDRESS`, the script will:

1. Deploy a new TestToken contract
2. Give test tokens to the deployer and minter
3. Use the TestToken as the requirement

This is perfect for development and testing.

## Environment Variables

### Frontend (.env.local)
```env
# WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here

# Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=your_base_mainnet_contract_address_here
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_SEPOLIA=your_base_sepolia_contract_address_here

# Required ERC-20 Token Address
NEXT_PUBLIC_REQUIRED_TOKEN_ADDRESS=your_erc20_token_address_here
```

### Contracts (.env)
```env
# Required
PRIVATE_KEY=your_private_key_here
OPENAI_API_KEY=your_openai_api_key_here
PINATA_JWT_KEY=your_pinata_jwt_key_here
BASESCAN_API_KEY=your_basescan_api_key_here

# Optional - Existing ERC-20 Token
REQUIRED_TOKEN_ADDRESS=your_existing_erc20_token_address_here
```

## Usage

### For Users

1. **Connect Wallet**: Connect your wallet to the Base Sepolia testnet
2. **Get Required Tokens**: Ensure you have the required ERC-20 token balance
3. **Generate NFT**: Enter a prompt and style, then generate your NFT
4. **Mint NFT**: Click "Mint This NFT" to mint your generated NFT

### For Developers

#### Using Existing Token
1. **Set Token Address**: Add the ERC-20 token address to `.env`
2. **Deploy Contracts**: Run the deployment script
3. **Distribute Tokens**: Ensure users have the required token

#### Using Test Token
1. **Deploy Contracts**: Run deployment without setting `REQUIRED_TOKEN_ADDRESS`
2. **Get Test Tokens**: Users can call `getTestTokens()` to get tokens
3. **Test Minting**: Use the test token to test the minting functionality

## Contract Functions

### VibeNFT Contract

- `safeMint(string uri, bytes signature)`: Mint an NFT (requires ERC-20 balance > 0)
- `canMint(address user)`: Check if an address can mint
- `getRequiredTokenBalance(address user)`: Get user's required token balance
- `requiredToken()`: Get the address of the required ERC-20 token
- `setRequiredToken(address _requiredToken)`: Update required token (owner only)

### TestToken Contract

- `getTestTokens()`: Get 100 test tokens (anyone can call)
- `mint(address to, uint256 amount)`: Mint tokens to address (owner only)
- `balanceOf(address account)`: Check token balance

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Route     │    │   Smart         │
│   (Next.js)     │◄──►│   (generate-nft)│◄──►│   Smart         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Wagmi/Rainbow │    │   OpenAI DALL-E │    │   Base Network  │
│   (Web3)        │    │   (Image Gen)   │    │   (Blockchain)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Pinata IPFS   │              │
         │              │   (Storage)     │              │
         │              └─────────────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   ERC-20 Token  │
                        │   (Requirement) │
                        └─────────────────┘
```

## Security Features

- **Signature Verification**: All mint requests must be signed by the contract owner
- **ERC-20 Balance Check**: Users must hold the required token to mint
- **One NFT Per Address**: Prevents spam and ensures uniqueness
- **Owner-Only Functions**: Critical functions restricted to contract owner

## Development

### Adding New Features

1. **Smart Contracts**: Add new functions to the Solidity contracts
2. **Frontend**: Update the React components and hooks
3. **API**: Extend the API routes as needed
4. **Testing**: Test thoroughly on Base Sepolia before mainnet

### Testing

```bash
# Test contracts
cd packages/contracts
pnpm test

# Test frontend
cd packages/frontend
pnpm test
```

## License

MIT License - see LICENSE file for details. 