"use client";

import { useState, useEffect } from "react";
import { getWalletAddress, ensureWalletAccess } from "@/hooks/contract";

export default function Navbar() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-black/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700/60 flex items-center justify-center shadow-inner">
            <span className="text-xs font-semibold text-white font-mono">⚡</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">
              MilestoneEscrow
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-full">
              v1.0
            </span>
          </div>
        </div>

        {/* Network & Wallet */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Stellar Testnet</span>
          </div>

          {address ? (
            <button
              onClick={copyAddress}
              title="Click to copy address"
              className="group flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{address.slice(0, 5)}...{address.slice(-4)}</span>
              <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 ml-1">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={loading}
              className="relative group overflow-hidden rounded-lg p-[1px] font-medium text-xs transition-all focus:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-700 rounded-lg group-hover:opacity-100 opacity-70 transition-opacity" />
              <span className="relative block px-4 py-2 rounded-[7px] bg-black text-white group-hover:bg-neutral-900 transition-colors">
                {loading ? "Connecting..." : "Connect Freighter"}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

