"use client";

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

export default function NomineeDocumentsPage() {
  const [token] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("aegis_nominee_token") || ""
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
    if (!token) return;
    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        setVault(data);
        if (data.documents?.length) {
          setSelectedId(data.documents[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load documents.");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="nominee-page">
        <p className="empty-message">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nominee-page">
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="nominee-page">
      <header className="vault-header">
        <div>
          <p className="micro-label">Nominee documents</p>
          <h1>Accessible vault records</h1>
        </div>
        <div className="filter-pills">
          {documentTypes.map((type) => (
            <button
              key={type}
              className={filterType === type ? "pill active" : "pill"}
              onClick={() => setFilterType(type)}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>
      </header>

      {!vault.documents.length ? (
        <div className="empty-state">
          <p>No documents are shared with your access level.</p>
          <span>Contact the vault owner to request document access.</span>
        </div>
      ) : (
        <section className="records-grid">
          <article className="console-card">
            <div className="card-head">
              <div><p className="micro-label">Shared vault</p><h2>Accessible documents</h2></div>
              <span>{filteredDocuments.length} records</span>
            </div>
            <div className="record-list">
              {filteredDocuments.map((document) => (
                <button
                  className={selectedDocument?.id === document.id ? "record-row selected" : "record-row"}
                  key={document.id}
                  onClick={() => setSelectedId(document.id)}
                >
                  <span>
                    <b>{document.documentType || "Document"}</b>
                    <small>{document.title || "Untitled"}</small>
                  </span>
                  <em className={document.riskLevel === "High" ? "status-pill danger" : document.riskLevel === "Low" ? "status-pill success" : "status-pill warning"}>
                    {document.riskLevel || "Medium"}
                  </em>
                </button>
              ))}
            </div>
          </article>

          <article className="console-card document-console">
            <div className="card-head">
              <div><p className="micro-label">Inheritance summary</p><h2>Selected record</h2></div>
            </div>
            {selectedDocument ? (
              <>
                <div className="detail-grid">
                  <div><span>Type</span><b>{selectedDocument.documentType || "Document"}</b></div>
                  <div><span>Organization</span><b>{selectedDocument.organization || selectedDocument.insuranceInfo?.organization || "Unknown"}</b></div>
                  <div><span>Risk</span><b>{selectedDocument.riskLevel || "Medium"}</b></div>
                  {selectedDocument.insuranceInfo?.expiryDate && (
                    <div><span>Expires</span><b>{selectedDocument.insuranceInfo.expiryDate}</b></div>
                  )}
                  {selectedDocument.insuranceInfo?.nominee && (
                    <div><span>Named Nominee</span><b>{selectedDocument.insuranceInfo.nominee}</b></div>
                  )}
                </div>
                <div className="summary-block">
                  <span>Inheritance Summary</span>
                  <p>{selectedDocument.inheritanceSummary || "No summary available."}</p>
                </div>
                {selectedDocument.importantPoints?.length ? (
                  <div className="summary-block">
                    <span>Important Points</span>
                    <ul>
                      {selectedDocument.importantPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {selectedDocument.risks?.length ? (
                  <div className="summary-block">
                    <span>Risks & Alerts</span>
                    <ul className="risk-list">
                      {selectedDocument.risks.map((risk, i) => (
                        <li key={i} className="risk-item">{risk}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="empty-message">Select a document to view details.</p>
            )}
          </article>
        </section>
      )}
    </div>
  );
}