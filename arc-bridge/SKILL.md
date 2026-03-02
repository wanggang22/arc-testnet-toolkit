---
name: arc-bridge
description: Bridge USDC to Arc Testnet via Circle Bridge Kit
disable-model-invocation: true
---

# Bridge USDC to Arc Testnet

Bridge USDC from ETH Sepolia to Arc Testnet using Circle Bridge Kit.

## Prerequisites
- USDC on ETH Sepolia (claim from: https://faucet.circle.com)
- ETH gas on ETH Sepolia (claim from: https://faucets.chain.link/sepolia)
- .env file with required variables

## Install Dependencies

```bash
mkdir -p ~/crosschain-transfer && cd ~/crosschain-transfer
npm init -y
npm install @circle-fin/bridge-kit @circle-fin/adapter-circle-wallets @circle-fin/adapter-viem-v2 @circle-fin/developer-controlled-wallets dotenv viem
```

Add `"type": "module"` to package.json.
Copy .env file to this directory.

## Bridge Script

Copy [bridge.mjs](scripts/bridge.mjs) to the project directory and run:

```bash
node bridge.mjs
```

## Notes
- Cast wallet is not in the Circle system — use castAdapter for **from**, circleAdapter with `address` for **to**
- ETH Sepolia confirmation takes ~**15 minutes**, you can do other tasks in the meantime
- USDC on Arc is a native token (**18 decimals**), on Sepolia it's **6 decimals**
- Verify balance after bridging:
  ```bash
  export PATH="$HOME/.foundry/bin:$PATH"
  cast balance $CAST_ADDRESS --rpc-url https://rpc.testnet.arc.network
  # Returns wei value, divide by 1e18 for USDC amount
  ```

## Output
Confirm Arc Testnet USDC balance increased for all 3 wallets.
