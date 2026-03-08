---
name: arc-modular-wallets
description: Circle Modular Wallets（MSCA）创建 + 交易（ERC-4337 UserOp）
disable-model-invocation: true
---

# Circle Modular Wallets (MSCA) 交互

创建 ERC-6900 模块化智能合约账户（MSCA），通过 ERC-4337 UserOperation 执行交易。
展示 Circle 高级钱包能力。

## 前提
- Circle API Key + Entity Secret 在 .env 中
- 已有 Circle Developer Wallet Set

## 关键概念
- **MSCA**: Modular Smart Contract Account (ERC-6900)
- **SCA Core**: `circle_6900_singleowner_v1` 或 `circle_6900_singleowner_v2`
- **UserOperation**: ERC-4337 标准，bundler 代付 gas
- 支持安装模块: 权限控制、社交恢复、自动化

## 安装依赖

```bash
mkdir -p ~/modular-wallets && cd ~/modular-wallets
npm init -y
npm pkg set type=module
npm install @circle-fin/developer-controlled-wallets dotenv uuid
```

复制 .env：`cp ~/deploy-contracts/.env ~/modular-wallets/.env`

---

## 执行

将 [modular-wallets.mjs](scripts/modular-wallets.mjs) 复制到项目目录后运行：

```bash
cd ~/modular-wallets && node modular-wallets.mjs
```

脚本自动执行：
1. 初始化 Circle SDK（使用已有 API Key + Entity Secret）
2. 在已有 Wallet Set 中创建 SCA 钱包（accountType: SCA, scaCore: circle_6900_singleowner_v2）
3. 查询钱包状态和余额
4. 通过 SDK 发送 USDC 转账（转给 Cast 钱包）
5. 查询交易状态（轮询到 COMPLETE）
6. 如果已有 SCA 钱包，尝试升级到 v2

## 交互笔数
- 创建 SCA 钱包: 1 笔（链上部署）
- USDC 转账: 1 笔（UserOp）
- 可选升级: 1 笔
- **总计 2-3 笔链上交易**

## 注意事项
- SCA 钱包创建后需要 gas，Circle Gas Station 会自动代付（ARC-TESTNET）
- SCA 钱包地址与 EOA 不同，是合约地址
- 转账前需确保 SCA 钱包有 USDC 余额（可通过 faucet 或从其他钱包转入）
- SOL 和 APTOS 不支持 SCA
- scaCore 升级是单向的，v1 → v2 不可逆
