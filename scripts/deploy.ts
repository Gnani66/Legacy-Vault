import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  console.log("Deploying LegacyVault with verifier...");

  const [deployer, verifier] = await ethers.getSigners();
  // Use second Hardhat account as dedicated backend verifier (never MetaMask personal key)
  // Hardhat account #0: 0xf39Fd6... #1: 0x709973... #2 is also available
  const verifierAddress = verifier ? await verifier.getAddress() : await deployer.getAddress();

  console.log("Deployer:", await deployer.getAddress());
  console.log("Verifier (backend):", verifierAddress);

  const LegacyVault = await ethers.getContractFactory("LegacyVault");

  // Pass verifier to constructor per Phase 5.21
  const vault = await LegacyVault.deploy(verifierAddress);

  await vault.waitForDeployment();

  const address = await vault.getAddress();

  console.log("LegacyVault deployed to:", address);
  console.log("Verifier set to:", await vault.verifier());
  console.log("\nUpdate backend/.env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`BLOCKCHAIN_PRIVATE_KEY=<dedicated verifier private key - use account #1>`);
  console.log(`Example verifier #1 private: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
