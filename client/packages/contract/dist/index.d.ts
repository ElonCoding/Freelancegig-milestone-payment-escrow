import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CAQHJS675URVDAIMTGGCQ24AFKWSCOGQINWFZF2OS6KHHSJDYKAIQFA4";
    };
};
export interface Escrow {
    client: string;
    freelancer: string;
    funded: boolean;
    milestones: Array<Milestone>;
    released: i128;
    token: string;
    total: i128;
}
export type DataKey = {
    tag: "Escrow";
    values: readonly [u64];
} | {
    tag: "Count";
    values: void;
};
export interface Milestone {
    amount: i128;
    description: string;
    status: MilestoneStatus;
}
export type MilestoneStatus = {
    tag: "Pending";
    values: void;
} | {
    tag: "Submitted";
    values: void;
} | {
    tag: "Approved";
    values: void;
};
export interface Client {
    /**
     * Construct and simulate a get_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_escrow: ({ escrow_id }: {
        escrow_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Escrow>>;
    /**
     * Construct and simulate a fund_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    fund_escrow: ({ caller, escrow_id }: {
        caller: string;
        escrow_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a add_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    add_milestone: ({ caller, escrow_id, description, amount }: {
        caller: string;
        escrow_id: u64;
        description: string;
        amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a cancel_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    cancel_escrow: ({ caller, escrow_id }: {
        caller: string;
        escrow_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a create_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    create_escrow: ({ client, freelancer, token }: {
        client: string;
        freelancer: string;
        token: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a get_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_milestone: ({ escrow_id, milestone_index }: {
        escrow_id: u64;
        milestone_index: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Milestone>>;
    /**
     * Construct and simulate a submit_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    submit_milestone: ({ caller, escrow_id, milestone_index }: {
        caller: string;
        escrow_id: u64;
        milestone_index: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a approve_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    approve_milestone: ({ caller, escrow_id, milestone_index }: {
        caller: string;
        escrow_id: u64;
        milestone_index: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_milestone_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_milestone_count: ({ escrow_id }: {
        escrow_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        get_escrow: (json: string) => AssembledTransaction<Escrow>;
        fund_escrow: (json: string) => AssembledTransaction<null>;
        add_milestone: (json: string) => AssembledTransaction<null>;
        cancel_escrow: (json: string) => AssembledTransaction<null>;
        create_escrow: (json: string) => AssembledTransaction<bigint>;
        get_milestone: (json: string) => AssembledTransaction<Milestone>;
        submit_milestone: (json: string) => AssembledTransaction<null>;
        approve_milestone: (json: string) => AssembledTransaction<null>;
        get_milestone_count: (json: string) => AssembledTransaction<number>;
    };
}
