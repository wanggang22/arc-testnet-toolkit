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
- ETH Sepolia confirmation takes ~**15 minutes**, you can do other tasks in the meantime
- USDC on Arc is a native token (**18 decimals**), on Sepolia it's **6 decimals**
- Verify balance after bridging:
  ```bash
  export PATH="$HOME/.foundry/bin:$PATH"
  cast balance $CAST_ADDRESS --rpc-url https://rpc.testnet.arc.network
  # Returns wei value, divide by 1e18 for USDC amount
  ```

## Windows Known Issue: Cast Wallet Bridge
Bridge kit 无法直接桥接 Cast 钱包（非 Circle 托管），有两个限制：

1. **from 端失败**：`createViemAdapterFromPrivateKey` 在 Windows 上报 RPC error 156001
   ("Failed to get native balance")，viem 内部 DNS/RPC 兼容性问题，
   patch RPC 或 monkey-patch cached clients 均无效。
2. **to 端失败**：即使用 Circle adapter 做 from（如 W1），将 Cast 地址作为 destination，
   bridge kit 仍会通过 adapter 检查目标地址余额。Cast 不是 Circle 托管钱包，
   Circle adapter 无法查询其余额，同样报 156001 错误。

因此 Cast 钱包既不能做 source 也不能做 destination，必须用 W1 做中转。

**Workaround（3 步）**：
1. Cast 在 Sepolia 转 USDC 给 W1（Cast 有私钥，用 viem 直接转账无问题）
2. W1 桥接到自己的 Arc 地址（bridge kit from/to 都是 Circle 钱包，正常工作）
3. W1 在 Arc 上把 USDC 转给 Cast（Circle SDK createTransaction）

See [bridge-cast-workaround.mjs](scripts/bridge-cast-workaround.mjs) for the working script.

## Output
Confirm Arc Testnet USDC balance increased for all 3 wallets.
