import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="page-shell" style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <header className="page-header">
        <div>
          <p className="micro-label">System Architecture — Phase 6.16</p>
          <h1>Legacy Vault</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 640 }}>
            Blockchain = ownership / nominee / claim state. IPFS = decentralized storage. Supabase = metadata. AI = analysis. Registry = independent verification. Only verified → verifier → unlock.
          </p>
        </div>
      </header>

      <section className="console-card">
        <div className="card-head">
          <h2>Architecture</h2>
        </div>
        <pre
          style={{
            background: "var(--dark)",
            color: "#e5e7eb",
            padding: 16,
            borderRadius: 10,
            overflow: "auto",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {`                    LEGACY VAULT
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
    FRONTEND          BACKEND          AI SERVICE
       │                 │                 │
    Next.js           Express          OpenRouter
   :3000              :5000              :8000
       │                 │                 │
       │          ┌──────┼──────┐          │
       │          │      │      │          │
       │       Supabase Pinata Blockchain  │
       │       metadata  IPFS  LegacyVault │
       │          │      │   0x5Fb...     │
       │          │   CID Qm...            │
       └──────────────────────────────────┘
                        │
                   Hardhat :8545`}
        </pre>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
        {[
          ["Blockchain", "ownership\nnominee\nclaim state\nunlock events\nonlyVerifier + paused"],
          ["IPFS", "Pinata\nCID Qm...\ndecentralized\nretrievable via gateway"],
          ["Supabase", "users\nassets\nnominees\nclaims\nverification_status"],
          ["AI Service", "PDF → image\nOCR\nQR detection\nfield extraction\nvision + consistency"],
          ["Mock Registry", "DC-DEMO-001 VALID\nDC-FAKE-001 NOT_FOUND\nname/date/authority match"],
          ["Verifier", "dedicated wallet\nHardhat #1\n0x7099...\nnever MetaMask key"],
        ].map(([title, body]) => (
          <div key={title} className="console-card">
            <div className="card-head">
              <h2 style={{ fontSize: 15 }}>{title}</h2>
            </div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{body}</pre>
          </div>
        ))}
      </div>

      <section className="console-card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <h2>Final Security Flow (6.18) — AI does NOT directly unlock</h2>
        </div>
        <pre
          style={{
            background: "var(--card)",
            padding: 16,
            borderRadius: 10,
            fontSize: 12,
            overflow: "auto",
            lineHeight: 1.7,
          }}
        >
          {`               DEATH CERTIFICATE
                       │
                       ▼
                 AI ANALYSIS
                       │
             ┌─────────┴─────────┐
             │                   │
          REJECTED           ACCEPTABLE
             │                   │
             ▼                   ▼
          STOP             REGISTRY CHECK
                                 │
                         ┌───────┴───────┐
                         │               │
                      MISMATCH          MATCH
                         │               │
                         ▼               ▼
                    NEEDS REVIEW      VERIFIED
                                         │
                                         ▼
                               AUTHORIZED VERIFIER
                                         │
                                         ▼
                                BLOCKCHAIN UNLOCK
                                         │
                                         ▼
                                   NOMINEE ACCESS`}
        </pre>
      </section>

      <section className="console-card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <h2>Permission Model (6.1)</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 13 }}>
          <div>
            <b>OWNER</b>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>createAsset()</div>
            <div style={{ color: "var(--muted)" }}>assignNominee()</div>
            <div style={{ color: "var(--muted)" }}>registerVault()</div>
          </div>
          <div>
            <b>NOMINEE</b>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>acceptNomination()</div>
            <div style={{ color: "var(--muted)" }}>submitClaim()</div>
          </div>
          <div>
            <b>VERIFIER</b>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>unlockAsset() only</div>
            <div style={{ color: "var(--muted)", fontSize: 11 }}>Hardhat #1 0x7099...</div>
          </div>
        </div>
        <div className="privacy-notice">
          Pause: deployer can <code>pause()</code> / <code>unpause()</code> to freeze asset/claim ops during demo emergencies.
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Link href="/demo" className="magnetic-button">
          Demo Mode →
        </Link>
        <Link href="/integration" className="secondary-link">
          Integration Console
        </Link>
        <Link href="/dashboard" className="secondary-link">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
