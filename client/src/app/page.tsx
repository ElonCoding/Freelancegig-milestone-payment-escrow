"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import EscrowDashboard from "@/components/EscrowDashboard";
import { getWalletAddress } from "@/hooks/contract";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    getWalletAddress().then(setWalletAddress);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {walletAddress ? (
        <EscrowDashboard walletAddress={walletAddress} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-6">
            E
          </div>
          <h1 className="text-3xl font-bold mb-3 text-center">
            Milestone Payment Escrow
          </h1>
          <p className="text-zinc-500 text-center max-w-md mb-8">
            A decentralized escrow DApp for freelancers. Fund projects with
            milestone-based payments on Stellar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
            <FeatureCard
              title="Create Escrows"
              description="Set up escrows with a freelancer and token address"
            />
            <FeatureCard
              title="Add Milestones"
              description="Define work milestones with individual payment amounts"
            />
            <FeatureCard
              title="Approve & Pay"
              description="Release payments only when milestones are completed"
            />
          </div>
          <p className="mt-8 text-sm text-zinc-400">
            Connect your Freighter wallet to get started.
          </p>
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
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}
