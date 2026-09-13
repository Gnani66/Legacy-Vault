"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

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
  bank: "M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M2 10l10-7 10 7z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3",
  check: "M20 6L9 17l-5-5",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  vault: "M21 8v13H3V8M1 3h22v5H1zM10 12h4",
};

const PROCEDURES = [
  {
    category: "Term Life & Insurance Policies",
    icon: ICONS.shield,
    steps: [
      "Locate the insurance policy in your Shared Documents tab",
      "Upload verified Death Certificate in the Claims Console",
      "Submit claim form with death certificate and nominee KYC",
      "Receive automated settlement into your verified bank account",
    ],
    documents: ["Death Certificate (Original/Certified)", "Policy Certificate", "Nominee Photo ID & Cancelled Cheque"],
  },
  {
    category: "Bank Accounts & Fixed Deposits",
    icon: ICONS.bank,
    steps: [
      "Obtain unlocked account numbers and IFSC from Allocated Assets",
      "Notify the branch manager with your registered nominee identification",
      "Submit official Claim Form with Civil Registry death certificate",
      "Funds transferred to nominee or joint account within 15 working days",
    ],
    documents: ["Death Certificate", "Passbook / Account statement", "KYC of the Nominee"],
  },
  {
    category: "Real Estate & Title Deeds",
    icon: ICONS.home,
    steps: [
      "Inspect property registered title deed in Shared Documents",
      "Apply for mutation in the local municipal corporation / revenue office",
      "Submit registered Will (if applicable) or succession affidavit",
      "Updated property tax records reflecting new ownership",
    ],
    documents: ["Title Deed Copy", "Death Certificate", "NOC from other legal heirs (if intestate)"],
  },
  {
    category: "Digital Assets & Crypto Vaults",
    icon: ICONS.key,
    steps: [
      "Verify death certificate to unlock multi-sig recovery guide",
      "Follow seed phrase sharding reconstruction protocol",
      "Initiate timed contingency transfer to your designated wallet",
      "Sweep funds to hardware cold storage",
    ],
    documents: ["Hardware Signer", "Nominee Passcode", "Sharded Recovery Key"],
  },
];

export default function NomineeGuidancePage() {
  return (
    <div className="page-shell">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-left">
          <h1>Claims & Inheritance Guidance</h1>
          <p className="page-description">
            Legal procedures, required documentation, and step-by-step instructions for each asset class.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/nominee/assistant" className="lv-btn lv-btn-primary">
            <Icon d={ICONS.message} size={14} />
            Ask Legal Assistant
          </Link>
        </div>
      </header>

      {/* ── Guidance Grid ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
        {PROCEDURES.map((proc, idx) => (
          <div key={idx} className="panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--line)" }}>
              <span
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--ink)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon d={proc.icon} size={18} />
              </span>
              <h2 className="panel-title" style={{ fontSize: "17px" }}>
                {proc.category}
              </h2>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                Step-by-Step Claim Flow
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {proc.steps.map((step, sIdx) => (
                  <div key={sIdx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "var(--soft)",
                        border: "1px solid var(--line)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--ink)",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      {sIdx + 1}
                    </span>
                    <span style={{ color: "var(--ink)", lineHeight: "1.4" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                Required Documentation
              </span>
              <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {proc.documents.map((doc, dIdx) => (
                  <li key={dIdx} style={{ fontSize: "12px", color: "var(--body)" }}>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}