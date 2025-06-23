import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

declare const hre: HardhatRuntimeEnvironment;

async function main() {
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  
  // Use the second account as minter if available, otherwise use deployer
  const minter = accounts.length > 1 ? accounts[1] : deployer;
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Minter account:", minter.address);

  // Check if a specific ERC-20 token address is provided
  const existingTokenAddress = process.env.REQUIRED_TOKEN_ADDRESS;
  let requiredTokenAddress: string;
  let testTokenAddress: string | undefined;

  if (existingTokenAddress) {
    // Use existing ERC-20 token
    console.log("Using existing ERC-20 token:", existingTokenAddress);
    requiredTokenAddress = existingTokenAddress;
    
    // Verify the token exists and is a valid ERC-20
    try {
      const tokenContract = new ethers.Contract(
        existingTokenAddress,
        ["function name() view returns (string)", "function symbol() view returns (string)"],
        deployer
      );
      const [name, symbol] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol()
      ]);
      console.log(`Token verified: ${name} (${symbol})`);
    } catch (error) {
      console.error("Error verifying token:", error);
      throw new Error("Invalid ERC-20 token address provided");
    }
  } else {
    // Deploy a new test token
    console.log("No existing token specified, deploying TestToken...");
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy(deployer.address);
    await testToken.waitForDeployment();
    testTokenAddress = await testToken.getAddress();
    requiredTokenAddress = testTokenAddress;
    console.log("TestToken deployed to:", testTokenAddress);

    // Give some test tokens to the minter (only if minter is different from deployer)
    if (minter.address !== deployer.address) {
      console.log("Giving test tokens to minter:", minter.address);
      const mintTx = await testToken.mint(minter.address, 1000 * 10 ** 18);
      await mintTx.wait();
      
      const minterBalance = await testToken.balanceOf(minter.address);
      console.log("Minter token balance:", minterBalance.toString());
    } else {
      console.log("Minter is same as deployer, skipping token distribution");
    }
  }

  // Deploy the VibeNFT contract with the required token
  console.log("Deploying VibeNFT with required token:", requiredTokenAddress);
  const VibeNFT = await ethers.getContractFactory("VibeNFT");
  const vibeNFT = await VibeNFT.deploy(deployer.address, requiredTokenAddress);

  await vibeNFT.waitForDeployment();

  const contractAddress = await vibeNFT.getAddress();
  console.log("VibeNFT deployed to:", contractAddress);

  // Verify the deployment by checking basic contract functions
  console.log("\n=== VERIFICATION ===");
  const canMint = await vibeNFT.canMint(minter.address);
  const tokenBalance = await vibeNFT.getRequiredTokenBalance(minter.address);
  const requiredToken = await vibeNFT.requiredToken();
  
  console.log("Minter address:", minter.address);
  console.log("Can mint:", canMint);
  console.log("Required token balance:", tokenBalance.toString());
  console.log("Required token address:", requiredToken);

  // Verify contracts on Basescan
  console.log("\n=== CONTRACT VERIFICATION ===");
  
  try {
    // Verify VibeNFT contract
    console.log("Verifying VibeNFT contract on Basescan...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [deployer.address, requiredTokenAddress],
    });
    console.log("✅ VibeNFT contract verified successfully!");
  } catch (error) {
    console.log("⚠️ VibeNFT verification failed (this is normal if already verified):", error);
  }

  // Verify TestToken if it was deployed
  if (testTokenAddress) {
    try {
      console.log("Verifying TestToken contract on Basescan...");
      await hre.run("verify:verify", {
        address: testTokenAddress,
        constructorArguments: [deployer.address],
      });
      console.log("✅ TestToken contract verified successfully!");
    } catch (error) {
      console.log("⚠️ TestToken verification failed (this is normal if already verified):", error);
    }
  }

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Required token address:", requiredTokenAddress);
  console.log("VibeNFT address:", contractAddress);
  console.log("\nEnvironment variables to set:");
  console.log(`REQUIRED_TOKEN_ADDRESS=${requiredTokenAddress}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_SEPOLIA=${contractAddress}`);
  
  if (!existingTokenAddress) {
    console.log("\nTestToken was deployed. Users can get test tokens by calling:");
    console.log(`TestToken.getTestTokens()`);
  }
  
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update your frontend environment variables");
  console.log("2. Start the frontend application");
  console.log("3. Generate and mint NFTs through the UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 