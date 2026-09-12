"use client";

import { useEffect, useState } from "react";

export default function WalletGate({ children, requireNominee = false }: { children: React.ReactNode; requireNominee?: boolean }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const w = (window as any)?.ethereum ? window.localStorage.getItem("lv_wallet") : null;
      // also try to get from provider
      if ((window as any)?.ethereum) {
        (window as any).ethereum
          .request({ method: "eth_accounts" })
          .then((accs: string[]) => {
            if (accs?.length) setWallet(accs[0]);
            setChecked(true);
          })
          .catch(() => setChecked(true));
      } else {
        setChecked(true);
      }
    } catch {
      setChecked(true);
    }
  }, []);

  if (!checked) return <p className="empty-message">Checking wallet...</p>;

  if (!wallet) {
    return (
      <div className="console-card" style={{ textAlign: "center", padding: 32 }}>
        <p className="micro-label">Wallet required</p>
        <h2 style={{ marginTop: 8 }}>Connect wallet to continue</h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>This route is protected — connect MetaMask to view your assets.</p>
        <button
          className="magnetic-button"
          style={{ marginTop: 16 }}
          onClick={async () => {
            const { connectMetaMask } = await import("@/lib/blockchain");
            try {
              const { address } = await connectMetaMask();
              window.localStorage.setItem("lv_wallet", address);
              setWallet(address);
              window.location.reload();
            } catch (e: any) {
              alert(e.message);
            }
          }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
