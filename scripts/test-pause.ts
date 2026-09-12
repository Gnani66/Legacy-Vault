import hre from "hardhat";
const { ethers } = await hre.network.connect();
async function main(){
 const [deployer, verifier, owner] = await ethers.getSigners();
 const F = await ethers.getContractFactory("LegacyVault", deployer);
 const v = await F.deploy(await verifier.getAddress());
 await v.waitForDeployment();
 console.log("deployed", await v.getAddress());
 // deployer pauses
 await (await v.connect(deployer).pause()).wait();
 console.log("paused", await v.paused());
 try{ await (await v.connect(owner).createAsset("Test","Qm123")).wait(); console.log("FAIL: createAsset should revert when paused"); } catch(e:any){ console.log("PASS: createAsset reverted when paused:", e.message.slice(0,60)); }
 await (await v.connect(deployer).unpause()).wait();
 console.log("unpaused", await v.paused());
 await (await v.connect(owner).createAsset("Test","Qm123")).wait();
 console.log("PASS: createAsset works after unpause — 6.2 emergency protection OK");
}
main().catch(e=>{console.error(e); process.exitCode=1});
