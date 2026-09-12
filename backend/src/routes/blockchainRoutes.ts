import { Router } from "express";
import { unlockAsset } from "../services/blockchainService";

const router = Router();

router.post("/unlock/:assetId", async (req, res) => {
  try {
    const assetId = Number(req.params.assetId);
    if (Number.isNaN(assetId)) {
      return res.status(400).json({ success: false, message: "Invalid asset ID" });
    }
    const receipt = await unlockAsset(assetId);
    return res.json({ success: true, transactionHash: receipt.hash });
  } catch (error: any) {
    console.error(error);
    const msg = error?.reason || error?.message || "Blockchain transaction failed";
    const isAuthError = msg.includes("Not authorized verifier");
    const isClaimError = msg.includes("Claim not pending") || msg.includes("Invalid asset status");
    return res.status(isAuthError ? 403 : isClaimError ? 400 : 500).json({
      success: false,
      message: msg,
      isAuthError,
    });
  }
});

// GET /api/blockchain/asset/:id — read asset (proxied for frontend without direct RPC)
import { vaultContract } from "../services/blockchainService";
router.get("/asset/:id", async (req, res) => {
  try {
    const asset = await vaultContract.getAsset(Number(req.params.id));
    return res.json({ success: true, asset });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get("/verifier", async (req, res) => {
  try {
    // vaultContract.verifier() view call
    const verifier = await (vaultContract as any).verifier();
    const deployer = await (vaultContract as any).deployer?.();
    return res.json({ success: true, verifier, deployer });
  } catch (e: any) {
    return res.json({ success: false, message: e.message });
  }
});

export default router;
