// SPDX-License-Identifier: Apache-2.0

// Auto-generated

import { TransferLog } from "../types/abi-interfaces/VibeNFT";
import { NFTTransfer } from "../types/models/NFTTransfer";
import { NFT } from "../types/models/NFT";

export async function handleTransferVibeNFTLog(log: TransferLog): Promise<void> {
  if (!log.args) return;
  // Create a new NFTTransfer entity for this transfer event
  const transfer = new NFTTransfer(
    log.transactionHash + '-' + log.logIndex.toString(), // unique id per event
    BigInt(log.blockNumber),
    log.transactionHash,
    log.args.from,
    log.args.to,
    log.args.tokenId.toBigInt()
  );
  await transfer.save();

  // Update or create the NFT entity for the transferred token
  const tokenId = log.args.tokenId.toString();
  let nft = await NFT.get(tokenId);
  if (!nft) {
    nft = new NFT(
      tokenId,
      log.args.to,
      BigInt(log.blockNumber),
      log.transactionHash,
      BigInt(log.block.timestamp)
    );
  } else {
    nft.owner = log.args.to;
    nft.lastTransferBlock = BigInt(log.blockNumber);
    nft.lastTransferTx = log.transactionHash;
    nft.lastTransferredTimestamp = BigInt(log.block.timestamp);
  }
  await nft.save();
}
