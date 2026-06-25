# Project Requirements & Specification Template

## 1. Overview

Stellar Streaks is a full-stack savings challenge on Stellar. Users commit to saving XLM on a weekly cadence, track progress against a goal, and unlock streak-based badges as they stay consistent.

## 2. Technology Stack

| Layer | Technology | Version Policy |
|---|---|---|
| Frontend framework | Next.js (App Router) | Latest stable |
| Language | TypeScript | Strict mode |
| Wallet connection | Stellar Wallet Kit | Latest stable |
| Chain SDK | `@stellar/stellar-sdk` | Latest stable |
| Contract language | Rust | Stable toolchain |
| Contract SDK | `soroban-sdk` | Latest matching target protocol |
| Package manager | Bun | Preferred locally and in CI |
| CI/CD | GitHub Actions | Latest action versions |

## 3. Repository Structure

```
stellar-streaks/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── contracts/
│   └── savings/
├── scripts/
├── .github/workflows/ci.yml
├── .env.example
├── package.json
└── README.md
```

## 4. Wallet Integration Requirements

- Support Stellar wallet connect/disconnect flows.
- Persist the selected wallet across sessions.
- Display address, network, and native balance.
- Warn on network mismatch.

## 5. Transaction Status Tracking

- Frontend should expose pending/success/fail transaction states.
- Contract entrypoints should return `Result`.
- Emit events for enrollment and savings updates.

## 6. Event Listening & State Synchronization

- Listen for contract events via Soroban RPC.
- Resume from the last processed ledger.
- Update the UI without requiring a manual refresh.

## 7. Smart Contract Requirements

- One contract crate under `contracts/savings`.
- Unit tests for the public entrypoints.
- No `unwrap()` or `panic!()` in user-input paths.

## 8. CI/CD Requirements

- Frontend job: checkout, setup Node, install deps, type check.
- Contract job: checkout, setup Rust, build WASM.

## 9. Scripts Folder

- `build.sh` builds the WASM.
- `deploy.sh` deploys the contract.
- `init.sh` performs post-deploy setup.

## 10. Environment & Configuration

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_CONTRACT_ID=
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

## 11. Non-Functional Requirements

- Strict TypeScript.
- Responsive layout.
- Clear loading and empty states.

## 12. README Requirements

- What the project does.
- Setup and local run instructions.
- How to run tests.
- Demo and deployment placeholders.
