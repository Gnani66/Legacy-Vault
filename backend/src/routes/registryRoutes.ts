import { Router } from "express";

// Mock Government Registry - same data as ai-service/mock_registry.py for demo consistency
const MOCK_REGISTRY: Record<string, { name: string; date_of_death: string; authority: string; status: string; registration_date: string }> = {
  "DC-DEMO-001": {
    name: "John Doe",
    date_of_death: "2026-08-20",
    authority: "Example Municipal Authority",
    status: "VALID",
    registration_date: "2026-08-21",
  },
  "DC-DEMO-002": {
    name: "Jane Doe",
    date_of_death: "2026-08-21",
    authority: "Example Municipal Authority",
    status: "VALID",
    registration_date: "2026-08-22",
  },
  "DC-DEMO-003": {
    name: "Robert Smith",
    date_of_death: "2026-07-15",
    authority: "Surat Municipal Corporation",
    status: "VALID",
    registration_date: "2026-07-16",
  },
  "DC-2024-98765": {
    name: "Amit Patel",
    date_of_death: "2024-12-01",
    authority: "crsorgi.gov.in",
    status: "VALID",
    registration_date: "2024-12-02",
  },
};

const router = Router();

// GET /api/registry/verify?certificate_number=DC-DEMO-001&name=John Doe&date_of_death=2026-08-20
router.get("/verify", (req, res) => {
  const { certificate_number, name, date_of_death, authority } = req.query as Record<string, string>;

  if (!certificate_number) {
    return res.status(400).json({ verified: false, status: "INVALID", reason: "certificate_number required" });
  }

  const record = MOCK_REGISTRY[certificate_number.trim()];

  if (!record) {
    return res.json({ verified: false, status: "NOT_FOUND", reason: "Certificate not found in registry" });
  }

  if (record.status !== "VALID") {
    return res.json({ verified: false, status: "INVALID", reason: "Registry marks certificate as invalid", registry_record: record });
  }

  // Name / date strict match per Phase 5.18
  if (name && record.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
    return res.json({
      verified: false,
      status: "MISMATCH",
      reason: `Deceased name does not match registry (expected ${record.name})`,
      registry_record: record,
    });
  }

  if (date_of_death && record.date_of_death !== date_of_death.trim()) {
    return res.json({
      verified: false,
      status: "MISMATCH",
      reason: `Date of death does not match registry (expected ${record.date_of_death})`,
      registry_record: record,
    });
  }

  if (authority && record.authority.toLowerCase().trim() !== authority.toLowerCase().trim()) {
    return res.json({
      verified: false,
      status: "MISMATCH",
      reason: `Authority does not match registry (expected ${record.authority})`,
      registry_record: record,
    });
  }

  return res.json({
    verified: true,
    status: "VALID",
    name: record.name,
    date_of_death: record.date_of_death,
    authority: record.authority,
    registration_date: record.registration_date,
    registry_record: record,
    reason: "Certificate matched mock government registry",
  });
});

// POST /api/registry/verify  { certificate_number, deceased_name, date_of_death, issuing_authority }
router.post("/verify", (req, res) => {
  const { certificate_number, deceased_name, date_of_death, issuing_authority, authority } = req.body;
  const cert = certificate_number || req.body.certificateNumber;

  if (!cert) return res.status(400).json({ verified: false, status: "INVALID", reason: "certificate_number required" });

  const record = MOCK_REGISTRY[cert.trim()];
  if (!record) return res.json({ verified: false, status: "NOT_FOUND", reason: "Certificate not found in registry" });
  if (record.status !== "VALID") return res.json({ verified: false, status: "INVALID", reason: "Registry marks invalid", registry_record: record });

  if (deceased_name && record.name.toLowerCase().trim() !== deceased_name.toLowerCase().trim()) {
    return res.json({ verified: false, status: "MISMATCH", reason: `Name mismatch (expected ${record.name})`, registry_record: record });
  }
  if (date_of_death && record.date_of_death !== date_of_death.trim()) {
    return res.json({ verified: false, status: "MISMATCH", reason: `Date mismatch (expected ${record.date_of_death})`, registry_record: record });
  }
  const authToCheck = issuing_authority || authority;
  if (authToCheck && record.authority.toLowerCase().trim() !== authToCheck.toLowerCase().trim()) {
    return res.json({ verified: false, status: "MISMATCH", reason: `Authority mismatch (expected ${record.authority})`, registry_record: record });
  }

  return res.json({
    verified: true,
    status: "VALID",
    name: record.name,
    date_of_death: record.date_of_death,
    authority: record.authority,
    registry_record: record,
    reason: "Certificate matched mock government registry",
  });
});

export default router;
