"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

type NomineeVault = {
  inheritanceStatus: string;
  verificationStatus: string;
  continuityGuidance: string[];
};

export default function NomineeGuidancePage() {
  const [token] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("aegis_nominee_token") || ""
  );
  const [vault, setVault] = useState<NomineeVault>({
    inheritanceStatus: "",
    verificationStatus: "",
    continuityGuidance: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        setVault(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load guidance.");
        setLoading(false);
      });
  }, [token]);

  const claimProcedures = [
    {
      type: "Insurance Claim",
      steps: [
        "Locate the policy document in your shared vault",
        "Note the organization, policy number, and nominee details",
        "Contact the insurer's claims department",
        "Submit the claim form along with identity proof and death certificate",
        "Provide nominee relationship proof if required",
        "Track claim status through the insurer's portal or contact",
      ],
    },
    {
      type: "Will & Legal",
      steps: [
        "Review the will document for executor details",
        "Contact the named executor or legal representative",
        "Obtain multiple certified copies of the death certificate",
        "Prepare identity proof and nominee verification documents",
        "File the will with the appropriate legal authority",
        "Follow the probate process as directed by the court",
      ],
    },
    {
      type: "Bank & Financial Accounts",
      steps: [
        "Gather account details from shared vault documents",
        "Visit the bank branch with death certificate and ID proof",
        "Complete the required nomination claim forms",
        "Provide nominee relationship documentation",
        "Transfer or close accounts as per the nominee's instruction",
      ],
    },
    {
      type: "Property Transfer",
      steps: [
        "Locate property documents: title deed, sale agreement, tax receipts",
        "Verify the nominee is listed in the documents",
        "Contact the local sub-registrar office for transfer process",
        "Submit death certificate, ID proof, and nominee proof",
        "Pay applicable stamp duty and registration fees",
        "Obtain updated title deed in nominee's name",
      ],
    },
  ];

  if (loading) {
    return (
      <div className="nominee-page">
        <p className="empty-message">Loading guidance...</p>
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
          <p className="micro-label">Nominee guidance</p>
          <h1>Continuity instructions & claim procedures</h1>
        </div>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <span>Verification Status</span>
          <strong>{vault.verificationStatus || "Pending"}</strong>
          <p>Your account verification state</p>
        </article>
        <article className="kpi-card">
          <span>Inheritance Status</span>
          <strong>{vault.inheritanceStatus || "Limited"}</strong>
          <p>Current vault access level</p>
        </article>
        <article className="kpi-card">
          <span>Guidance Steps</span>
          <strong>{vault.continuityGuidance.length}</strong>
          <p>Actionable instructions from vault owner</p>
        </article>
      </section>

      {vault.continuityGuidance.length > 0 && (
        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">Vault owner instructions</p><h2>Your continuity guidance</h2></div>
          </div>
          <div className="alert-stack">
            {vault.continuityGuidance.map((item, index) => (
              <div className="status-pill success" key={`guidance-${index}`}>
                <b>Step {index + 1}</b>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="procedure-grid">
        <div className="section-title">
          <p className="micro-label">Claim procedures</p>
          <h2>How to claim inherited assets</h2>
        </div>
        {claimProcedures.map((procedure) => (
          <article key={procedure.type} className="procedure-card console-card">
            <div className="card-head">
              <h2>{procedure.type}</h2>
            </div>
            <ol className="procedure-steps">
              {procedure.steps.map((step, index) => (
                <li key={index}>
                  <span className="step-number">{index + 1}</span>
                  <span className="step-text">{step}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="console-card important-notes">
        <div className="card-head">
          <h2>Important notes</h2>
        </div>
        <ul>
          <li>Keep all original documents safe - you may need to show them at multiple stages</li>
          <li>Get multiple certified copies of the death certificate (at least 5-10)</li>
          <li>Maintain a checklist of documents submitted to each organization</li>
          <li>Track all claim reference numbers for follow-ups</li>
          <li>Contact the vault owner through registered channels if you need clarification</li>
          <li>Some processes may take weeks to months - be patient and follow up regularly</li>
        </ul>
      </section>
    </div>
  );
}