"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddAssetModal, { AssetRecord } from "@/components/AddAssetModal";
import { cachedFetch, clearApiCache, getApiUrl } from "@/lib/api";

type Nominee = { id: string; name: string; relation: string; isVerified?: boolean };
type VaultDocument = { id: string; title?: string; documentType?: string; createdAt: string };
type AuditLog = { id: string; action: string; createdAt: string };
type ContinuityScore = { continuityScore: number; factors?: Record<string, boolean> };
type Asset = {
  id: string;
  category: string;
  title: string;
  nomineeId?: string;
  accessCondition?: string;
  createdAt: string;
  details?: Record<string, string>;
};

type UploadState = {
  name: string;
  phase: "uploading" | "processing" | "done" | "error";
  docType?: string;
  message?: string;
};

const ASSET_CATEGORIES = [
  { id: "bank", label: "Bank Accounts" },
  { id: "property", label: "Property" },
  { id: "legal", label: "Legal Docs" },
  { id: "crypto", label: "Crypto" },
  { id: "insurance", label: "Insurance" },
];

/* ── Minimal line icons ────────────────────────────────────────── */

function Icon({ d, size = 15 }: { d: string; size?: number }) {
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
  bank: "M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M2 10l10-7 10 7z",
  chart: "M3 3v18h18M8 17V9M13 17V5M18 17v-6",
  key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  dot: "M12 12h.01",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  check: "M20 6L9 17l-5-5",
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  plus: "M12 5v14M5 12h14",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};

function categoryIcon(id: string) {
  switch (id) {
    case "documents": return ICONS.file;
    case "bank": return ICONS.bank;
    case "investments": return ICONS.chart;
    case "crypto": return ICONS.key;
    case "insurance": return ICONS.shield;
    case "property": return ICONS.home;
    default: return ICONS.dot;
  }
}

function assetTitle(asset: Asset): string {
  const details = asset.details;
  if (details) {
    return (
      details.documentTitle ||
      details.bankName ||
      details.walletName ||
      details.provider ||
      details.propertyAddress ||
      details.title ||
      asset.title
    );
  }
  return asset.title || ASSET_CATEGORIES.find((c) => c.id === asset.category)?.label || asset.category;
}

function categoryLabel(id: string) {
  return ASSET_CATEGORIES.find((c) => c.id === id)?.label || id;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function relativeStamp(value: string) {
  try {
    const date = new Date(value);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const t = date.getTime();
    const day = 86_400_000;
    const time = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
    if (t >= startOfToday) return `Today · ${time}`;
    if (t >= startOfToday - day) return `Yesterday · ${time}`;
    return formatDate(value);
  } catch {
    return value;
  }
}

function humanizeAction(action: string) {
  const text = action.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function activityIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes("upload") || a.includes("document")) return ICONS.file;
  if (a.includes("nominee")) return ICONS.users;
  if (a.includes("asset")) return ICONS.bank;
  if (a.includes("security") || a.includes("password") || a.includes("settings")) return ICONS.shield;
  if (a.includes("create") || a.includes("signup") || a.includes("register")) return ICONS.plus;
  return ICONS.activity;
}

export default function OverviewPage() {
  const [mounted, setMounted] = useState(false);
  const [token] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [wallet, setWallet] = useState("");
  const [score, setScore] = useState<ContinuityScore>({ continuityScore: 0 });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastUpload, setLastUpload] = useState<UploadState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    const token = window.localStorage.getItem("legacy_token") || "";
    if (!token) {
      window.location.href = "/signin";
      return;
    }

    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${token}` };
    const opts = { headers, signal: controller.signal } as RequestInit;

    Promise.allSettled([
      cachedFetch<ContinuityScore>(`${getApiUrl()}/continuity-score`, opts),
      cachedFetch<Asset[]>(`${getApiUrl()}/assets`, opts),
      cachedFetch<Nominee[]>(`${getApiUrl()}/nominees`, opts),
      cachedFetch<VaultDocument[]>(`${getApiUrl()}/vault-documents`, opts),
      cachedFetch<AuditLog[]>(`${getApiUrl()}/audit-logs`, opts),
    ]).then((results) => {
      if (controller.signal.aborted) return;
      const [scoreRes, assetsRes, nomRes, docRes, auditRes] = results;
      if (scoreRes.status === "fulfilled" && scoreRes.value) setScore(scoreRes.value);
      if (assetsRes.status === "fulfilled" && assetsRes.value) setAssets(assetsRes.value);
      if (nomRes.status === "fulfilled" && nomRes.value) setNominees(nomRes.value);
      if (docRes.status === "fulfilled" && docRes.value) setDocuments(docRes.value);
      if (auditRes.status === "fulfilled" && auditRes.value) setActivity(auditRes.value);
      setLoading(false);
    });

    try {
      const ethereum = (window as { ethereum?: { request?: (args: { method: string }) => Promise<string[]> } }).ethereum;
      if (ethereum?.request) {
        ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
          if (accounts?.[0]) setWallet(accounts[0]);
        });
      }
    } catch {}

    return () => controller.abort();
  }, [token]);

  /* Header search wiring (from app shell) */
  useEffect(() => {
    function onSearch(e: Event) {
      setQuery((e as CustomEvent<string>).detail || "");
    }
    window.addEventListener("lv:search", onSearch);
    return () => window.removeEventListener("lv:search", onSearch);
  }, []);

  async function handleQuickUpload(file: File) {
    if (!token || isUploading) return;
    const body = new FormData();
    body.append("document", file);
    setIsUploading(true);
    setLastUpload({ name: file.name, phase: "uploading" });
    try {
      const response = await fetch(`${getApiUrl()}/ai-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json();
      if (response.ok) {
        setLastUpload({
          name: file.name,
          phase: "done",
          docType: data?.vaultDocument?.aiAnalysis?.documentType || data?.vaultDocument?.documentType,
        });
        clearApiCache("vault-documents");
        clearApiCache("continuity-score");
        setDocuments((prev) => [data.vaultDocument, ...prev]);
      } else {
        setLastUpload({ name: file.name, phase: "error", message: data.message || "Upload failed" });
      }
    } catch {
      setLastUpload({ name: file.name, phase: "error", message: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  }

  function handleAddAsset(asset: AssetRecord) {
    setAssets((prev) => [
      {
        id: asset.id,
        category: asset.category,
        title: asset.title,
        nomineeId: asset.nomineeId,
        createdAt: asset.createdAt,
      },
      ...prev,
    ]);
    clearApiCache("assets");
    clearApiCache("continuity-score");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleQuickUpload(file);
  }

  if (!mounted) return null;

  /* Continuity pillars — derived from real vault state, 20 pts each */
  const pillars: { label: string; points: number }[] = [
    { label: "Assets", points: assets.length > 0 ? 20 : 0 },
    { label: "Documents", points: documents.length > 0 ? 20 : 0 },
    { label: "Nominees", points: nominees.length > 0 ? 20 : 0 },
    { label: "Rules", points: score.factors?.emergencyContactExists ? 20 : 0 },
    { label: "Security", points: Boolean(wallet) || Boolean(score.factors?.willUploaded) ? 20 : 0 },
  ];

  const filteredAssets = query.trim()
    ? assets.filter((a) =>
        `${assetTitle(a)} ${categoryLabel(a.category)}`.toLowerCase().includes(query.trim().toLowerCase())
      )
    : assets;

  return (
    <div className="page-shell">
      {/* ── Page header ─────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-left">
          <h1>Overview</h1>
          <p className="page-description">Your digital legacy, secured and organized.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="lv-btn lv-btn-primary" onClick={() => setModalOpen(true)}>
            <Icon d={ICONS.plus} size={14} />
            Add asset
          </button>
        </div>
      </header>

      {/* ── Metrics strip ───────────────────────────────────────── */}
      <section className="metric-strip" aria-label="Vault summary">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div className="metric" key={i}>
              <span className="metric-label skeleton-line" />
              <strong className="metric-value skeleton-line" />
            </div>
          ))
        ) : (
          <>
            <div className="metric">
              <span className="metric-label">Assets secured</span>
              <strong className="metric-value">{assets.length}</strong>
              <span className="metric-context">
                {assets.length
                  ? `${new Set(assets.map((a) => a.category)).size} categor${assets.length === 1 ? "y" : "ies"}`
                  : "No assets yet"}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Documents</span>
              <strong className="metric-value">{documents.length}</strong>
              <span className="metric-context">{documents.length ? "OCR processed" : "Vault empty"}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Nominees</span>
              <strong className="metric-value">{nominees.length}</strong>
              <span className="metric-context">
                {nominees.length
                  ? nominees.some((n) => n.isVerified)
                    ? "Verified"
                    : "Verification pending"
                  : "None configured"}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Continuity score</span>
              <strong className="metric-value">
                {score.continuityScore}
                <em>/100</em>
              </strong>
              <span className="metric-context">
                {score.continuityScore >= 80 ? "Vault ready" : score.continuityScore >= 40 ? "In progress" : "Needs setup"}
              </span>
            </div>
          </>
        )}
      </section>

      {/* ── Quick upload ────────────────────────────────────────── */}
      <section className="panel upload-module" aria-label="Quick upload">
        <div className="upload-head">
          <div>
            <h2 className="panel-title">Quick upload</h2>
            <p className="panel-sub">Secure a document or asset. OCR, categorization and risk analysis run automatically.</p>
          </div>
          <div className="upload-actions">
            <label className="lv-btn lv-btn-secondary">
              <Icon d={ICONS.upload} size={14} />
              Upload document
              <input
                type="file"
                hidden
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleQuickUpload(file);
                }}
              />
            </label>
            <button type="button" className="lv-btn lv-btn-secondary" onClick={() => setModalOpen(true)}>
              Add asset
            </button>
          </div>
        </div>

        <div
          className={`upload-dropzone${isDragOver ? " drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Drop a document to upload"
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== "INPUT") {
              (e.currentTarget.querySelector("input[type=file]") as HTMLInputElement | null)?.click();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              (e.currentTarget.querySelector("input[type=file]") as HTMLInputElement | null)?.click();
            }
          }}
        >
          <input
            type="file"
            hidden
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleQuickUpload(file);
            }}
          />
          <span className="upload-icon">
            <Icon d={ICONS.upload} size={16} />
          </span>
          <span className="upload-hint">Drop a document here</span>
          <span className="upload-browse">or browse your files</span>
          <span className="upload-supported">PDF, PNG, JPG · Max 25 MB</span>
        </div>

        {lastUpload && (
          <div className={`upload-state ${lastUpload.phase}`}>
            <span className={`upload-state-icon${lastUpload.phase === "error" ? " error" : ""}`}>
              <Icon d={lastUpload.phase === "error" ? ICONS.alert : ICONS.file} size={14} />
            </span>
            <div className="upload-state-body">
              <span className="upload-state-name">{lastUpload.name}</span>
              {lastUpload.phase === "done" ? (
                <span className="upload-state-meta success">
                  <Icon d={ICONS.check} size={12} />
                  {lastUpload.docType ? `${lastUpload.docType} · ` : ""}Verified &amp; stored
                </span>
              ) : lastUpload.phase === "error" ? (
                <span className="upload-state-meta error">{lastUpload.message}</span>
              ) : (
                <span className="upload-state-meta">
                  {lastUpload.phase === "uploading" ? "Uploading…" : "OCR &amp; verification in progress…"}
                </span>
              )}
            </div>
            {lastUpload.phase !== "done" && lastUpload.phase !== "error" && (
              <div className="upload-progress">
                <span />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Asset summary + Nominee status ──────────────────────── */}
      <div className="overview-grid overview-grid-primary">
        <section aria-label="Asset summary">
          <div className="section-head">
            <h2>Asset summary</h2>
            <Link href="/dashboard/vault" className="text-link">View vault</Link>
          </div>

          {assets.length ? (
            <div className="panel table-panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="col-right">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.slice(0, 6).map((asset) => (
                    <tr key={asset.id}>
                      <td className="cell-strong">{assetTitle(asset)}</td>
                      <td>{categoryLabel(asset.category)}</td>
                      <td><span className="status-chip ok">Secured</span></td>
                      <td className="col-right cell-muted">{formatDate(asset.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {query && !filteredAssets.length && (
                <p className="table-empty">No assets match &quot;{query}&quot;.</p>
              )}
            </div>
          ) : (
            <div className="panel empty-panel">
              <h3 className="empty-title">Your vault is ready.</h3>
              <p className="empty-copy">Add your first asset to begin securing your digital legacy.</p>
              <button type="button" className="lv-btn lv-btn-primary" onClick={() => setModalOpen(true)}>
                Add new asset
              </button>
              <div className="empty-categories" aria-label="Asset categories">
                {["documents", "bank", "investments", "crypto", "insurance", "property", "other"].map((id) => (
                  <span className="category-chip" key={id}>
                    <Icon d={categoryIcon(id)} size={13} />
                    {id === "documents" ? "Documents" : categoryLabel(id).replace(" Accounts", "")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section aria-label="Nominee status">
          <div className="section-head">
            <h2>Nominee status</h2>
            <Link href="/dashboard/nominees" className="text-link">Manage</Link>
          </div>

          {nominees.length ? (
            <div className="panel list-panel">
              {nominees.map((n) => (
                <div className="nominee-row" key={n.id}>
                  <span className="avatar sm">{(n.name || "?").charAt(0).toUpperCase()}</span>
                  <div className="nominee-info">
                    <strong>{n.name}</strong>
                    <span className="nominee-relation">{n.relation}</span>
                  </div>
                  <div className="nominee-flags">
                    <span className={`status-chip ${n.isVerified ? "ok" : "warn"}`}>
                      {n.isVerified ? "Verified" : "Pending"}
                    </span>
                    <span className={`status-chip ${n.isVerified ? "ok" : "muted"}`}>
                      {n.isVerified ? "Access active" : "Access locked"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel empty-panel">
              <h3 className="empty-title">No nominees configured</h3>
              <p className="empty-copy">Your vault currently has no designated recipients.</p>
              <Link href="/dashboard/nominees" className="lv-btn lv-btn-secondary">
                Add nominee
              </Link>
              <p className="empty-note">
                <Icon d={ICONS.shield} size={13} />
                Nominees are required before inheritance rules can be activated.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── Recent activity + Continuity score ──────────────────── */}
      <div className="overview-grid overview-grid-secondary">
        <section aria-label="Recent activity">
          <div className="section-head">
            <h2>Recent activity</h2>
            <Link href="/dashboard/audit" className="text-link">Full audit trail</Link>
          </div>

          <div className="panel list-panel">
            {loading ? (
              [0, 1, 2].map((i) => <div className="skeleton-row" key={i} />)
            ) : activity.length ? (
              activity.slice(0, 8).map((log) => (
                <div className="activity-row" key={log.id}>
                  <span className="activity-icon">
                    <Icon d={activityIcon(log.action)} size={13} />
                  </span>
                  <div className="activity-body">
                    <span className="activity-title">{humanizeAction(log.action)}</span>
                    <time className="activity-time">{relativeStamp(log.createdAt)}</time>
                  </div>
                </div>
              ))
            ) : (
              <p className="panel-blank">No activity yet. Actions in your vault are recorded here in a tamper-proof trail.</p>
            )}
          </div>
        </section>

        <section aria-label="Continuity score">
          <div className="section-head">
            <h2>Continuity score</h2>
          </div>

          <div className="panel continuity-panel">
            <p className="continuity-status">
              {score.continuityScore >= 80 ? "Vault ready" : score.continuityScore >= 40 ? "In progress" : "Needs setup"}
            </p>
            <div className="continuity-top">
              <div className="continuity-score">
                <strong>{score.continuityScore}</strong>
                <em>/100</em>
              </div>
              <div className="continuity-readiness">
                <span>Vault readiness</span>
                <strong>{score.continuityScore}%</strong>
              </div>
            </div>
            <div className="continuity-bar">
              <span style={{ width: `${score.continuityScore}%` }} />
            </div>
            <ul className="continuity-pillars">
              {pillars.map((p) => (
                <li key={p.label}>
                  <span className="pillar-label">{p.label}</span>
                  <span className="pillar-track">
                    <i style={{ width: `${(p.points / 20) * 100}%` }} />
                  </span>
                  <span className={`pillar-points${p.points ? " done" : ""}`}>{p.points}/20</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <AddAssetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAssetCreated={handleAddAsset}
      />
    </div>
  );
}
