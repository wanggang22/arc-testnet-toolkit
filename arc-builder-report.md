# Arc Testnet Builder Report

**Author:** Independent Builder
**Date:** March 3, 2026
**Duration:** Single-day full tutorial walkthrough

---

## Overview

I completed the full Arc Testnet developer tutorial in one session, covering the entire Circle developer stack — from environment setup to contract deployment, token interactions, cross-chain transfers, and event monitoring. This report summarizes all on-chain activity and key findings.

---

## On-Chain Statistics

| Metric | Value |
|--------|-------|
| **Total Transactions** | 54+ |
| **Unique Wallets Used** | 4 (1 EOA + 2 Circle EOA + 1 SCA) |
| **Contracts Deployed** | 9 (5 Foundry + 4 Circle Templates) |
| **Token Standards Covered** | ERC-20, ERC-721, ERC-1155 |
| **Cross-Chain Transfers** | 4 (2 Bridge Kit + 2 Gateway) |
| **Event Monitors Created** | 4 |
| **Webhook Events Triggered** | 7 |

---

## Transaction Breakdown

### Contract Deployments (9 tx)

**Foundry (Cast Wallet):**
| Contract | Type |
|----------|------|
| HelloArchitect | Custom |
| ArcToken | ERC-20 |
| ArcNFT | ERC-721 |
| ArcMultiToken | ERC-1155 |
| ArcAirdrop | Airdrop |

**Circle Templates (SCA Wallet):**
| Contract | Type |
|----------|------|
| AirdropContract | Airdrop |
| ERC20Token | ERC-20 |
| ERC721NFT | ERC-721 |
| ERC1155Multi | ERC-1155 |

### Contract Interactions (28 tx)

**Cast Wallet — 18 transactions:**
- HelloArchitect: `setGreeting` x2
- ERC-20: `transfer` x2, `approve` x2, `mint` x1
- ERC-721: `mint` x3, `transferFrom` x1
- ERC-1155: `mint` x3, `safeTransferFrom` x1
- Airdrop: `airdropERC20` x1
- EURC: `transfer` x2

**SCA Wallet — 10 transactions:**
- ERC-20: `mintTo` x1, `transfer` x2, `approve` x1
- Airdrop: `airdropERC20` x1
- ERC-721: `mintTo` x2
- ERC-1155: `mintTo` x3

### Cross-Chain Transfers (10 tx)

**Bridge Kit (CCTP v2) — Sepolia → Arc:**
| Wallet | Amount | Status |
|--------|--------|--------|
| Wallet1 (Circle EOA) | 1 USDC | Success |
| Wallet2 (Circle EOA) | 1 USDC | Success |

**Gateway — Sepolia → Arc (2 rounds):**

*Round 1:*
- Approve → Deposit 6 USDC → EIP-712 Sign → API Submit → gatewayMint
- Fee: 2.00015 USDC | Received: ~1 USDC on Arc

*Round 2:*
- Approve → Deposit 6 USDC → EIP-712 Sign → API Submit → gatewayMint
- Fee: 2.00015 USDC | Received: ~1 USDC on Arc

### Event Monitoring (7 tx triggered)

4 monitors created (Transfer, Approval, TransferSingle), then 7 transactions fired to trigger webhooks:
- ERC-20 Transfer x2
- ERC-20 Approval x1
- ERC-721 Mint x1
- ERC-1155 Mint x1
- ERC-1155 TransferSingle x1
- ERC-20 Transfer (initial test) x1

All webhook notifications confirmed received.

---

## Circle Developer Stack Coverage

| Feature | Used | Notes |
|---------|------|-------|
| Dev-Controlled Wallets | Yes | 2 EOA + 1 SCA created via API |
| Smart Contract Templates | Yes | 4 contracts deployed |
| Contract Import | Yes | 3 Foundry contracts imported |
| Event Monitors | Yes | 4 monitors with webhook |
| Bridge Kit (CCTP) | Yes | 2 successful cross-chain transfers |
| Gateway | Yes | 2 full deposit-sign-mint cycles |
| Foundry (forge/cast) | Yes | 5 contracts + all cast interactions |
| Entity Secret (API Registration) | Yes | RSA-OAEP encrypted, auto-registered |

---

## Tools & Tech Stack

- **Foundry** (forge 1.5.1 + cast 1.5.1) — Contract compilation & deployment
- **Node.js + ESM** (.mjs) — All automation scripts
- **viem** — Gateway deposit transactions
- **Circle APIs** — Direct fetch (SDK has known bugs)
- **Platform:** Windows 11 + Git Bash

---

## Key Findings & Feedback

### What Worked Well
1. **Foundry integration** is smooth — deploy and interact with contracts easily via `cast`
2. **Circle Dev-Controlled Wallets** API is straightforward for creating and managing wallets
3. **Gateway flow** is well-designed — deposit once, mint anywhere
4. **Event monitoring + webhooks** provide real-time contract event notifications

### Issues Encountered

1. **Contracts SDK bug** — `deployContractTemplate` in `@circle-fin/smart-contract-platform` doesn't work properly. Workaround: direct fetch API calls.

2. **Event Monitor SDK bug** — `createEventMonitor` / `listEventMonitors` methods don't work. Workaround: direct fetch to `/v1/w3s/contracts/monitors`.

3. **Bridge Kit + viem adapter incompatibility** — `@circle-fin/adapter-viem-v2` fails on Arc Testnet RPC with error code 156001 ("Failed to get native balance"). Only Circle-managed wallets (via `circleWalletsAdapter`) succeed. Private key wallets cannot bridge via Bridge Kit.

4. **USDC decimal mismatch** — Arc uses 18 decimals (native token) vs Sepolia's 6 decimals. This needs careful handling in cross-chain operations.

5. **Gateway bash command** — The `gateway-complete.mjs` script had a bash command joining issue (`export PATH=...` must use `&&` separator with `cast send`).

### Suggestions
- Fix SDK methods for contract deployment and event monitoring
- Document the viem adapter limitation with Arc RPC
- Clarify USDC decimal differences prominently in docs

---

All transactions are verifiable on the Arc Testnet explorer using your own wallet addresses.

---

*Built with Foundry + Circle Developer Platform on Arc Testnet.*
