"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getApiUrl } from "@/lib/api";

type NomineeDocument = {
  id: string;
  title?: string;
  documentType?: string;
  inheritanceSummary?: string;
  riskLevel?: string;
  organization?: string;
  importantPoints?: string[];
  risks?: string[];
  insuranceInfo?: {
    organization?: string;
    nominee?: string;
    expiryDate?: string;
    riskLevel?: string;
  } | null;
};

type NomineeVault = {
  documents: NomineeDocument[];
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
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  check: "M20 6L9 17l-5-5",
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
};

export default function NomineeDocumentsPage() {
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem("legacy_nominee_token") ||
        window.localStorage.getItem("aegis_nominee_token") ||
        ""
  );
  const [vault, setVault] = useState<NomineeVault>({ documents: [], inheritanceStatus: "" });
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  const selectedDocument = useMemo(
    () => vault.documents.find((document) => document.id === selectedId) || vault.documents[0],
    [selectedId, vault.documents]
  );

  const documentTypes = useMemo(() => {
    const types = new Set(vault.documents.map((d) => d.documentType || "Other"));
    return ["all", ...Array.from(types)];
  }, [vault.documents]);

  const filteredDocuments = useMemo(() => {
    if (filterType === "all") return vault.documents;
    return vault.documents.filter((d) => (d.documentType || "Other") === filterType);
  }, [vault.documents, filterType]);

  useEffect(() => {
    let activeToken = token;
    if (!activeToken && typeof window !== "undefined") {
      activeToken =
        window.localStorage.getItem("legacy_nominee_token") ||
        window.localStorage.getItem("aegis_nominee_token") ||
        "";
    }
    if (!activeToken) {
      setLoading(false);
      return;
    }
    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load shared records");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setVault(data);
          if (data.documents?.length) setSelectedId(data.documents[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load documents.");
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="page-shell">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-left">
          <h1>Shared Vault Records</h1>
          <p className="page-description">
            Legal wills, property deeds, insurance policies, and succession directives.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/nominee/assistant" className="lv-btn lv-btn-secondary">
            <Icon d={ICONS.message} size={14} />
            Ask AI About Documents
          </Link>
        </div>
      </header>

      {/* ── Filter Pills ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
        {documentTypes.map((type) => {
          const isActive = filterType === type;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
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
                textTransform: "capitalize",
              }}
            >
              {type === "all" ? "All Documents" : type}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="panel" style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
          Loading shared documents...
        </div>
      ) : vault.documents.length === 0 ? (
        <div className="empty-message">No documents are shared with your access level.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "24px" }}>
          {/* Left: Document List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredDocuments.map((doc) => {
              const isSelected = selectedDocument?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedId(doc.id)}
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    background: "#fff",
                    border: isSelected ? "2px solid var(--ink)" : "1px solid var(--line)",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.05)" : "0 1px 2px rgba(0,0,0,0.02)",
                    transition: "all 140ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
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
                        <Icon d={ICONS.file} size={16} />
                      </span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                          {doc.title || "Legal Document"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                          {doc.documentType || "Official Record"} · {doc.organization || "Private"}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: doc.riskLevel === "High" ? "#fef2f2" : "#f0fdf4",
                        color: doc.riskLevel === "High" ? "#b91c1c" : "#15803d",
                        border: doc.riskLevel === "High" ? "1px solid #ef4444" : "1px solid #86efac",
                      }}
                    >
                      {doc.riskLevel || "Verified"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Document Inspector */}
          <div>
            {selectedDocument ? (
              <div className="panel" style={{ padding: "28px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "16px",
                    marginBottom: "20px",
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
                      <Icon d={ICONS.file} size={18} />
                    </span>
                    <div>
                      <h2 className="panel-title" style={{ fontSize: "18px" }}>
                        {selectedDocument.title || "Document Details"}
                      </h2>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {selectedDocument.documentType || "Official Instrument"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ padding: "10px 14px", background: "var(--soft)", borderRadius: "8px", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>Organization</span>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginTop: "2px" }}>
                      {selectedDocument.organization || selectedDocument.insuranceInfo?.organization || "Estate Private"}
                    </div>
                  </div>

                  <div style={{ padding: "10px 14px", background: "var(--soft)", borderRadius: "8px", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>Named Beneficiary</span>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginTop: "2px" }}>
                      {selectedDocument.insuranceInfo?.nominee || "Primary Designated Nominee"}
                    </div>
                  </div>
                </div>

                {/* Inheritance Summary */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                    AI Inheritance Summary
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--soft)",
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "var(--ink)",
                    }}
                  >
                    {selectedDocument.inheritanceSummary || "This legal instrument specifies succession guidelines and release triggers for named heirs."}
                  </div>
                </div>

                {/* Important Points */}
                {selectedDocument.importantPoints && selectedDocument.importantPoints.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                      Key Clauses & Directives
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {selectedDocument.importantPoints.map((pt, i) => (
                        <li key={i} style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.5" }}>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
                  <Link href="/nominee/assistant" className="lv-btn lv-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                    <Icon d={ICONS.message} size={14} />
                    Clarify with AI Assistant
                  </Link>
                  <Link href="/nominee/claims" className="lv-btn lv-btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                    <Icon d={ICONS.shield} size={14} />
                    File Succession Claim
                  </Link>
                </div>
              </div>
            ) : (
              <div className="panel" style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                Select a document from the list.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}