"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/api";

type ClaimRecord = {
  id: string;
  certificateNumber: string;
  deceasedName: string;
  dateOfDeath: string;
  authority: string;
  status: "verified" | "pending" | "rejected";
  unlockedAssets?: string[];
  createdAt: string;
  aiResult?: any;
};

/* ── Minimal SVG line icons matching Owner Dashboard ── */
function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  check: "M20 6L9 17l-5-5",
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  vault: "M21 8v13H3V8M1 3h22v5H1zM10 12h4",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

const PRESETS = [
  {
    label: "DC-DEMO-001 (John Doe · Municipal Auth)",
    certNum: "DC-DEMO-001",
    name: "John Doe",
    date: "2026-08-20",
    authority: "Example Municipal Authority",
  },
  {
    label: "DC-DEMO-002 (Jane Doe · Municipal Auth)",
    certNum: "DC-DEMO-002",
    name: "Jane Doe",
    date: "2026-08-21",
    authority: "Example Municipal Authority",
  },
  {
    label: "DC-DEMO-003 (Robert Smith · Surat Corp)",
    certNum: "DC-DEMO-003",
    name: "Robert Smith",
    date: "2026-07-15",
    authority: "Surat Municipal Corporation",
  },
];

function ClaimsContent() {
  const searchParams = useSearchParams();
  const targetAssetId = searchParams?.get("targetAssetId") || "";

  const [certNumber, setCertNumber] = useState("DC-DEMO-001");
  const [deceasedName, setDeceasedName] = useState("John Doe");
  const [dateOfDeath, setDateOfDeath] = useState("2026-08-20");
  const [authority, setAuthority] = useState("Example Municipal Authority");
  const [file, setFile] = useState<File | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState<number>(0);
  const [result, setResult] = useState<ClaimRecord | null>(null);
  const [error, setError] = useState("");
  const [claims, setClaims] = useState<ClaimRecord[]>([]);

  useEffect(() => {
    loadExistingClaims();
  }, []);

  function loadExistingClaims() {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("legacy_nominee_token") ||
          window.localStorage.getItem("aegis_nominee_token")
        : null;

    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.claims) setClaims(data.claims);
      })
      .catch(() => {});
  }

  function applyPreset(p: (typeof PRESETS)[0]) {
    setCertNumber(p.certNum);
    setDeceasedName(p.name);
    setDateOfDeath(p.date);
    setAuthority(p.authority);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setVerifying(true);
    setVerifyStep(1);

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("legacy_nominee_token") ||
          window.localStorage.getItem("aegis_nominee_token")
        : null;

    try {
      setTimeout(() => setVerifyStep(2), 800);
      setTimeout(() => setVerifyStep(3), 1600);

      const formData = new FormData();
      formData.append("certificateNumber", certNumber.trim());
      formData.append("deceasedName", deceasedName.trim());
      formData.append("dateOfDeath", dateOfDeath.trim());
      formData.append("authority", authority.trim());
      if (targetAssetId) formData.append("targetAssetId", targetAssetId);
      if (file) formData.append("deathCertificate", file);

      const res = await fetch(`${getApiUrl()}/nominee/claim-with-certificate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Verification failed");
      }

      setResult(data.claim);
      setClaims((prev) => [data.claim, ...prev]);
    } catch (err: any) {
      setError(err.message || "An error occurred during verification.");
    } finally {
      setVerifying(false);
      setVerifyStep(0);
    }
  }

  const hasAnyVerified = claims.some((c) => c.status === "verified") || Boolean(result);

  return (
    <div className="page-shell">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-left">
          <h1>Death Certificate & Claims Verification</h1>
          <p className="page-description">
            Submit and cross-reference official civil registration records to trigger automated asset release.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/nominee/assets" className="lv-btn lv-btn-secondary">
            <Icon d={ICONS.vault} size={14} />
            View Allocated Assets
          </Link>
        </div>
      </header>

      {/* ── Success Banner if Claim Just Verified ────────────────── */}
      {result && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #10b981",
            borderRadius: "10px",
            padding: "20px 24px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#10b981",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon d={ICONS.check} size={18} />
            </span>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#065f46" }}>
                Certificate {result.certificateNumber} Verified Successfully!
              </div>
              <div style={{ fontSize: "13px", color: "#047857", marginTop: "2px" }}>
                Deceased name: <b>{result.deceasedName}</b> · Registry Status: <b>VALID</b> · All allocated assets unlocked.
              </div>
            </div>
          </div>
          <Link href="/nominee/assets" className="lv-btn lv-btn-primary">
            Access Unlocked Assets <Icon d={ICONS.arrowRight} size={13} />
          </Link>
        </div>
      )}

      {/* ── Two-Column Grid ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px" }}>
        {/* Left Column: Form & Presets */}
        <div className="panel" style={{ padding: "28px" }}>
          <div style={{ marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--line)" }}>
            <h2 className="panel-title">Submit Certificate</h2>
            <p className="panel-sub" style={{ marginTop: "2px" }}>
              AI extracts watermarks, digital stamps, and verifies against the live civil registry.
            </p>
          </div>

          {/* Preset Buttons */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Sample Official Certificate Presets:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {PRESETS.map((p) => {
                const isActive = certNumber === p.certNum;
                return (
                  <button
                    key={p.certNum}
                    type="button"
                    onClick={() => applyPreset(p)}
                    style={{
                      fontSize: "12px",
                      fontWeight: isActive ? "600" : "500",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: isActive ? "1px solid var(--ink)" : "1px solid var(--line)",
                      background: isActive ? "var(--ink)" : "#fff",
                      color: isActive ? "#fff" : "var(--body)",
                      cursor: "pointer",
                      transition: "all 140ms ease",
                    }}
                  >
                    {p.certNum} ({p.name})
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* File Upload Dropzone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginBottom: "6px" }}>
                Death Certificate File (PDF or Image)
              </label>
              <div
                style={{
                  border: "1px dashed #d8d3ca",
                  borderRadius: "10px",
                  padding: "24px 20px",
                  textAlign: "center",
                  background: "#fbfaf8",
                  cursor: "pointer",
                  transition: "border-color 140ms ease",
                }}
                onClick={() => document.getElementById("dc-file-input")?.click()}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--ink)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <Icon d={ICONS.upload} size={18} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                  {file ? file.name : "Click to select death-certificate.pdf"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                  PDF, PNG, JPG up to 25MB · Automatic seal and stamp detection
                </div>
                <input
                  id="dc-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginBottom: "6px" }}>
                Certificate Registration Number
              </label>
              <input
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="e.g. DC-DEMO-001"
                required
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "#fff",
                  padding: "0 12px",
                  color: "var(--ink)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginBottom: "6px" }}>
                  Deceased Full Name
                </label>
                <input
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "#fff",
                    padding: "0 12px",
                    color: "var(--ink)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginBottom: "6px" }}>
                  Date of Death
                </label>
                <input
                  type="date"
                  value={dateOfDeath}
                  onChange={(e) => setDateOfDeath(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "#fff",
                    padding: "0 12px",
                    color: "var(--ink)",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginBottom: "6px" }}>
                Issuing Municipal Authority
              </label>
              <input
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="e.g. Municipal Corporation of Greater Mumbai"
                required
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "#fff",
                  padding: "0 12px",
                  color: "var(--ink)",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "12px 14px",
                  background: "#fef2f2",
                  border: "1px solid #ef4444",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Icon d={ICONS.alert} size={15} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="lv-btn lv-btn-primary"
              style={{
                width: "100%",
                height: "44px",
                justifyContent: "center",
                marginTop: "8px",
                fontSize: "14px",
              }}
            >
              <Icon d={ICONS.shield} size={16} />
              {verifying ? "Executing Verification Protocol..." : "Verify Certificate & Unlock Assets"}
            </button>
          </form>
        </div>

        {/* Right Column: Verification Stages & Claims History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Verification Engine Pipeline Visualizer */}
          <div className="panel" style={{ padding: "28px" }}>
            <h2 className="panel-title" style={{ marginBottom: "4px" }}>
              Automated Verification Pipeline
            </h2>
            <p className="panel-sub" style={{ marginBottom: "20px" }}>
              Multi-signature verification against official authorities
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Stage 1 */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: verifyStep >= 1 ? "var(--soft)" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: verifyStep >= 1 ? "var(--ink)" : "var(--line)",
                    color: verifyStep >= 1 ? "#fff" : "var(--muted)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {verifyStep > 1 || hasAnyVerified ? <Icon d={ICONS.check} size={14} /> : "1"}
                </span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                    AI OCR & Tamper Analysis
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {verifyStep >= 1 ? "Extracting official seals & stamps..." : "Extracts watermarks and seals"}
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: verifyStep >= 2 ? "var(--soft)" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: verifyStep >= 2 ? "var(--ink)" : "var(--line)",
                    color: verifyStep >= 2 ? "#fff" : "var(--muted)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {verifyStep > 2 || hasAnyVerified ? <Icon d={ICONS.check} size={14} /> : "2"}
                </span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                    Civil Registry Validation
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {verifyStep >= 2 ? "Cross-referencing government records..." : "Cross-referenced against official registry"}
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: verifyStep >= 3 ? "var(--soft)" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: verifyStep >= 3 || hasAnyVerified ? "var(--ink)" : "var(--line)",
                    color: verifyStep >= 3 || hasAnyVerified ? "#fff" : "var(--muted)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {hasAnyVerified ? <Icon d={ICONS.check} size={14} /> : "3"}
                </span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                    Contingency Protocol Execution
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {hasAnyVerified ? "Assets unlocked and released." : "Decrypts sensitive asset credentials"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Claims Records */}
          <div className="panel" style={{ padding: "28px" }}>
            <h2 className="panel-title" style={{ marginBottom: "4px" }}>
              Filed Verification Claims
            </h2>
            <p className="panel-sub" style={{ marginBottom: "16px" }}>
              History of death certificates submitted for this vault
            </p>

            {claims.length === 0 ? (
              <div className="empty-message">No death certificates filed yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    style={{
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", fontFamily: "var(--font-mono)" }}>
                          {claim.certificateNumber}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: claim.status === "verified" ? "#ecfdf5" : "#fffbeb",
                            color: claim.status === "verified" ? "#065f46" : "#b45309",
                            border: claim.status === "verified" ? "1px solid #10b981" : "1px solid #f59e0b",
                          }}
                        >
                          {claim.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                        Deceased: {claim.deceasedName} · {claim.authority}
                      </div>
                    </div>

                    <Link
                      href="/nominee/assets"
                      className="lv-btn lv-btn-secondary"
                      style={{ height: "30px", minHeight: "30px", padding: "0 10px", fontSize: "12px" }}
                    >
                      View Assets
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NomineeClaimsPage() {
  return (
    <Suspense fallback={<div className="page-shell"><p>Loading claims console...</p></div>}>
      <ClaimsContent />
    </Suspense>
  );
}
