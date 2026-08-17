import {
  Client as EscrowClient,
  type Escrow,
  type Milestone,
  type MilestoneStatus,
} from "contract";
import { rpc } from "@stellar/stellar-sdk";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

// ─── Config ──────────────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS =
  "CAQHJS675URVDAIMTGGCQ24AFKWSCOGQINWFZF2OS6KHHSJDYKAIQFA4";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

const server = new rpc.Server(RPC_URL);

// Re-export generated types
export type { Escrow, Milestone, MilestoneStatus };

// ─── Wallet ──────────────────────────────────────────────────────────────────
export async function getWalletAddress(): Promise<string | null> {
  try {
    const conn = await isConnected();
    if (!conn.isConnected) return null;
    const allowed = await isAllowed();
    if (!allowed.isAllowed) {
      await requestAccess();
    }
    const { address } = await getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function ensureWalletAccess(): Promise<string> {
  const conn = await isConnected();
  if (!conn.isConnected) throw new Error("Freighter is not installed");
  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    await requestAccess();
  }
  const { address } = await getAddress();
  return address;
}

// ─── Client Factory ──────────────────────────────────────────────────────────
async function getClient(publicKey: string): Promise<EscrowClient> {
  return new EscrowClient({
    rpcUrl: RPC_URL,
    contractId: CONTRACT_ADDRESS,
    networkPassphrase: NETWORK_PASSPHRASE,
    publicKey,
    signTransaction: async (txXdr: string) => {
      const signed = await signTransaction(txXdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      return { signedTxXdr: signed.signedTxXdr };
    },
  });
}

// ─── State-Changing Functions ────────────────────────────────────────────────
export async function createEscrow(
  freelancer: string,
  token: string,
): Promise<string> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.create_escrow({
    client: caller,
    freelancer,
    token,
  });
  const result = await tx.signAndSend();
  return String(result.result);
}

export async function addMilestone(
  escrowId: number,
  description: string,
  amount: number,
): Promise<void> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.add_milestone({
    caller,
    escrow_id: BigInt(escrowId),
    description,
    amount: BigInt(amount),
  });
  await tx.signAndSend();
}

export async function fundEscrow(escrowId: number): Promise<void> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.fund_escrow({
    caller,
    escrow_id: BigInt(escrowId),
  });
  await tx.signAndSend();
}

export async function submitMilestone(
  escrowId: number,
  milestoneIndex: number,
): Promise<void> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.submit_milestone({
    caller,
    escrow_id: BigInt(escrowId),
    milestone_index: milestoneIndex,
  });
  await tx.signAndSend();
}

export async function approveMilestone(
  escrowId: number,
  milestoneIndex: number,
): Promise<void> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.approve_milestone({
    caller,
    escrow_id: BigInt(escrowId),
    milestone_index: milestoneIndex,
  });
  await tx.signAndSend();
}

export async function cancelEscrow(escrowId: number): Promise<void> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.cancel_escrow({
    caller,
    escrow_id: BigInt(escrowId),
  });
  await tx.signAndSend();
}

// ─── Read-Only Functions ─────────────────────────────────────────────────────
export async function getEscrow(escrowId: number): Promise<Escrow> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.get_escrow({
    escrow_id: BigInt(escrowId),
  });
  return tx.result;
}

export async function getMilestoneCount(escrowId: number): Promise<number> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.get_milestone_count({
    escrow_id: BigInt(escrowId),
  });
  return Number(tx.result);
}

export async function getMilestone(
  escrowId: number,
  index: number,
): Promise<Milestone> {
  const caller = await ensureWalletAccess();
  const client = await getClient(caller);
  const tx = await client.get_milestone({
    escrow_id: BigInt(escrowId),
    milestone_index: index,
  });
  return tx.result;
}
