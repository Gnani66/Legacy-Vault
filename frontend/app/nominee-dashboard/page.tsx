"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NomineeLayout from "@/app/nominee/layout";
import { getApiUrl } from "@/lib/api";

type NomineeVaultData = {
  nominee?: {
    name: string;
    email: string;
    relation: string;
    accessLevel: string;
    isVerified: boolean;
  };
  assets: Array<{
    id: string;
    category: string;
    title: string;
    status: "locked" | "unlocked";
    accessCondition: string;
    details?: Record<string, string>;
  }>;
  documents: Array<{
    id: string;
    title: string;
    documentType: string;
    riskLevel?: string;
  }>;
  claims: Array<{
    id: string;
    certificateNumber: string;
    status: string;
    deceasedName: string;
    dateOfDeath?: string;
  }>;
  inheritanceStatus: string;
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
  vault: "M21 8v13H3V8M1 3h22v5H1zM10 12h4",
  bank: "M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M2 10l10-7 10 7z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  check: "M20 6L9 17l-5-5",
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  unlock: "M5 11h14v10H5zM16 11V7a4 4 0 0 0-8 0",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
};

function categoryIcon(cat: string) {
  switch (cat.toLowerCase()) {
    case "bank": return ICONS.bank;
    case "property": return ICONS.home;
    case "crypto": return ICONS.key;
    case "insurance": return ICONS.shield;
    default: return ICONS.file;
  }
}

export default function NomineeDashboardPage() {
  const [data, setData] = useState<NomineeVaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("legacy_nominee_token") ||
          window.localStorage.getItem("aegis_nominee_token")
        : null;

    if (!token) {
      fetch(`${getApiUrl()}/nominee/verify-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "sarah.nominee@example.com", otp: "123456" }),
      })
        .then((r) => r.json())
        .then((authData) => {
          if (authData?.token) {
            window.localStorage.setItem("legacy_nominee_token", authData.token);
            window.localStorage.setItem("aegis_nominee_token", authData.token);
            loadVault(authData.token);
          }
        })
        .catch(() => setLoading(false));
      return;
    }

    loadVault(token);

    function onSearch(e: Event) {
      setSearchQuery((e as CustomEvent<string>).detail || "");
    }
    window.addEventListener("lv:nominee_search", onSearch);
    return () => window.removeEventListener("lv:nominee_search", onSearch);
  }, []);

  function loadVault(authToken: string) {
    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((vaultData) => {
        if (vaultData) setData(vaultData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const assets = data?.assets || [];
  const documents = data?.documents || [];
  const claims = data?.claims || [];
  const hasVerifiedClaim =
    claims.some((c) => c.status === "verified") ||
    data?.inheritanceStatus === "Verified / Assets Unlocked";
  const unlockedAssetsCount = assets.filter((a) => a.status === "unlocked").length;

  const filteredAssets = searchQuery.trim()
    ? assets.filter((a) =>
        `${a.title} ${a.category}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : assets;

  return (
    <NomineeLayout>
      <div className="page-shell">
        {/* ── Page header ─────────────────────────────────────────── */}
        <header className="page-header">
          <div className="header-left">
            <h1>Overview</h1>
            <p className="page-description">
              Beneficiary access, asset release verification, and legacy records for{" "}
              <b>{data?.nominee?.name || "Sarah Jenkins"}</b>.
            </p>
          </div>
          <div className="header-actions">
            {!hasVerifiedClaim ? (
              <Link href="/nominee/claims" className="lv-btn lv-btn-primary">
                <Icon d={ICONS.shield} size={15} />
                Submit Death Certificate
              </Link>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                <Icon d={ICONS.check} size={14} />
                Verified & Released
              </span>
            )}
            <Link href="/nominee/assets" className="lv-btn lv-btn-secondary">
              <Icon d={ICONS.vault} size={15} />
              View Assets
            </Link>
          </div>
        </header>

        {/* ── Metric strip matching Owner Dashboard ───────────────── */}
        <section className="metric-strip" aria-label="Beneficiary summary">
          <div className="metric">
            <span className="metric-label">Allocated Assets</span>
            <strong className="metric-value">{loading ? "–" : assets.length}</strong>
            <span className="metric-context">
              {hasVerifiedClaim
                ? `${assets.length} unlocked & accessible`
                : `${unlockedAssetsCount} unlocked · ${assets.length - unlockedAssetsCount} locked`}
            </span>
          </div>

          <div className="metric">
            <span className="metric-label">Claim Status</span>
            <strong className="metric-value">
              {loading ? "–" : hasVerifiedClaim ? "Verified" : "Pending"}
            </strong>
            <span className="metric-context">
              {hasVerifiedClaim ? "Assets released" : "Death certificate required"}
            </span>
          </div>

          <div className="metric">
            <span className="metric-label">Accessible Documents</span>
            <strong className="metric-value">{loading ? "–" : documents.length}</strong>
            <span className="metric-context">Wills, deeds & policies shared</span>
          </div>

          <div className="metric">
            <span className="metric-label">Beneficiary Level</span>
            <strong className="metric-value" style={{ fontSize: "24px" }}>
              {loading ? "–" : data?.nominee?.accessLevel || "PRIMARY"}
            </strong>
            <span className="metric-context">
              {data?.nominee?.relation || "Designated heir"}
            </span>
          </div>
        </section>

        {/* ── Contingency Alert Banner (If certificate is pending) ─── */}
        {!hasVerifiedClaim && (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              padding: "20px 24px",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--ink)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon d={ICONS.lock} size={18} />
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--ink)" }}>
                  Official Death Certificate Required to Unlock Sensitive Records
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--body)", lineHeight: "1.5" }}>
                  Sensitive data such as bank account numbers, private keys, and title deeds remain encrypted
                  until an official certificate is verified against the civil registry.
                </p>
              </div>
            </div>
            <Link href="/nominee/claims" className="lv-btn lv-btn-primary">
              <Icon d={ICONS.upload} size={14} />
              Upload & Verify Certificate
            </Link>
          </div>
        )}

        {/* ── Main Dashboard Grid ─────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
          {/* Left Column: Allocated Assets & Documents */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Allocated Assets Panel */}
            <div className="panel" style={{ padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <h2 className="panel-title">Allocated Assets</h2>
                  <p className="panel-sub" style={{ marginTop: "2px" }}>
                    Assets designated to you by the estate owner
                  </p>
                </div>
                <Link
                  href="/nominee/assets"
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  View all <Icon d={ICONS.arrowRight} size={13} />
                </Link>
              </div>

              {filteredAssets.length === 0 ? (
                <div className="empty-message">No allocated assets found matching criteria.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {filteredAssets.slice(0, 4).map((asset) => {
                    const isUnlocked = hasVerifiedClaim || asset.status === "unlocked";
                    return (
                      <div
                        key={asset.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          border: "1px solid var(--line)",
                          borderRadius: "8px",
                          background: "#fff",
                          transition: "border-color 160ms ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              background: "var(--soft)",
                              border: "1px solid var(--line)",
                              display: "grid",
                              placeItems: "center",
                              color: "var(--ink)",
                            }}
                          >
                            <Icon d={categoryIcon(asset.category)} size={15} />
                          </span>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                              {asset.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "capitalize" }}>
                              {asset.category} · {asset.accessCondition || "Post-Verification Access"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: isUnlocked ? "#ecfdf5" : "#fffbeb",
                              color: isUnlocked ? "#065f46" : "#b45309",
                              border: isUnlocked ? "1px solid #10b981" : "1px solid #f59e0b",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Icon d={isUnlocked ? ICONS.unlock : ICONS.lock} size={11} />
                            {isUnlocked ? "Unlocked" : "Locked"}
                          </span>
                          <Link
                            href={`/nominee/assets?id=${asset.id}`}
                            className="lv-btn"
                            style={{
                              height: "30px",
                              minHeight: "30px",
                              padding: "0 10px",
                              fontSize: "12px",
                              border: "1px solid var(--line)",
                              background: "var(--canvas)",
                            }}
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accessible Vault Documents Panel */}
            <div className="panel" style={{ padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <h2 className="panel-title">Shared Vault Documents</h2>
                  <p className="panel-sub" style={{ marginTop: "2px" }}>
                    Legal wills, insurance policies, and ownership deeds
                  </p>
                </div>
                <Link
                  href="/nominee/documents"
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  View all <Icon d={ICONS.arrowRight} size={13} />
                </Link>
              </div>

              {documents.length === 0 ? (
                <div className="empty-message">No shared documents recorded.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        background: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            background: "var(--soft)",
                            border: "1px solid var(--line)",
                            display: "grid",
                            placeItems: "center",
                            color: "var(--ink)",
                          }}
                        >
                          <Icon d={ICONS.file} size={15} />
                        </span>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                            {doc.title || "Legal Instrument"}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {doc.documentType || "Official Record"}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/nominee/documents"
                        className="lv-btn"
                        style={{
                          height: "30px",
                          minHeight: "30px",
                          padding: "0 10px",
                          fontSize: "12px",
                          border: "1px solid var(--line)",
                          background: "var(--canvas)",
                        }}
                      >
                        Inspect
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Verification Engine & Guidance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Succession Protocol Tracker */}
            <div className="panel" style={{ padding: "24px" }}>
              <h2 className="panel-title" style={{ marginBottom: "4px" }}>
                Succession Protocol
              </h2>
              <p className="panel-sub" style={{ marginBottom: "20px" }}>
                Verification stages for asset release
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Step 1 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--ink)",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon d={ICONS.check} size={13} />
                  </span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
                      1. Nominee Authentication
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      Identity and email OTP verified.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: hasVerifiedClaim ? "var(--ink)" : "var(--line)",
                      color: hasVerifiedClaim ? "#fff" : "var(--muted)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon d={hasVerifiedClaim ? ICONS.check : ICONS.shield} size={13} />
                  </span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
                      2. Death Certificate Verification
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      {hasVerifiedClaim
                        ? "Verified against Civil Registration System."
                        : "Required: Upload official certificate."}
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: hasVerifiedClaim ? "var(--ink)" : "var(--line)",
                      color: hasVerifiedClaim ? "#fff" : "var(--muted)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon d={hasVerifiedClaim ? ICONS.check : ICONS.lock} size={13} />
                  </span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
                      3. Asset Release & Transfer
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      {hasVerifiedClaim
                        ? "Assets unlocked. Credentials accessible."
                        : "Protected until certificate approval."}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
                <Link
                  href="/nominee/claims"
                  className="lv-btn lv-btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Icon d={ICONS.shield} size={14} />
                  {hasVerifiedClaim ? "View Verified Claim" : "Go to Verification Console"}
                </Link>
              </div>
            </div>

            {/* Assistance & Guidance Card */}
            <div className="panel" style={{ padding: "24px" }}>
              <h2 className="panel-title" style={{ marginBottom: "4px" }}>
                Nominee Assistance
              </h2>
              <p className="panel-sub" style={{ marginBottom: "16px" }}>
                Support with claims and probate procedures
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  href="/nominee/assistant"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    background: "var(--soft)",
                    color: "var(--ink)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon d={ICONS.message} size={16} />
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>Ask AI Legal Assistant</span>
                  </div>
                  <Icon d={ICONS.arrowRight} size={13} />
                </Link>

                <Link
                  href="/nominee/guidance"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    background: "var(--soft)",
                    color: "var(--ink)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon d={ICONS.file} size={16} />
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>Read Claim Guidelines</span>
                  </div>
                  <Icon d={ICONS.arrowRight} size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NomineeLayout>
  );
}