import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const [deployer, verifier, owner, nominee, attacker] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());
  console.log("Verifier:", await verifier.getAddress());
  console.log("Owner:", await owner.getAddress());
  console.log("Nominee:", await nominee.getAddress());
  console.log("Attacker:", await attacker.getAddress());

  const LegacyVault = await ethers.getContractFactory("LegacyVault", deployer);
  const vault = await LegacyVault.deploy(await verifier.getAddress());
  await vault.waitForDeployment();
  console.log("Deployed:", await vault.getAddress());
  console.log("Verifier on-chain:", await (vault as any).verifier());

  // Owner creates asset
  const vaultOwner = vault.connect(owner);
  const tx1 = await vaultOwner.createAsset("Family Property", "QmTestCID123");
  await tx1.wait();
  console.log("✓ Asset #0 created by owner");

  // Owner assigns nominee
  const tx2 = await vaultOwner.assignNominee(0, await nominee.getAddress());
  await tx2.wait();
  console.log("✓ Nominee assigned");

  // Nominee accepts
  const vaultNominee = vault.connect(nominee);
  const tx3 = await vaultNominee.acceptNomination(0);
  await tx3.wait();
  console.log("✓ Nominee accepted");

  // Nominee submits claim
  const tx4 = await vaultNominee.submitClaim(0);
  await tx4.wait();
  console.log("✓ Claim submitted -> CLAIM_PENDING (status 1)");

  // Try attacker unlock — should revert "Not authorized verifier"
  try {
    const vaultAttacker = vault.connect(attacker);
    const txBad = await vaultAttacker.unlockAsset(0);
    await txBad.wait();
    console.log("✗ FAIL: Attacker unlock succeeded (should have reverted)");
  } catch (e: any) {
    console.log("✓ PASS: Attacker unlock reverted:", e.message.slice(0, 80));
  }

  // Try owner unlock — should also revert (only verifier)
  try {
    const txBad2 = await vaultOwner.unlockAsset(0);
    await txBad2.wait();
    console.log("✗ FAIL: Owner unlock succeeded (should have reverted)");
  } catch (e: any) {
    console.log("✓ PASS: Owner unlock reverted:", e.message.slice(0, 80));
  }

  // Verifier unlocks — should succeed
  const vaultVerifier = vault.connect(verifier);
  const tx5 = await vaultVerifier.unlockAsset(0);
  await tx5.wait();
  console.log("✓ PASS: Verifier unlock succeeded -> UNLOCKED (status 2)");

  const asset = await vault.getAsset(0);
  console.log("Final asset status:", asset.status, "(0=Locked 1=ClaimPending 2=Unlocked)");
  console.log(asset.status === 2n ? "🏆 PHASE 5 VERIFIER FIX VERIFIED" : "FAIL");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
