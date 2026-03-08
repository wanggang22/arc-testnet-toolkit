---
name: arc-usyc
description: Arc Testnet USYC 代币化收益全流程（approve + deposit + redeem）
disable-model-invocation: true
---

# Arc Testnet USYC 代币化收益交互

在 Arc Testnet 上通过 USYC Teller 合约进行 USDC → USYC 订阅（deposit）和 USYC → USDC 赎回（redeem）。

## 前提
- Arc Testnet 上有 USDC + ETH gas
- Cast 钱包私钥在 .env 中

## 关键地址（Arc Testnet）
```
USYC Token:      0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C (6 decimals)
USYC Teller:     0x9fdF14c5B14173D74C08Af27AebFf39240dC105A
USYC Entitle:    0xcc205224862c7641930c87679e98999d23c26113
USDC (Arc):      0x3600000000000000000000000000000000000000 (native, 18 decimals)
RPC:             https://rpc.testnet.arc.network
```

## 安装依赖

```bash
mkdir -p ~/usyc-transfer && cd ~/usyc-transfer
npm init -y
npm pkg set type=module
npm install viem dotenv
```

复制 .env：`cp ~/deploy-contracts/.env ~/usyc-transfer/.env`

---

## 执行

将 [usyc-interact.mjs](scripts/usyc-interact.mjs) 复制到项目目录后运行：

```bash
cd ~/usyc-transfer && node usyc-interact.mjs
```

脚本自动执行：
1. 检查 Arc Testnet ETH + USDC 余额
2. 检查当前 USYC 余额
3. approve USDC 给 Teller 合约
4. deposit() 订阅 USYC
5. 查询新 USYC 余额
6. redeem() 赎回部分 USYC 回 USDC
7. 查询最终 USDC + USYC 余额

## 交互笔数
- approve: 1 笔
- deposit: 1 笔
- redeem: 1 笔
- **总计 3 笔 Arc 链上交易**

## 注意事项
- Arc USDC 是原生代币（18 decimals），USYC 是 6 decimals — 注意单位转换
- deposit 参数 `_assets` 用 USDC 最小单位（Arc 上 18 decimals）
- redeem 的 `_account` 参数填自己地址
- 如果 Teller 合约 revert，可能是 entitlement 检查未通过
