---
name: arc-compliance
description: Circle Compliance Engine 地址合规筛查（API 调用，无 Gas）
disable-model-invocation: true
---

# Circle Compliance Engine 地址筛查

使用 Circle Compliance API 对钱包地址进行合规风险筛查。纯 API 调用，无链上交易，但展示对 Circle 合规产品的使用。

## 前提
- Circle API Key 在 .env 中（CIRCLE_API_KEY）

## API 端点
```
POST https://api.circle.com/v1/w3s/compliance/screening/addresses
Authorization: Bearer <CIRCLE_API_KEY>
```

## 安装依赖

```bash
mkdir -p ~/compliance-check && cd ~/compliance-check
npm init -y
npm pkg set type=module
npm install dotenv uuid
```

复制 .env：`cp ~/deploy-contracts/.env ~/compliance-check/.env`

---

## 执行

将 [compliance-screen.mjs](scripts/compliance-screen.mjs) 复制到项目目录后运行：

```bash
cd ~/compliance-check && node compliance-screen.mjs
```

脚本自动执行：
1. 筛查 Cast 钱包地址（ETH 链）
2. 筛查 Circle Wallet1 地址
3. 筛查 Circle Wallet2 地址
4. 筛查一个已知高风险地址（Tornado Cash router）作为对比
5. 汇总输出筛查结果

## 交互笔数
- **0 笔链上交易**（纯 API）
- 4 次 API 调用

## 返回结果说明
- `result`: APPROVED / DENIED
- `riskSignals`: 风险信号列表
  - `riskScore`: UNKNOWN / LOW / MEDIUM / HIGH / SEVERE / BLOCKLIST
  - `riskCategory`: SANCTIONS / GAMBLING / ILLICIT_BEHAVIOR 等
  - `riskType`: OWNERSHIP / COUNTERPARTY / INDIRECT

## 建议用法
可嵌入其他 skill 流程中（bridge/gateway 前先筛查目标地址），增加合规交互深度。
