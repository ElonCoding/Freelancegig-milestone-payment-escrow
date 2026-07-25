"use client";

import { useState, useEffect } from "react";
import { getWalletAddress, ensureWalletAccess } from "@/hooks/contract";

export default function Navbar() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWalletAddress().then(setAddress);
  }, []);

  async function connect() {
    setLoading(true);
    try {
      const addr = await ensureWalletAccess();
      setAddress(addr);
    } catch (e) {
      alert(String(e));
    }
    setLoading(false);
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          E
        </div>
        <span className="text-lg font-semibold tracking-tight">
          MilestoneEscrow
        </span>
      </div>
      <div>
        {address ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Connecting..." : "Connect Freighter"}
          </button>
        )}
      </div>
    </nav>
  );
}
