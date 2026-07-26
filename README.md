# Ercow — Freelancegig Milestone-Payment Escrow

Milestone-based escrow on the **Stellar / Soroban** blockchain.  
Rust smart contract + Next.js 16 frontend.

---

## Repo Structure

```
.
├── client/                  # Next.js 16 frontend (React 19, Tailwind 4)
│   └── packages/
│       └── contract/        # Auto-generated Soroban JS bindings (must build first)
└── contract/                # Rust workspace — Soroban smart contract
    └── contracts/
        └── contract/        # Escrow contract source
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| npm | ≥ 9 | ships with Node |
| Rust | stable | https://rustup.rs |
| Soroban CLI | latest | `cargo install --locked soroban-cli` |
| Freighter Wallet | browser ext | https://freighter.app |

> **Stellar network**: app targets **Testnet** by default. Get test XLM at https://friendbot.stellar.org

---

## 1 — Contract (Rust / Soroban)

### Build

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
```

WASM output → `contract/target/wasm32-unknown-unknown/release/contract.wasm`

### Test

```bash
cd contract
cargo test
```

### Deploy to Testnet

```bash
soroban contract deploy \
  --wasm contract/target/wasm32-unknown-unknown/release/contract.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

Copy the returned **Contract ID** — needed in frontend env.

---

## 2 — JS Bindings (generate once, rebuild after contract changes)

The `client/packages/contract/` package is auto-generated TypeScript bindings.  
**Must be built before the frontend will compile.**

```bash
cd client/packages/contract
npm install
npm run build        # tsc -> dist/
```

> If contract ABI changes -> regenerate with:
> ```bash
> soroban contract bindings typescript \
>   --contract-id <CONTRACT_ID> \
>   --network testnet \
>   --output-dir client/packages/contract
> ```

---

## 3 — Frontend (Next.js)

### Install

```bash
cd client
npm install
```

### Environment

Create `client/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ID=<YOUR_DEPLOYED_CONTRACT_ID>
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
```

### Run Dev Server

```bash
cd client
npm run dev
```

App -> **http://localhost:3000**

### Build for Production

```bash
cd client
npm run build
npm start
```

---

## Quick Start (all steps, in order)

```bash
# 1. Clone
git clone https://github.com/ElonCoding/Ercow.git
cd Ercow

# 2. Build contract
cd contract
cargo build --target wasm32-unknown-unknown --release

# 3. Deploy (testnet) — grab CONTRACT_ID from output
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contract.wasm \
  --source <SECRET_KEY> \
  --network testnet

# 4. Build JS bindings
cd ../client/packages/contract
npm install && npm run build

# 5. Set env vars
cd ../../
cp .env.example .env.local   # or create manually (see above)

# 6. Run frontend
npm install && npm run dev
```

---

## Common Errors

| Error | Fix |
|-------|-----|
| `Module not found: Can't resolve 'contract'` | `cd client/packages/contract && npm install && npm run build` |
| `bun: command not found` | Use `npm` instead, or install bun: https://bun.sh |
| Freighter not connecting | Install Freighter extension + switch to Testnet inside it |
| `HostError: Error(Contract, ...)` | Wrong contract ID in `.env.local` or contract not deployed |

---

## Tech Stack

- **Smart Contract** — Rust, Soroban SDK 25, Stellar Testnet
- **Frontend** — Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Wallet** — Freighter (browser extension)
- **RPC** — `@stellar/stellar-sdk` + Soroban RPC
