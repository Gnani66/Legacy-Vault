"use client";

import { useState } from "react";
import { getApiUrl } from "@/lib/api";
import { connectMetaMask, createAsset, assignNominee, acceptNomination, submitClaim, getWalletContract } from "@/lib/blockchain";
import AuditTimeline, { AuditEvent } from "@/components/AuditTimeline";
import VerificationEvidence from "@/components/VerificationEvidence";
import StatusBadge from "@/components/StatusBadge";

export default function IntegrationPage() {
  const [wallet, setWallet] = useState<string>("");
  const [vaultRegistered, setVaultRegistered] = useState(false);
  const [assetName, setAssetName] = useState("Family Property");
  const [cid, setCid] = useState("");
  const [assetId, setAssetId] = useState<number | null>(null);
  const [nomineeAddress, setNomineeAddress] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [nomineeAssigned, setNomineeAssigned] = useState(false);
  const [nomineeAccepted, setNomineeAccepted] = useState(false);
  const [deathCid, setDeathCid] = useState("");
  const [claimId, setClaimId] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [registryResult, setRegistryResult] = useState<any>(null);
  const [claimPending, setClaimPending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const [demoMode, setDemoMode] = useState<"DEMO" | "FAKE">("DEMO");

  function nowTime() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function addLog(msg: string) { setLog((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]); }
  function pushEvent(title: string, detail?: string, hash?: string, status: AuditEvent["status"] = "ok") {
    setEvents((prev) => [...prev, { time: nowTime(), title, detail, hash, status }]);
  }
  function setErr(msg: string) { setError(msg); setTimeout(() => setError(""), 4000); }

  async function connect() {
    setError(""); setLoading("connect");
    try {
      const { address } = await connectMetaMask();
      setWallet(address);
      window.localStorage.setItem("lv_wallet", address);
      addLog(`MetaMask connected: ${address}`);
      pushEvent("Vault registered", `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (e: any) {
      const msg = e.message.includes("MetaMask") ? "MetaMask not found — install extension" : e.message;
      addLog(`Connect failed: ${msg}`); setErr(msg);
    } finally { setLoading(""); }
  }

  async function doRegisterVault() {
    if (!wallet) { setErr("Connect wallet first"); return; }
    setError(""); setLoading("register");
    try {
      const contract = await getWalletContract();
      const tx = await contract.registerVault();
      addLog(`registerVault tx: ${tx.hash} ... Confirming transaction...`);
      const receipt = await tx.wait();
      setVaultRegistered(true);
      setTxHashes((p) => ({ ...p, register: receipt.hash }));
      pushEvent("Vault registered", `Tx ${receipt.hash.slice(0, 10)}...`, receipt.hash);
      addLog("✓ Vault registered");
    } catch (e: any) {
      const msg = e.code === 4001 ? "MetaMask rejected the transaction" : e.message?.slice(0, 140);
      addLog(`Register failed: ${msg}`); setErr(msg);
    } finally { setLoading(""); }
  }

  async function uploadAssetFile(file: File) {
    setError(""); setLoading("upload");
    try {
      addLog("Uploading to IPFS...");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${getApiUrl()}/api/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!data.success && !data.cid) throw new Error(data.message || "IPFS upload failed");
      const returnedCid = data.cid || data.IpfsHash;
      setCid(returnedCid);
      pushEvent(`"Family Property" added`, `IPFS CID ${returnedCid.slice(0, 14)}...`);
      addLog(`✓ Pinata IPFS CID: ${returnedCid}`);
      return returnedCid;
    } catch (e: any) {
      addLog(`Upload failed: ${e.message}`); setErr("Certificate upload failed — check Pinata JWT");
      return null;
    } finally { setLoading(""); }
  }

  async function doCreateAsset() {
    if (!cid) { setErr("Upload asset first to get CID"); return; }
    setError(""); setLoading("create");
    try {
      addLog("Confirming transaction...");
      const { receipt, assetId: newId, hash } = await createAsset(assetName, cid);
      const id = newId ?? 0;
      setAssetId(id);
      setTxHashes((p) => ({ ...p, create: hash }));
      pushEvent(`Asset #${id} created`, `${assetName} → CID ${cid.slice(0, 10)}...`, hash);
      addLog(`✓ Blockchain createAsset #${id} tx: ${hash}`);
      const metaRes = await fetch(`${getApiUrl()}/api/assets`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockchain_asset_id: id, owner_wallet: wallet, name: assetName, ipfs_cid: cid, nominee_wallet: nomineeAddress, status: "locked" }),
      });
      const meta = await metaRes.json();
      addLog(`Supabase asset saved: ${JSON.stringify(meta.asset || meta).slice(0, 80)}`);
    } catch (e: any) {
      const msg = e.code === 4001 ? "MetaMask rejected" : e.message?.slice(0, 140);
      addLog(`createAsset failed: ${msg}`); setErr(msg);
    } finally { setLoading(""); }
  }

  async function doAssignNominee() {
    if (assetId === null) { setErr("Create asset first"); return; }
    setError(""); setLoading("assign");
    try {
      addLog("Confirming transaction...");
      const receipt = await assignNominee(assetId, nomineeAddress);
      addLog(`✓ NomineeAssigned tx: ${receipt.hash}`);
      setNomineeAssigned(true);
      setTxHashes((p) => ({ ...p, assign: receipt.hash }));
      pushEvent("Nominee assigned", `${nomineeAddress.slice(0, 10)}...`, receipt.hash);
      await fetch(`${getApiUrl()}/api/assets/${assetId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nominee_wallet: nomineeAddress }) });
    } catch (e: any) {
      const msg = e.code === 4001 ? "MetaMask rejected" : e.message?.slice(0, 140);
      addLog(`Assign failed: ${msg}`); setErr(msg);
    } finally { setLoading(""); }
  }

  async function doAccept() {
    if (assetId === null) { setErr("Need assetId"); return; }
    setError(""); setLoading("accept");
    try {
      addLog("Confirming transaction...");
      const receipt = await acceptNomination(assetId);
      addLog(`✓ NomineeAccepted tx: ${receipt.hash}`);
      setNomineeAccepted(true);
      setTxHashes((p) => ({ ...p, accept: receipt.hash }));
      pushEvent("Nomination accepted", `Asset #${assetId}`, receipt.hash);
    } catch (e: any) {
      const msg = e.code === 4001 ? "MetaMask rejected" : `Switch MetaMask to nominee wallet ${nomineeAddress}`;
      addLog(`Accept failed: ${e.message?.slice(0, 100)}`); setErr(msg);
    } finally { setLoading(""); }
  }

  async function uploadDeathCert(file: File) {
    setError(""); setLoading("death");
    try {
      addLog("Uploading to IPFS...");
      const form = new FormData(); form.append("file", file);
      const res = await fetch(`${getApiUrl()}/api/upload`, { method: "POST", body: form });
      const data = await res.json();
      const dcCid = data.cid || data.IpfsHash;
      setDeathCid(dcCid);
      addLog(`✓ Death certificate CID: ${dcCid}`);
      const claimRes = await fetch(`${getApiUrl()}/api/claims`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: String(assetId), claim_asset_id: assetId, nominee_wallet: wallet || nomineeAddress, death_certificate_cid: dcCid }),
      });
      const claimData = await claimRes.json();
      setClaimId(claimData.claim?.id || "");
      pushEvent("Death certificate submitted", `CID ${dcCid.slice(0, 10)}... — claim pending`);
      addLog(`Claim created: ${claimData.claim?.id} status pending`);
      return dcCid;
    } catch (e: any) { addLog(`Death cert upload failed: ${e.message}`); setErr("Certificate upload failed"); return null; } finally { setLoading(""); }
  }

  async function doAiVerify(file: File | null) {
    if (!file) { setErr("Select death certificate file again for AI verification"); return; }
    setError(""); setLoading("ai");
    try {
      addLog("AI analyzing document...");
      const form = new FormData(); form.append("file", file);
      const res = await fetch(`${getApiUrl()}/api/ai/verify-death-certificate`, { method: "POST", body: form });
      const data = await res.json();
      if (!data.success && !data.verification) throw new Error(data.message || "AI verification service unavailable");
      const v = data.verification || data;
      setAiResult(v);
      pushEvent("AI verification completed", `${v.status} ${Math.round((v.confidence || 0) * 100)}% — ${v.ai_analysis?.certificate_number || ""}`);
      addLog(`AI result: ${v.status} conf ${v.confidence} cert ${v.ai_analysis?.certificate_number || ""}`);
      if (claimId) await fetch(`${getApiUrl()}/api/claims/${claimId}/verify`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ai_result: v, verification_status: v.status === "VERIFIED" ? "verified" : "needs_review" }) });
    } catch (e: any) { addLog(`AI verify failed: ${e.message?.slice(0, 120)}`); setErr("AI verification service unavailable — check AI :8000"); } finally { setLoading(""); }
  }

  // Demo toggle: DC-DEMO-001 passes, DC-FAKE-001 rejected (6.7-6.8)
  async function doRegistryVerify() {
    const isFake = demoMode === "FAKE";
    const certNum = isFake ? "DC-FAKE-001" : aiResult?.ai_analysis?.certificate_number || "DC-DEMO-001";
    const name = isFake ? "Fake Person" : aiResult?.ai_analysis?.deceased_name || "John Doe";
    const date = isFake ? "2026-01-01" : aiResult?.ai_analysis?.date_of_death || "2026-08-20";
    const authority = isFake ? "Fake Authority" : aiResult?.ai_analysis?.issuing_authority || "Example Municipal Authority";
    setError(""); setLoading("registry");
    try {
      addLog("Verifying with Government Registry...");
      const res = await fetch(`${getApiUrl()}/api/registry/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate_number: certNum, deceased_name: name, date_of_death: date, issuing_authority: authority }),
      });
      const data = await res.json();
      setRegistryResult(data);
      const detail = data.verified ? "MATCH ✓" : `REJECTED: ${data.reason}`;
      pushEvent(data.verified ? "Government registry matched" : "Government registry rejected", `${certNum} — ${detail}`, undefined, data.verified ? "ok" : "failed");
      addLog(`Registry: ${data.verified ? "✓ VERIFIED" : "✗ FAILED"} ${data.status} ${data.reason}`);
      if (claimId) await fetch(`${getApiUrl()}/api/claims/${claimId}/verify`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verification_status: data.verified ? "verified" : "rejected", verification_reason: data.reason, registry_result: data }) });
    } catch (e: any) { addLog(`Registry failed: ${e.message}`); setErr("Registry verification failed"); } finally { setLoading(""); }
  }

  async function doSubmitClaim() {
    if (assetId === null) return;
    setError(""); setLoading("claim");
    try {
      addLog("Confirming transaction...");
      const receipt = await submitClaim(assetId);
      addLog(`✓ ClaimSubmitted tx: ${receipt.hash} -> CLAIM_PENDING`);
      setClaimPending(true);
      setTxHashes((p) => ({ ...p, claim: receipt.hash }));
      pushEvent("Claim submitted", `Asset #${assetId} → CLAIM_PENDING`, receipt.hash);
      if (claimId) await fetch(`${getApiUrl()}/api/claims/${claimId}/verify`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockchain_status: "claim_pending" }) });
    } catch (e: any) {
      const msg = e.code === 4001 ? "MetaMask rejected" : "Only nominee can claim — switch wallet";
      addLog(`submitClaim failed: ${e.message?.slice(0, 100)}`); setErr(msg);
    } finally { setLoading(""); }
  }

  async function doUnlock() {
    if (assetId === null) return;
    setError(""); setLoading("unlock");
    try {
      addLog("Backend verifier unlocking...");
      const res = await fetch(`${getApiUrl()}/api/blockchain/unlock/${assetId}`, { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Not authorized verifier");
      addLog(`✓ AssetUnlocked tx: ${data.transactionHash} -> UNLOCKED`);
      setUnlocked(true);
      setTxHashes((p) => ({ ...p, unlock: data.transactionHash }));
      pushEvent("Blockchain asset unlocked", `Tx ${data.transactionHash.slice(0, 10)}... → UNLOCKED`, data.transactionHash);
      if (claimId) await fetch(`${getApiUrl()}/api/claims/${claimId}/verify`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockchain_status: "unlocked" }) });
      await fetch(`${getApiUrl()}/api/assets/${assetId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "unlocked" }) });
    } catch (e: any) {
      const msg = e.message.includes("Not authorized") ? "Only authorized verifier can unlock" : e.message.slice(0, 120);
      addLog(`Unlock failed: ${msg}`); setErr(msg);
    } finally { setLoading(""); }
  }

  return (
    <div className="page-shell" style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <header className="page-header">
        <div>
          <p className="micro-label">Phase 6 — Security + Demo Hardening</p>
          <h1>Legacy Vault Demo Console</h1>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>Owner → IPFS + Blockchain + Supabase → Nominee → AI → Registry → Verifier → UNLOCKED 🔓</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className={`magnetic-button ${loading === "connect" ? "loading-btn" : ""}`} onClick={connect} disabled={loading === "connect"}>
            {loading === "connect" ? "Connecting..." : wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect MetaMask"}
          </button>
          {!wallet && <span style={{ fontSize: 12, color: "var(--muted)" }}>Hardhat 8545</span>}
        </div>
      </header>

      {error && <div className="error-banner">❌ {error}</div>}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">1 — Register Vault</p><h2>VaultRegistered</h2></div>
            {vaultRegistered ? <StatusBadge status="verified" /> : <StatusBadge status="pending" />}
          </div>
          <button className={`magnetic-button ${loading === "register" ? "loading-btn" : ""}`} onClick={doRegisterVault} disabled={!!loading || !wallet}>
            {loading === "register" ? "Confirming transaction..." : "Register Vault"}
          </button>
          {txHashes.register && <div className="tx-hash" style={{ marginTop: 8 }}>Tx: {txHashes.register} <span style={{ color: "#047857" }}>✓ confirmed</span></div>}
        </section>

        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">2 — Upload Asset → Pinata</p><h2>Upload + IPFS</h2></div>
            {cid ? <StatusBadge status="verified" /> : <StatusBadge status="locked" />}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Asset name: Family Property" />
            <label className="premium-dropzone" style={{ minHeight: 90 }}>
              <input type="file" accept=".pdf,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAssetFile(f); }} />
              <b>{loading === "upload" ? "Uploading to IPFS..." : "Select family-property.pdf"}</b>
              <span>POST /api/upload → CID</span>
            </label>
            {cid && <div className="tx-hash">CID: {cid}</div>}
            {cid && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className={`magnetic-button ${loading === "create" ? "loading-btn" : ""}`} onClick={doCreateAsset} disabled={!!loading}>
                  {loading === "create" ? "Confirming transaction..." : `Create blockchain asset #${assetId ?? "?"}`}
                </button>
                <span className="micro-label" style={{ alignSelf: "center" }}>contract.createAsset()</span>
              </div>
            )}
            {txHashes.create && <div className="tx-hash">Tx: {txHashes.create} <span style={{ color: "#047857" }}>✓ confirmed</span></div>}
          </div>
          <div className="privacy-notice">Documents are stored using decentralized IPFS infrastructure. Only authorized users should upload sensitive documents. For production, encrypt before IPFS — CID alone does not provide confidentiality.</div>
        </section>

        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">3 — Nominee Assignment (Owner only)</p><h2>assignNominee</h2></div>
            {nomineeAssigned ? <StatusBadge status="verified" /> : <StatusBadge status="pending" />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input value={nomineeAddress} onChange={(e) => setNomineeAddress(e.target.value)} placeholder="0xNominee (Hardhat #1: 0x7099...)" />
            <button className={`magnetic-button ${loading === "assign" ? "loading-btn" : ""}`} onClick={doAssignNominee} disabled={!!loading || assetId === null}>
              {loading === "assign" ? "Confirming transaction..." : "Assign Nominee"}
            </button>
          </div>
          {txHashes.assign && <div className="tx-hash" style={{ marginTop: 8 }}>Tx: {txHashes.assign} <span style={{ color: "#047857" }}>✓ confirmed</span></div>}
        </section>

        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">4 — Nominee Accepts (Nominee only)</p><h2>acceptNomination</h2></div>
            {nomineeAccepted ? <StatusBadge status="verified" /> : <StatusBadge status="claim_pending" />}
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Switch MetaMask to nominee wallet, then:</p>
          <button className={`magnetic-button ${loading === "accept" ? "loading-btn" : ""}`} onClick={doAccept} disabled={!!loading || assetId === null}>
            {loading === "accept" ? "Confirming transaction..." : "Accept Nomination (as Nominee)"}
          </button>
          {txHashes.accept && <div className="tx-hash" style={{ marginTop: 8 }}>Tx: {txHashes.accept} <span style={{ color: "#047857" }}>✓ confirmed</span></div>}
        </section>

        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">5 — Death Certificate + AI (6.6)</p><h2>Certificate Verification</h2></div>
            {aiResult ? <StatusBadge status={aiResult.status === "VERIFIED" ? "verified" : aiResult.status === "REJECTED" ? "rejected" : "verifying"} /> : <StatusBadge status="pending" />}
          </div>
          <label className="premium-dropzone" style={{ minHeight: 90 }}>
            <input type="file" accept=".pdf,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDeathCert(f); }} />
            <b>{loading === "death" ? "Uploading to IPFS..." : "Select death-certificate.pdf"}</b>
            <span>Backend → Pinata → POST /api/claims (pending)</span>
          </label>
          {deathCid && <div className="tx-hash" style={{ marginTop: 8 }}>Death CID: {deathCid}</div>}
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8 }}>
              <input type="file" accept=".pdf,image/*" style={{ display: "none" }} id="ai-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void doAiVerify(f); }} />
              <span className={`secondary-link ${loading === "ai" ? "loading-btn" : ""}`} onClick={() => document.getElementById("ai-file")?.click()} style={{ cursor: "pointer" }}>
                {loading === "ai" ? "AI analyzing document..." : "Run AI Verification"}
              </span>
            </label>
            <select value={demoMode} onChange={(e) => setDemoMode(e.target.value as any)} style={{ height: 36, borderRadius: 8, border: "1px solid var(--line)" }}>
              <option value="DEMO">DC-DEMO-001 (pass)</option>
              <option value="FAKE">DC-FAKE-001 (reject demo 6.7)</option>
            </select>
          </div>
          {aiResult && (
            <div style={{ marginTop: 12 }}>
              <VerificationEvidence checks={aiResult.checks || aiResult.ai_analysis || {}} confidence={aiResult.confidence || 0.91} status={aiResult.status} />
            </div>
          )}
        </section>

        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">6 — Government Registry (6.7-6.8)</p><h2>Verify with Registry</h2></div>
            {registryResult?.verified ? <StatusBadge status="verified" /> : registryResult ? <StatusBadge status="rejected" /> : <StatusBadge status="pending" />}
          </div>
          <button className={`magnetic-button ${loading === "registry" ? "loading-btn" : ""}`} onClick={doRegistryVerify} disabled={!!loading || (!aiResult && demoMode !== "FAKE")}>
            {loading === "registry" ? "Verifying..." : `Verify ${demoMode === "FAKE" ? "DC-FAKE-001 (expect REJECT)" : "DC-DEMO-001 (expect VERIFIED)"}`}
          </button>
          <p className="micro-label" style={{ marginTop: 6 }}>Demo: DC-DEMO-001 = John Doe 2026-08-20 — DC-FAKE-001 = NOT_FOUND → REJECTED</p>
          {registryResult && (
            <div style={{ marginTop: 12 }}>
              <VerificationEvidence
                checks={{
                  document_type: registryResult.verified,
                  required_fields: registryResult.verified,
                  registry_match: registryResult.verified,
                  certificate_number: registryResult.verified,
                }}
                confidence={registryResult.verified ? 0.96 : 0.32}
                status={registryResult.verified ? "VERIFIED" : "REJECTED"}
              />
              <div style={{ marginTop: 8, fontSize: 12, padding: 10, background: registryResult.verified ? "#ecfdf5" : "#fef2f2", borderRadius: 8 }}>
                <b>{registryResult.verified ? "GOVERNMENT VERIFICATION ✓ VERIFIED" : "✕ VERIFICATION FAILED — Registry Match ✕"}</b>
                <div>{registryResult.reason}</div>
                <div>Name: {registryResult.name || registryResult.registry_record?.name || "—"} | Date: {registryResult.date_of_death || "—"} | Status: {registryResult.status}</div>
              </div>
            </div>
          )}
        </section>

        <section className="console-card">
          <div className="card-head">
            <div><p className="micro-label">7 — Claim + Verifier (6.1 onlyVerifier + 6.2 paused)</p><h2>Blockchain Transition</h2></div>
            {unlocked ? <StatusBadge status="unlocked" /> : claimPending ? <StatusBadge status="claim_pending" /> : <StatusBadge status="locked" />}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className={`magnetic-button ${loading === "claim" ? "loading-btn" : ""}`} onClick={doSubmitClaim} disabled={!!loading || assetId === null || !nomineeAccepted}>
              {loading === "claim" ? "Confirming transaction..." : "Submit Claim (nominee)"}
            </button>
            <button
              className={`magnetic-button light ${loading === "unlock" ? "loading-btn" : ""}`}
              onClick={doUnlock}
              disabled={!!loading || !claimPending || !registryResult?.verified}
              title={!registryResult?.verified ? "Need registry VERIFIED first (AI alone does NOT unlock 6.18)" : ""}
            >
              {loading === "unlock" ? "Backend verifier unlocking..." : "Backend Verifier → unlockAsset()"}
            </button>
          </div>
          <p className="micro-label" style={{ marginTop: 8 }}>AI does NOT directly unlock — only registry VERIFIED → authorized verifier (Hardhat #1) can unlock. Unauthorized wallets revert.</p>
          {txHashes.claim && <div className="tx-hash" style={{ marginTop: 8 }}>Claim Tx: {txHashes.claim} <span style={{ color: "#047857" }}>✓</span></div>}
          {txHashes.unlock && <div className="tx-hash">Unlock Tx: {txHashes.unlock} <span style={{ color: "#047857" }}>✓</span></div>}
          {unlocked && (
            <div style={{ marginTop: 12, padding: 16, background: "#111", color: "#fff", borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>✓ VERIFIED</div>
              <div>Death Certificate Verified — Government Registry Match — Blockchain Asset Unlocked</div>
              <div style={{ fontSize: 22, marginTop: 8 }}>🔓 ACCESS GRANTED</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#a1a1aa" }}>IPFS CID: {cid}</div>
              <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noreferrer" className="primary-link light" style={{ marginTop: 12, display: "inline-flex" }}>
                View Document
              </a>
            </div>
          )}
        </section>

        <section className="console-card">
          <div className="card-head">
            <h2>Legacy Vault Audit Trail (6.4)</h2>
            <span>{events.length} events</span>
          </div>
          <AuditTimeline events={events} />
          {log.length > 0 && (
            <pre style={{ marginTop: 12, maxHeight: 160, overflow: "auto", background: "var(--dark)", color: "#e5e7eb", padding: 12, borderRadius: 10, fontSize: 11 }}>
              {log.join("\n")}
            </pre>
          )}
        </section>

        <section className="console-card">
          <h2 style={{ margin: 0 }}>Phase 6 Checklist</h2>
          <ul style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
            <li>{vaultRegistered ? "✓" : "○"} Vault registered</li>
            <li>{cid ? "✓" : "○"} Upload asset → CID → createAsset</li>
            <li>{nomineeAssigned ? "✓" : "○"} Owner-only assignNominee</li>
            <li>{nomineeAccepted ? "✓" : "○"} Nominee-only accept</li>
            <li>{deathCid ? "✓" : "○"} Death cert + claim pending</li>
            <li>{aiResult ? "✓" : "○"} AI evidence (6.6) + confidence</li>
            <li>{registryResult?.verified ? "✓ verified" : registryResult ? "✕ rejected (6.7)" : "○"} Registry DC-DEMO-001 / DC-FAKE-001</li>
            <li>{claimPending ? "✓" : "○"} submitClaim → CLAIM_PENDING</li>
            <li>{unlocked ? "✓" : "○"} Verifier-only unlock (6.1) + pause guard (6.2) → UNLOCKED</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
