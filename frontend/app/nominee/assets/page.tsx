"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/api";

type AllocatedAsset = {
  id: string;
  category: string;
  title: string;
  accessCondition: string;
  status: "locked" | "unlocked";
  details?: Record<string, string>;
  createdAt: string;
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
  bank: "M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M2 10l10-7 10 7z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  check: "M20 6L9 17l-5-5",
  copy: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 4h2a2 2 0 0 1 2 2v4M21 14H11a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  unlock: "M5 11h14v10H5zM16 11V7a4 4 0 0 0-8 0",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "bank", label: "Bank Accounts", icon: ICONS.bank },
  { id: "property", label: "Real Estate", icon: ICONS.home },
  { id: "crypto", label: "Digital Assets", icon: ICONS.key },
  { id: "insurance", label: "Insurance Policies", icon: ICONS.shield },
  { id: "legal", label: "Legal Wills & Trusts", icon: ICONS.file },
];

function categoryIcon(cat: string) {
  switch (cat.toLowerCase()) {
    case "bank": return ICONS.bank;
    case "property": return ICONS.home;
    case "crypto": return ICONS.key;
    case "insurance": return ICONS.shield;
    default: return ICONS.file;
  }
}

function NomineeAssetsContent() {
  const searchParams = useSearchParams();
  const requestedId = searchParams?.get("id") || "";

  const [assets, setAssets] = useState<AllocatedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeAsset, setActiveAsset] = useState<AllocatedAsset | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [inheritanceStatus, setInheritanceStatus] = useState("Pending Action");

  useEffect(() => {
    loadAssets();
  }, []);

  function loadAssets() {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("legacy_nominee_token") ||
          window.localStorage.getItem("aegis_nominee_token")
        : null;

    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load vault records");
        return res.json();
      })
      .then((data) => {
        if (data?.assets) {
          setAssets(data.assets);
          if (requestedId) {
            const found = data.assets.find((a: AllocatedAsset) => a.id === requestedId);
            if (found) setActiveAsset(found);
            else if (data.assets.length > 0) setActiveAsset(data.assets[0]);
          } else if (data.assets.length > 0) {
            setActiveAsset(data.assets[0]);
          }
        }
        if (data?.inheritanceStatus) {
          setInheritanceStatus(data.inheritanceStatus);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unable to fetch allocated assets.");
        setLoading(false);
      });
  }

  const isGloballyUnlocked =
    inheritanceStatus.toLowerCase().includes("verified") ||
    inheritanceStatus.toLowerCase().includes("unlocked");

  const filtered =
    selectedCategory === "all"
      ? assets
      : assets.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());

  function copyText(key: string, val: string) {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  return (
    <div className="page-shell">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-left">
          <h1>Allocated Assets</h1>
          <p className="page-description">
            Protected assets designated to your care by the estate owner.
          </p>
        </div>
        <div className="header-actions">
          {!isGloballyUnlocked && (
            <Link href="/nominee/claims" className="lv-btn lv-btn-primary">
              <Icon d={ICONS.shield} size={14} />
              Submit Death Certificate
            </Link>
          )}
        </div>
      </header>

      {/* ── Category Filter Pills ────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                height: "36px",
                padding: "0 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: isActive ? "600" : "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: isActive ? "1px solid var(--ink)" : "1px solid var(--line)",
                background: isActive ? "var(--ink)" : "#fff",
                color: isActive ? "#fff" : "var(--body)",
                cursor: "pointer",
                transition: "all 140ms ease",
              }}
            >
              {cat.icon && <Icon d={cat.icon} size={14} />}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Assets Master-Detail Layout ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr", gap: "24px" }}>
        {/* Left Column: Asset Card List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div className="panel" style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
              Loading assets...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-message">No assets found for the selected category.</div>
          ) : (
            filtered.map((asset) => {
              const isUnlocked = isGloballyUnlocked || asset.status === "unlocked";
              const isSelected = activeAsset?.id === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => setActiveAsset(asset)}
                  style={{
                    padding: "18px",
                    borderRadius: "10px",
                    background: "#fff",
                    border: isSelected ? "2px solid var(--ink)" : "1px solid var(--line)",
                    cursor: "pointer",
                    transition: "border-color 140ms ease, box-shadow 140ms ease",
                    boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "var(--soft)",
                          border: "1px solid var(--line)",
                          display: "grid",
                          placeItems: "center",
                          color: "var(--ink)",
                          flexShrink: 0,
                        }}
                      >
                        <Icon d={categoryIcon(asset.category)} size={16} />
                      </span>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--ink)" }}>
                          {asset.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "capitalize", marginTop: "2px" }}>
                          {asset.category} · {asset.accessCondition || "Certificate Verified"}
                        </div>
                      </div>
                    </div>

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
                        flexShrink: 0,
                      }}
                    >
                      <Icon d={isUnlocked ? ICONS.unlock : ICONS.lock} size={11} />
                      {isUnlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Asset Credentials & Details Inspector */}
        <div>
          {activeAsset ? (
            (() => {
              const isUnlocked = isGloballyUnlocked || activeAsset.status === "unlocked";
              const details = activeAsset.details || {};

              return (
                <div className="panel" style={{ padding: "28px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "20px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "8px",
                          background: "var(--ink)",
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Icon d={categoryIcon(activeAsset.category)} size={18} />
                      </span>
                      <div>
                        <h2 className="panel-title" style={{ fontSize: "18px" }}>
                          {activeAsset.title}
                        </h2>
                        <span style={{ fontSize: "12px", color: "var(--muted)", textTransform: "capitalize" }}>
                          Category: {activeAsset.category}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        background: isUnlocked ? "#ecfdf5" : "#fffbeb",
                        color: isUnlocked ? "#065f46" : "#b45309",
                        border: isUnlocked ? "1px solid #10b981" : "1px solid #f59e0b",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Icon d={isUnlocked ? ICONS.unlock : ICONS.lock} size={12} />
                      {isUnlocked ? "Ready to Claim" : "Certificate Required"}
                    </span>
                  </div>

                  {/* If Locked: Security Alert & Call-to-action */}
                  {!isUnlocked ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div
                        style={{
                          background: "var(--soft)",
                          border: "1px solid var(--line)",
                          borderRadius: "10px",
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "var(--ink)",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            margin: "0 auto 12px",
                          }}
                        >
                          <Icon d={ICONS.lock} size={20} />
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--ink)" }}>
                          Credentials Protected by Protocol
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--body)", margin: "8px 0 16px", lineHeight: "1.5" }}>
                          To prevent unauthorized transfers, sensitive account numbers, passcodes, and
                          recovery instructions remain encrypted until an official death certificate is verified.
                        </p>
                        <Link
                          href={`/nominee/claims?targetAssetId=${activeAsset.id}`}
                          className="lv-btn lv-btn-primary"
                          style={{ display: "inline-flex", margin: "0 auto" }}
                        >
                          <Icon d={ICONS.shield} size={14} />
                          Upload Death Certificate to Unlock
                        </Link>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                          Pre-Verification Metadata
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "var(--soft)", borderRadius: "6px", fontSize: "13px" }}>
                            <span style={{ color: "var(--muted)" }}>Condition</span>
                            <strong style={{ color: "var(--ink)" }}>{activeAsset.accessCondition || "Post-Verification Release"}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "var(--soft)", borderRadius: "6px", fontSize: "13px" }}>
                            <span style={{ color: "var(--muted)" }}>Status</span>
                            <strong style={{ color: "var(--ink)" }}>Encrypted / Awaiting Verification</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* If Unlocked: High-Contrast Credentials Table */
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div
                        style={{
                          background: "#ecfdf5",
                          border: "1px solid #10b981",
                          borderRadius: "8px",
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          color: "#065f46",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        <Icon d={ICONS.check} size={16} />
                        <span>Claim Verified: All credentials and legal documents have been decrypted.</span>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", marginBottom: "10px" }}>
                          Sensitive Asset Credentials
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {Object.entries(details).length === 0 ? (
                            <div style={{ padding: "12px", background: "var(--soft)", borderRadius: "6px", fontSize: "13px" }}>
                              Asset released. Contact executor for direct transfer documents.
                            </div>
                          ) : (
                            Object.entries(details).map(([key, val]) => (
                              <div
                                key={key}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "12px 14px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--line)",
                                  background: "#fff",
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>
                                    {key.replace(/([A-Z])/g, " $1")}
                                  </div>
                                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                                    {val}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => copyText(key, String(val))}
                                  style={{
                                    border: "1px solid var(--line)",
                                    borderRadius: "6px",
                                    background: "var(--soft)",
                                    padding: "6px 10px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "var(--ink)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <Icon d={copiedKey === key ? ICONS.check : ICONS.copy} size={13} />
                                  {copiedKey === key ? "Copied" : "Copy"}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <Link
                          href="/nominee/guidance"
                          className="lv-btn lv-btn-secondary"
                          style={{ flex: 1, justifyContent: "center" }}
                        >
                          Transfer Guidelines
                        </Link>
                        <Link
                          href="/nominee/assistant"
                          className="lv-btn lv-btn-primary"
                          style={{ flex: 1, justifyContent: "center" }}
                        >
                          Ask AI About Claim
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="panel" style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
              Select an asset from the left to view credentials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NomineeAssetsPage() {
  return (
    <Suspense fallback={<div className="page-shell"><p>Loading allocated assets...</p></div>}>
      <NomineeAssetsContent />
    </Suspense>
  );
}
