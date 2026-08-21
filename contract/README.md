# Soroban Smart Contract Workspace

## Project Structure

This project follows the official Stellar Soroban workspace architecture:

```text
contract/
├── Cargo.toml                          # Soroban Workspace Manifest
├── contracts/
│   └── contract/
│       ├── Cargo.toml                  # Escrow Contract Package Manifest (escrow-contract)
│       └── src/
│           ├── lib.rs                  # Soroban Escrow Smart Contract Implementation
│           └── test.rs                 # 12 Comprehensive Rust Unit Tests
└── README.md
```

- Workspace Cargo configuration is defined in [`contract/Cargo.toml`](file:///d:/Freelancegig%20milestone-payment%20escrow/contract/Cargo.toml).
- Escrow contract manifest is located at [`contract/contracts/contract/Cargo.toml`](file:///d:/Freelancegig%20milestone-payment%20escrow/contract/contracts/contract/Cargo.toml).
- Core Rust smart contract code is located at [`contract/contracts/contract/src/lib.rs`](file:///d:/Freelancegig%20milestone-payment%20escrow/contract/contracts/contract/src/lib.rs).
- Unit tests are located at [`contract/contracts/contract/src/test.rs`](file:///d:/Freelancegig%20milestone-payment%20escrow/contract/contracts/contract/src/test.rs).

