"use client";

type Checks = Record<string, boolean | undefined>;

export default function VerificationEvidence({
  checks,
  confidence,
  status,
}: {
  checks: Checks;
  confidence: number;
  status: string;
}) {
  const labels: Record<string, string> = {
    document_type: "Document Type",
    required_fields: "Required Fields",
    date_consistency: "Date Consistency",
    visual_integrity: "Visual Integrity",
    qr_verification: "QR Code",
    certificate_number: "Certificate Number",
    registry_match: "Government Registry",
    gov_registry: "Government Registry",
  };

  const isPassed = status === "VERIFIED" || status === "verified" || status === "VALID";
  const isRejected = status === "REJECTED" || status === "rejected" || status === "FAILED";

  return (
    <div className={`verify-evidence ${isPassed ? "passed" : isRejected ? "rejected" : "review"}`}>
      <div className="verify-evidence-head">
        <span className="micro-label">CERTIFICATE VERIFICATION</span>
        <span className={`status-badge ${isPassed ? "enabled" : isRejected ? "danger" : "warning"}`}>
          {status}
        </span>
      </div>
      <div className="verify-checks-grid">
        {Object.entries(checks).map(([k, v]) => (
          <div key={k} className={`verify-check ${v ? "ok" : v === false ? "fail" : "unknown"}`}>
            <span>{labels[k] || k.replace(/_/g, " ")}</span>
            <b>{v === true ? "✓" : v === false ? "✕" : "—"}</b>
          </div>
        ))}
      </div>
      <div className="verify-confidence">
        <span>AI Confidence</span>
        <strong>{Math.round((confidence || 0) * 100)}%</strong>
        <div className="health-bar" style={{ marginTop: 8 }}>
          <span style={{ width: `${Math.round((confidence || 0) * 100)}%`, background: isPassed ? "#047857" : isRejected ? "#991b1b" : "#d97706" }} />
        </div>
      </div>
      <div className={`verify-final ${isPassed ? "passed" : isRejected ? "rejected" : ""}`}>
        {isPassed ? "✓ VERIFICATION PASSED" : isRejected ? "✕ VERIFICATION FAILED" : "⚠ NEEDS REVIEW"}
      </div>
    </div>
  );
}
