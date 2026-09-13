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

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  onAssetCreated?: (asset: AssetRecord) => void;
}

type Step = 1 | 2 | 3 | 4;
type Category = (typeof ASSET_CATEGORIES)[number];

const ASSET_CATEGORIES = [
  {
    id: "bank",
    label: "Bank Accounts",
    description: "Accounts, fixed deposits, cards, statements",
    icon: "M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M2 10l10-7 10 7z",
  },
  {
    id: "property",
    label: "Property",
    description: "Homes, land, deeds, registration papers",
    icon: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6",
  },
  {
    id: "legal",
    label: "Legal Documents",
    description: "Wills, powers of attorney, agreements",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  },
  {
    id: "crypto",
    label: "Digital Assets",
    description: "Wallets, exchanges, recovery instructions",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9.5 12.5l1.7 1.7 3.8-4.2",
  },
  {
    id: "insurance",
    label: "Insurance",
    description: "Policies, claims contacts, renewal records",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
] as const;

function Icon({ d, size = 18 }: { d: string; size?: number }) {
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

function categoryMeta(category: string): Category | undefined {
  return ASSET_CATEGORIES.find((c) => c.id === category);
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="add-asset-steps" aria-label={`Step ${step} of 4`}>
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
          <span className="add-asset-cat-icon">
            <Icon d={c.icon} />
          </span>
          <span className="add-asset-cat-label">{c.label}</span>
          <span className="add-asset-cat-desc">{c.description}</span>
        </button>
      ))}
    </div>
  );
}

function renderCategoryForm(
  category: string,
  fileName: string,
  onFileSelected: (file: File | null) => void
) {
  const inputCls = "add-asset-input";

  switch (category) {
    case "bank":
      return (
        <>
          <input className={inputCls} name="bankName" placeholder="Bank name" required />
          <input className={inputCls} name="accountHolder" placeholder="Account holder name" required />
          <select className={inputCls} name="accountType" defaultValue="" required>
            <option value="" disabled>Account type</option>
            <option>Savings</option>
            <option>Current</option>
            <option>Fixed deposit</option>
          </select>
          <input className={inputCls} name="accountNumber" placeholder="Account number or IBAN" required />
          <input className={inputCls} name="branchIfsc" placeholder="Branch or IFSC code" required />
          <FileUpload label="Bank statement or passbook" fileName={fileName} onFileSelected={onFileSelected} />
        </>
      );
    case "property":
      return (
        <>
          <select className={inputCls} name="propertyType" defaultValue="" required>
            <option value="" disabled>Property type</option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Land</option>
          </select>
          <input className={inputCls} name="propertyAddress" placeholder="Property address" required />
          <input className={inputCls} name="deedNumber" placeholder="Registration or deed number" required />
          <FileUpload label="Property deed or title document" fileName={fileName} onFileSelected={onFileSelected} />
        </>
      );
    case "legal":
      return (
        <>
          <input className={inputCls} name="documentTitle" placeholder="Document title" required />
          <input className={inputCls} name="executionDate" type="date" required />
          <input className={inputCls} name="lawyerDetails" placeholder="Notary or lawyer contact" />
          <FileUpload label="Will or legal document" fileName={fileName} onFileSelected={onFileSelected} />
        </>
      );
    case "crypto":
      return (
        <>
          <input className={inputCls} name="walletName" placeholder="Wallet or exchange name" required />
          <input className={inputCls} name="publicAddress" placeholder="Public address or account reference" required />
          <select className={inputCls} name="assetType" defaultValue="" required>
            <option value="" disabled>Asset type</option>
            <option>Cryptocurrency</option>
            <option>Exchange account</option>
            <option>NFT collection</option>
          </select>
          <FileUpload label="Wallet export or screenshot" fileName={fileName} onFileSelected={onFileSelected} />
        </>
      );
    case "insurance":
      return (
        <>
          <input className={inputCls} name="provider" placeholder="Insurance provider" required />
          <input className={inputCls} name="policyNumber" placeholder="Policy number" required />
          <input className={inputCls} name="expiryDate" type="date" />
          <FileUpload label="Insurance policy document" fileName={fileName} onFileSelected={onFileSelected} />
        </>
      );
    default:
      return <input className={inputCls} name="title" placeholder="Asset title" required />;
  }
}

function FileUpload({
  label,
  fileName,
  onFileSelected,
}: {
  label: string;
  fileName: string;
  onFileSelected: (file: File | null) => void;
}) {
  const [error, setError] = useState("");

  function handleFile(file: File | null) {
    setError("");
    if (!file) {
      onFileSelected(null);
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
    if (!allowed.includes(ext)) {
      setError("Only PDF, images, and documents accepted.");
      onFileSelected(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("File must be under 25 MB.");
      onFileSelected(null);
      return;
    }

    onFileSelected(file);
  }

  return (
    <div className="add-asset-file-zone">
      <label
        className="add-asset-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          hidden
          accept=".pdf,image/*,.doc,.docx"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <span className="add-asset-drop-icon">
          <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" size={17} />
        </span>
        <span className="add-asset-drop-label">{fileName || label}</span>
        <span className="add-asset-drop-hint">Upload supporting PDF, image, or document</span>
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
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
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

  function reset() {
    setStep(1);
    setCategory("");
    setSelectedNominee("");
    setAccessCondition("death_certificate");
    setSupportingFile(null);
    setSaveError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

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
    setSaveError("");

    const form = document.getElementById("asset-form") as HTMLFormElement | null;
    const formData = form ? new FormData(form) : new FormData();
    const details: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") details[key] = value;
    });
    if (supportingFile) details.supportingDocument = supportingFile.name;

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

      if (res.ok) {
        if (supportingFile) {
          const body = new FormData();
          body.append("document", supportingFile);
          await fetch(`${getApiUrl()}/ai-upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body,
          }).catch(() => undefined);
        }

        onAssetCreated?.({
          id: data.id || `asset-${Date.now()}`,
          category,
          title:
            details.documentTitle ||
            details.bankName ||
            details.walletName ||
            details.provider ||
            details.propertyAddress ||
            details.title ||
            categoryMeta(category)?.label ||
            category,
          nomineeId: selectedNominee,
          status: "Secured",
          createdAt: data.createdAt || new Date().toISOString(),
        });
        assetCreated = true;
      } else {
        errMsg = data.message || "Failed to secure asset";
      }
    } catch (error) {
      errMsg = error instanceof Error ? error.message : "Failed to secure asset";
    } finally {
      setSaving(false);
    }

    if (assetCreated) handleClose();
    else if (errMsg) setSaveError(errMsg);
  }

  if (!open) return null;

  const meta = categoryMeta(category);

  return (
    <div className="add-asset-overlay" onClick={handleClose}>
      <div className="add-asset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-asset-header">
          <StepIndicator step={step} />
          <button type="button" className="add-asset-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="add-asset-body">
          {step === 1 && (
            <>
              <h2>Add asset</h2>
              <p className="add-asset-sub">
                Choose the asset type, enter the essential details, then attach the supporting document.
              </p>
              <CategoryStep onSelect={(c) => { setCategory(c); nextStep(); }} />
            </>
          )}

          {step === 2 && (
            <>
              <div className="add-asset-step-label">
                <span className="add-asset-cat-icon">
                  <Icon d={meta?.icon || ""} />
                </span>
                {meta?.label}
              </div>
              <form className="add-asset-form" onSubmit={(e) => { e.preventDefault(); nextStep(); }} id="asset-form">
                {renderCategoryForm(category, supportingFile?.name || "", setSupportingFile)}
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Access and nominee</h2>
              <div className="add-asset-form" id="nominee-form">
                <label>Assign to nominee</label>
                <select value={selectedNominee} onChange={(e) => setSelectedNominee(e.target.value)}>
                  <option value="">No nominee assigned yet</option>
                  {nominees.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.relation}) {n.isVerified ? "✓" : ""}
                    </option>
                  ))}
                </select>
                <label>Access condition</label>
                <select value={accessCondition} onChange={(e) => setAccessCondition(e.target.value)}>
                  <option value="death_certificate">Verified death certificate</option>
                  <option value="inactivity">Owner inactivity threshold</option>
                  <option value="manual">Legal representative approval</option>
                </select>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Review and secure</h2>
              <div className="add-asset-summary">
                <div className="add-asset-summary-row"><span>Category</span><b>{meta?.label}</b></div>
                <div className="add-asset-summary-row"><span>Nominee</span><b>{nominees.find((n) => n.id === selectedNominee)?.name || "Not assigned"}</b></div>
                <div className="add-asset-summary-row"><span>Document</span><b>{supportingFile?.name || "No document attached"}</b></div>
                <div className="add-asset-summary-row"><span>Access rule</span><b>{accessCondition.replace(/_/g, " ")}</b></div>
                <div className="add-asset-hr" />
                <p className="add-asset-note">
                  The asset record is saved to the vault. Attached documents are processed through the secure document intake.
                </p>
                {saveError && <p className="add-asset-file-error">{saveError}</p>}
              </div>
              <form onSubmit={handleSecure}>
                <button type="submit" className="lv-btn lv-btn-primary lv-btn-full" disabled={saving}>
                  {saving ? "Securing..." : "Secure asset"}
                </button>
              </form>
            </>
          )}
        </div>

        {step < 4 && (
          <div className="add-asset-footer">
            <button type="button" className="lv-btn lv-btn-ghost" onClick={prevStep}>Back</button>
            {step === 2 && (
              <button type="submit" form="asset-form" className="lv-btn lv-btn-primary">Next: nominee</button>
            )}
            {step === 3 && (
              <button type="button" className="lv-btn lv-btn-primary" onClick={nextStep}>Review asset</button>
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
