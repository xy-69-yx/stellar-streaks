#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
cd contracts/savings
cargo build --release --target wasm32-unknown-unknown
