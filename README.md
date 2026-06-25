# Stellar Streaks

Stellar Streaks is a Stellar savings challenge starter: a gamified XLM commitment tracker with streaks, badges, and a Soroban contract scaffold. The current implementation focuses on the product shell and the on-chain data model so the challenge can grow into a real wallet-connected savings app.

## Submission Checklist

- Live demo link: [link]
- Demo video link: [link]
- Test output screenshot (3+ passing tests): [placeholder]
- Public GitHub repo link: [link]
- Meaningful commits: [placeholder]

## Project Overview

This project demonstrates:

- A Soroban smart contract for challenge setup, participant enrollment, and weekly savings tracking
- A Next.js frontend that presents progress, badges, milestones, and wallet space
- A monthly/weekly progress model built around XLM savings goals
- A future-ready layout for Stellar Wallet Kit integration
- TypeScript strict mode and a CI workflow that checks the web app and builds the contract WASM

## Key Features

- Savings challenge hero with the weekly XLM target
- Progress bar that visualizes completion against the goal
- Badge wall for streak-based rewards
- Weekly ledger for committed deposits
- Wallet section reserved for address, balance, and network state

## Screenshots

<table width="100%">
  <tr>
    <td align="center" width="50%">
      <strong>🏠 Dashboard</strong><br/><br/>
      <em>[screenshot placeholder]</em>
    </td>
    <td align="center" width="50%">
      <strong>🔌 Wallet Panel</strong><br/><br/>
      <em>[screenshot placeholder]</em>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <strong>🪙 Ledger</strong><br/><br/>
      <em>[screenshot placeholder]</em>
    </td>
    <td align="center" width="50%">
      <strong>✅ Test Output</strong><br/><br/>
      <em>[screenshot placeholder]</em>
    </td>
  </tr>
</table>

## Contract

- **Network:** `Stellar Testnet`
- **Contract id:** `CCNR43J7GIYASMXZALQAWJHI66WPLG7BFRGCGDJR44DACNFVQGT2MTIZ`
- **WASM hash:** `40867084ea1cd14486cb9d03e1a87555423996bea87c7bbe8023a9f99300bd61`
- **Deploy tx:** `34fdeb7aeb0aaa13bd7ba94b32823d2ceb12e50a3ce8c23c6b3612edc83c5224`
- **Upload tx:** `d7970f55d65098e5dfd5e718f6253f2a89121439b45584388d06e9f445104bd7`
- **Source account:** `alice`
- **Stellar Lab:** https://lab.stellar.org/r/testnet/contract/CCNR43J7GIYASMXZALQAWJHI66WPLG7BFRGCGDJR44DACNFVQGT2MTIZ
- **Stellar Expert deploy tx:** https://stellar.expert/explorer/testnet/tx/34fdeb7aeb0aaa13bd7ba94b32823d2ceb12e50a3ce8c23c6b3612edc83c5224
- **Soroban RPC:** `https://soroban-testnet.stellar.org`

## Setup

Run from the repo root:

1. Install dependencies

   ```bash
   bun install
   ```

2. Run the frontend

   ```bash
   bun run dev
   ```

3. Build the contract

   ```bash
   cd contracts/savings
   cargo build --release --target wasm32v1-none
   ```

4. Deploy the contract to Stellar Testnet

   ```bash
   ./scripts/deploy.sh testnet alice
   ```

## Tests

Run the contract unit tests:

```bash
cd contracts/savings
cargo test
```

## Environment Variables

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_CONTRACT_ID=CCNR43J7GIYASMXZALQAWJHI66WPLG7BFRGCGDJR44DACNFVQGT2MTIZ
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Scripts

- `bun run dev` - start the Next.js dev server
- `bun run build` - production build
- `bunx tsc --noEmit` - type check the frontend
- `cargo test` inside `contracts/savings` - run contract tests
- `./scripts/deploy.sh testnet alice` - deploy the contract to Stellar Testnet

## Project Structure

```
stellar-streaks/
├── contracts/savings/
│   ├── src/
│   └── Cargo.toml
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── .github/workflows/ci.yml
├── Cargo.toml
├── package.json
└── README.md
```
