"use client";

const map: Record<string, string> = {
  LOCKED: "locked",
  CLAIM_PENDING: "claim-pending",
  CLAIMPENDING: "claim-pending",
  VERIFYING: "verifying",
  VERIFIED: "verified",
  REJECTED: "rejected",
  UNLOCKED: "unlocked",
  NEEDS_REVIEW: "needs-review",
  PENDING: "pending",
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase().replace(/\s+/g, "_");
  const cls = map[key] || "locked";
  const label = status.replace(/_/g, " ");
  return <span className={`status-badge badge-${cls}`}>{label}</span>;
}
