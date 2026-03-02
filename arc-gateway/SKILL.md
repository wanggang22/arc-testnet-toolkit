---
name: arc-gateway
description: Circle Gateway 跨链转账全流程（Deposit → Sign → Mint）
disable-model-invocation: true
---

# Circle Gateway 跨链转账全流程

通过 Circle Gateway 合约实现 ETH Sepolia → Arc Testnet 的 USDC 跨链转移。
独立于 Bridge Kit，使用 Gateway 合约直接交互，增加更多链上记录。

**⚠️ Deposit 后需等 ~15 分钟 Sepolia finality，务必一次做对！**

## 前提
- ETH Sepolia 上有 USDC（至少 6 个）+ ETH gas
- 已安装 Foundry + Node.js

## 关键地址（硬编码，不要改）
```
Gateway Wallet:  0x0077777d7EBA4688BDeF3E311b846F25870A19B9
Gateway Minter:  0x0022222ABE238Cc2C7Bb1f21003F0a260052475B
USDC (Sepolia):  0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 (6 decimals)
USDC (Arc):      0x3600000000000000000000000000000000000000 (native, 18 decimals)
Domains:         ETH Sepolia=0, Arc Testnet=26
Gateway API:     https://gateway-api-testnet.circle.com
```

## 安装依赖

```bash
mkdir -p ~/gateway-transfer && cd ~/gateway-transfer
npm init -y
npm install viem dotenv
```

在 package.json 添加 `"type": "module"`。复制 .env 到此目录（需要 CAST_PRIVATE_KEY、CAST_ADDRESS）。

---

## 执行流程（只需两步）

### Step 1: 运行 deposit（~2 分钟）

将 [gateway-deposit.mjs](scripts/gateway-deposit.mjs) 复制到项目目录后运行：

```bash
node gateway-deposit.mjs
```
- 自动检查 Sepolia USDC 余额、ETH gas
- 余额不够直接 ABORT 并提示去哪领
- 如果 Gateway 已有余额则跳过 deposit

### Step 2: 运行 complete（自动等待 + 一气呵成）

将 [gateway-complete.mjs](scripts/gateway-complete.mjs) 复制到项目目录后运行：

```bash
node gateway-complete.mjs
```
- 自动每 60 秒轮询 Gateway 余额
- 余额到账后自动：签名 → 提交 API → gatewayMint → 验证余额
- 如果 mint 失败，自动保存 attestation 到 mint-data.json 供手动重试

**可以 deposit 完直接运行 complete，它会自动等待 15 分钟直到余额出现。**

## 关键注意事项（已知坑点）
- ⚠️ **Gateway API 返回 `signature` 字段，不是 `operatorSig`**
- **maxFee 至少 2 USDC**（实测最低约 2.00015 USDC），脚本设置 3 USDC 上限足够
- **Deposit 后等约 15 分钟**才能在 balance 中看到（脚本自动轮询）
- Arc 上 USDC 是原生代币（18 decimals），**不能从 Arc 存入 Gateway**，只能 Sepolia → Arc
- 签名用 **BigInt**（`999999999n`），API 提交用 **string**（`"999999999"`），脚本分开构建两份 spec 避免混淆
- Deposit 脚本用 **viem 直接发交易**（不是 cast），避免 Foundry PATH 问题影响预检
