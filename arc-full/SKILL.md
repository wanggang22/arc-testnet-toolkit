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
4. 生成 Entity Secret → **脚本自动通过 API 注册**（不需要用户去 Console 操作）
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
   - ⚠️ SDK deployContractTemplate 有 bug，使用直接 fetch API 调用

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
11. Bridge Kit 桥接 USDC（Wallet1、Wallet2 各 1 次，Cast 会失败）
    - ⚠️ 需添加 BigInt 序列化修复：`BigInt.prototype.toJSON = function() { return this.toString(); };`
    - ⚠️ Cast 钱包用 viem adapter 会报 RPC 错误，实测只有 Wallet1+Wallet2 成功（2 笔）
    - ETH Sepolia 确认需 ~15 分钟
12. Gateway 全流程（只需两个脚本）：
    - `gateway-deposit.mjs`：预检 Sepolia USDC 余额 + ETH gas → Approve → Deposit
    - `gateway-complete.mjs`：自动轮询余额 → EIP-712 签名 → 提交 API → gatewayMint → 验证
    - Deposit 后直接运行 complete，它会自动等 ~15 分钟直到余额出现再一口气跑完
    - Gateway fee ~2 USDC，存 6 USDC 转 3 USDC，到账约 1 USDC

### Phase 5: XyloNet DeFi 交互（对应 `/arc-xylonet`）
13. 自动执行 XyloNet 平台 DeFi 操作，产生 ~18 笔链上交易
    - PayX 打赏 ×3、DEX Swap ×2、Vault 存款、CCTP Bridge、添加流动性
    - 使用 cast send 直接发链上交易，每笔用 1 USDC/EURC
    ```bash
    node D:/wwwwwwwwwwwww/arc/xylonet-auto/xylonet-auto.mjs
    ```

### Phase 6: 监控（对应 `/arc-monitor`）
14. **手动**：webhook.site 获取 URL + Circle Console 注册 Webhook
15. 先导入 Foundry 合约到 Circle，再创建 4 个事件监控器（Transfer、Approval、TransferSingle）
    - ⚠️ SCP SDK 不工作，使用直接 fetch API（endpoint: `/v1/w3s/contracts/monitors`）
16. 触发一笔交易 → 验证 webhook.site 收到通知

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

## Circle SDK 已知问题（实测踩坑）
- **Entity Secret 注册**：必须用 RSA-OAEP SHA-256 加密 → **base64** 编码（hex 会 400）
- **SCP SDK deployContractTemplate**：有 bug，改用直接 fetch API
- **模板部署 API**：需要 `idempotencyKey`（顶层）、`feeLevel`（顶层，不是嵌套 fee 对象）、`defaultAdmin`、`primarySaleRecipient`、`royaltyRecipient`
- **Bridge Kit BigInt**：JSON.stringify 报错，需要 `BigInt.prototype.toJSON = function() { return this.toString(); };`
- **Cast 钱包 Bridge**：viem adapter 在 Arc RPC 报错，只有 Wallet1+Wallet2 成功
- **SCP SDK createEventMonitor/listEventMonitors**：不工作，改用直接 fetch API（endpoint: `/v1/w3s/contracts/monitors`）
- **事件监控前置步骤**：Foundry 部署的合约需先通过 `/v1/w3s/contracts/import` 导入 Circle
- **gateway-complete.mjs bash 命令**：`export PATH=...` 和 `cast send` 必须用 `&&` 连接

## 总计交互笔数（实测）
- Foundry 部署：5 笔
- Circle 模板部署：4 笔
- Cast 交互：~18 笔
- SCA 交互：~10 笔
- Bridge：~6 笔（W1+W2 各 approve+burn+mint，Cast 钱包 viem adapter 失败）
- Gateway：~4 笔（approve + deposit + API transfer + gatewayMint）
- XyloNet 交互：~16 笔（Tip/Swap/Deposit/Bridge/LP）
- Monitor 触发：~8 笔（导入+监控器+触发）
- **总计约 71 笔链上交互**
