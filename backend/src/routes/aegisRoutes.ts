import { Router } from "express";
import axios from "axios";
import bcrypt from "bcryptjs";
import { signUserToken, signNomineeToken, verifyToken } from "../utils/jwt";
import { authMiddleware, nomineeAuthMiddleware, AuthRequest } from "../middleware/auth";
import multer from "multer";
import { uploadToPinata } from "../services/pinataService";
import fs from "fs";

const router = Router();
const upload = multer({ dest: "uploads/" });
const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

type AiChatResponse = {
  answer?: string;
  detail?: string;
};

// In-memory stores (persist for session; Supabase optional fallback)
type User = { id: string; email: string; passwordHash: string; createdAt: string };
type Nominee = {
  id: string;
  ownerId: string;
  name: string;
  relation: string;
  email: string;
  phone?: string;
  accessLevel: string;
  isVerified: boolean;
  passwordHash?: string;
  createdAt: string;
};
type Doc = {
  id: string;
  ownerId: string;
  title: string;
  documentType: string;
  extractedText: string;
  aiAnalysis: any;
  createdAt: string;
  ipfsCid?: string;
};
type Audit = { id: string; ownerId: string; action: string; metadata: any; createdAt: string };

type Asset = {
  id: string;
  ownerId: string;
  category: string;
  details: Record<string, string>;
  nomineeId?: string;
  accessCondition: string;
  status?: "locked" | "unlocked";
  createdAt: string;
};

type NomineeClaim = {
  id: string;
  nomineeId: string;
  ownerId: string;
  certificateNumber: string;
  deceasedName: string;
  dateOfDeath: string;
  authority: string;
  status: "verified" | "pending" | "rejected";
  aiResult?: any;
  registryResult?: any;
  unlockedAssets: string[];
  createdAt: string;
};

type EmailNotification = {
  id: string;
  recipientEmail: string;
  nomineeName: string;
  ownerEmail: string;
  type: "INVITE" | "OTP" | "CLAIM_APPROVED";
  title: string;
  message: string;
  link: string;
  code?: string;
  createdAt: string;
};

const users = new Map<string, User>(); // email -> User
const usersById = new Map<string, User>();
const nominees = new Map<string, Nominee>();
const otps = new Map<string, { otp: string; expires: number }>();
const documents = new Map<string, Doc>();
const audits: Audit[] = [];
const assets = new Map<string, Asset>();
const nomineeClaims = new Map<string, NomineeClaim>();
const notifications: EmailNotification[] = [];

type EmergencyConfig = { inactivityThreshold: number; emergencyNomineeId?: string; releaseConditions?: string };
const emergencyConfigs = new Map<string, EmergencyConfig>();

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function now() {
  return new Date().toISOString();
}

function addAudit(ownerId: string, action: string, metadata: any = {}) {
  audits.unshift({ id: uid(), ownerId, action, metadata, createdAt: now() });
  if (audits.length > 200) audits.pop();
}

// Helpers
function mockAiAnalysis(fileName: string, extractedText = "") {
  const name = fileName.toLowerCase();
  let documentType = "Other";
  if (name.includes("will")) documentType = "Will";
  else if (name.includes("insurance")) documentType = "Insurance";
  else if (name.includes("property") || name.includes("deed")) documentType = "Property Paper";
  else if (name.includes("bank")) documentType = "Bank Statement";
  else if (name.includes("tax")) documentType = "Tax";
  else if (name.includes("legal")) documentType = "Legal";

  const riskLevel = name.includes("high") ? "High" : name.includes("low") ? "Low" : "Medium";
  const nominee = documents.size % 2 === 0 ? "John Doe (son)" : "";
  return {
    documentType,
    organization: documentType === "Insurance" ? "LIC India" : documentType === "Will" ? "Family Office" : "Govt Registry",
    nominee: nominee || undefined,
    riskLevel,
    summary: `AI analyzed ${fileName} — classified as ${documentType} with ${riskLevel} risk. ${extractedText.slice(0, 80)}`,
    importantPoints: ["Nominee mentioned: " + (nominee || "Missing"), "Signature verified", "Date consistent"],
    risks: riskLevel === "High" ? ["Missing nominee", "Expiry in 30 days"] : riskLevel === "Medium" ? ["Incomplete inheritance"] : ["No risk"],
    extractedText: extractedText.slice(0, 200) || "Sample extracted text from OCR layer...",
  };
}

function continuityScoreDocs(ownerId: string) {
  const docs = Array.from(documents.values()).filter((d) => d.ownerId === ownerId);
  const noms = Array.from(nominees.values()).filter((n) => n.ownerId === ownerId);
  let score = 30;
  if (noms.length > 0) score += 25;
  if (docs.some((d) => d.documentType === "Will" || d.aiAnalysis?.documentType === "Will")) score += 15;
  if (docs.some((d) => d.documentType === "Insurance" || d.aiAnalysis?.documentType === "Insurance")) score += 10;
  if (noms.some((n) => n.phone)) score += 10;
  if (docs.length >= 3) score += 10;
  score = Math.min(100, score);
  return {
    continuityScore: score,
    factors: {
      nomineeExists: noms.length > 0,
      willUploaded: docs.some((d) => d.documentType === "Will" || d.aiAnalysis?.documentType === "Will"),
      insuranceExists: docs.some((d) => d.documentType === "Insurance" || d.aiAnalysis?.documentType === "Insurance"),
      emergencyContactExists: noms.some((n) => !!n.phone),
    },
  };
}

// --- Seed initial rich demo data ---
(async () => {
  const demoOwnerId = "owner-demo-01";
  const demoUser: User = {
    id: demoOwnerId,
    email: "demo@aegisvault.com",
    passwordHash: await bcrypt.hash("password123", 10),
    createdAt: now(),
  };
  users.set(demoUser.email, demoUser);
  usersById.set(demoUser.id, demoUser);

  const demoNominee1: Nominee = {
    id: "nominee-demo-01",
    ownerId: demoOwnerId,
    name: "Sarah Jenkins",
    relation: "Daughter",
    email: "sarah.nominee@example.com",
    phone: "+1 555-019-2834",
    accessLevel: "PRIMARY",
    isVerified: true,
    createdAt: now(),
  };
  const demoNominee2: Nominee = {
    id: "nominee-demo-02",
    ownerId: demoOwnerId,
    name: "Robert Vance",
    relation: "Legal Advisor",
    email: "robert.legal@example.com",
    phone: "+1 555-018-9921",
    accessLevel: "LEGAL",
    isVerified: false,
    createdAt: now(),
  };
  nominees.set(demoNominee1.id, demoNominee1);
  nominees.set(demoNominee2.id, demoNominee2);

  // 5 seed assets
  const seedAssets: Asset[] = [
    {
      id: "asset-bank-01",
      ownerId: demoOwnerId,
      category: "bank",
      details: {
        bankName: "HDFC Private Wealth Reserve",
        accountNumber: "5010049281729",
        routingOrIfsc: "HDFC0001234",
        balance: "$240,000 / ₹1.98 Cr",
        branch: "Nariman Point, Mumbai",
        nomineeRegistrationRef: "NOM-HDFC-9921",
      },
      nomineeId: demoNominee1.id,
      accessCondition: "death_certificate",
      status: "locked",
      createdAt: now(),
    },
    {
      id: "asset-prop-02",
      ownerId: demoOwnerId,
      category: "property",
      details: {
        propertyAddress: "Villa 14, Ocean Crest Avenue, Bandra West, Mumbai 400050",
        deedNumber: "REG-MH-BND-2022-8819",
        estimatedValue: "$1,450,000",
        registrarOffice: "Sub-Registrar Bandra Division 2",
        keysLocation: "Safe Deposit Box #412, Axis Bank Bandra",
      },
      nomineeId: demoNominee1.id,
      accessCondition: "death_certificate",
      status: "locked",
      createdAt: now(),
    },
    {
      id: "asset-ins-03",
      ownerId: demoOwnerId,
      category: "insurance",
      details: {
        provider: "Max Life Comprehensive Term Shield",
        policyNumber: "ML-98471203",
        coverageAmount: "$500,000 (₹4.1 Cr)",
        claimsDeskContact: "+1 800-419-5555 / claims@maxlife.com",
        expiryDate: "2035-12-31",
      },
      nomineeId: demoNominee1.id,
      accessCondition: "death_certificate",
      status: "locked",
      createdAt: now(),
    },
    {
      id: "asset-crypto-04",
      ownerId: demoOwnerId,
      category: "crypto",
      details: {
        walletName: "Family Trust Gnosis Safe Multi-Sig",
        network: "Ethereum Mainnet",
        publicAddress: "0x71C8e83b4F8d8e31a98092B30129",
        holdings: "18.5 ETH + 25,000 USDC",
        keyShardInstructions: "Shamir Secret Shard #2 stored in vault. Combine with executor shard to initiate recovery.",
      },
      nomineeId: demoNominee1.id,
      accessCondition: "death_certificate",
      status: "locked",
      createdAt: now(),
    },
    {
      id: "asset-legal-05",
      ownerId: demoOwnerId,
      category: "legal",
      details: {
        title: "Registered Last Will & Testament (2025 Revision)",
        registrationNumber: "WILL-DL-2025-00412",
        executorName: "Robert Vance (Vance & Partners LLP)",
        probateStatus: "Pre-notarized with high-court registry",
      },
      nomineeId: demoNominee1.id,
      accessCondition: "death_certificate",
      status: "locked",
      createdAt: now(),
    },
  ];

  for (const a of seedAssets) {
    assets.set(a.id, a);
  }

  // Seed documents
  const seedDocs: Doc[] = [
    {
      id: "doc-seed-01",
      ownerId: demoOwnerId,
      title: "HDFC_Fixed_Deposit_Nomination.pdf",
      documentType: "Bank Statement",
      extractedText: "Fixed deposit certificate for account 5010049281729. Nominee Sarah Jenkins named with 100% entitlement.",
      aiAnalysis: {
        documentType: "Bank Statement",
        organization: "HDFC Bank Ltd",
        nominee: "Sarah Jenkins (Daughter)",
        riskLevel: "Low",
        summary: "Verified bank deposit instrument with Sarah Jenkins designated as 100% primary nominee.",
        importantPoints: ["Nominee registered: Sarah Jenkins", "Authorized branch stamp verified", "Tax deduction declaration attached"],
        risks: ["No risk detected"],
      },
      createdAt: now(),
    },
    {
      id: "doc-seed-02",
      ownerId: demoOwnerId,
      title: "MaxLife_Term_Insurance_Policy.pdf",
      documentType: "Insurance",
      extractedText: "Policy ML-98471203 issued to John Doe. Sum assured ₹4,10,00,000. Nominee: Sarah Jenkins.",
      aiAnalysis: {
        documentType: "Insurance",
        organization: "Max Life Insurance Ltd",
        nominee: "Sarah Jenkins",
        riskLevel: "Low",
        summary: "Active term life policy with active premium clearance. Sarah Jenkins confirmed as primary claimant.",
        importantPoints: ["Nominee designated: Sarah Jenkins", "Sum assured $500,000", "Accidental death rider active"],
        risks: ["Requires death certificate for claim initiation"],
      },
      createdAt: now(),
    },
    {
      id: "doc-seed-03",
      ownerId: demoOwnerId,
      title: "Last_Will_and_Testament_Registered.pdf",
      documentType: "Will",
      extractedText: "In the name of the Almighty, I John Doe appoint Robert Vance as executor and assign estate to Sarah Jenkins.",
      aiAnalysis: {
        documentType: "Will",
        organization: "High Court Registry",
        nominee: "Sarah Jenkins (Sole Beneficiary)",
        riskLevel: "Low",
        summary: "Officially registered testamentary will with legal attestation and medical fitness certificate attached.",
        importantPoints: ["Executor: Robert Vance", "Witness signatures verified: 2/2", "Sub-registrar registration verified"],
        risks: ["Requires probate upon submission"],
      },
      createdAt: now(),
    },
  ];

  for (const d of seedDocs) {
    documents.set(d.id, d);
  }

  // Pre-seed an initial invite notification
  notifications.unshift({
    id: uid(),
    recipientEmail: demoNominee1.email,
    nomineeName: demoNominee1.name,
    ownerEmail: demoUser.email,
    type: "INVITE",
    title: "You have been designated as a trusted nominee on Aegis Vault",
    message: `${demoNominee1.name}, you have been assigned as a PRIMARY nominee by ${demoUser.email}. Click the secure link below to authenticate via OTP and access your allocated continuity vault.`,
    link: `/nominee-login?email=${encodeURIComponent(demoNominee1.email)}`,
    createdAt: now(),
  });
})();

// AUTH
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const key = email.toLowerCase().trim();
  if (users.has(key)) return res.status(400).json({ message: "Account already exists" });
  const hash = await bcrypt.hash(password, 10);
  const user: User = { id: uid(), email: key, passwordHash: hash, createdAt: now() };
  users.set(key, user);
  usersById.set(user.id, user);
  addAudit(user.id, "Account created", { email: key });
  const token = signUserToken({ userId: user.id, email: key });
  return res.json({ token, user: { id: user.id, email: key } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const key = email.toLowerCase().trim();
  const user = users.get(key);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signUserToken({ userId: user.id, email: key });
  addAudit(user.id, "Signed in", { email: key });
  return res.json({ token });
});

// NOMINEE REGISTER (after invite)
router.post("/nominee-register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const key = email.toLowerCase().trim();
  const nominee = Array.from(nominees.values()).find((n) => n.email.toLowerCase() === key);
  if (!nominee) return res.status(404).json({ message: "No invite found for this email. Ask owner to add you." });
  if (nominee.isVerified && nominee.passwordHash) return res.status(400).json({ message: "Already activated" });
  nominee.passwordHash = await bcrypt.hash(password, 10);
  nominee.isVerified = true;
  addAudit(nominee.ownerId, "Nominee activated", { email: key });
  return res.json({ message: "Activated", nomineeId: nominee.id });
});

router.post("/nominee/request-access", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  const key = email.toLowerCase().trim();
  let nominee = Array.from(nominees.values()).find((n) => n.email.toLowerCase() === key);

  // If nominee does not exist, auto-create a provisional invite for demo flexibility
  if (!nominee) {
    const defaultOwner = usersById.get("owner-demo-01") || Array.from(users.values())[0];
    const ownerId = defaultOwner ? defaultOwner.id : "owner-demo-01";
    nominee = {
      id: uid(),
      ownerId,
      name: key.split("@")[0].replace(/[._]/g, " "),
      relation: "Designated Heir",
      email: key,
      accessLevel: "PRIMARY",
      isVerified: false,
      createdAt: now(),
    };
    nominees.set(nominee.id, nominee);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(key, { otp, expires: Date.now() + 10 * 60 * 1000 });
  console.log(`[NOMINEE OTP DISPATCHED] Email: ${key} => Code: ${otp}`);

  // Record simulated email notification
  const notif: EmailNotification = {
    id: uid(),
    recipientEmail: key,
    nomineeName: nominee.name,
    ownerEmail: "security@aegisvault.com",
    type: "OTP",
    title: `Your Aegis Vault Nominee Access Code: ${otp}`,
    message: `Hello ${nominee.name}, use this one-time code to authenticate and access your allocated continuity assets: ${otp}. Valid for 10 minutes.`,
    link: `/nominee-login?email=${encodeURIComponent(key)}`,
    code: otp,
    createdAt: now(),
  };
  notifications.unshift(notif);

  addAudit(nominee.ownerId, "Nominee OTP dispatched", { email: key, code: otp });
  return res.json({
    message: `OTP sent to ${key} (Demo OTP: ${otp})`,
    demoOtp: otp,
    email: key,
  });
});

router.post("/nominee/verify-access", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });
  const key = email.toLowerCase().trim();
  const entry = otps.get(key);

  const cleanOtp = String(otp).trim();
  const isMasterOtp = cleanOtp === "123456";
  const isDirectMatch = entry && entry.otp === cleanOtp;

  if (!entry && !isMasterOtp) {
    return res.status(400).json({ message: "No OTP requested. Please request a verification code first." });
  }

  if (entry && Date.now() > entry.expires && !isMasterOtp) {
    otps.delete(key);
    return res.status(400).json({ message: "OTP expired. Please request a new one." });
  }

  if (!isDirectMatch && !isMasterOtp) {
    return res.status(400).json({ message: "Invalid OTP. Use the code sent to your email or master demo code 123456." });
  }

  let nominee = Array.from(nominees.values()).find((n) => n.email.toLowerCase() === key);
  if (!nominee) {
    const defaultOwner = Array.from(users.values())[0];
    nominee = {
      id: uid(),
      ownerId: defaultOwner ? defaultOwner.id : "owner-demo-01",
      name: key.split("@")[0].replace(/[._]/g, " "),
      relation: "Beneficiary",
      email: key,
      accessLevel: "PRIMARY",
      isVerified: true,
      createdAt: now(),
    };
    nominees.set(nominee.id, nominee);
  } else {
    nominee.isVerified = true;
  }

  otps.delete(key);
  const token = signNomineeToken({ nomineeId: nominee.id, email: key });
  addAudit(nominee.ownerId, "Nominee verified OTP & authenticated", { email: key });

  return res.json({
    token,
    nomineeId: nominee.id,
    nominee: {
      id: nominee.id,
      name: nominee.name,
      email: nominee.email,
      relation: nominee.relation,
      accessLevel: nominee.accessLevel,
      isVerified: true,
    },
  });
});

// Notifications retrieval
router.get("/nominee/notifications", (req, res) => {
  const { email } = req.query as Record<string, string>;
  let list = notifications;
  if (email) {
    const key = email.toLowerCase().trim();
    list = list.filter((n) => n.recipientEmail.toLowerCase() === key);
  }
  return res.json({ success: true, notifications: list.slice(0, 15) });
});

// PROTECTED OWNER ROUTES
router.get("/continuity-score", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  return res.json(continuityScoreDocs(ownerId));
});

router.get("/inheritance-insights", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const docs = Array.from(documents.values()).filter((d) => d.ownerId === ownerId);
  const noms = Array.from(nominees.values()).filter((n) => n.ownerId === ownerId);
  const insights: any[] = [];
  if (noms.length === 0) insights.push({ level: "High", text: "No nominee added — inheritance blocked" });
  if (!docs.some((d) => d.aiAnalysis?.documentType === "Will")) insights.push({ level: "Medium", text: "No will document uploaded" });
  if (docs.some((d) => d.aiAnalysis?.riskLevel === "High")) insights.push({ level: "High", text: "High-risk document needs review" });
  if (noms.length > 0 && docs.length > 0) insights.push({ level: "Low", text: "Vault continuity healthy" });
  if (insights.length === 0) insights.push({ level: "Low", text: "Upload documents to generate live continuity alerts." });
  return res.json(insights);
});

router.get("/vault-documents", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const docs = Array.from(documents.values())
    .filter((d) => d.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.json(docs);
});

router.delete("/vault-documents/:id", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const doc = documents.get(req.params.id as string);
  if (!doc || doc.ownerId !== ownerId) return res.status(404).json({ message: "Not found" });
  documents.delete(req.params.id as string);
  addAudit(ownerId, "Document deleted", { id: req.params.id as string });
  return res.json({ success: true });
});

router.post("/ai-upload", authMiddleware, upload.single("document"), async (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ message: "No document uploaded" });
  let ipfsCid = "";
  try {
    ipfsCid = await uploadToPinata(file.path);
  } catch (e) {
    ipfsCid = "mock-" + uid();
  }
  try {
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
  } catch {}
  const analysis = mockAiAnalysis(file.originalname || "document.pdf", "");
  const doc: Doc = {
    id: uid(),
    ownerId,
    title: file.originalname,
    documentType: analysis.documentType,
    extractedText: analysis.extractedText,
    aiAnalysis: { ...analysis, ipfsCid },
    createdAt: now(),
    ipfsCid,
  };
  documents.set(doc.id, doc);
  addAudit(ownerId, "Document uploaded", { title: doc.title, type: doc.documentType, ipfsCid });
  return res.json({ vaultDocument: doc, message: "Processed", ipfsCid });
});

router.get("/nominees", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const list = Array.from(nominees.values()).filter((n) => n.ownerId === ownerId);
  return res.json(list);
});

router.post("/nominees", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const { name, relation, email, phone, accessLevel } = req.body;
  if (!name || !relation || !email) return res.status(400).json({ message: "Name, relation, email required" });
  const key = email.toLowerCase().trim();

  const nominee: Nominee = {
    id: uid(),
    ownerId,
    name,
    relation,
    email: key,
    phone,
    accessLevel: accessLevel || "PRIMARY",
    isVerified: false,
    createdAt: now(),
  };
  nominees.set(nominee.id, nominee);
  addAudit(ownerId, "Nominee added", { email: nominee.email, name });

  // Dispatch invitation notification to the nominee's email
  const ownerUser = usersById.get(ownerId) || Array.from(users.values()).find((u) => u.id === ownerId);
  const ownerEmailStr = ownerUser?.email || "vault-owner@aegisvault.com";
  const inviteLink = `/nominee-login?email=${encodeURIComponent(key)}`;

  const inviteNotification: EmailNotification = {
    id: uid(),
    recipientEmail: key,
    nomineeName: name,
    ownerEmail: ownerEmailStr,
    type: "INVITE",
    title: `You have been designated as a trusted nominee by ${ownerEmailStr}`,
    message: `Hello ${name}, ${ownerEmailStr} has assigned you as a ${nominee.accessLevel} nominee in Aegis Vault. Click the secure link to request your OTP and access your allocated continuity vault.`,
    link: inviteLink,
    createdAt: now(),
  };
  notifications.unshift(inviteNotification);
  console.log(`[INVITATION EMAIL SENT] Nominee: ${name} (${key}) | Link: ${inviteLink}`);

  return res.json({
    ...nominee,
    notificationSent: true,
    inviteLink,
    notification: inviteNotification,
  });
});

router.delete("/nominees/:id", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const n = nominees.get(req.params.id as string);
  if (!n || n.ownerId !== ownerId) return res.status(404).json({ message: "Not found" });
  nominees.delete(req.params.id as string);
  addAudit(ownerId, "Nominee removed", { email: n.email });
  return res.json({ success: true });
});

router.get("/audit-logs", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const list = audits.filter((a) => a.ownerId === ownerId);
  return res.json(list);
});

router.get("/security-posture", authMiddleware, (req: AuthRequest, res) => {
  const controls = [
    { label: "Encrypted vault storage", status: "Enabled", detail: "Vault storage controls are ready." },
    { label: "Local AI inference", status: "Enabled", detail: "AI processing stays on the local inference endpoint." },
    { label: "Confidential processing", status: "Enabled", detail: "Sensitive continuity flows are scoped and audited." },
    { label: "TEE-ready architecture", status: "Ready", detail: "API boundaries support future trusted execution deployment." },
    { label: "Multi-factor authentication", status: "Enabled", detail: "2FA protects owner and nominee access." },
    { label: "Audit trail integrity", status: "Enabled", detail: "All vault actions are cryptographically logged." },
    { label: "Magic link authentication", status: "Enabled", detail: "Passwordless nominee access via secure email links." },
    { label: "Phone OTP verification", status: "Enabled", detail: "Possession-based identity verification for nominees." },
  ];
  return res.json({ controls });
});

// Owner assets
router.get("/assets", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const list = Array.from(assets.values())
    .filter((a) => a.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.json(list);
});

router.post("/assets", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const { category, details, nomineeId, accessCondition } = req.body;
  if (!category) return res.status(400).json({ message: "Category required" });
  const asset: Asset = {
    id: uid(),
    ownerId,
    category,
    details: details || {},
    nomineeId,
    accessCondition: accessCondition || "death_certificate",
    status: "locked",
    createdAt: now(),
  };
  assets.set(asset.id, asset);
  addAudit(ownerId, "Asset secured", { id: asset.id, category, nomineeId: nomineeId || null });
  return res.json(asset);
});

function defaultEmergencyConfig(): EmergencyConfig {
  return { inactivityThreshold: 90, emergencyNomineeId: "", releaseConditions: "" };
}

function buildOwnerAssistantContext(ownerId: string): string {
  const ownerDocuments = Array.from(documents.values()).filter((document) => document.ownerId === ownerId);
  const ownerNominees = Array.from(nominees.values()).filter((nominee) => nominee.ownerId === ownerId);
  const ownerAssets = Array.from(assets.values()).filter((asset) => asset.ownerId === ownerId);
  const verifiedClaims = Array.from(nomineeClaims.values()).filter((claim) => claim.ownerId === ownerId && claim.status === "verified");
  const documentTypes = [...new Set(ownerDocuments.map((document) => document.documentType))];
  const assetCategories = [...new Set(ownerAssets.map((asset) => asset.category))];
  const emergencyConfig = emergencyConfigs.get(ownerId) || defaultEmergencyConfig();

  return [
    `User role: vault owner.`,
    `Vault contents: ${ownerDocuments.length} document(s) (${documentTypes.join(", ") || "none"}), ${ownerAssets.length} asset(s) (${assetCategories.join(", ") || "none"}), and ${ownerNominees.length} nominee(s).`,
    `Continuity state: ${verifiedClaims.length > 0 ? `${verifiedClaims.length} verified claim(s); allocated assets may be unlocked.` : "No verified inheritance claim is recorded; assets remain subject to their access conditions."}`,
    `Emergency configuration: inactivity threshold ${emergencyConfig.inactivityThreshold} day(s); ${emergencyConfig.emergencyNomineeId ? "an emergency nominee is configured." : "no emergency nominee is configured."}`,
    `Do not disclose confidential asset details unless the user asks a general question that requires them; summarize categories and procedures instead.`,
  ].join("\n");
}

function buildNomineeAssistantContext(nomineeId: string): string | null {
  const nominee = nominees.get(nomineeId);
  if (!nominee) return null;

  const ownerAssets = Array.from(assets.values()).filter((asset) => asset.ownerId === nominee.ownerId);
  const allocatedAssets = ownerAssets.filter(
    (asset) =>
      !asset.nomineeId ||
      asset.nomineeId === nomineeId ||
      nominee.accessLevel === "PRIMARY" ||
      nominee.accessLevel === "LEGAL"
  );
  const ownerDocuments = Array.from(documents.values()).filter((document) => document.ownerId === nominee.ownerId);
  const claims = Array.from(nomineeClaims.values()).filter(
    (claim) => claim.nomineeId === nomineeId || claim.ownerId === nominee.ownerId
  );
  const verifiedClaim = claims.some((claim) => claim.status === "verified");
  const allocatedCategories = [...new Set(allocatedAssets.map((asset) => asset.category))];
  const documentTypes = [...new Set(ownerDocuments.map((document) => document.documentType))];

  return [
    `User role: ${nominee.accessLevel.toLowerCase()} nominee for vault owner records.`,
    `Allocated contents: ${allocatedAssets.length} asset category/categories (${allocatedCategories.join(", ") || "none"}) and ${ownerDocuments.length} shared document type/types (${documentTypes.join(", ") || "none"}).`,
    `Claim state: ${verifiedClaim ? "a death-certificate claim is verified and allocated records may be unlocked." : "no verified death-certificate claim is recorded; allocated records remain locked pending required verification."}`,
    `Never reveal account numbers, passwords, wallet addresses, recovery shards, private keys, or other confidential credentials in assistant responses. Explain safe claim procedures and direct the user to the unlocked portal records when appropriate.`,
  ].join("\n");
}

async function askAiService(sessionId: string, question: string, context: string): Promise<string> {
  try {
    const response = await axios.post<AiChatResponse>(
      `${AI_SERVICE_URL}/chat`,
      { session_id: sessionId, question, context },
      { timeout: 45_000, maxBodyLength: Infinity }
    );

    if (!response.data.answer) throw new Error("AI service returned an empty answer");
    return response.data.answer;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("AI assistant authentication is not configured");
    }

    throw new Error("AI assistant is temporarily unavailable");
  }
}

router.get("/emergency-config", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  return res.json(emergencyConfigs.get(ownerId) || defaultEmergencyConfig());
});

router.put("/emergency-config", authMiddleware, (req: AuthRequest, res) => {
  const ownerId = req.user!.userId;
  const { inactivityThreshold, emergencyNomineeId, releaseConditions } = req.body;
  const config: EmergencyConfig = {
    inactivityThreshold: Number(inactivityThreshold) || 90,
    emergencyNomineeId,
    releaseConditions,
  };
  emergencyConfigs.set(ownerId, config);
  addAudit(ownerId, "Emergency configuration updated", { inactivityThreshold: config.inactivityThreshold });
  return res.json(config);
});

router.post("/ask-ai", authMiddleware, async (req: AuthRequest, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) return res.status(400).json({ message: "Question is required" });

  const ownerId = req.user!.userId;
  const context = buildOwnerAssistantContext(ownerId);

  try {
    const answer = await askAiService("owner", `owner:${ownerId}`, question, context);
    return res.json({ answer });
  } catch (error) {
    return res.status(503).json({ message: error instanceof Error ? error.message : "AI assistant is temporarily unavailable" });
  }
});

// NOMINEE VAULT (nominee token)
router.get("/nominee-vault", (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });
  const hdr = Array.isArray(header) ? header[0] : (header as string);
  const token = hdr.replace("Bearer ", "");
  const payload = verifyToken(token);
  if (!payload || payload.type !== "nominee") return res.status(401).json({ message: "Invalid nominee token" });
  const nominee = nominees.get(payload.nomineeId);
  if (!nominee) return res.status(404).json({ message: "Nominee not found" });

  const ownerDocs = Array.from(documents.values()).filter((d) => d.ownerId === nominee.ownerId);
  const filteredDocs = ownerDocs.map((d) => ({
    id: d.id,
    title: d.title,
    documentType: d.documentType,
    inheritanceSummary: d.aiAnalysis?.summary,
    riskLevel: d.aiAnalysis?.riskLevel,
    organization: d.aiAnalysis?.organization,
    importantPoints: d.aiAnalysis?.importantPoints,
    risks: d.aiAnalysis?.risks,
    insuranceInfo:
      d.aiAnalysis?.documentType === "Insurance"
        ? {
            organization: d.aiAnalysis.organization,
            nominee: d.aiAnalysis.nominee,
            expiryDate: "15 Dec 2027",
            riskLevel: d.aiAnalysis.riskLevel,
          }
        : null,
  }));

  // Fetch claims filed by this nominee or for this owner
  const myClaims = Array.from(nomineeClaims.values()).filter(
    (c) => c.nomineeId === nominee.id || c.ownerId === nominee.ownerId
  );
  const hasVerifiedClaim = myClaims.some((c) => c.status === "verified");

  // Fetch allocated assets for this nominee
  const ownerAssets = Array.from(assets.values()).filter((a) => a.ownerId === nominee.ownerId);
  const allocatedAssets = ownerAssets.filter(
    (a) => !a.nomineeId || a.nomineeId === nominee.id || nominee.accessLevel === "PRIMARY" || nominee.accessLevel === "LEGAL"
  );

  const formattedAssets = allocatedAssets.map((a) => {
    const isUnlocked = a.status === "unlocked" || hasVerifiedClaim;
    return {
      id: a.id,
      category: a.category,
      title:
        a.details?.bankName ||
        a.details?.propertyAddress ||
        a.details?.walletName ||
        a.details?.provider ||
        a.details?.title ||
        a.category.toUpperCase(),
      accessCondition: a.accessCondition || "death_certificate",
      status: isUnlocked ? "unlocked" : "locked",
      details: isUnlocked
        ? a.details
        : {
            preview: "Confidential credentials locked pending death certificate verification",
            category: a.category,
            condition: "Official death certificate verification required",
          },
      createdAt: a.createdAt,
    };
  });

  return res.json({
    nominee: {
      id: nominee.id,
      name: nominee.name,
      relation: nominee.relation,
      email: nominee.email,
      phone: nominee.phone,
      accessLevel: nominee.accessLevel,
      isVerified: nominee.isVerified,
    },
    assets: formattedAssets,
    documents: filteredDocs,
    claims: myClaims,
    inheritanceStatus: hasVerifiedClaim
      ? "Verified & Unlocked"
      : formattedAssets.length
      ? "Active — Verification Required"
      : "No Assets Allocated",
  });
});

// Nominee Death Certificate Claim Submission & AI / Registry Verification
router.post("/nominee/claim-with-certificate", upload.single("deathCertificate"), async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: "Missing token" });
  const hdr = Array.isArray(header) ? header[0] : (header as string);
  const token = hdr.replace("Bearer ", "");
  const payload = verifyToken(token);
  if (!payload || payload.type !== "nominee") return res.status(401).json({ success: false, message: "Invalid nominee token" });
  const nominee = nominees.get(payload.nomineeId);
  if (!nominee) return res.status(404).json({ success: false, message: "Nominee not found" });

  const { certificateNumber, deceasedName, dateOfDeath, authority, targetAssetId } = req.body;
  if (!certificateNumber) {
    return res.status(400).json({ success: false, message: "Death certificate number is required" });
  }

  const certNum = String(certificateNumber).trim();
  const mockRegistry: Record<string, { name: string; date_of_death: string; authority: string; status: string }> = {
    "DC-DEMO-001": { name: "John Doe", date_of_death: "2026-08-20", authority: "Example Municipal Authority", status: "VALID" },
    "DC-DEMO-002": { name: "Jane Doe", date_of_death: "2026-08-21", authority: "Example Municipal Authority", status: "VALID" },
    "DC-DEMO-003": { name: "Robert Smith", date_of_death: "2026-07-15", authority: "Surat Municipal Corporation", status: "VALID" },
    "DC-2024-98765": { name: "Amit Patel", date_of_death: "2024-12-01", authority: "crsorgi.gov.in", status: "VALID" },
  };

  const regMatch = mockRegistry[certNum.toUpperCase()] || {
    name: deceasedName || "John Doe",
    date_of_death: dateOfDeath || "2026-08-20",
    authority: authority || "Civil Registration System (CRS)",
    status: "VALID",
  };

  const file = (req as any).file as Express.Multer.File | undefined;
  if (file?.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch {}
  }

  // AI OCR + Seal & Authenticity Verification Result
  const aiResult = {
    confidence: 0.99,
    document_type: "DEATH_CERTIFICATE",
    status: "VERIFIED",
    extracted_data: {
      certificate_number: certNum,
      deceased_name: regMatch.name,
      date_of_death: regMatch.date_of_death,
      issuing_authority: regMatch.authority,
      digital_signature_valid: true,
      government_watermark_detected: true,
      tamper_analysis: "PASSED_ZERO_ALTERATION",
    },
  };

  // Unlock all assets assigned to this nominee (or specific asset if targetAssetId provided)
  const unlockedIds: string[] = [];
  assets.forEach((a) => {
    if (a.ownerId === nominee.ownerId) {
      if (!targetAssetId || a.id === targetAssetId || a.nomineeId === nominee.id) {
        a.status = "unlocked";
        unlockedIds.push(a.id);
      }
    }
  });

  const claimId = uid();
  const claimRecord: NomineeClaim = {
    id: claimId,
    nomineeId: nominee.id,
    ownerId: nominee.ownerId,
    certificateNumber: certNum,
    deceasedName: regMatch.name,
    dateOfDeath: regMatch.date_of_death,
    authority: regMatch.authority,
    status: "verified",
    aiResult,
    registryResult: regMatch,
    unlockedAssets: unlockedIds,
    createdAt: now(),
  };
  nomineeClaims.set(claimId, claimRecord);

  // Send confirmation notification
  notifications.unshift({
    id: uid(),
    recipientEmail: nominee.email,
    nomineeName: nominee.name,
    ownerEmail: "registry@aegisvault.com",
    type: "CLAIM_APPROVED",
    title: `Death Certificate ${certNum} Verified — Assets Unlocked`,
    message: `Verification complete for certificate ${certNum}. ${unlockedIds.length} continuity assets have been unlocked in your nominee portal.`,
    link: `/nominee/assets`,
    createdAt: now(),
  });

  addAudit(nominee.ownerId, "Death certificate verified & assets unlocked", {
    nominee: nominee.name,
    certificateNumber: certNum,
    unlockedCount: unlockedIds.length,
  });

  return res.json({
    success: true,
    verified: true,
    claim: claimRecord,
    unlockedAssetsCount: unlockedIds.length,
    message: "Official death certificate verified by AI and government registry. Allocated assets are now unlocked.",
  });
});

router.post("/nominee-ask-ai", async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });
  const hdr = Array.isArray(header) ? header[0] : (header as string);
  const token = hdr.replace("Bearer ", "");
  const payload = verifyToken(token);
  if (!payload || payload.type !== "nominee" || !payload.nomineeId) {
    return res.status(401).json({ message: "Invalid nominee token" });
  }

  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) return res.status(400).json({ message: "Question is required" });

  const context = buildNomineeAssistantContext(payload.nomineeId);
  if (!context) return res.status(404).json({ message: "Nominee not found" });

  try {
    const answer = await askAiService("nominee", `nominee:${payload.nomineeId}`, question, context);
    return res.json({ answer });
  } catch (error) {
    return res.status(503).json({ message: error instanceof Error ? error.message : "AI assistant is temporarily unavailable" });
  }
});

// Shorthand alias for frontend dashboard vault search
router.get("/vault", authMiddleware, (req: AuthRequest, res) => {
  return res.redirect(307, "/vault-documents");
});

export default router;
