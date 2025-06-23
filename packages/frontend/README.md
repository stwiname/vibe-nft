# Vibe NFT Frontend

A Next.js frontend for the Vibe NFT smart contract, built with TypeScript, Tailwind CSS, and Web3 integration.

## Features

- 🔗 Wallet connection with RainbowKit
- 🎨 Beautiful, modern UI with gradient backgrounds
- 🪙 NFT minting with signature verification
- 📱 Responsive design for all devices
- ⚡ Fast development with Next.js 15 and Turbopack
- 🔒 Secure Web3 integration with wagmi

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: wagmi, RainbowKit, ethers.js
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm
- A WalletConnect Project ID (get from [cloud.walletconnect.com](https://cloud.walletconnect.com))

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy the environment template:
   ```bash
   cp env.example .env.local
   ```

3. Update `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
   NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=your_base_mainnet_contract_address_here
   NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_GOERLI=your_base_goerli_contract_address_here
   ```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Building

Build the app for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## Smart Contract Integration

This frontend connects to the VibeNFT smart contract deployed on Base network. The contract features:

- ERC721 standard with metadata support
- One NFT per address limit
- Signature-based minting for controlled access
- IPFS metadata support

### Contract Functions

- `safeMint(string uri, bytes signature)` - Mint a new NFT with signature verification
- `balanceOf(address owner)` - Check NFT balance for an address
- `tokenURI(uint256 tokenId)` - Get metadata URI for a token
- `ownerOf(uint256 tokenId)` - Get owner of a specific token

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud Project ID | Yes |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_BASE` | Contract address on Base mainnet | Yes |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_GOERLI` | Contract address on Base Goerli testnet | Yes |

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Main page component
│   └── providers.tsx   # Web3 providers setup
├── lib/                # Utility libraries
│   ├── contracts.ts    # Contract configuration
│   ├── wagmi.ts        # Wagmi configuration
│   └── hooks/          # Custom React hooks
│       └── useVibeNFT.ts # NFT interaction hook
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
