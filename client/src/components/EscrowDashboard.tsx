"use client";

import { useState } from "react";
import {
  createEscrow,
  addMilestone,
  fundEscrow,
  cancelEscrow,
  submitMilestone,
  approveMilestone,
  getEscrow,
  getMilestoneCount,
  getMilestone,
  type Escrow,
  type Milestone,
  type MilestoneStatus,
} from "@/hooks/contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(raw: bigint) {
  const xlm = Number(raw) / 10_000_000;
  return xlm.toFixed(7);
}

function statusName(status: MilestoneStatus): string {
  return status.tag;
}

function statusColor(status: MilestoneStatus) {
  switch (status.tag) {
    case "Pending":
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    case "Submitted":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "Approved":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

// ─── Create Escrow Section ───────────────────────────────────────────────────
function CreateEscrowForm({
  onCreated,
}: {
  onCreated: (id: number) => void;
}) {
  const [freelancer, setFreelancer] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleCreate() {
    if (!freelancer || !token) return;
    setLoading(true);
    setMsg("");
    try {
      const id = await createEscrow(freelancer, token);
      setMsg(`Escrow created! ID: ${id}`);
      onCreated(Number(id));
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <h2 className="text-lg font-semibold mb-4">Create New Escrow</h2>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Freelancer Address (G...)"
          value={freelancer}
          onChange={(e) => setFreelancer(e.target.value)}
          className="w-full px-4 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <input
          type="text"
          placeholder="Token Address (C... or asset contract)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-4 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <button
          onClick={handleCreate}
          disabled={loading || !freelancer || !token}
          className="w-full py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : "Create Escrow"}
        </button>
        {msg && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{msg}</p>
        )}
      </div>
    </div>
  );
}

// ─── Add Milestone Form ──────────────────────────────────────────────────────
function AddMilestoneForm({
  escrowId,
  onAdded,
}: {
  escrowId: number;
  onAdded: () => void;
}) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleAdd() {
    if (!desc || !amount) return;
    setLoading(true);
    setMsg("");
    try {
      await addMilestone(
        escrowId,
        desc,
        Math.floor(Number(amount) * 10_000_000),
      );
      setMsg("Milestone added!");
      setDesc("");
      setAmount("");
      onAdded();
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    }
    setLoading(false);
  }

  return (
    <div className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
      <h3 className="text-sm font-medium mb-3">Add Milestone</h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Amount (XLM)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.0000001"
          className="w-32 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !desc || !amount}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "..." : "Add"}
        </button>
      </div>
      {msg && <p className="text-xs text-zinc-500 mt-2">{msg}</p>}
    </div>
  );
}

// ─── Milestone Card ──────────────────────────────────────────────────────────
function MilestoneCard({
  milestone,
  index,
  escrowId,
  escrow,
  walletAddress,
  onAction,
}: {
  milestone: Milestone;
  index: number;
  escrowId: number;
  escrow: Escrow;
  walletAddress: string;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const isFreelancer = walletAddress === escrow.freelancer;
  const isClient = walletAddress === escrow.client;

  async function handleSubmit() {
    setLoading(true);
    setMsg("");
    try {
      await submitMilestone(escrowId, index);
      setMsg("Submitted!");
      onAction();
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    }
    setLoading(false);
  }

  async function handleApprove() {
    setLoading(true);
    setMsg("");
    try {
      await approveMilestone(escrowId, index);
      setMsg("Approved & paid!");
      onAction();
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-zinc-400">#{index}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(milestone.status)}`}
          >
            {statusName(milestone.status)}
          </span>
        </div>
        <p className="text-sm font-medium truncate">{milestone.description}</p>
        <p className="text-xs text-zinc-500">
          {formatAmount(milestone.amount)} XLM
        </p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {milestone.status.tag === "Pending" && isFreelancer && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Submit"}
          </button>
        )}
        {milestone.status.tag === "Submitted" && isClient && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Approve & Pay"}
          </button>
        )}
        {msg && <span className="text-xs text-zinc-500">{msg}</span>}
      </div>
    </div>
  );
}

// ─── Escrow Detail View ──────────────────────────────────────────────────────
function EscrowDetail({
  escrowId,
  escrow,
  milestones,
  walletAddress,
  onRefresh,
}: {
  escrowId: number;
  escrow: Escrow;
  milestones: Milestone[];
  walletAddress: string;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const isClient = walletAddress === escrow.client;

  async function handleFund() {
    setLoading(true);
    setMsg("");
    try {
      await fundEscrow(escrowId);
      setMsg("Escrow funded!");
      onRefresh();
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!confirm("Cancel escrow and refund all funds?")) return;
    setLoading(true);
    setMsg("");
    try {
      await cancelEscrow(escrowId);
      setMsg("Escrow cancelled, funds refunded.");
      onRefresh();
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    }
    setLoading(false);
  }

  const totalNum = Number(escrow.total);
  const releasedNum = Number(escrow.released);
  const progress = totalNum > 0 ? (releasedNum / totalNum) * 100 : 0;

  return (
    <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Escrow #{escrowId}</h2>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${escrow.funded ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
          >
            {escrow.funded ? "Funded" : "Draft"}
          </span>
        </div>
        {isClient && escrow.funded && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
          >
            Cancel Escrow
          </button>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Client</p>
          <p className="text-sm font-mono">{shortenAddr(escrow.client)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Freelancer</p>
          <p className="text-sm font-mono">{shortenAddr(escrow.freelancer)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Total</p>
          <p className="text-sm font-semibold">
            {formatAmount(escrow.total)} XLM
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Released</p>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {formatAmount(escrow.released)} XLM
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {escrow.funded && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Fund Button */}
      {isClient && !escrow.funded && milestones.length > 0 && (
        <button
          onClick={handleFund}
          disabled={loading}
          className="w-full mb-6 py-2.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading
            ? "Processing..."
            : `Fund Escrow (${formatAmount(escrow.total)} XLM)`}
        </button>
      )}

      {/* Add Milestone */}
      {isClient && !escrow.funded && (
        <div className="mb-6">
          <AddMilestoneForm escrowId={escrowId} onAdded={onRefresh} />
        </div>
      )}

      {/* Milestones */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-zinc-600 dark:text-zinc-400">
          Milestones ({milestones.length})
        </h3>
        <div className="space-y-2">
          {milestones.map((ms, i) => (
            <MilestoneCard
              key={i}
              milestone={ms}
              index={i}
              escrowId={escrowId}
              escrow={escrow}
              walletAddress={walletAddress}
              onAction={onRefresh}
            />
          ))}
          {milestones.length === 0 && (
            <p className="text-sm text-zinc-400 py-4 text-center">
              No milestones yet.{" "}
              {isClient ? "Add one above." : "Waiting for client."}
            </p>
          )}
        </div>
      </div>

      {msg && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{msg}</p>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function EscrowDashboard({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [escrowId, setEscrowId] = useState("");
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadEscrow(id: number) {
    setLoading(true);
    setError("");
    try {
      const data = await getEscrow(id);
      setEscrow(data);
      const count = await getMilestoneCount(id);
      const ms: Milestone[] = [];
      for (let i = 0; i < count; i++) {
        ms.push(await getMilestone(id, i));
      }
      setMilestones(ms);
    } catch (e) {
      setError(`Escrow not found or error: ${String(e)}`);
      setEscrow(null);
      setMilestones([]);
    }
    setLoading(false);
  }

  function handleRefresh() {
    const id = Number(escrowId);
    if (!isNaN(id)) loadEscrow(id);
  }

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Milestone Payment Escrow</h1>
        <p className="text-sm text-zinc-500">
          Create escrows, add milestones, fund, and manage payments on Stellar
          testnet.
        </p>
      </div>

      <CreateEscrowForm onCreated={(id) => setEscrowId(String(id))} />

      {/* View Escrow */}
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <h2 className="text-lg font-semibold mb-4">View Escrow</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Escrow ID"
            value={escrowId}
            onChange={(e) => setEscrowId(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={() => {
              const id = Number(escrowId);
              if (!isNaN(id)) loadEscrow(id);
            }}
            disabled={loading || !escrowId}
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Load"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>

      {/* Escrow Detail */}
      {escrow && (
        <EscrowDetail
          escrowId={Number(escrowId)}
          escrow={escrow}
          milestones={milestones}
          walletAddress={walletAddress}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
