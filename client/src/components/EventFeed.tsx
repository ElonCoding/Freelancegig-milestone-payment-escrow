"use client";

import { useEffect, useState } from "react";
import { RPC_URL, CONTRACT_ADDRESS } from "@/hooks/contract";

export interface OnChainEvent {
  id: string;
  topic: string;
  timestamp: string;
  data: string;
}

export default function EventFeed() {
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      try {
        // 1. Get latest ledger sequence to avoid retention errors
        const ledgerRes = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getLatestLedger",
          }),
        });
        const ledgerJson = await ledgerRes.json();
        const latestSequence = ledgerJson.result?.sequence || 1000;
        const startLedger = Math.max(1, latestSequence - 2000);

        // 2. Query contract events
        const response = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "getEvents",
            params: {
              startLedger,
              filters: [{ type: "contract", contractIds: [CONTRACT_ADDRESS] }],
              pagination: { limit: 10 },
            },
          }),
        });

        if (!response.ok) throw new Error("RPC network offline");
        const json = await response.json();
        if (json.error) throw new Error(json.error.message);

        if (active) {
          setConnected(true);
          const rawEvents = json.result?.events || [];
          const parsed: OnChainEvent[] = rawEvents.map((e: any, idx: number) => ({
            id: e.id || `evt-${idx}-${Date.now()}`,
            topic: e.topic?.[0] || "ContractEvent",
            timestamp: new Date().toLocaleTimeString(),
            data: JSON.stringify(e.value || e.topic || {}),
          }));
          setEvents(parsed);
        }
      } catch (err) {
        if (active) {
          setConnected(false);
        }
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 6000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connected ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                connected ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono">
            On-Chain Event Stream
          </h2>
        </div>
        <span className="text-[11px] font-mono text-neutral-500">
          {connected ? "Subscribed (6s poll)" : "RPC Disconnected"}
        </span>
      </div>

      {!connected && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs font-mono text-rose-300">
          ⚠️ Connection lost to Soroban RPC node. Retrying in background...
        </div>
      )}

      <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs pr-1">
        {events.length > 0 ? (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors flex justify-between items-start gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                    {evt.topic}
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px] truncate font-mono">
                  {evt.data}
                </p>
              </div>
              <span className="text-neutral-500 text-[10px] whitespace-nowrap pt-0.5">
                {evt.timestamp}
              </span>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-neutral-500 text-xs font-mono">
            Listening for contract interactions on-chain...
          </div>
        )}
      </div>
    </div>
  );
}

