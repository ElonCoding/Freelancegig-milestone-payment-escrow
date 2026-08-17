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
  DEFAULT_ARBITRATOR,
  type Escrow,
  type Milestone,
  type MilestoneStatus,
} from "@/hooks/contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shortenAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(raw: bigint) {
  const xlm = Number(raw) / 10_000_000;
  return xlm.toFixed(7);
}

function statusName(status: MilestoneStatus): string {
  return status.tag;
}

function statusBadge(status: MilestoneStatus) {
  switch (status.tag) {
    case "Pending":
      return "bg-neutral-900 text-neutral-400 border border-neutral-800";
    case "Submitted":
      return "bg-amber-950/50 text-amber-300 border border-amber-800/60";
    case "Approved":
      return "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60";
    default:
      return "bg-neutral-900 text-neutral-400 border border-neutral-800";
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
  const [arbitrator, setArbitrator] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleCreate() {
    if (!freelancer || !token) return;
    setLoading(true);
    setMsg("");
    try {
      const id = await createEscrow(freelancer, token, arbitrator);
      setMsg(`Escrow created successfully! Escrow ID: #${id}`);
      onCreated(Number(id));
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    }
    setLoading(false);
  }

  function fillDefaultArbitrator() {
    setArbitrator(DEFAULT_ARBITRATOR);
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Create Escrow Contract
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Instantiate a new on-chain milestone escrow on Soroban
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800">
          New Contract
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-neutral-400 mb-1.5">
            Freelancer Wallet Address *
          </label>
          <input
            type="text"
            placeholder="G..."
            value={freelancer}
            onChange={(e) => setFreelancer(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-800 bg-neutral-900/80 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-neutral-400 mb-1.5">
            Token Contract Address *
          </label>
          <input
            type="text"
            placeholder="C... or native token asset"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-800 bg-neutral-900/80 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono text-neutral-400">
              Arbitrator Address (Optional)
            </label>
            <button
              type="button"
              onClick={fillDefaultArbitrator}
              className="text-[10px] font-mono text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
            >
              Use Default
            </button>
          </div>
          <input
            type="text"
            placeholder="G... (defaults to system arbitrator)"
            value={arbitrator}
            onChange={(e) => setArbitrator(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-800 bg-neutral-900/80 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !freelancer || !token}
          className="w-full py-2.5 px-4 text-xs font-medium rounded-lg bg-white text-black hover:bg-neutral-200 disabled:opacity-40 transition-all shadow-sm"
        >
          {loading ? "Creating Escrow..." : "Initialize Escrow Contract"}
        </button>

        {msg && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono ${
              msg.startsWith("Error")
                ? "bg-rose-950/30 border-rose-800/60 text-rose-300"
                : "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
            }`}
          >
            {msg}
          </div>
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
    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
      <h3 className="text-xs font-semibold text-neutral-300 mb-3 font-mono uppercase tracking-wider">
        + Add New Milestone
      </h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Deliverable Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-black text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
        />
        <input
          type="number"
          placeholder="Amount (XLM)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.0000001"
          className="w-full sm:w-36 px-3 py-2 text-xs font-mono rounded-lg border border-neutral-800 bg-black text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !desc || !amount}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {loading ? "..." : "Add Milestone"}
        </button>
      </div>
      {msg && (
        <p className="text-[11px] font-mono text-neutral-400 mt-2">{msg}</p>
      )}
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
    <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-mono text-neutral-500">#{index + 1}</span>
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${statusBadge(
              milestone.status
            )}`}
          >
            {statusName(milestone.status)}
          </span>
        </div>
        <p className="text-xs font-medium text-neutral-200 truncate">
          {milestone.description}
        </p>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          {formatAmount(milestone.amount)} <span className="text-neutral-500">XLM</span>
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {milestone.status.tag === "Pending" && isFreelancer && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Deliverable"}
          </button>
        )}
        {milestone.status.tag === "Submitted" && isClient && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-40 transition-colors"
          >
            {loading ? "Approving..." : "Approve & Release Funds"}
          </button>
        )}
        {msg && <span className="text-xs font-mono text-neutral-400">{msg}</span>}
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
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-6 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Escrow Contract #{escrowId}</h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                escrow.funded
                  ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/60"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800"
              }`}
            >
              {escrow.funded ? "● Active & Funded" : "○ Draft State"}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Contract ID: #{escrowId}
          </p>
        </div>
        {isClient && escrow.funded && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-mono rounded-lg border border-rose-900/60 text-rose-400 hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
          >
            Cancel & Refund
          </button>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
        <div>
          <p className="text-[11px] font-mono text-neutral-500 mb-1">Client</p>
          <p className="text-xs font-mono text-neutral-200 truncate">
            {shortenAddr(escrow.client)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-neutral-500 mb-1">Freelancer</p>
          <p className="text-xs font-mono text-neutral-200 truncate">
            {shortenAddr(escrow.freelancer)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-neutral-500 mb-1">Total Amount</p>
          <p className="text-xs font-mono font-semibold text-white">
            {formatAmount(escrow.total)} XLM
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-neutral-500 mb-1">Released Amount</p>
          <p className="text-xs font-mono font-semibold text-emerald-400">
            {formatAmount(escrow.released)} XLM
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {escrow.funded && (
        <div>
          <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1.5">
            <span>Funding Release Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
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
          className="w-full py-2.5 text-xs font-medium rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 transition-colors shadow-sm"
        >
          {loading
            ? "Processing..."
            : `Lock & Fund Escrow (${formatAmount(escrow.total)} XLM)`}
        </button>
      )}

      {/* Add Milestone */}
      {isClient && !escrow.funded && (
        <AddMilestoneForm escrowId={escrowId} onAdded={onRefresh} />
      )}

      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
            Contract Milestones ({milestones.length})
          </h3>
          <button
            onClick={onRefresh}
            className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Refresh Status
          </button>
        </div>
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
            <div className="p-8 text-center rounded-xl border border-dashed border-neutral-800 text-neutral-500 text-xs font-mono">
              No milestones defined for this escrow yet.{" "}
              {isClient ? "Add one above." : "Waiting for client to add milestones."}
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900 text-xs font-mono text-neutral-300">
          {msg}
        </div>
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
  const [activeTab, setActiveTab] = useState<"manage" | "create">("manage");

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
    <div className="w-full space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "manage"
                ? "bg-neutral-800 text-white border border-neutral-700"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Manage Escrow
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "create"
                ? "bg-neutral-800 text-white border border-neutral-700"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            + Create Escrow
          </button>
        </div>

        <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
          Connected: {shortenAddr(walletAddress)}
        </span>
      </div>

      {activeTab === "create" ? (
        <CreateEscrowForm
          onCreated={(id) => {
            setEscrowId(String(id));
            setActiveTab("manage");
            loadEscrow(id);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* View Escrow Search Card */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-6 backdrop-blur-md">
            <h2 className="text-base font-semibold text-white mb-1">
              Load Escrow Contract
            </h2>
            <p className="text-xs text-neutral-400 mb-4">
              Enter an on-chain Escrow ID to view details, milestones, and status
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Escrow ID (e.g. 1)"
                value={escrowId}
                onChange={(e) => setEscrowId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const id = Number(escrowId);
                    if (!isNaN(id)) loadEscrow(id);
                  }
                }}
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-800 bg-neutral-900/80 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
              />
              <button
                onClick={() => {
                  const id = Number(escrowId);
                  if (!isNaN(id)) loadEscrow(id);
                }}
                disabled={loading || !escrowId}
                className="px-5 py-2.5 text-xs font-medium rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
              >
                {loading ? "Loading..." : "Load Escrow"}
              </button>
            </div>
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/30 border border-rose-800/60 text-xs font-mono text-rose-300">
                {error}
              </div>
            )}
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
      )}
    </div>
  );
}

