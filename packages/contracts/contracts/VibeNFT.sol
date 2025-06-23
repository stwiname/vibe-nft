// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

// ERC-20 interface for balance checking
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract VibeNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, EIP712 {
    uint256 private _nextTokenId;
    IERC20 public requiredToken; // ERC-20 token that users must hold

    bytes32 private constant MINT_TYPEHASH = keccak256("Mint(string uri)");

    error AlreadyOwnsNFT();
    error InsufficientTokenBalance();

    constructor(address initialOwner, address _requiredToken)
        ERC721("Vibe NFT", "VIBE")
        Ownable(initialOwner)
        EIP712("VibeNFT", "1")
    {
        requiredToken = IERC20(_requiredToken);
    }

    function safeMint(string memory uri, bytes memory signature) public {
        // Check if the caller already owns an NFT
        if (balanceOf(msg.sender) > 0) {
            revert AlreadyOwnsNFT();
        }

        // Check if the caller has the required ERC-20 token balance
        if (requiredToken.balanceOf(msg.sender) == 0) {
            revert InsufficientTokenBalance();
        }

        // Verify the signature
        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, keccak256(bytes(uri))));
        bytes32 hash = _hashTypedDataV4(structHash);
        
        address signer = ECDSA.recover(hash, signature);
        require(signer == owner(), "Invalid signature");

        // Mint the NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // Function to update the required token (only owner)
    function setRequiredToken(address _requiredToken) external onlyOwner {
        requiredToken = IERC20(_requiredToken);
    }

    // Function to check if an address can mint (view function)
    function canMint(address user) external view returns (bool) {
        return balanceOf(user) == 0 && requiredToken.balanceOf(user) > 0;
    }

    // Function to get the required token balance for an address
    function getRequiredTokenBalance(address user) external view returns (uint256) {
        return requiredToken.balanceOf(user);
    }

    // The following functions are overrides required by Solidity.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 