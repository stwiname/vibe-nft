import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import PinataSDK from '@pinata/sdk';
import { ethers } from 'ethers';
import { Readable } from 'stream';
import { VIBE_NFT_ABI, getVibeNFTContractAddress } from '@/lib/contracts';

// ERC-20 ABI for ethers.js compatibility
const ERC20_ABI_ETHERS = [
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinata
const pinata = new PinataSDK({
  pinataJWTKey: process.env.PINATA_JWT_KEY,
});

const REQUIRED_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_REQUIRED_TOKEN_ADDRESS;
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

// Helper function to convert ArrayBuffer to Readable stream
function arrayBufferToStream(buffer: ArrayBuffer): Readable {
  return Readable.from(Buffer.from(buffer));
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt') || 'A vibrant, colorful abstract art piece with geometric shapes and flowing lines';
    const style = searchParams.get('style') || 'modern digital art';
    const account = searchParams.get('account');
    const chainId = Number(searchParams.get('chainId')) || 84532;

    if (!prompt || !style || !account) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Check ERC-20 token balance before generating
    if (!REQUIRED_TOKEN_ADDRESS) {
      return NextResponse.json({ success: false, error: 'Required token address not configured' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tokenContract = new ethers.Contract(REQUIRED_TOKEN_ADDRESS, ERC20_ABI_ETHERS, provider);
    const balance: bigint = await tokenContract.balanceOf(account);
    if (balance <= 0n) {
      return NextResponse.json({ success: false, error: 'Insufficient token balance to generate an NFT.' }, { status: 403 });
    }

    // Step 1: Generate image with OpenAI
    console.log('Generating image with prompt:', prompt);
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${prompt}, ${style}, high quality, detailed, vibrant colors`,
      n: 1,
      size: "1024x1024",
    });

    const imageData = imageResponse.data?.[0];
    if (!imageData?.url) {
      throw new Error('Failed to generate image');
    }

    // Step 2: Download the image
    console.log('Downloading generated image');
    const imageResponse2 = await fetch(imageData.url);
    const imageBuffer = await imageResponse2.arrayBuffer();

    // Step 3: Upload image to IPFS via Pinata
    console.log('Uploading image to IPFS via Pinata');
    const imageStream = arrayBufferToStream(imageBuffer);
    
    const imageUploadResponse = await pinata.pinFileToIPFS(imageStream, {
      pinataMetadata: {
        name: 'vibe-nft-image.png'
      }
    });
    const imageCid = imageUploadResponse.IpfsHash;
    const imageIpfsUrl = `ipfs://${imageCid}`;

    // Step 4: Create metadata JSON
    console.log('Creating metadata JSON');
    const metadata = {
      name: "Vibe NFT",
      description: `A unique Vibe NFT generated with the prompt: "${prompt}"`,
      image: imageIpfsUrl,
      attributes: [
        {
          trait_type: "Prompt",
          value: prompt
        },
        {
          trait_type: "Style",
          value: style
        },
        {
          trait_type: "Generator",
          value: "OpenAI DALL-E 3"
        },
        {
          trait_type: "Created",
          value: new Date().toISOString()
        }
      ],
      external_url: "https://vibe-nft.vercel.app",
      animation_url: imageIpfsUrl
    };

    // Step 5: Upload metadata to IPFS via Pinata
    console.log('Uploading metadata to IPFS via Pinata');
    const metadataJson = JSON.stringify(metadata, null, 2);
    const metadataBuffer = Buffer.from(metadataJson, 'utf8');
    const metadataStream = Readable.from(metadataBuffer);
    
    const metadataUploadResponse = await pinata.pinFileToIPFS(metadataStream, {
      pinataMetadata: {
        name: 'vibe-nft-metadata.json'
      }
    });
    const metadataCid = metadataUploadResponse.IpfsHash;
    const metadataIpfsUrl = `ipfs://${metadataCid}`;

    // Step 6: Create signature
    console.log('Creating signature');
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Private key not configured');
    }

    const wallet = new ethers.Wallet(privateKey);
    console.log("XXXX wallet address", wallet.address);

    // Get contract address to use as domain
    const contractAddress = getVibeNFTContractAddress(chainId);
    
    // Create EIP-712 typed data that matches the contract's expected format
    const domain = {
      name: 'VibeNFT',
      version: '1',
      chainId: chainId,
      verifyingContract: contractAddress,
    };

    const types = {
      Mint: [
        { name: 'uri', type: 'string' }
      ]
    };

    const value = {
      uri: metadataIpfsUrl
    };

    // Sign the typed data using EIP-712
    const signature = await wallet.signTypedData(domain, types, value);

    // Verify the signature can be recovered to the correct address
    const recovered = ethers.verifyTypedData(domain, types, value, signature);


    // Step 7: Return the results
    console.log('Returning results');
    return NextResponse.json({
      success: true,
      data: {
        imageCid: imageCid,
        imageUrl: imageIpfsUrl,
        originalImageUrl: imageData.url,
        metadataCid: metadataCid,
        metadataUrl: metadataIpfsUrl,
        signature: signature,
        metadata: metadata
      }
    });

  } catch (error) {
    console.error('Error generating NFT:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 