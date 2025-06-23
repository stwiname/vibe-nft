// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("Test Token", "TEST")
        Ownable(initialOwner)
    {
        // Mint some initial tokens to the owner
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }

    // Function to mint tokens to any address (for testing)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function to allow anyone to get some test tokens (for testing)
    function getTestTokens() public {
        _mint(msg.sender, 100 * 10 ** decimals());
    }
} 