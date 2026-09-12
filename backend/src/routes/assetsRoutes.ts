import { Router } from "express";

type AssetMeta = {
  id: string;
  blockchain_asset_id: number;
  owner_wallet: string;
  name: string;
  description?: string;
  ipfs_cid: string;
  nominee_wallet?: string;
  status: "locked" | "claim_pending" | "unlocked";
  createdAt: string;
};

const assets = new Map<string, AssetMeta>();

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const router = Router();

// POST /api/assets  { blockchain_asset_id, owner_wallet, name, ipfs_cid, nominee_wallet, status }
router.post("/", (req, res) => {
  const { blockchain_asset_id, owner_wallet, name, description, ipfs_cid, nominee_wallet, status } = req.body;
  if (blockchain_asset_id === undefined || !owner_wallet || !name || !ipfs_cid) {
    return res.status(400).json({ success: false, message: "blockchain_asset_id, owner_wallet, name, ipfs_cid required" });
  }
  const meta: AssetMeta = {
    id: uid(),
    blockchain_asset_id: Number(blockchain_asset_id),
    owner_wallet: owner_wallet.toLowerCase(),
    name,
    description,
    ipfs_cid,
    nominee_wallet: nominee_wallet?.toLowerCase(),
    status: status || "locked",
    createdAt: new Date().toISOString(),
  };
  assets.set(meta.id, meta);
  return res.json({ success: true, asset: meta });
});

router.get("/", (req, res) => {
  const { owner_wallet, nominee_wallet } = req.query as Record<string, string>;
  let list = Array.from(assets.values());
  if (owner_wallet) list = list.filter((a) => a.owner_wallet === owner_wallet.toLowerCase());
  if (nominee_wallet) list = list.filter((a) => a.nominee_wallet === nominee_wallet.toLowerCase());
  return res.json({ success: true, assets: list });
});

router.get("/:id", (req, res) => {
  const a = assets.get(req.params.id) || Array.from(assets.values()).find((x) => String(x.blockchain_asset_id) === req.params.id);
  if (!a) return res.status(404).json({ success: false, message: "Asset not found" });
  return res.json({ success: true, asset: a });
});

// PUT /api/assets/:id  { nominee_wallet, status }
router.put("/:id", (req, res) => {
  const key = req.params.id;
  let a = assets.get(key) || Array.from(assets.values()).find((x) => String(x.blockchain_asset_id) === key);
  if (!a) return res.status(404).json({ success: false, message: "Asset not found" });
  if (req.body.nominee_wallet) a.nominee_wallet = req.body.nominee_wallet.toLowerCase();
  if (req.body.status) a.status = req.body.status;
  if (req.body.description) a.description = req.body.description;
  assets.set(a.id, a);
  return res.json({ success: true, asset: a });
});

export default router;
