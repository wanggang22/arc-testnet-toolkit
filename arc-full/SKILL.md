---
name: arc-full
description: Arc Testnet 全流程一键执行（编排所有 arc-* skill）
disable-model-invocation: true
---

# Arc Testnet 全流程一键执行

按顺序执行所有 Arc Testnet 教程操作，最大化链上交互记录。
每个阶段对应一个独立 skill，也可单独调用。

## Windows 注意事项
- 使用 Git Bash，Unix 语法
- Foundry PATH：`export PATH="$HOME/.foundry/bin:$PATH"`
- bash 下没有 grep/sed/tail/cut，所有逻辑写 .mjs 脚本
- Node.js 脚本用 .mjs 扩展名 + package.json 中 `"type": "module"`

## 执行顺序

### Phase 1: 环境搭建（对应 `/arc-setup`）
1. 安装 Foundry（forge, cast）
2. 创建 cast 钱包（保留私钥，空投用）
3. **手动**：Circle Developer Console 注册 + 创建 API Key（Standard，不是 Client）
4. 生成 Entity Secret → **手动**注册到 Console
5. 代码创建 Circle 托管钱包（2 个 EOA on ARC+Sepolia + 1 个 SCA on ARC）
6. **手动**：领测试币
   - https://faucet.circle.com → Cast 钱包领 USDC + EURC（Arc Testnet）
   - https://faucet.circle.com → Wallet1、Wallet2 领 USDC（Ethereum Sepolia + Arc Testnet）
   - https://faucets.chain.link/sepolia → Cast + Wallet1 + Wallet2 领 ETH gas
   - 每个地址多领几次确保余额充足（Sepolia USDC 至少 10+ 用于 Gateway）

### Phase 2: 合约部署（对应 `/arc-deploy-foundry` + `/arc-deploy-templates`）
7. Foundry 部署 5 个合约到 cast 钱包：
   - HelloArchitect、ArcToken (ERC-20)、ArcNFT (ERC-721)、ArcMultiToken (ERC-1155)、ArcAirdrop
   - 完整 Solidity 源码在 skill 内
8. Circle 模板部署 4 个合约到 SCA 钱包：
   - Airdrop、ERC-20、ERC-721、ERC-1155
   - 使用 deployContractTemplate API

### Phase 3: 合约交互（对应 `/arc-interactions`）
9. Cast 钱包：~18 笔交互
   - HelloArchitect: setGreeting x2
   - ERC-20: transfer x2, approve x2, mint x1
   - ERC-721: mint x3, transferFrom x1
   - ERC-1155: mint x3, safeTransferFrom x1
   - Airdrop: airdropERC20 x1
   - EURC: transfer x2
10. SCA 钱包：~10 笔交互
    - ERC-20: mintTo, transfer x2, approve
    - Airdrop: airdropERC20
    - ERC-721: mintTo x2
    - ERC-1155: mintTo x3

### Phase 4: 跨链（对应 `/arc-bridge` + `/arc-gateway`）
11. Bridge Kit 桥接 USDC（Wallet1、Wallet2、Cast 各 1 次，共 3 USDC）
    - ETH Sepolia 确认需 ~15 分钟
12. Gateway 全流程（只需两个脚本）：
    - `gateway-deposit.mjs`：预检 Sepolia USDC 余额 + ETH gas → Approve → Deposit
    - `gateway-complete.mjs`：自动轮询余额 → EIP-712 签名 → 提交 API → gatewayMint → 验证
    - Deposit 后直接运行 complete，它会自动等 ~15 分钟直到余额出现再一口气跑完
    - Gateway fee ~2 USDC，存 6 USDC 转 3 USDC，到账约 1 USDC

### Phase 5: 监控（对应 `/arc-monitor`）
13. **手动**：webhook.site 获取 URL + Circle Console 注册 Webhook
14. 创建 4 个事件监控器（Transfer、Approval、TransferSingle）
15. 触发一笔交易 → 验证 webhook.site 收到通知

## 项目目录结构
```
~/arc-setup/           - 环境搭建脚本和 .env
~/hello-arc/           - Foundry 项目（5 个合约）
~/deploy-contracts/    - Circle 模板部署 + SCA 交互
~/crosschain-transfer/ - Bridge Kit 桥接
~/gateway-transfer/    - Gateway 全流程
```
每个目录都需要复制 .env 文件。

## 关键注意事项
- **所有操作尽量集中到 cast 钱包**（有私钥可领空投/claim）
- SCA 钱包没有私钥，不能直接领空投，只用于 Circle 模板部署
- Arc 上 USDC 是原生代币（**18 decimals**），Sepolia 上是 **6 decimals**
- Arc 上 USDC **不能**存入 Gateway（只能 Sepolia → Arc 单向）
- Circle 模板合约 **name 必须字母数字**（无连字符）
- Circle 模板 royalty 参数是 **royaltyPercent**（数字），不是 royaltyBps
- Gateway API 返回 **`signature`** 字段（不是 `operatorSig`）
- 手动步骤需要用户操作，执行时用 **AskUserQuestion 暂停等待**
- 等待时间较长的步骤，可以先做其他操作

## 总计交互笔数
- Foundry 部署：5 笔
- Circle 模板部署：4 笔
- Cast 交互：~18 笔
- SCA 交互：~10 笔
- Bridge：3 笔
- Gateway：~4 笔（approve + deposit + transfer + mint）
- Monitor 触发：1 笔
- **总计约 45+ 笔链上交互**
