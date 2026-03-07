---
name: arc-full
description: Arc Testnet full workflow one-click execution (orchestrates all arc-* skills)
disable-model-invocation: true
---

# Arc Testnet Full Workflow

Execute all Arc Testnet tutorial operations in sequence to maximize on-chain activity records.
Each phase corresponds to an independent skill that can also be invoked separately.

## Windows Notes
- Use Git Bash with Unix syntax
- Foundry PATH: `export PATH="$HOME/.foundry/bin:$PATH"`
- No grep/sed/tail/cut in bash — write all logic in .mjs scripts
- Node.js scripts use .mjs extension + `"type": "module"` in package.json

## Execution Order

### Phase 1: Environment Setup (`/arc-setup`)
1. Install Foundry (forge, cast)
2. Create cast wallet (keep private key for airdrop claims)
3. **Manual**: Register on Circle Developer Console + create API Key (Standard, not Client)
4. Generate Entity Secret → **Manual**: register in Console
5. Programmatically create Circle managed wallets (2 EOA on ARC+Sepolia + 1 SCA on ARC)
6. **Manual**: Claim testnet tokens
   - https://faucet.circle.com → Claim USDC + EURC for Cast wallet (Arc Testnet)
   - https://faucet.circle.com → Claim USDC for Wallet1, Wallet2 (Ethereum Sepolia + Arc Testnet)
   - https://faucets.chain.link/sepolia → Claim ETH gas for Cast + Wallet1 + Wallet2
   - Claim multiple times per address to ensure sufficient balance (Sepolia USDC at least 10+ for Gateway)

### Phase 2: Contract Deployment (`/arc-deploy-foundry` + `/arc-deploy-templates`)
7. Deploy 5 contracts to cast wallet via Foundry:
   - HelloArchitect, ArcToken (ERC-20), ArcNFT (ERC-721), ArcMultiToken (ERC-1155), ArcAirdrop
   - Full Solidity source code included in skill
8. Deploy 4 template contracts to SCA wallet via Circle:
   - Airdrop, ERC-20, ERC-721, ERC-1155
   - Uses deployContractTemplate API

### Phase 3: Contract Interactions (`/arc-interactions`)
9. Cast wallet: ~18 interactions
   - HelloArchitect: setGreeting x2
   - ERC-20: transfer x2, approve x2, mint x1
   - ERC-721: mint x3, transferFrom x1
   - ERC-1155: mint x3, safeTransferFrom x1
   - Airdrop: airdropERC20 x1
   - EURC: transfer x2
10. SCA wallet: ~10 interactions
    - ERC-20: mintTo, transfer x2, approve
    - Airdrop: airdropERC20
    - ERC-721: mintTo x2
    - ERC-1155: mintTo x3

### Phase 4: Cross-Chain (`/arc-bridge` + `/arc-gateway`)
11. Bridge Kit: bridge USDC (Wallet1, Wallet2, Cast — 1 each, 3 USDC total)
    - ETH Sepolia confirmation takes ~15 minutes
    - **Windows issue**: Bridge kit 无法直接桥接 Cast 钱包 — from 端 viem adapter RPC 156001 错误，to 端 Circle adapter 无法查询非托管钱包余额。Workaround：Cast(Sepolia) 转 USDC 给 W1 → W1 桥接到自己的 Arc 地址 → W1(Arc) 转给 Cast。See `bridge-cast-workaround.mjs`.
12. Gateway full flow (just two scripts):
    - `gateway-deposit.mjs`: Pre-check Sepolia USDC balance + ETH gas → Approve → Deposit
    - `gateway-complete.mjs`: Auto-poll balance → EIP-712 signing → Submit API → gatewayMint → Verify
    - Run complete right after deposit — it auto-waits ~15 min until balance appears
    - Gateway fee ~2 USDC, deposit 6 USDC, transfer 3 USDC, ~1 USDC arrives on Arc

### Phase 5: Monitoring (`/arc-monitor`)
13. **Manual**: Get URL from webhook.site + register Webhook in Circle Console
14. Create 4 event monitors (Transfer, Approval, TransferSingle)
15. Trigger a transaction → verify webhook.site receives notification

## Project Directory Structure
```
~/arc-setup/           - Setup scripts and .env
~/hello-arc/           - Foundry project (5 contracts)
~/deploy-contracts/    - Circle template deployment + SCA interactions
~/crosschain-transfer/ - Bridge Kit bridging
~/gateway-transfer/    - Gateway full flow
```
Each directory needs a copy of the .env file.

## Key Notes
- **Focus all operations on the cast wallet** (has private key for airdrop claims)
- SCA wallet has no private key, cannot claim airdrops directly — only used for Circle template deployment
- USDC on Arc is a native token (**18 decimals**), on Sepolia it's **6 decimals**
- USDC on Arc **cannot** be deposited to Gateway (Sepolia → Arc one-way only)
- Circle template contract **name must be alphanumeric** (no hyphens)
- Circle template royalty parameter is **royaltyPercent** (number), not royaltyBps
- Gateway API returns **`signature`** field (not `operatorSig`)
- Manual steps require user action — **pause with AskUserQuestion** when executing
- Steps with long wait times — you can do other tasks in the meantime

## Total Transaction Count
- Foundry deployments: 5
- Circle template deployments: 4
- Cast interactions: ~18
- SCA interactions: ~10
- Bridge: 3
- Gateway: ~4 (approve + deposit + transfer + mint)
- Monitor trigger: 1
- **Total: ~45+ on-chain transactions**
