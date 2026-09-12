"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

type Nominee = { id: string; name: string; relation: string; isVerified?: boolean };

export type AssetRecord = {
  id: string;
  category: string;
  title: string;
  nomineeId?: string;
  status: string;
  createdAt: string;
};

type Step = 1 | 2 | 3 | 4;

const ASSET_CATEGORIES = [
  { id: "bank", label: "Bank Accounts & Financials", icon: "🏦" },
  { id: "property", label: "Property & Real Estate", icon: "🏠" },
  { id: "legal", label: "Legal Wills & Documents", icon: "📜" },
  { id: "crypto", label: "Crypto Wallets & Digital Assets", icon: "🔐" },
  { id: "insurance", label: "Insurance Policies", icon: "🛡️" },
] as const;

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  onAssetCreated?: (asset: AssetRecord) => void;
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="add-asset-steps">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`add-asset-step-num ${s === step ? "active" : s < step ? "done" : ""}`}
        >
          {s < step ? "✓" : s}
        </div>
      ))}
    </div>
  );
}

function CategoryStep({ onSelect }: { onSelect: (cat: string) => void }) {
  return (
    <div className="add-asset-category-grid">
      {ASSET_CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          className="add-asset-category-card"
          onClick={() => onSelect(c.id)}
        >
          <span className="add-asset-cat-icon">{c.icon}</span>
          <span className="add-asset-cat-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

function renderCategoryForm(category: string) {
  const inputCls = "add-asset-input";
  switch (category) {
    case "bank":
      return (
        <>
          <input className={inputCls} name="bankName" placeholder="Bank Name (e.g. HDFC, SBI)" required />
          <input className={inputCls} name="accountHolder" placeholder="Account Holder Name" required />
          <select className={inputCls} name="accountType" defaultValue="" required>
            <option value="" disabled>Account Type</option>
            <option>Savings</option>
            <option>Checking</option>
            <option>Fixed Deposit</option>
          </select>
          <input className={inputCls} name="accountNumber" placeholder="Account Number / IBAN (masked & encrypted)" required />
          <input className={inputCls} name="branchIfsc" placeholder="Branch / IFSC Code" required />
          <FileUpload label="Bank passbook or statement" />
        </>
      );
    case "property":
      return (
        <>
          <select className={inputCls} name="propertyType" defaultValue="" required>
            <option value="" disabled>Property Type</option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Land</option>
          </select>
          <input className={inputCls} name="propertyAddress" placeholder="Property Address" required />
          <input className={inputCls} name="deedNumber" placeholder="Registration / Deed Number" required />
          <FileUpload label="Property Deed / Title Document (PDF)" />
        </>
      );
    case "legal":
      return (
        <>
          <input className={inputCls} name="documentTitle" placeholder="Document Title (e.g. My Last Will)" required />
          <input className={inputCls} name="executionDate" type="date" required />
          <input className={inputCls} name="lawyerDetails" placeholder="Notary / Lawyer Name & Contact (optional)" />
          <FileUpload label="Upload Will / legal document (PDF)" />
        </>
      );
    case "crypto":
      return (
        <>
          <input className={inputCls} name="walletName" placeholder="Wallet / Exchange Name" required />
          <input className={inputCls} name="publicAddress" placeholder="Public Address (for recovery) — masked" required />
          <select className={inputCls} name="assetType" defaultValue="" required>
            <option value="" disabled>Asset Type</option>
            <option>Cryptocurrency</option>
            <option>Exchange Account</option>
            <option>NFT Collection</option>
          </select>
          <FileUpload label="Wallet export / screenshot" />
        </>
      );
    case "insurance":
      return (
        <>
          <input className={inputCls} name="provider" placeholder="Insurance Provider" required />
          <input className={inputCls} name="policyNumber" placeholder="Policy Number" required />
          <input className={inputCls} name="expiryDate" type="date" placeholder="Policy Expiry Date" />
          <FileUpload label="Upload Insurance Policy (PDF)" />
        </>
      );
    default:
      return <input className={inputCls} name="title" placeholder="Asset title" required />;
  }
}

function FileUpload({ label }: { label: string }) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFile = (f: File | null) => {
    setError("");
    if (!f) return;
    const allowed = ["image/*", ".pdf", ".doc", ".docx"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.some((a) => a === `image/*` || a === ext) && ext !== ".pdf" && ext !== ".doc" && ext !== ".docx") {
      setError("Only PDF, images, and documents accepted.");
      setFileName("");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      setFileName("");
      return;
    }
    setFileName(f.name);
  };

  return (
    <div className="add-asset-file-zone">
      <label className="add-asset-dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
        <input type="file" hidden accept=".pdf,image/*,.doc,.docx" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        <span className="add-asset-drop-label">{fileName || label}</span>
        <span className="add-asset-drop-hint">Drag & drop or click to upload</span>
      </label>
      {error && <span className="add-asset-file-error">{error}</span>}
    </div>
  );
}

export default function AddAssetModal({ open, onClose, onAssetCreated }: AddAssetModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState("");
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [selectedNominee, setSelectedNominee] = useState("");
  const [accessCondition, setAccessCondition] = useState("death_certificate");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!open) return;
    const token = window.localStorage.getItem("legacy_token") || "";
    if (!token) return;
    const controller = new AbortController();
    fetch(`${getApiUrl()}/nominees`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setNominees(data || []))
      .catch(() => setNominees([]));
    return () => controller.abort();
  }, [open]);

  const reset = () => {
    setStep(1);
    setCategory("");
    setSelectedNominee("");
    setAccessCondition("death_certificate");
    setSaveError("");
  };

  const handleClose = () => { reset(); onClose(); };

  function nextStep() {
    if (step < 4) setStep((s) => (s + 1) as Step);
  }

  function prevStep() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  async function handleSecure(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const details: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") details[key] = value;
    });

    const token = window.localStorage.getItem("legacy_token") || "";
    let assetCreated = false;
    let errMsg = "";
    try {
      const res = await fetch(`${getApiUrl()}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          details,
          nomineeId: selectedNominee,
          accessCondition,
        }),
      });
      const data = await res.json();
      if (res.ok && onAssetCreated) {
        const asset: AssetRecord = {
          id: data.id || `asset-${Date.now()}`,
          category,
          title: details.documentTitle || details.bankName || details.walletName || details.provider || details.propertyAddress || ASSET_CATEGORIES.find((c) => c.id === category)?.label || category,
          nomineeId: selectedNominee,
          status: "Secured via Blockchain",
          createdAt: data.createdAt || new Date().toISOString(),
        };
        onAssetCreated(asset);
        assetCreated = true;
      } else {
        errMsg = data.message || "Failed to secure asset";
      }
    } catch (e) {
      errMsg = e instanceof Error ? e.message : "Failed to secure asset";
    } finally {
      setSaving(false);
    }
    if (assetCreated) handleClose();
    else if (errMsg) setSaveError(errMsg);
  }

  if (!open) return null;

  return (
    <div className="add-asset-overlay" onClick={handleClose}>
      <div className="add-asset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-asset-header">
          <StepIndicator step={step} />
          <button type="button" className="add-asset-close" onClick={handleClose}>✕</button>
        </div>

        <div className="add-asset-body">
          {step === 1 && (
            <>
              <h2>Add New Asset</h2>
              <p className="add-asset-sub">Select the category of asset you want to secure.</p>
              <CategoryStep onSelect={(c) => { setCategory(c); nextStep(); }} />
            </>
          )}

          {step === 2 && (
            <>
              <div className="add-asset-step-label">
                <span className="add-asset-cat-icon">{ASSET_CATEGORIES.find((c) => c.id === category)?.icon}</span>
                {ASSET_CATEGORIES.find((c) => c.id === category)?.label}
              </div>
              <form className="add-asset-form" onSubmit={(e) => { e.preventDefault(); nextStep(); }} id="asset-form">
                {renderCategoryForm(category)}
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Access & Nominee</h2>
              <div className="add-asset-form" id="nominee-form">
                <label>Assign to Nominee</label>
                <select value={selectedNominee} onChange={(e) => setSelectedNominee(e.target.value)} required>
                  <option value="">Select a nominee</option>
                  {nominees.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.relation}) {n.isVerified ? "✓" : ""}
                    </option>
                  ))}
                </select>
                <label>Access Condition</label>
                <select value={accessCondition} onChange={(e) => setAccessCondition(e.target.value)}>
                  <option value="death_certificate">Unlock only upon verified Death Certificate submission</option>
                  <option value="inactivity">Unlock after inactivity threshold (days)</option>
                  <option value="manual">Manual approval (legal representative)</option>
                </select>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Secure & Encrypt Asset</h2>
              <div className="add-asset-summary">
                <div className="add-asset-summary-row"><span>Category</span><b>{ASSET_CATEGORIES.find((c) => c.id === category)?.label}</b></div>
                <div className="add-asset-summary-row"><span>Nominee</span><b>{nominees.find((n) => n.id === selectedNominee)?.name || "—"}</b></div>
                <div className="add-asset-summary-row"><span>Access Rule</span><b>Death Certificate Verification</b></div>
                <div className="add-asset-hr" />
                <p className="add-asset-note">
                  Your file will be encrypted, stored on IPFS, and recorded on the blockchain.
                  Only the assigned nominee can trigger the release flow.
                </p>
                {saveError && <p className="add-asset-file-error">{saveError}</p>}
              </div>
              <form onSubmit={handleSecure}>
                <button type="submit" className="lv-btn lv-btn-primary lv-btn-full" disabled={saving}>
                  {saving ? "Securing…" : "Secure & Encrypt Asset"}
                </button>
              </form>
            </>
          )}
        </div>

        {step < 4 && (
          <div className="add-asset-footer">
            <button type="button" className="lv-btn lv-btn-ghost" onClick={prevStep}>Back</button>
            {step === 2 && (
              <button type="submit" form="asset-form" className="lv-btn lv-btn-primary">Next: Assign Nominee</button>
            )}
            {step === 3 && (
              <button type="button" className="lv-btn lv-btn-primary" onClick={nextStep}>Next: Secure Asset</button>
            )}
          </div>
        )}
        {step === 4 && (
          <div className="add-asset-footer">
            <button type="button" className="lv-btn lv-btn-ghost" onClick={prevStep}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
