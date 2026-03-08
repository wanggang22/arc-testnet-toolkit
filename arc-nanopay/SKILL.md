---
name: arc-nanopay
description: Arc Testnet Nanopayments 全流程（Seller 服务 + Buyer 付款 + 提现）
disable-model-invocation: true
---

# Arc Testnet Nanopayments 全流程

通过 Circle Gateway Nanopayments 实现 gasless USDC 微支付，包含 Seller 端和 Buyer 端完整流程。
基于 x402 协议 + EIP-3009 签名 + Gateway 批量结算。

## Windows 注意事项
- 使用 Git Bash，Unix 语法
- Node.js 脚本用 .mjs 扩展名 + package.json 中 `"type": "module"`
- 所有变量从 ~/arc-setup/.env 读取

## 前提
- Arc Testnet 上有 USDC（Cast 钱包）
- Arc Testnet 上有 ETH gas（用于 deposit 交易）
- .env 包含 CAST_PRIVATE_KEY、CAST_ADDRESS

## 安装依赖

```bash
mkdir -p ~/nanopay-transfer && cd ~/nanopay-transfer
npm init -y
npm pkg set type=module
npm install @circle-fin/x402-batching @x402/core @x402/evm viem express dotenv tsx typescript
npm install --save-dev @types/node @types/express
```

复制 .env 到此目录：`cp ~/arc-setup/.env ~/nanopay-transfer/.env`

---

## 执行流程（3 步）

### Step 1: 启动 Seller 服务器

将 [nanopay-seller.mjs](scripts/nanopay-seller.mjs) 复制到项目目录后运行：

```bash
cd ~/nanopay-transfer
node nanopay-seller.mjs &
```

- 启动 Express 服务器（端口 4402）
- 提供 3 个 x402 保护的 API 端点：
  - `/api/weather` — $0.001（天气数据）
  - `/api/joke` — $0.0001（笑话）
  - `/api/premium` — $0.01（高级内容）
- 未付款请求返回 HTTP 402
- Seller 地址使用 CAST_ADDRESS（自己付给自己测试用）

### Step 2: 运行 Buyer 全流程

将 [nanopay-buyer.mjs](scripts/nanopay-buyer.mjs) 复制到项目目录后运行：

```bash
cd ~/nanopay-transfer
node nanopay-buyer.mjs
```

脚本自动执行：
1. 检查钱包余额和 Gateway 余额
2. 如果 Gateway 余额不足，Deposit 1 USDC 到 Gateway（1 笔链上 approve + 1 笔 deposit）
3. 检查 Seller 端点是否支持 x402 batching
4. 依次向 3 个端点付款（3 笔 offchain 签名，零 gas）
5. 查询最终余额
6. Withdraw 剩余余额回钱包（1 笔链上交易）

### Step 3: 停止 Seller 服务器

```bash
kill %1  # 或 pkill -f nanopay-seller
```

## 交互笔数统计
- Deposit: ~2 笔（approve + deposit）
- x402 付款: 3 笔（offchain 签名，零 gas，但产生 Gateway 记录）
- Withdraw: ~1 笔
- **总计约 6 笔交互记录**

## 关键注意事项
- ⚠️ **validBefore 必须至少 3 天后**，否则 Gateway 拒绝
- ⚠️ **Deposit 用的是 Arc Testnet USDC**（native token, 18 decimals）
- x402 付款是 offchain 签名，**零 gas**，但 Gateway 会批量结算到链上
- Seller 和 Buyer 可以是同一个地址（测试用途）
- 包名是 `@circle-fin/x402-batching`（注意连字符）
