"use client";

import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

export const LEGACY_VAULT_ABI = [
  "function registerVault() external",
  "function createAsset(string name, string ipfsCid) external returns (uint256)",
  "function assignNominee(uint256 assetId, address nominee) external",
  "function acceptNomination(uint256 assetId) external",
  "function submitClaim(uint256 assetId) external",
  "function unlockAsset(uint256 assetId) external",
  "function getAsset(uint256 assetId) view returns ((uint256 id, address owner, address nominee, string name, string ipfsCid, uint8 status, bool nomineeAccepted))",
  "function getOwnerAssets(address owner) view returns (uint256[])",
  "function getNomineeAssets(address nominee) view returns (uint256[])",
  "function verifier() view returns (address)",
  "function deployer() view returns (address)",
  "event VaultRegistered(address indexed owner)",
  "event AssetCreated(uint256 indexed assetId, address indexed owner, string name)",
  "event NomineeAssigned(uint256 indexed assetId, address indexed nominee)",
  "event NomineeAccepted(uint256 indexed assetId, address indexed nominee)",
  "event ClaimSubmitted(uint256 indexed assetId, address indexed nominee)",
  "event AssetUnlocked(uint256 indexed assetId, address indexed nominee)",
] as const;

// Connect MetaMask and return provider + signer address
export async function connectMetaMask(): Promise<{ address: string; provider: BrowserProvider }> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask not found. Install MetaMask extension.");
  }
  const provider = new BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { address, provider };
}

export async function getWalletContract() {
  if (typeof window === "undefined" || !(window as any).ethereum) throw new Error("MetaMask not found");
  const provider = new BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, LEGACY_VAULT_ABI, signer);
  return contract;
}

export async function getReadContract() {
  const provider = new JsonRpcProvider(RPC_URL);
  const contract = new Contract(CONTRACT_ADDRESS, LEGACY_VAULT_ABI, provider);
  return contract;
}

// Phase 5 helpers — fundamental pattern: Frontend -> MetaMask -> ethers -> LegacyVault.sol
export async function registerVault() {
  const contract = await getWalletContract();
  const tx = await contract.registerVault();
  const receipt = await tx.wait();
  return receipt;
}

export async function createAsset(assetName: string, cid: string) {
  const contract = await getWalletContract();
  const tx = await contract.createAsset(assetName, cid);
  const receipt = await tx.wait();
  // Parse AssetCreated event to get assetId
  let assetId: number | null = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "AssetCreated") {
        assetId = Number(parsed.args.assetId);
        break;
      }
    } catch {}
  }
  return { receipt, assetId, hash: receipt.hash };
}

export async function assignNominee(assetId: number, nomineeAddress: string) {
  const contract = await getWalletContract();
  const tx = await contract.assignNominee(assetId, nomineeAddress);
  const receipt = await tx.wait();
  return receipt;
}

export async function acceptNomination(assetId: number) {
  const contract = await getWalletContract();
  const tx = await contract.acceptNomination(assetId);
  const receipt = await tx.wait();
  return receipt;
}

export async function submitClaim(assetId: number) {
  const contract = await getWalletContract();
  const tx = await contract.submitClaim(assetId);
  const receipt = await tx.wait();
  return receipt;
}

// Only backend verifier wallet should call unlockAsset via API; frontend should NOT call direct unlock
// But we expose for completeness — will revert if not verifier
export async function unlockAssetDirect(assetId: number) {
  const contract = await getWalletContract();
  const tx = await contract.unlockAsset(assetId);
  const receipt = await tx.wait();
  return receipt;
}
