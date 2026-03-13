---
name: arc-bridge
description: Bridge USDC across 4 directions (Sepolia↔Arc, Solana↔Arc) via Bridge Kit + CCTP v2
disable-model-invocation: true
---

# Bridge USDC — 4 Directions

Bridge USDC across 4 directions using Circle Bridge Kit + CCTP v2.

## 4 Directions (5 Bridge Calls)

| # | Direction | Adapter |
|---|-----------|---------|
| 1 | Sepolia → Arc | Circle Wallets (W1) |
| 2 | Sepolia → Arc | Circle Wallets (W2) |
| 3 | Solana → Arc | Solana → Viem (Cast EOA) |
| 4 | Arc → Sepolia | Viem (Cast EOA) |
| 5 | Arc → Solana | Viem → Solana |

## Prerequisites
- ETH Sepolia: USDC + ETH gas
- Solana Devnet: USDC + SOL gas
- Arc Testnet: USDC (for Arc→ directions)
- .env with all wallet keys

### Faucets
- Arc USDC/EURC: https://faucet.circle.com
- Sepolia ETH: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- Solana Devnet SOL: https://faucet.solana.com/
- Solana Devnet USDC: https://faucet.circle.com (select Solana Devnet)

## Install Dependencies

```bash
cd ~/crosschain-transfer
npm install @circle-fin/bridge-kit @circle-fin/adapter-circle-wallets @circle-fin/adapter-viem-v2 @circle-fin/adapter-solana @circle-fin/developer-controlled-wallets dotenv viem
```

Add `"type": "module"` to package.json.

## Required .env Variables

```
CIRCLE_API_KEY=...
CIRCLE_ENTITY_SECRET=...
CAST_PRIVATE_KEY=0x...
CAST_ADDRESS=0x...
WALLET1_ADDRESS=0x...
WALLET2_ADDRESS=0x...
SOLANA_ADDRESS=...
SOLANA_PRIVATE_KEY=...
```

## Run

```bash
node bridge.mjs
```

Script executes 5 bridges across 4 directions, prints success/fail count.

## Notes
- **BigInt serialization**: Script includes `BigInt.prototype.toJSON` fix at top
- **Solana directions need SOL gas**: Even Arc→Solana requires SOL on the destination wallet (mint tx executes on Solana + creates Token Account)
- **Solana adapter**: Package `@circle-fin/adapter-solana`, export `createSolanaAdapterFromPrivateKey` (NOT `createSolanaAdapter`)
- **USDC decimals**: Arc native 18, Sepolia 6, Solana 6
- **CCTP v2 FAST mode**: Arc 1 block, Solana 3 blocks, Sepolia 2 blocks confirmation
- **Fee**: Arc→ directions fee = 0, Solana→Arc fee ~100 (0.0001 USDC)

## Output
All 5 bridges succeed (given sufficient balance and gas on all chains).
