"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { cachedFetch, clearApiCache, getApiUrl } from "@/lib/api";

type AiAnalysis = {
  documentType?: string;
  organization?: string;
  nominee?: string;
  riskLevel?: "Low" | "Medium" | "High";
  summary?: string;
  importantPoints?: string[];
  risks?: string[];
};
type VaultDocument = {
  id: string;
  title?: string;
  documentType?: string;
  extractedText: string;
  aiAnalysis: AiAnalysis;
  createdAt: string;
};

const documentTypes = ["All", "Insurance", "Will", "Property Paper", "Property", "Bank Statement", "Investment", "Legal", "Tax", "Other"];
const riskFilters = ["All", "High", "Medium", "Low"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function VaultPage() {
  const [token, setToken] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [typeFilter, setTypeFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [uploadStatus, setUploadStatus] = useState("Ready");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!token) {
      const t = window.localStorage.getItem("legacy_token") || "";
      if (t) setToken(t);
      return;
    }
    const controller = new AbortController();
    cachedFetch<VaultDocument[]>(`${getApiUrl()}/vault-documents`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then((data) => {
      if (controller.signal.aborted) return;
      setDocuments(data || []);
      if (data?.[0]?.id) setSelectedId((prev) => prev || data[0].id);
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

  function riskClass(risk?: string) {
    if (risk === "High") return "status-pill danger";
    if (risk === "Low") return "status-pill success";
    return "status-pill warning";
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="micro-label">Vault</p>
          <h1>Document register</h1>
        </div>
        <div className="header-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, nominees, risk"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </header>

      <div className="console-grid">
        <article className="console-card">
          <div className="card-head">
            <div><p className="micro-label">Upload</p><h2>AI intake room</h2></div>
            <span>{uploadStatus}</span>
          </div>
          <label
            className="premium-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void uploadFile(file);
            }}
          >
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
            <b>{isUploading ? "Processing document" : "Drop document"}</b>
            <span>OCR, categorization, risk analysis, nominee detection</span>
          </label>
        </article>

        <article className="console-card">
          <div className="card-head">
            <div><p className="micro-label">Vault</p><h2>Document list</h2></div>
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

      <article className="console-card document-console">
        <div className="card-head">
          <div><p className="micro-label">Analysis</p><h2>Selected intelligence</h2></div>
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
    </div>
  );
}
