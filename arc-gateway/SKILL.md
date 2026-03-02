---
name: arc-gateway
description: Circle Gateway cross-chain transfer full flow (Deposit → Sign → Mint)
disable-model-invocation: true
---

# Circle Gateway Cross-Chain Transfer Full Flow

Transfer USDC from ETH Sepolia to Arc Testnet via Circle Gateway contract.
Independent from Bridge Kit — interacts directly with Gateway contracts for additional on-chain records.

**Warning: After deposit, wait ~15 min for Sepolia finality. Get it right the first time!**

## Prerequisites
- USDC on ETH Sepolia (at least 6) + ETH gas
- Foundry + Node.js installed

## Key Addresses (hardcoded, do not change)
```
Gateway Wallet:  0x0077777d7EBA4688BDeF3E311b846F25870A19B9
Gateway Minter:  0x0022222ABE238Cc2C7Bb1f21003F0a260052475B
USDC (Sepolia):  0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 (6 decimals)
USDC (Arc):      0x3600000000000000000000000000000000000000 (native, 18 decimals)
Domains:         ETH Sepolia=0, Arc Testnet=26
Gateway API:     https://gateway-api-testnet.circle.com
```

## Install Dependencies

```bash
mkdir -p ~/gateway-transfer && cd ~/gateway-transfer
npm init -y
npm install viem dotenv
```

Add `"type": "module"` to package.json. Copy .env to this directory (needs CAST_PRIVATE_KEY, CAST_ADDRESS).

---

## Execution Flow (just two steps)

### Step 1: Run deposit (~2 minutes)

Copy [gateway-deposit.mjs](scripts/gateway-deposit.mjs) to the project directory and run:

```bash
node gateway-deposit.mjs
```
- Auto-checks Sepolia USDC balance and ETH gas
- ABORTs with faucet links if balance is insufficient
- Skips deposit if Gateway already has balance

### Step 2: Run complete (auto-wait + all-in-one)

Copy [gateway-complete.mjs](scripts/gateway-complete.mjs) to the project directory and run:

```bash
node gateway-complete.mjs
```
- Auto-polls Gateway balance every 60 seconds
- Once balance arrives: sign → submit API → gatewayMint → verify balance
- If mint fails, saves attestation to mint-data.json for manual retry

**You can run complete right after deposit — it will auto-wait ~15 minutes until balance appears.**

## Known Gotchas
- **Gateway API returns `signature` field, not `operatorSig`**
- **maxFee must be at least 2 USDC** (actual minimum ~2.00015 USDC), script sets 3 USDC cap
- **Wait ~15 minutes after deposit** before balance shows up (script auto-polls)
- USDC on Arc is a native token (18 decimals), **cannot deposit to Gateway from Arc** — Sepolia → Arc only
- Signing uses **BigInt** (`999999999n`), API submission uses **string** (`"999999999"`) — script builds two separate specs to avoid confusion
- Deposit script uses **viem direct transactions** (not cast) to avoid Foundry PATH issues during pre-flight checks
