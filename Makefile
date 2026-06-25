# Stellar Streaks top-level Makefile

.PHONY: dev build test typecheck deploy

dev:
	bun run dev

build:
	bun run build

typecheck:
	bunx tsc --noEmit

test:
	cd contracts/savings && cargo test

deploy:
	./scripts/deploy.sh testnet alice
