import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

import * as dotenv from 'dotenv';
import path from 'path';

const mode = process.env.NODE_ENV || 'production';

// Load the appropriate .env file
const dotenvPath = path.resolve(__dirname, `.env${mode !== 'production' ? `.${mode}` : ''}`);
dotenv.config({ path: dotenvPath });

const startHeight = process.env.START_HEIGHT ? parseInt(process.env.START_HEIGHT, 10) : 27875166;
const contractAddress = process.env.CONTRACT_ADDRESS || '0x08e587bc0f634f5a97cd38f73a9f55bc53b4e054';

// Can expand the Datasource processor types via the generic param
const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "base-sepolia-starter",
  description:
    "This project can be use as a starting point for developing your new Base Sepolia SubQuery project",
  runner: {
    node: {
      name: "@subql/node-ethereum",
      version: ">=3.0.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /**
     *  chainId is the EVM Chain ID, for Base Sepolia this is 84531
     *  https://chainlist.org/chain/84532
     */
    chainId: process.env.CHAIN_ID!,
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: process.env.ENDPOINT!?.split(',') as string[] | string,
  },
  dataSources: [{
    kind: EthereumDatasourceKind.Runtime,
    startBlock: startHeight,
    options: {
      abi: 'VibeNFT',
      address: contractAddress,
    },
    assets: new Map([['VibeNFT', {file: './abis/VibeNFT.json'}]]),
    mapping: {
      file: './dist/index.js',
      handlers: [
        {
          handler: "handleTransferVibeNFTLog",
          kind: EthereumHandlerKind.Event,
          filter: {
            topics: [
              "Transfer(address,address,uint256)"
            ]
          }
        }
      ]
    }
  }],
  repository: "https://github.com/subquery/ethereum-subql-starter",
};

// Must set default to the project instance
export default project;
