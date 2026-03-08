# Arc Testnet Toolkit

A complete, reproducible toolkit for interacting with [Arc Network](https://arc.network/) Testnet. Covers all official tutorials end-to-end with ready-to-run scripts.

## What's Included

| Module | Description | Scripts |
|--------|-------------|---------|
| **arc-setup** | Environment setup: Foundry, Circle wallets, faucets | `generate-entity-secret.mjs`, `create-wallets.mjs` |
| **arc-deploy-foundry** | Deploy 5 smart contracts via Foundry (ERC-20, ERC-721, ERC-1155, Airdrop, HelloArchitect) | 5 Solidity contracts |
| **arc-deploy-templates** | Deploy 4 Circle template contracts via API | `deploy-templates.mjs` |
| **arc-interactions** | ~28 on-chain interactions (cast + SCA wallets) | `sca-interactions.mjs` |
| **arc-bridge** | USDC bridge from ETH Sepolia to Arc via Bridge Kit | `bridge.mjs` |
| **arc-gateway** | Full Circle Gateway flow: deposit, EIP-712 sign, API submit, gatewayMint | `gateway-deposit.mjs`, `gateway-complete.mjs` |
| **arc-xylonet** | XyloNet DeFi interactions: Tip, Swap, Vault, Bridge, LP | `xylonet-auto.mjs` |
| **arc-nanopay** | Nanopayments: x402 seller server + buyer deposit/pay/withdraw | `nanopay-seller.mjs`, `nanopay-buyer.mjs` |
| **arc-monitor** | Contract event monitors + webhook notifications | `import-and-monitor.mjs`, `query-logs.mjs` |
| **arc-full** | Orchestration guide for running all modules in sequence | (instructions only) |

## Total On-chain Activity

- 5 Foundry contract deployments
- 4 Circle template deployments (Airdrop + ERC-20 + ERC-721 + ERC-1155)
- ~18 cast wallet transactions (transfers, mints, approvals, airdrops)
- ~10 SCA wallet transactions
- ~6 cross-chain bridges (Bridge Kit: W1+W2 approve+burn+mint)
- ~4 Gateway transactions (approve + deposit + API transfer + gatewayMint)
- ~16 XyloNet DeFi transactions (Tip/Swap/Deposit/Bridge/LP)
- ~6 Nanopayments (deposit + 3 x402 payments + withdraw)
- ~8 monitor setup + trigger transactions
- **~77 total transactions**

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

- Circle SCP SDK `deployContractTemplate` has bugs — use direct fetch API instead
- Circle SCP SDK `createEventMonitor` doesn't work — use `/v1/w3s/contracts/monitors` endpoint
- Foundry contracts must be imported via `/v1/w3s/contracts/import` before creating monitors
- Monitor/import API calls require `idempotencyKey`
- Gateway API returns `signature` field (not `operatorSig`)
- Nanopayments EIP-3009 `validBefore` must be at least 3 days in the future
- Nanopayments package: `@circle-fin/x402-batching` (note the hyphen in `circle-fin`)
- EIP-712 signing requires BigInt, but API submission requires string values
- Circle template `name` must be alphanumeric (no hyphens)
- Arc USDC is a native token (18 decimals) vs Sepolia USDC (6 decimals)
- EURC on Arc: `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` (6 decimals)
- Gateway deposits take ~15 min for Sepolia finality
- Bridge Kit: Cast wallet with viem adapter fails on Arc RPC, only Circle wallets work
- BigInt serialization fix needed: `BigInt.prototype.toJSON = function() { return this.toString(); };`

## License

MIT
