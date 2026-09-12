import { Router } from "express";

type Claim = {
  id: string;
  asset_id: string;
  claim_asset_id: number; // blockchain assetId
  nominee_wallet: string;
  owner_wallet?: string;
  death_certificate_cid: string;
  death_certificate_name?: string;
  verification_status: "pending" | "verified" | "rejected" | "needs_review";
  verification_reason?: string;
  blockchain_status: "pending" | "claim_pending" | "unlocked";
  ai_result?: any;
  registry_result?: any;
  createdAt: string;
};

const claims = new Map<string, Claim>();

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const router = Router();

// POST /api/claims  { asset_id, nominee_wallet, death_certificate_cid }
router.post("/", (req, res) => {
  const { asset_id, claim_asset_id, assetId, nominee_wallet, death_certificate_cid, deathCertificateCid, name } = req.body;
  const cid = death_certificate_cid || deathCertificateCid;
  const aId = asset_id || assetId || String(claim_asset_id ?? "");

  if (!cid) return res.status(400).json({ success: false, message: "death_certificate_cid required" });
  if (!nominee_wallet) return res.status(400).json({ success: false, message: "nominee_wallet required" });

  const claim: Claim = {
    id: uid(),
    asset_id: String(aId || uid()),
    claim_asset_id: Number(aId) || 0,
    nominee_wallet: nominee_wallet.toLowerCase(),
    death_certificate_cid: cid,
    death_certificate_name: name || "death-certificate.pdf",
    verification_status: "pending",
    blockchain_status: "pending",
    createdAt: new Date().toISOString(),
  };
  claims.set(claim.id, claim);
  return res.json({ success: true, claim });
});

router.get("/", (req, res) => {
  const { nominee_wallet, asset_id } = req.query as Record<string, string>;
  let list = Array.from(claims.values());
  if (nominee_wallet) list = list.filter((c) => c.nominee_wallet.toLowerCase() === nominee_wallet.toLowerCase());
  if (asset_id) list = list.filter((c) => c.asset_id === asset_id || String(c.claim_asset_id) === asset_id);
  return res.json({ success: true, claims: list });
});

router.get("/:id", (req, res) => {
  const c = claims.get(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: "Claim not found" });
  return res.json({ success: true, claim: c });
});

// PUT /api/claims/:id/verify  { verification_status, verification_reason, ai_result, registry_result }
router.put("/:id/verify", (req, res) => {
  const c = claims.get(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: "Claim not found" });
  const { verification_status, verification_reason, ai_result, registry_result, blockchain_status } = req.body;
  if (verification_status) c.verification_status = verification_status;
  if (verification_reason) c.verification_reason = verification_reason;
  if (ai_result) c.ai_result = ai_result;
  if (registry_result) c.registry_result = registry_result;
  if (blockchain_status) c.blockchain_status = blockchain_status;
  claims.set(c.id, c);
  return res.json({ success: true, claim: c });
});

// PUT /api/claims/:id/blockchain-status
router.put("/:id/blockchain-status", (req, res) => {
  const c = claims.get(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: "Claim not found" });
  c.blockchain_status = req.body.blockchain_status || c.blockchain_status;
  return res.json({ success: true, claim: c });
});

export default router;
export { claims };
