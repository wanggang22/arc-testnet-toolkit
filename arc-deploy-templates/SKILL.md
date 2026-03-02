---
name: arc-deploy-templates
description: Circle 模板合约部署到 Arc Testnet（4 个模板）
disable-model-invocation: true
---

# Circle 模板合约部署到 Arc Testnet

用 Circle Smart Contract Platform SDK 部署 4 个模板合约到 SCA 钱包。

## 前提
- 已有 .env 包含 CIRCLE_API_KEY、CIRCLE_ENTITY_SECRET、SCA_WALLET_ID
- 已安装 @circle-fin/smart-contract-platform

如果依赖未安装：
```bash
npm install @circle-fin/smart-contract-platform
```

## 完整部署脚本

将 [deploy-templates.mjs](scripts/deploy-templates.mjs) 复制到项目目录后运行：

```bash
node deploy-templates.mjs
```

如果 30 秒后状态还是 pending，再等一会儿重新查询：
```javascript
// 可以单独查询
const res = await scpClient.getContract({ id: "contractId" });
console.log(res.data.contract);
```

## 注意事项（已知坑点）
- **name 必须字母数字**，不能有连字符（如 "ERC-20" 会报错，要用 "ERC20Token"）
- **royaltyPercent** 是数字类型，不是 royaltyBps
- 必须包含 **fee** 和 **name** 字段，否则报错
- 响应在 `res.data.contractIds` 和 `res.data.transactionId`
- 查状态：`scpClient.getContract({ id })` → `res.data.contract`

## 输出
列出所有合约地址和部署状态，确认 .env 已更新。
