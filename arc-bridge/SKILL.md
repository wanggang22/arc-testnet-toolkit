---
name: arc-bridge
description: USDC 跨链桥接到 Arc Testnet（Bridge Kit）
disable-model-invocation: true
---

# USDC 跨链桥接到 Arc Testnet

从 ETH Sepolia 桥接 USDC 到 Arc Testnet，使用 Circle Bridge Kit。

## 前提
- ETH Sepolia 上有 USDC（领取: https://faucet.circle.com）
- ETH Sepolia 上有 ETH gas（领取: https://faucets.chain.link/sepolia）
- .env 文件包含必要变量

## 安装依赖

```bash
mkdir -p ~/crosschain-transfer && cd ~/crosschain-transfer
npm init -y
npm install @circle-fin/bridge-kit @circle-fin/adapter-circle-wallets @circle-fin/adapter-viem-v2 @circle-fin/developer-controlled-wallets dotenv viem
```

在 package.json 添加 `"type": "module"`。
复制 .env 文件到此目录。

## 完整桥接脚本

将 [bridge.mjs](scripts/bridge.mjs) 复制到项目目录后运行：

```bash
node bridge.mjs
```

## 注意事项
- Cast 钱包不在 Circle 系统内，**from** 用 castAdapter，**to** 用 circleAdapter 并指定 `address`
- ETH Sepolia 确认需约 **15 分钟**，期间可做其他操作
- Arc 上 USDC 是 native token（**18 decimals**），Sepolia 上是 **6 decimals**
- 桥接完成后验证余额：
  ```bash
  export PATH="$HOME/.foundry/bin:$PATH"
  cast balance $CAST_ADDRESS --rpc-url https://rpc.testnet.arc.network
  # 返回 wei 值，除以 1e18 得到 USDC 数量
  ```

## 输出
确认 3 个钱包的 Arc Testnet USDC 余额增加。
