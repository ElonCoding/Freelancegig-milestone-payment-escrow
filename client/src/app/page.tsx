"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import EscrowDashboard from "@/components/EscrowDashboard";
import EventFeed from "@/components/EventFeed";
import { getWalletAddress } from "@/hooks/contract";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    getWalletAddress().then(setWalletAddress);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />

      {walletAddress ? (
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <EscrowDashboard walletAddress={walletAddress} />
          <EventFeed />
        </main>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-lg shadow-blue-500/20">
            E
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Stellar Freelance Escrow dApp
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-md mb-8">
            Decentralized milestone-based payment escrow with automated dispute resolution & real-time on-chain event tracking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left">
            <FeatureCard
              title="1. Milestone Escrows"
              description="Define milestone deliverables & lock payment tokens safely in Soroban smart contract."
            />
            <FeatureCard
              title="2. Deliver & Dispute"
              description="Submit work, request client approvals, or trigger arbitration for disputed work."
            />
            <FeatureCard
              title="3. Instant Settlement"
              description="Released funds transfer directly to freelancer upon client or arbitrator approval."
            />
          </div>

          <div className="mt-8 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-md w-full">
            <p className="text-xs font-mono text-zinc-500 mb-2">
              🔒 Required Wallet Extension
            </p>
            <p className="text-sm font-medium">
              Connect your Freighter wallet to start managing milestone escrows.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <h3 className="text-sm font-semibold mb-1 text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
