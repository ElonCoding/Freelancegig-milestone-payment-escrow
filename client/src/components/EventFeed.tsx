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
    <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>⚡ Real-Time On-Chain Event Stream</span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
        </h2>
        <span className="text-xs font-mono text-zinc-500">
          {connected ? "Subscribed to RPC" : "Connection Disconnected"}
        </span>
      </div>

      {!connected && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          ⚠️ Connection lost to Soroban RPC node. Retrying in background...
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
        {events.length > 0 ? (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center"
            >
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-semibold mr-2">
                  [{evt.topic}]
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-md inline-block align-bottom">
                  {evt.data}
                </span>
              </div>
              <span className="text-zinc-400 text-[10px] whitespace-nowrap ml-2">
                {evt.timestamp}
              </span>
            </div>
          ))
        ) : (
          <p className="text-zinc-400 py-4 text-center">
            Listening for contract events...
          </p>
        )}
      </div>
    </div>
  );
}
