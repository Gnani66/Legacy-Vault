import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="page-shell" style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <header className="page-header">
        <div>
          <p className="micro-label">Judge Demo Mode — Phase 6</p>
          <h1>Legacy Vault Demo</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 640 }}>
            Run the entire presentation without manual hunting. One deterministic certificate (DC-DEMO-001) passes every time; DC-FAKE-001Always rejected.
          </p>
        </div>
        <Link href="/integration" className="magnetic-button">
          Open Integration Console →
        </Link>
      </header>

      <div className="demo-split">
        <Link href="/integration" className="console-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card-head">
            <div>
              <p className="micro-label">Owner Flow</p>
              <h2>1. Owner: Create & Assign</h2>
            </div>
            <span>0x83A...</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Connect wallet → Register Vault → Upload asset → Pinata CID → createAsset → Supabase → assignNominee</p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="status-badge enabled">Hardhat 8545</span>
            <span className="status-badge ready">MetaMask</span>
          </div>
        </Link>

        <Link href="/integration" className="console-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card-head">
            <div>
              <p className="micro-label">Nominee Flow</p>
              <h2>2. Nominee: Accept</h2>
            </div>
            <span>Pending</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Switch to nominee wallet (0x7099...) → acceptNomination → nomineeAccepted = true</p>
          <span className="status-badge" style={{ background: "#f3f4f6", marginTop: 8 }}>Try DC-DEMO-001 / DC-FAKE-001</span>
        </Link>
      </div>

      <section className="console-card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <div>
            <p className="micro-label">Deterministic Demo Certificates</p>
            <h2>Upload Demo Certificate</h2>
          </div>
        </div>
        <div className="demo-split">
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 16, background: "#ecfdf5" }}>
            <b>DC-DEMO-001 ✓ PASS</b>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              Name: John Doe<br />Date: 2026-08-20<br />Authority: Example Municipal Authority
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="status-badge enabled">VALID</span>
              <span style={{ fontSize: 11, color: "#047857" }}>→ Verified → Unlocked</span>
            </div>
          </div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 16, background: "#fef2f2" }}>
            <b>DC-FAKE-001 ✕ REJECT</b>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              No matching record<br />Registry → NOT_FOUND<br />Shows rejection UI
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="status-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>REJECTED</span>
            </div>
          </div>
        </div>
        <div className="privacy-notice">
          Documents are stored using decentralized IPFS (Pinata). Only authorized users should upload sensitive documents. For production, encrypt before IPFS — CID alone does not provide confidentiality.
        </div>
      </section>

      <div className="demo-split" style={{ marginTop: 12 }}>
        <section className="console-card">
          <div className="card-head">
            <div>
              <p className="micro-label">Registry + AI</p>
              <h2>3. Verify Government Registry</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>AI: OCR → QR → field extraction → vision → consistency → 91% confidence</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Registry: exact match on name / date / authority / number</p>
          <Link href="/integration" className="secondary-link" style={{ marginTop: 12 }}>
            Verify with Government Registry →
          </Link>
        </section>

        <section className="console-card">
          <div className="card-head">
            <div>
              <p className="micro-label">Blockchain Audit</p>
              <h2>4. View Blockchain Audit</h2>
            </div>
            <span>5 events</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>VaultRegistered → AssetCreated → NomineeAssigned → ClaimSubmitted → AssetUnlocked</p>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <code className="tx-hash">0x8f31...a921</code>
            <span style={{ fontSize: 11, color: "#047857" }}>✓ confirmed</span>
          </div>
          <Link href="/integration" className="secondary-link" style={{ marginTop: 12 }}>
            View Audit Timeline →
          </Link>
        </section>
      </div>

      <section className="console-card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <div>
            <p className="micro-label">9-Step Demo Script (6.19)</p>
            <h2>Exact Rehearsal Sequence</h2>
          </div>
          <Link href="/about" className="secondary-link">
            Architecture →
          </Link>
        </div>
        <ol style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 18, color: "var(--body)" }}>
          <li>Owner: &quot;Connect wallet and create Legacy Vault.&quot;</li>
          <li>Asset: &quot;Upload family asset → IPFS CID, blockchain stores CID + ownership.&quot;</li>
          <li>Nominee: &quot;Assign nominee (0x7099...)&quot;</li>
          <li>Nominee switch: &quot;Nominee connects and accepts.&quot;</li>
          <li>Trigger: &quot;Nominee submits death certificate (DC-DEMO-001).&quot;</li>
          <li>AI: &quot;Multimodal AI: OCR + QR + vision + consistency.&quot;</li>
          <li>Registry: &quot;Click Verify with Government Registry → MATCH ✓&quot;</li>
          <li>Blockchain: &quot;Authorized verifier unlocks (onlyVerifier).&quot;</li>
          <li>Result: 🔓 ASSET UNLOCKED — show Audit + Tx Hash + Verification Evidence</li>
        </ol>
      </section>
    </div>
  );
}
