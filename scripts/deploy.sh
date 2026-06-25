#!/usr/bin/env bash
set -euo pipefail

network="${1:-testnet}"
source_account="${2:-alice}"

case "$network" in
  testnet)
    rpc_url="https://soroban-testnet.stellar.org"
    network_passphrase="Test SDF Network ; September 2015"
    ;;
  *)
    echo "Unsupported network: ${network}" >&2
    exit 1
    ;;
esac

cd "$(dirname "$0")/.."

stellar contract deploy \
  --package savings \
  --alias stellar-streaks \
  --source-account "$source_account" \
  --network "$network" \
  --rpc-url "$rpc_url" \
  --network-passphrase "$network_passphrase"
