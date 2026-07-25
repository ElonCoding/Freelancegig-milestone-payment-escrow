import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCEC6DZQWPIOKMXGMP3ECKL5ETFTUAMTG26B6T5ICGNHSIBUJOZNRGQZ",
  }
} as const


export interface Escrow {
  client: string;
  freelancer: string;
  funded: boolean;
  milestones: Array<Milestone>;
  released: i128;
  token: string;
  total: i128;
}

export type DataKey = {tag: "Escrow", values: readonly [u64]} | {tag: "Count", values: void};


export interface Milestone {
  amount: i128;
  description: string;
  status: MilestoneStatus;
}

export type MilestoneStatus = {tag: "Pending", values: void} | {tag: "Submitted", values: void} | {tag: "Approved", values: void};

export interface Client {
  /**
   * Construct and simulate a get_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_escrow: ({escrow_id}: {escrow_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Escrow>>

  /**
   * Construct and simulate a fund_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fund_escrow: ({caller, escrow_id}: {caller: string, escrow_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_milestone: ({caller, escrow_id, description, amount}: {caller: string, escrow_id: u64, description: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a cancel_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_escrow: ({caller, escrow_id}: {caller: string, escrow_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_escrow: ({client, freelancer, token}: {client: string, freelancer: string, token: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_milestone: ({escrow_id, milestone_index}: {escrow_id: u64, milestone_index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Milestone>>

  /**
   * Construct and simulate a submit_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  submit_milestone: ({caller, escrow_id, milestone_index}: {caller: string, escrow_id: u64, milestone_index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a approve_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve_milestone: ({caller, escrow_id, milestone_index}: {caller: string, escrow_id: u64, milestone_index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_milestone_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_milestone_count: ({escrow_id}: {escrow_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABkVzY3JvdwAAAAAABwAAAAAAAAAGY2xpZW50AAAAAAATAAAAAAAAAApmcmVlbGFuY2VyAAAAAAATAAAAAAAAAAZmdW5kZWQAAAAAAAEAAAAAAAAACm1pbGVzdG9uZXMAAAAAA+oAAAfQAAAACU1pbGVzdG9uZQAAAAAAAAAAAAAIcmVsZWFzZWQAAAALAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAABXRvdGFsAAAAAAAACw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAABkVzY3JvdwAAAAAAAQAAAAYAAAAAAAAAAAAAAAVDb3VudAAAAA==",
        "AAAAAQAAAAAAAAAAAAAACU1pbGVzdG9uZQAAAAAAAAMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAD01pbGVzdG9uZVN0YXR1cwA=",
        "AAAAAgAAAAAAAAAAAAAAD01pbGVzdG9uZVN0YXR1cwAAAAADAAAAAAAAAAAAAAAHUGVuZGluZwAAAAAAAAAAAAAAAAlTdWJtaXR0ZWQAAAAAAAAAAAAAAAAAAAhBcHByb3ZlZA==",
        "AAAAAAAAAAAAAAAKZ2V0X2VzY3JvdwAAAAAAAQAAAAAAAAAJZXNjcm93X2lkAAAAAAAABgAAAAEAAAfQAAAABkVzY3JvdwAA",
        "AAAAAAAAAAAAAAALZnVuZF9lc2Nyb3cAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAllc2Nyb3dfaWQAAAAAAAAGAAAAAA==",
        "AAAAAAAAAAAAAAANYWRkX21pbGVzdG9uZQAAAAAAAAQAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAJZXNjcm93X2lkAAAAAAAABgAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAANY2FuY2VsX2VzY3JvdwAAAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAJZXNjcm93X2lkAAAAAAAABgAAAAA=",
        "AAAAAAAAAAAAAAANY3JlYXRlX2VzY3JvdwAAAAAAAAMAAAAAAAAABmNsaWVudAAAAAAAEwAAAAAAAAAKZnJlZWxhbmNlcgAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAQAAAAY=",
        "AAAAAAAAAAAAAAANZ2V0X21pbGVzdG9uZQAAAAAAAAIAAAAAAAAACWVzY3Jvd19pZAAAAAAAAAYAAAAAAAAAD21pbGVzdG9uZV9pbmRleAAAAAAEAAAAAQAAB9AAAAAJTWlsZXN0b25lAAAA",
        "AAAAAAAAAAAAAAAQc3VibWl0X21pbGVzdG9uZQAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAJZXNjcm93X2lkAAAAAAAABgAAAAAAAAAPbWlsZXN0b25lX2luZGV4AAAAAAQAAAAA",
        "AAAAAAAAAAAAAAARYXBwcm92ZV9taWxlc3RvbmUAAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACWVzY3Jvd19pZAAAAAAAAAYAAAAAAAAAD21pbGVzdG9uZV9pbmRleAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAATZ2V0X21pbGVzdG9uZV9jb3VudAAAAAABAAAAAAAAAAllc2Nyb3dfaWQAAAAAAAAGAAAAAQAAAAQ=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_escrow: this.txFromJSON<Escrow>,
        fund_escrow: this.txFromJSON<null>,
        add_milestone: this.txFromJSON<null>,
        cancel_escrow: this.txFromJSON<null>,
        create_escrow: this.txFromJSON<u64>,
        get_milestone: this.txFromJSON<Milestone>,
        submit_milestone: this.txFromJSON<null>,
        approve_milestone: this.txFromJSON<null>,
        get_milestone_count: this.txFromJSON<u32>
  }
}