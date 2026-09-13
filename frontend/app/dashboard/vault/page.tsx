"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import AddAssetModal, { AssetRecord } from "@/components/AddAssetModal";
import { cachedFetch, clearApiCache, getApiUrl } from "@/lib/api";
import styles from "./vault.module.css";

type AiAnalysis = {
  documentType?: string;
  organization?: string;
  nominee?: string;
  riskLevel?: "Low" | "Medium" | "High";
  summary?: string;
};

type VaultDocument = {
  id: string;
  title?: string;
  documentType?: string;
  extractedText: string;
  aiAnalysis: AiAnalysis;
  createdAt: string;
};

type Asset = {
  id: string;
  category: string;
  title?: string;
  nomineeId?: string;
  accessCondition?: string;
  createdAt: string;
  details?: Record<string, string>;
};

const documentTypes = ["All", "Insurance", "Will", "Property Paper", "Property", "Bank Statement", "Investment", "Legal", "Tax", "Other"];
const riskFilters = ["All", "High", "Medium", "Low"];

const CATEGORY_LABELS: Record<string, string> = {
  bank: "Bank",
  property: "Property",
  legal: "Legal",
  crypto: "Digital",
  insurance: "Insurance",
};

const ICONS = {
  plus: "M12 5v14M5 12h14",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  document: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  bank: "M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M2 10l10-7 10 7z",
  property: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6",
  legal: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  crypto: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  insurance: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function assetTitle(asset: Asset) {
  const details = asset.details || {};
  return (
    asset.title ||
    details.documentTitle ||
    details.bankName ||
    details.walletName ||
    details.provider ||
    details.propertyAddress ||
    details.title ||
    CATEGORY_LABELS[asset.category] ||
    "Asset"
  );
}

function assetSubtitle(asset: Asset) {
  const details = asset.details || {};
  return details.supportingDocument || details.accountType || details.propertyType || details.assetType || "Manual record";
}

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] || category;
}

function riskClass(risk?: string) {
  if (risk === "High") return "status-pill danger";
  if (risk === "Low") return "status-pill success";
  return "status-pill warning";
}

export default function VaultPage() {
  const [token, setToken] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [typeFilter, setTypeFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [uploadStatus, setUploadStatus] = useState("Ready");
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      const t = window.localStorage.getItem("legacy_token") || "";
      if (t) setToken(t);
      return;
    }

    const controller = new AbortController();
    const opts = { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal };

    cachedFetch<VaultDocument[]>(`${getApiUrl()}/vault-documents`, opts).then((data) => {
      if (controller.signal.aborted) return;
      setDocuments(data || []);
      if (data?.[0]?.id) setSelectedId((prev) => prev || data[0].id);
    });

    cachedFetch<Asset[]>(`${getApiUrl()}/assets`, opts).then((data) => {
      if (controller.signal.aborted) return;
      setAssets(data || []);
    });

    return () => controller.abort();
  }, [token]);

  const selectedDocument = useMemo(
    () => documents.find((d) => d.id === selectedId) || documents[0],
    [documents, selectedId]
  );

  const filteredDocuments = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return documents.filter((document) => {
      const analysis = document.aiAnalysis || {};
      if (typeFilter !== "All" && analysis.documentType !== typeFilter && document.documentType !== typeFilter) return false;
      if (riskFilter !== "All" && analysis.riskLevel !== riskFilter) return false;
      if (!q) return true;
      const content = [document.title, analysis.documentType, analysis.organization, analysis.nominee, analysis.summary].join(" ").toLowerCase();
      return content.includes(q);
    });
  }, [documents, deferredQuery, riskFilter, typeFilter]);

  const filteredAssets = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((asset) => `${assetTitle(asset)} ${categoryLabel(asset.category)} ${assetSubtitle(asset)}`.toLowerCase().includes(q));
  }, [assets, deferredQuery]);

  async function uploadFile(file: File) {
    if (!token || isUploading) return;
    const body = new FormData();
    body.append("document", file);
    setIsUploading(true);
    setUploadStatus("Processing");
    try {
      const response = await fetch(`${getApiUrl()}/ai-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json();
      setUploadStatus(response.ok ? "Saved" : data.message || "Failed");
      if (response.ok) {
        clearApiCache("vault-documents");
        clearApiCache("continuity-score");
        setDocuments((prev) => [data.vaultDocument, ...prev]);
        setSelectedId(data.vaultDocument?.id || "");
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteDocument(id: string) {
    await fetch(`${getApiUrl()}/vault-documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    clearApiCache("vault-documents");
    setSelectedId("");
    setDocuments((prev) => prev.filter((d) => d.id !== id));
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

  return (
    <div className={`page-shell ${styles.workspace}`}>
      <header className={`page-header ${styles.header}`}>
        <div>
          <p className="micro-label">Vault</p>
          <h1>My Vault</h1>
          <p className="page-description">Manage manual asset records and the documents that verify them.</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.search}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets, documents, nominees, risk"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="button" className="lv-btn lv-btn-primary" onClick={() => setModalOpen(true)}>
            <Icon d={ICONS.plus} size={15} />
            Add asset
          </button>
        </div>
      </header>

      <section className={styles.stats} aria-label="Vault summary">
        <div className={styles.stat}><span>Manual assets</span><strong>{assets.length}</strong><p>{assets.length ? "Stored in vault" : "Ready to add"}</p></div>
        <div className={styles.stat}><span>Documents</span><strong>{documents.length}</strong><p>{documents.length ? "Available for review" : "No documents yet"}</p></div>
        <div className={styles.stat}><span>Linked files</span><strong>{assets.filter((asset) => asset.details?.supportingDocument).length}</strong><p>Attached to asset records</p></div>
      </section>

      <section className={styles.assetPanel}>
        <div className="card-head">
          <div><p className="micro-label">Assets</p><h2>Asset register</h2></div>
          <button type="button" className="lv-btn lv-btn-secondary" onClick={() => setModalOpen(true)}>
            <Icon d={ICONS.plus} size={14} />
            Add manually
          </button>
        </div>
        <div className={styles.assetList}>
          {filteredAssets.length ? (
            filteredAssets.map((asset) => (
              <article className={styles.assetRow} key={asset.id}>
                <span className={styles.assetIcon}>
                  <Icon d={ICONS[asset.category as keyof typeof ICONS] || ICONS.document} />
                </span>
                <div>
                  <strong>{assetTitle(asset)}</strong>
                  <span>{assetSubtitle(asset)}</span>
                </div>
                <em>{categoryLabel(asset.category)}</em>
                <time>{formatDate(asset.createdAt)}</time>
              </article>
            ))
          ) : (
            <div className={styles.empty}>
              <strong>No manual assets yet</strong>
              <p>Add a bank account, property, policy, legal document, or digital asset with supporting details.</p>
              <button type="button" className="lv-btn lv-btn-primary" onClick={() => setModalOpen(true)}>
                Add first asset
              </button>
            </div>
          )}
        </div>
      </section>

      <div className={styles.documentGrid}>
        <article className={styles.uploadCard}>
          <div className="card-head">
            <div><p className="micro-label">Documents</p><h2>Document intake</h2></div>
            <span>{uploadStatus}</span>
          </div>
          <label
            className={styles.dropzone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void uploadFile(file);
            }}
          >
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
            <span className={styles.dropIcon}><Icon d={ICONS.upload} size={18} /></span>
            <b>{isUploading ? "Processing document" : "Drop a document here"}</b>
            <span>OCR, categorization and risk analysis run after upload.</span>
          </label>
        </article>

        <article className={styles.documentsCard}>
          <div className="card-head">
            <div><p className="micro-label">Documents</p><h2>Document list</h2></div>
          </div>
          <div className="filters">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {documentTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              {riskFilters.map((risk) => <option key={risk}>{risk}</option>)}
            </select>
          </div>
          <div className="record-list">
            {filteredDocuments.map((document) => (
              <button
                className={selectedDocument?.id === document.id ? "record-row selected" : "record-row"}
                key={document.id}
                onClick={() => setSelectedId(document.id)}
              >
                <span>
                  <b>{document.documentType || document.aiAnalysis?.documentType || "Document"}</b>
                  <small>{document.title || "Untitled"} / {formatDate(document.createdAt)}</small>
                </span>
                <em className={riskClass(document.aiAnalysis?.riskLevel)}>
                  {document.aiAnalysis?.riskLevel || "Medium"}
                </em>
              </button>
            ))}
            {!filteredDocuments.length && <p className="empty-message">No records found.</p>}
          </div>
        </article>
      </div>

      <article className={`document-console ${styles.analysisCard}`}>
        <div className="card-head">
          <div><p className="micro-label">Analysis</p><h2>Selected document</h2></div>
          {selectedDocument && (
            <button className="danger-button" onClick={() => void deleteDocument(selectedDocument.id)}>
              Delete
            </button>
          )}
        </div>
        {selectedDocument ? (
          <>
            <div className="detail-grid">
              <div><span>Nominee</span><b>{selectedDocument.aiAnalysis?.nominee || "Missing"}</b></div>
              <div><span>Organization</span><b>{selectedDocument.aiAnalysis?.organization || "Unknown"}</b></div>
              <div><span>Risk</span><b>{selectedDocument.aiAnalysis?.riskLevel || "Medium"}</b></div>
            </div>
            <div className="summary-block">
              <span>Summary</span>
              <p>{selectedDocument.aiAnalysis?.summary || "No summary available."}</p>
            </div>
            <pre>{selectedDocument.extractedText ? selectedDocument.extractedText.slice(0, 4000) : "No OCR text extracted."}</pre>
          </>
        ) : (
          <p className="empty-message">Select a document to inspect.</p>
        )}
      </article>

      <AddAssetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAssetCreated={handleAddAsset}
      />
    </div>
  );
}
