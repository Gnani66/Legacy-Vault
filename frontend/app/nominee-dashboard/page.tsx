"use client";

import { useEffect } from "react";

export default function NomineeDashboardPage() {
  useEffect(() => {
    window.location.href = "/nominee/documents";
  }, []);

  return (
    <div className="page-shell">
      <p className="empty-message">Redirecting...</p>
    </div>
  );
}