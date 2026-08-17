import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
        contractId: "CAQHJS675URVDAIMTGGCQ24AFKWSCOGQINWFZF2OS6KHHSJDYKAIQFA4",
    }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAABkVzY3JvdwAAAAAABwAAAAAAAAAGY2xpZW50AAAAAAATAAAAAAAAAApmcmVlbGFuY2VyAAAAAAATAAAAAAAAAAZmdW5kZWQAAAAAAAEAAAAAAAAACm1pbGVzdG9uZXMAAAAAA+oAAAfQAAAACU1pbGVzdG9uZQAAAAAAAAAAAAAIcmVsZWFzZWQAAAALAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAABXRvdGFsAAAAAAAACw==",
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
            "AAAAAAAAAAAAAAATZ2V0X21pbGVzdG9uZV9jb3VudAAAAAABAAAAAAAAAAllc2Nyb3dfaWQAAAAAAAAGAAAAAQAAAAQ="]), options);
        this.options = options;
    }
    fromJSON = {
        get_escrow: (this.txFromJSON),
        fund_escrow: (this.txFromJSON),
        add_milestone: (this.txFromJSON),
        cancel_escrow: (this.txFromJSON),
        create_escrow: (this.txFromJSON),
        get_milestone: (this.txFromJSON),
        submit_milestone: (this.txFromJSON),
        approve_milestone: (this.txFromJSON),
        get_milestone_count: (this.txFromJSON)
    };
}
