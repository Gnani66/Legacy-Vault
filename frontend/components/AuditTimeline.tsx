"use client";

export type AuditEvent = {
  time: string;
  title: string;
  detail?: string;
  hash?: string;
  status?: "ok" | "pending" | "failed";
};

export default function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (!events.length) {
    return <p className="empty-message">No events yet — connect wallet to begin.</p>;
  }
  return (
    <div className="audit-timeline">
      {events.map((ev, i) => (
        <div key={i} className={`audit-tl-row ${ev.status || "ok"}`}>
          <div className="audit-tl-dot" />
          {i < events.length - 1 && <div className="audit-tl-line" />}
          <div className="audit-tl-content">
            <div className="audit-tl-time">{ev.time}</div>
            <div className="audit-tl-title">{ev.title}</div>
            {ev.detail && <div className="audit-tl-detail">{ev.detail}</div>}
            {ev.hash && (
              <div className="audit-tl-hash">
                Tx: <code>{ev.hash.slice(0, 10)}...{ev.hash.slice(-6)}</code>{" "}
                <a href={`#`} onClick={(e) => e.preventDefault()} title={ev.hash} style={{ marginLeft: 6, fontSize: 11, color: "var(--muted)" }}>
                  View Transaction
                </a>
                <span style={{ marginLeft: 6, color: "#047857", fontSize: 11 }}>✓ confirmed</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
