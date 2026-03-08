---
name: arc-xreserve
description: Arc Testnet 稳定币扩展操作（EURC 交互 + Permit2 授权 + FxEscrow 查询）
disable-model-invocation: true
---

# Arc Testnet 稳定币扩展操作

在 Arc Testnet 上执行 EURC 高级操作：ERC-20 approve/transfer + Permit2 合约授权 + FxEscrow 合约查询。
增加 Arc 链上交互多样性，覆盖 EURC（之前 skill 主要操作 USDC）。

## 前提
- Arc Testnet 上有 EURC 余额（通过 bridge 或 faucet 获取）+ ETH gas
- Cast 钱包私钥在 .env 中

## 关键地址（Arc Testnet）
```
EURC:        0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a (6 decimals)
USDC:        0x3600000000000000000000000000000000000000 (18 decimals)
Permit2:     0x000000000022D473030F116dDEE9F6B43aC78BA3
FxEscrow:    0x867650F5eAe8df91445971f14d89fd84F0C9a9f8
Multicall3:  0xcA11bde05977b3631167028862bE2a173976CA11
RPC:         https://rpc.testnet.arc.network
```

## 安装依赖

```bash
mkdir -p ~/arc-stablecoin-ops && cd ~/arc-stablecoin-ops
npm init -y
npm pkg set type=module
npm install viem dotenv
```

复制 .env：`cp ~/deploy-contracts/.env ~/arc-stablecoin-ops/.env`

---

## 执行

将 [stablecoin-ops.mjs](scripts/stablecoin-ops.mjs) 复制到项目目录后运行：

```bash
cd ~/arc-stablecoin-ops && node stablecoin-ops.mjs
```

脚本自动执行：
1. 查询 USDC + EURC 余额
2. EURC approve 给 Permit2 合约
3. EURC approve 给 FxEscrow 合约
4. EURC transfer 给 Wallet1
5. EURC self-transfer（自己转给自己）
6. USDC approve 给 Permit2 合约
7. Multicall3 批量查询余额
8. 读取 FxEscrow 合约状态

## 交互笔数
- approve: 3 笔（EURC→Permit2, EURC→FxEscrow, USDC→Permit2）
- transfer: 2 笔（EURC→W1, EURC→self）
- **总计 5 笔 Arc 链上交易** + 读取操作

## 注意事项
- EURC 是 6 decimals，USDC 在 Arc 上是 18 decimals
- Permit2 是 Uniswap 的通用授权合约，已预部署在 Arc 上
- FxEscrow 是 StableFX 的结算合约，可以读取但写入需要 StableFX API 权限
- 如果 EURC 余额为 0，transfer 会跳过但 approve 仍会执行（0 金额 approve 也是有效交互）
