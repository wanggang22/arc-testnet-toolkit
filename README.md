# Arc Testnet Toolkit

A complete, reproducible toolkit for interacting with [Arc Network](https://arc.network/) Testnet. Covers all official tutorials end-to-end with ready-to-run scripts.

## What's Included

| Module | Description | Scripts |
|--------|-------------|---------|
| **arc-setup** | Environment setup: Foundry, Circle wallets, faucets | `generate-entity-secret.mjs`, `create-wallets.mjs` |
| **arc-deploy-foundry** | Deploy 5 smart contracts via Foundry (ERC-20, ERC-721, ERC-1155, Airdrop, HelloArchitect) | 5 Solidity contracts |
| **arc-deploy-templates** | Deploy 4 Circle template contracts via SCP SDK | `deploy-templates.mjs` |
| **arc-interactions** | ~28 on-chain interactions (cast + SCA wallets) | `sca-interactions.mjs` |
| **arc-bridge** | USDC bridge from ETH Sepolia to Arc via Bridge Kit | `bridge.mjs` |
| **arc-gateway** | Full Circle Gateway flow: deposit, EIP-712 sign, API submit, gatewayMint | `gateway-deposit.mjs`, `gateway-complete.mjs` |
| **arc-monitor** | Contract event monitors + webhook notifications | `create-monitors.mjs`, `query-logs.mjs` |
| **arc-full** | Orchestration guide for running all modules in sequence | (instructions only) |

## Total On-chain Activity

- 5 Foundry contract deployments
- 4 Circle template deployments
- ~18 cast wallet transactions (transfers, mints, approvals, airdrops)
- ~10 SCA wallet transactions
- 3 cross-chain bridges (Bridge Kit)
- ~4 Gateway transactions (approve + deposit + transfer + mint)
- 1 monitor trigger
- **45+ total transactions**

## Prerequisites

- Node.js 18+
- [Foundry](https://book.getfoundry.sh/) (forge, cast)
- [Circle Developer Console](https://console.circle.com) account with API Key
- ETH Sepolia testnet tokens (USDC + ETH for gas)

## Quick Start

Each module contains a `SKILL.md` with step-by-step instructions and standalone scripts in `scripts/` or `contracts/`.

1. Start with `arc-setup/` to configure wallets and environment
2. Follow `arc-full/SKILL.md` for the recommended execution order

## Gotchas Documented

- Gateway API returns `signature` field (not `operatorSig`)
- EIP-712 signing requires BigInt, but API submission requires string values
- Circle template `name` must be alphanumeric (no hyphens)
- Arc USDC is a native token (18 decimals) vs Sepolia USDC (6 decimals)
- Gateway deposits take ~15 min for Sepolia finality

## License

MIT
