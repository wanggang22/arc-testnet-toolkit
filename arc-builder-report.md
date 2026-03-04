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
| Contract | Type | Address |
|----------|------|---------|
| HelloArchitect | Custom | `0x6d4BD5D0D8f527E3298D3db6D5fA9DD754aaAA3E` |
| ArcToken | ERC-20 | `0xCC05Fc43cb8e985e03cBD83861BadfEF12F49d84` |
| ArcNFT | ERC-721 | `0x0D59A3442B1eCC7550A6ba181DEb23BE9A256aF3` |
| ArcMultiToken | ERC-1155 | `0x94850C213021f82305B5a829243b58D95Bb4b38e` |
| ArcAirdrop | Airdrop | `0x75bBa24191922D721d3b16d0F0FFF7F97b444174` |

**Circle Templates (SCA Wallet):**
| Contract | Type | Address |
|----------|------|---------|
| AirdropContract | Airdrop | `0x133343737d3f947247dcb3079cb03601ed5504e7` |
| ERC20Token | ERC-20 | `0xf7bca5f7eaa39b824693b852d75e7349b8bbc75c` |
| ERC721NFT | ERC-721 | `0xef99642f73f254dea0d6c6909910c3b8e6828309` |
| ERC1155Multi | ERC-1155 | `0xdd7893c0064009ffa2ab3d53d218152983288b18` |

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
- Transfer ID: `1f4b67c1-bb0c-4c7c-8256-b2ad21af1aa8`
- Fee: 2.00015 USDC | Received: ~1 USDC on Arc

*Round 2:*
- Approve → Deposit 6 USDC → EIP-712 Sign → API Submit → gatewayMint
- Transfer ID: `15823214-6e1c-4ce0-a0a2-b023480c866a`
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

## Wallet Addresses (Verifiable On-Chain)

| Wallet | Address |
|--------|---------|
| Cast (EOA) | `***REMOVED***` |
| Wallet1 (Circle EOA) | `0xc55d62b537b771f923f5ead6cc111e77e4d99531` |
| Wallet2 (Circle EOA) | `0xf4e280f54e77dc6dde9ff2d0a209857b75e33fb9` |
| SCA (Circle) | `0x8d1990553d0d46eb7ca528b52a6c98a2585518fc` |

All transactions are verifiable on the Arc Testnet explorer.

---

*Built with Foundry + Circle Developer Platform on Arc Testnet.*
