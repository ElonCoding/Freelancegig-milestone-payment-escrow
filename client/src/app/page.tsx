"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import EscrowDashboard from "@/components/EscrowDashboard";
import EventFeed from "@/components/EventFeed";
import { getWalletAddress, ensureWalletAccess } from "@/hooks/contract";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getWalletAddress().then(setWalletAddress);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const addr = await ensureWalletAccess();
      setWalletAddress(addr);
    } catch (e) {
      alert(String(e));
    }
    setConnecting(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-100 antialiased selection:bg-neutral-800 selection:text-white">
      <Navbar />

      <div className="relative flex-1">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-neutral-900/30 blur-3xl pointer-events-none rounded-full" />

        {walletAddress ? (
          <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Escrow Management Workspace
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Manage deliverables, fund milestone allocations, and approve completed work.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
                  Soroban RPC: Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <EscrowDashboard walletAddress={walletAddress} />
              </div>
              <div className="lg:col-span-1 sticky top-24">
                <EventFeed />
              </div>
            </div>
          </main>
        ) : (
          <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            {/* Hero Header */}
            <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Stellar Soroban Smart Contract
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Decentralized Milestone Payment Escrow
              </h1>

              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                Trustless freelance payments locked on-chain. Funds are released per milestone upon client approval or arbitrated via dispute resolution.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-black font-medium text-xs sm:text-sm hover:bg-neutral-200 transition-all shadow-md shadow-white/5"
                >
                  {connecting ? "Connecting Wallet..." : "Connect Freighter Wallet"}
                </button>
                <a
                  href="https://github.com/ElonCoding/Freelancegig-milestone-payment-escrow"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium text-xs sm:text-sm hover:bg-neutral-800 transition-colors"
                >
                  View Contract Source ↗
                </a>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
              <BentoCard
                step="01"
                title="Create & Set Milestones"
                description="Client instantiates contract with freelancer address, setting milestone deliverables and XLM allocations."
              />
              <BentoCard
                step="02"
                title="Lock & Submit Work"
                description="Client locks project funds on-chain. Freelancer submits completed work deliverables per milestone."
              />
              <BentoCard
                step="03"
                title="Approve or Arbitrate"
                description="Client approves milestone to release XLM instantly to freelancer, or raises on-chain dispute for arbitrator."
              />
            </div>

            {/* Live Terminal Preview */}
            <div className="max-w-2xl mx-auto">
              <EventFeed />
            </div>
          </main>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <div>MilestoneEscrow · Built on Stellar Soroban</div>
          <div className="flex items-center gap-4">
            <a
              href="https://stellar.expert/explorer/testnet/contract/CAQHJS675URVDAIMTGGCQ24AFKWSCOGQINWFZF2OS6KHHSJDYKAIQFA4"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              Contract Explorer ↗
            </a>
            <span>·</span>
            <a
              href="https://freelancegig-milestone-payment-escr-psi.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              Vercel Deployment ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-md hover:border-neutral-700 transition-all flex flex-col justify-between space-y-4">
      <span className="text-xs font-mono text-neutral-500 font-semibold">
        [{step}]
      </span>
      <div>
        <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
          {description}
        </p>
      </div>
    </div>
  );
}

