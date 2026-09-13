import Link from "next/link";
import ScrollNav from "@/components/ScrollNav";

const products = [
  {
    title: "AI Document Intelligence",
    desc: "OCR + structured extraction turns messy paperwork into clean JSON — nominee detection, risk scoring, category tagging on every upload.",
    tag: "Core",
  },
  {
    title: "Nominee Continuity Engine",
    desc: "Define trusted nominees, access levels, and emergency contacts. Automatic escalation and verification workflows.",
    tag: "Governance",
  },
  {
    title: "Estate Health Dashboard",
    desc: "Real-time estate health 0–100, missing-nominee alerts, high-risk file tracking, and AI-powered search across your entire vault.",
    tag: "Intelligence",
  },
  {
    title: "Blockchain Registry",
    desc: "Immutable on-chain audit trail for every document, nominee change, and access event. Enterprise-grade compliance.",
    tag: "Infrastructure",
  },
];

const whyUs = [
  {
    icon: "01",
    title: "Absolute Data Sovereignty",
    desc: "Encrypted at rest and in transit. Zero-knowledge architecture — only you and your designated nominees hold continuity keys.",
  },
  {
    icon: "02",
    title: "AI Never Directly Unlocks",
    desc: "Registry VERIFIED → authorized verifier. AI assists with intelligence, never with access. Human-in-the-loop for every critical action.",
  },
  {
    icon: "03",
    title: "Enterprise-Grade Infrastructure",
    desc: "Blockchain + IPFS + Supabase + AI + Registry. Built for family offices, founders, and advisors who need continuity around assets.",
  },
  {
    icon: "04",
    title: "Compliance by Design",
    desc: "SOC2 Type 2 and ISO 27001 aligned. Audit trails, access controls, and nominee governance built into every layer.",
  },
];

const partners = [
  "Supabase",
  "IPFS",
  "Avalanche",
  "Chainlink",
  "OpenAI",
  "Vercel",
];

const steps = [
  { num: "01", title: "Ingest", desc: "Upload estate, insurance, property, banking, and identity documents into a secure vault." },
  { num: "02", title: "Structure", desc: "OCR and AI convert messy paperwork into clean JSON with nominee, risk, and category fields." },
  { num: "03", title: "Govern", desc: "Define trusted nominees, access levels, emergency contacts, and continuity ownership." },
  { num: "04", title: "Decide", desc: "Estate health, risk alerts, and AI search turn the vault into an operating dashboard." },
];

const questions = [
  ["Is Aegis Vault just storage?", "No. Storage is only the foundation. The platform adds OCR, structured AI extraction, risk scoring, nominee governance, and contextual vault search."],
  ["Who is this designed for?", "Families, founders, advisors, and family offices that need continuity around assets, policies, wills, banking records, and property papers."],
  ["What makes it different?", "Every document becomes a structured intelligence record. The dashboard tracks missing nominees, high-risk files, emergency contacts, and estate health."],
  ["Can nominees be managed?", "Yes. Users can add multiple nominees, assign access levels, and maintain emergency contact information for continuity planning."],
];

export default function Home() {
  return (
    <main className="av-page" suppressHydrationWarning>
      <ScrollNav />
      {/* ═══ NAVBAR ═══ */}
      <nav className="av-nav">
        <div className="av-nav-inner">
          <div className="av-nav-left">
            <Link className="av-logo" href="/">
              <span className="av-logo-mark">AV</span>
              <span className="av-logo-text">Aegis Vault</span>
            </Link>
            <div className="av-nav-links">
              <a href="#products">Products</a>
              <a href="#why-us">Why Us</a>
              <a href="#workflow">Workflow</a>
              <a href="#answers">Answers</a>
            </div>
          </div>
          <div className="av-nav-right">
            <Link href="/nominee-login" className="av-nav-link" style={{ border: "1px solid #c4b5fd", background: "rgba(124, 58, 237, 0.08)", color: "#6d28d9" }}>
              Nominee Portal
            </Link>
            <Link href="/signin" className="av-nav-link">Owner Sign in</Link>
            <Link href="/dashboard" className="av-nav-btn-primary">Owner Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="av-hero">
        <div className="av-hero-dot-bg" aria-hidden="true" />
        <div className="av-hero-gradient-top" aria-hidden="true" />
        <div className="av-hero-gradient-bottom" aria-hidden="true" />

        <div className="av-hero-image" aria-hidden="true">
          <div className="av-hero-visual">
            {/* Abstract asset visualization */}
            <svg viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="av-hero-svg">
              <defs>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#180E26" />
                  <stop offset="50%" stopColor="#2d1b4e" />
                  <stop offset="100%" stopColor="#180E26" />
                </linearGradient>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="600" height="400" rx="20" fill="url(#heroGrad)" />
              <circle cx="300" cy="200" r="160" fill="url(#glowGrad)" />
              {/* Grid lines */}
              {[...Array(8)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={50 + i * 45} x2="600" y2={50 + i * 45} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
              ))}
              {[...Array(12)].map((_, i) => (
                <line key={`v${i}`} x1={50 + i * 48} y1="0" x2={50 + i * 48} y2="400" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
              ))}
              {/* Floating nodes */}
              <circle cx="150" cy="120" r="8" fill="#7c3aed" opacity="0.8" />
              <circle cx="350" cy="80" r="6" fill="#a78bfa" opacity="0.6" />
              <circle cx="450" cy="160" r="10" fill="#7c3aed" opacity="0.7" />
              <circle cx="200" cy="280" r="7" fill="#c4b5fd" opacity="0.5" />
              <circle cx="400" cy="300" r="9" fill="#7c3aed" opacity="0.6" />
              <circle cx="100" cy="200" r="5" fill="#a78bfa" opacity="0.4" />
              <circle cx="500" cy="240" r="6" fill="#c4b5fd" opacity="0.5" />
              {/* Connection lines */}
              <line x1="150" y1="120" x2="350" y2="80" stroke="#7c3aed" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="350" y1="80" x2="450" y2="160" stroke="#7c3aed" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="200" y1="280" x2="400" y2="300" stroke="#7c3aed" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="150" y1="120" x2="200" y2="280" stroke="#a78bfa" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="450" y1="160" x2="500" y2="240" stroke="#a78bfa" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
              {/* Central node cluster */}
              <circle cx="300" cy="180" r="24" fill="#180E26" stroke="#7c3aed" strokeWidth="2" />
              <text x="300" y="185" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">AV</text>
              <circle cx="300" cy="180" r="36" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.3" />
              <circle cx="300" cy="180" r="52" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.15" />
            </svg>
          </div>
        </div>

        <div className="av-hero-content">
          <div className="av-hero-badge">
            <span>Dual-Dashboard Architecture: Owner & Nominee</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <h1 className="av-hero-title">
            Enterprise Digital Asset &
            <br />
            Inheritance Continuity
          </h1>
          <p className="av-hero-sub">
            Aegis Vault powers two synchronized dashboards: An operating vault for <b>Asset Owners</b> to assign trusted nominees and secure assets, and a passwordless <b>Nominee Portal</b> for heirs to verify claims with death certificates and inherit assets smoothly.
          </p>

          {/* Dual Dashboard Entry Cards in Hero */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "24px", marginBottom: "28px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.95)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(24, 14, 38, 0.12)", boxShadow: "0 10px 25px -5px rgba(24, 14, 38, 0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#4338ca", background: "#eef2ff", padding: "4px 10px", borderRadius: "999px", marginBottom: "10px" }}>
                  <span>●</span> Portal 1
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#180E26", marginBottom: "6px" }}>Asset Owner Dashboard</h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "16px" }}>
                  Store bank, property, and crypto records. Assign trusted nominees, trigger instant email notifications, and set contingency release rules.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Link href="/dashboard" className="av-btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: "14px", height: "42px", padding: "0 14px" }}>
                  Launch Owner Vault
                </Link>
                <Link href="/signin" className="av-btn-text" style={{ fontSize: "13px", padding: "0 10px" }}>
                  Sign in
                </Link>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(255, 255, 255, 0.98) 100%)", padding: "20px", borderRadius: "16px", border: "1.5px solid #a78bfa", boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.12)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#6d28d9", background: "#f3e8ff", padding: "4px 10px", borderRadius: "999px", marginBottom: "10px" }}>
                  <span style={{ color: "#7c3aed" }}>●</span> Portal 2
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#180E26", marginBottom: "6px" }}>Nominee Continuity Portal</h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "16px" }}>
                  Passwordless OTP login for assigned nominees. View allocated assets, upload & verify death certificate via AI, and unlock confidential inheritance credentials.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Link href="/nominee-login" className="av-btn-primary" style={{ flex: 1, justifyContent: "center", background: "#7c3aed", fontSize: "14px", height: "42px", padding: "0 14px" }}>
                  Open Nominee Portal
                </Link>
                <Link href="/nominee-dashboard" className="av-btn-text" style={{ fontSize: "13px", color: "#7c3aed", padding: "0 10px" }}>
                  View Demo
                </Link>
              </div>
            </div>
          </div>

          <div className="av-hero-trusted">
            <p>Trusted by leading companies and estate managers worldwide</p>
            <div className="av-hero-logos">
              {partners.map((p) => (
                <div key={p} className="av-hero-logo-item">{p}</div>
              ))}
            </div>
            <div className="av-hero-badges">
              <div className="av-badge">SOC 2 Type II</div>
              <div className="av-badge">ISO 27001</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BACKED BY MARQUEE ═══ */}
      <section className="av-marquee-section">
        <div className="av-marquee-label">Backed by Leading Organizations</div>
        <div className="av-marquee-track">
          <div className="av-marquee-scroll">
            {[...partners, ...partners, ...partners].map((p, i) => (
              <div key={i} className="av-marquee-item">{p}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DUAL DASHBOARD ARCHITECTURE ═══ */}
      <section id="dashboards" className="av-section" style={{ background: "#fcfbfe", borderTop: "1px solid #f0eaf8", borderBottom: "1px solid #f0eaf8" }}>
        <div className="av-section-inner">
          <div className="av-section-header" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 48px auto" }}>
            <span className="av-section-label" style={{ color: "#7c3aed" }}>Ecosystem Architecture</span>
            <h2>Two Dedicated Dashboards for Complete Continuity</h2>
            <p>From wealth organization to frictionless claim settlement — Aegis Vault provides segregated, military-grade interfaces for both the Asset Owner and the Nominee.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "28px" }}>
            {/* Dashboard 1: Asset Owner */}
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1.5px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#180E26", color: "#fff", display: "grid", placeItems: "center", fontWeight: "700", fontSize: "13px" }}>AO</div>
                    <div>
                      <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#180E26", margin: 0 }}>Asset Owner Dashboard</h3>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>For Wealth Ingestion & Governance</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", background: "#eef2ff", color: "#4338ca", padding: "4px 10px", borderRadius: "999px" }}>OWNER ROLE</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px", color: "#334155" }}>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
                    <span><b>Estate Health Metric (0–100)</b>: Real-time scoring of your vault's continuity readiness.</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
                    <span><b>Multi-Asset Protection</b>: Secure bank accounts, real estate deeds, crypto keys, and life insurance.</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
                    <span><b>Nominee Assignment & Email Alerts</b>: Designate primary/legal nominees; instant invitation links dispatched.</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
                    <span><b>Smart Contingency Rules</b>: Enforce death certificate verification or inactivity trigger thresholds.</span>
                  </li>
                </ul>
              </div>
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", display: "flex", gap: "12px" }}>
                <Link href="/dashboard" className="av-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  Open Owner Dashboard
                </Link>
                <Link href="/signin" className="av-btn-text" style={{ padding: "0 14px" }}>
                  Sign in
                </Link>
              </div>
            </div>

            {/* Dashboard 2: Nominee */}
            <div style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)", borderRadius: "20px", border: "2px solid #c4b5fd", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 15px 35px -10px rgba(124, 58, 237, 0.12)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#7c3aed", color: "#fff", display: "grid", placeItems: "center", fontWeight: "700", fontSize: "13px" }}>NP</div>
                    <div>
                      <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#180E26", margin: 0 }}>Nominee Continuity Portal</h3>
                      <span style={{ fontSize: "12px", color: "#7c3aed" }}>For Asset Claims & Legal Inheritance</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", background: "#ede9fe", color: "#6d28d9", padding: "4px 10px", borderRadius: "999px" }}>NOMINEE ROLE</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px", color: "#334155" }}>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#7c3aed", fontWeight: "bold" }}>✓</span>
                    <span><b>Passwordless OTP Login</b>: Secure access via verified email link and one-time numeric passcode.</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#7c3aed", fontWeight: "bold" }}>✓</span>
                    <span><b>Allocated Assets Visibility</b>: Clear display of assigned properties, bank accounts, and policies.</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#7c3aed", fontWeight: "bold" }}>✓</span>
                    <span><b>Death Certificate Upload & AI Check</b>: Instant OCR stamp analysis + official Government Registry cross-check.</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: "#7c3aed", fontWeight: "bold" }}>✓</span>
                    <span><b>Instant Asset Unlock</b>: Unlocks confidential routing, deed registrations, and recovery keys upon verification.</span>
                  </li>
                </ul>
              </div>
              <div style={{ borderTop: "1px solid #e9d5ff", paddingTop: "20px", display: "flex", gap: "12px" }}>
                <Link href="/nominee-login" className="av-btn-primary" style={{ flex: 1, justifyContent: "center", background: "#7c3aed" }}>
                  Launch Nominee Portal
                </Link>
                <Link href="/nominee-dashboard" className="av-btn-text" style={{ padding: "0 14px", color: "#7c3aed" }}>
                  Explore View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS ═══ */}
      <section id="products" className="av-section">
        <div className="av-section-inner">
          <div className="av-section-header">
            <span className="av-section-label">Products</span>
            <h2>Infrastructure built for the future of digital assets</h2>
            <p>From document intelligence to on-chain compliance — every layer designed for institutional-grade continuity.</p>
          </div>
          <div className="av-products-grid">
            {products.map((p) => (
              <article key={p.title} className="av-product-card">
                <span className="av-product-tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <span className="av-product-link">
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section id="why-us" className="av-section av-section-alt">
        <div className="av-section-inner">
          <div className="av-section-header">
            <span className="av-section-label">Why Us</span>
            <h2>Built for institutions that demand more</h2>
          </div>
          <div className="av-why-grid">
            {whyUs.map((w) => (
              <article key={w.title} className="av-why-card">
                <span className="av-why-num">{w.icon}</span>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ */}
      <section id="workflow" className="av-section">
        <div className="av-section-inner">
          <div className="av-section-header">
            <span className="av-section-label">Workflow</span>
            <h2>From documents to decisions in minutes</h2>
          </div>
          <div className="av-steps-grid">
            {steps.map((s) => (
              <div key={s.num} className="av-step-card">
                <span className="av-step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BAND ═══ */}
      <section className="av-cta-band">
        <div className="av-cta-band-inner">
          <h2>Scale personalised continuity without growing your team</h2>
          <p>Give a dedicated vault to every family. Aegis agents are always available. If human touch is needed, you&apos;ll know.</p>
          <div className="av-cta-actions">
            <Link href="/signup" className="av-btn-primary">Create your vault</Link>
            <span className="av-cta-micro">No card needed · No cost to start · Live 24/7</span>
          </div>
        </div>
      </section>

      {/* ═══ SECURITY ═══ */}
      <section id="security" className="av-section">
        <div className="av-section-inner">
          <div className="av-security-content">
            <div>
              <span className="av-section-label">Security</span>
              <h2>Absolute Data Sovereignty.</h2>
              <p>Encrypted at rest and in transit. Zero-knowledge friendly — only you and your designated nominees hold continuity keys. AI never directly unlocks; only registry VERIFIED → authorized verifier.</p>
              <div className="av-security-stats">
                <div>
                  <strong>256-bit</strong>
                  <span>AES Encryption</span>
                </div>
                <div>
                  <strong>Zero</strong>
                  <span>Knowledge Proof</span>
                </div>
                <div>
                  <strong>100%</strong>
                  <span>Audit Trail</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT CTA ═══ */}
      <section id="contact" className="av-contact">
        <div className="av-contact-inner">
          <div className="av-contact-left">
            <span className="av-section-label">Contact</span>
            <h2>Let&apos;s build your digital asset infrastructure</h2>
            <p>Talk to our team about how Aegis Vault can power your institution&apos;s continuity needs.</p>
          </div>
          <div className="av-contact-right">
            <form className="av-contact-form">
              <div className="av-form-row">
                <input type="text" placeholder="Full name" />
                <input type="email" placeholder="Work email" />
              </div>
              <input type="text" placeholder="Company" />
              <input type="text" placeholder="How can we help?" />
              <button type="submit" className="av-btn-primary av-btn-full">Talk to us</button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="answers" className="av-section">
        <div className="av-section-inner">
          <div className="av-section-header">
            <span className="av-section-label">FAQ</span>
            <h2>Clear answers before urgent moments</h2>
          </div>
          <div className="av-faq-grid">
            {questions.map(([q, a]) => (
              <article key={q} className="av-faq-card">
                <h3>{q}</h3>
                <p>{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="av-footer">
        <div className="av-footer-inner">
          <div className="av-footer-top">
            <div className="av-footer-brand">
              <Link className="av-logo av-logo-dark" href="/">
                <span className="av-logo-mark av-logo-mark-light">AV</span>
                <span className="av-logo-text av-logo-text-light">Aegis Vault</span>
              </Link>
              <p>AI-powered continuity infrastructure for families and advisors. Enterprise-grade digital asset management.</p>
            </div>
            <div className="av-footer-cols">
              <div>
                <h4>Product</h4>
                <a href="#products">Document Intelligence</a>
                <a href="#products">Nominee Engine</a>
                <a href="#products">Estate Dashboard</a>
                <a href="#products">Blockchain Registry</a>
              </div>
              <div>
                <h4>Company</h4>
                <a href="/about">About</a>
                <a href="#why-us">Why Us</a>
                <a href="#answers">FAQ</a>
                <a href="#contact">Contact</a>
              </div>
              <div>
                <h4>Resources & Dashboards</h4>
                <a href="/dashboard" style={{ fontWeight: 600, color: "#a78bfa" }}>Owner Dashboard</a>
                <a href="/nominee-login" style={{ fontWeight: 600, color: "#a78bfa" }}>Nominee Portal (OTP)</a>
                <a href="/demo">Interactive Demo</a>
                <a href="/integration">System Verification</a>
                <a href="/signin">Sign in</a>
              </div>
            </div>
          </div>
          <div className="av-footer-bottom">
            <span>© 2026 Aegis Vault. All rights reserved.</span>
            <div className="av-footer-legal">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
