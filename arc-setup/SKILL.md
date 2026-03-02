---
name: arc-setup
description: Arc Testnet 环境搭建（Foundry + Circle 钱包 + 测试币）
disable-model-invocation: true
---

# Arc Testnet 环境搭建

帮我在这台电脑上完成 Arc Testnet 的完整环境搭建。按以下步骤逐一执行，每步确认成功后再继续。

## Windows 注意事项
- 使用 Git Bash，语法为 Unix 风格（正斜杠路径、/dev/null 等）
- bash 下没有 grep、sed、tail、cut，所有逻辑写 .mjs 脚本
- Foundry PATH 需每次设置：`export PATH="$HOME/.foundry/bin:$PATH"`
- Node.js 脚本统一用 .mjs + package.json 中 `"type": "module"`

## Step 1: 安装 Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
export PATH="$HOME/.foundry/bin:$PATH"
foundryup
forge --version && cast --version
```

## Step 2: 创建 Cast 钱包

```bash
export PATH="$HOME/.foundry/bin:$PATH"
cast wallet new
```

输出 Address 和 Private Key，记录下来。这是主力钱包（有私钥可领空投/claim）。

## Step 3: Circle Developer Console

**用 AskUserQuestion 暂停，提示用户手动完成：**
1. 打开 https://console.circle.com 注册/登录
2. Settings → API Keys → Create → 选 **Standard**（不是 Client）
3. 复制 API Key（格式：`TEST_API_KEY:xxx:xxx`）
4. 用户提供 API Key 后继续

## Step 4: 创建项目 + 生成 Entity Secret

```bash
mkdir -p ~/arc-setup && cd ~/arc-setup
npm init -y
npm install @circle-fin/developer-controlled-wallets @circle-fin/smart-contract-platform dotenv
```

在 package.json 添加 `"type": "module"`。

将 [generate-entity-secret.mjs](scripts/generate-entity-secret.mjs) 复制到项目目录后运行：

```bash
node generate-entity-secret.mjs
```

**用 AskUserQuestion 暂停**，等用户确认已在 Console 注册 Entity Secret。

然后创建 `.env`：

```
CIRCLE_API_KEY=用户提供的值
CIRCLE_ENTITY_SECRET=刚生成的值
CAST_PRIVATE_KEY=Step2的私钥
CAST_ADDRESS=Step2的地址
ARC_RPC=https://rpc.testnet.arc.network
```

## Step 5: 创建 Circle 托管钱包

将 [create-wallets.mjs](scripts/create-wallets.mjs) 复制到项目目录后运行：

```bash
node create-wallets.mjs
```

## Step 6: 领取测试币

**用 AskUserQuestion 暂停，提示用户手动领币：**
1. https://faucet.circle.com → 给 **Cast 钱包**领 USDC + EURC（选 Arc Testnet）
2. https://faucet.circle.com → 给 **Wallet1、Wallet2** 领 USDC（选 Ethereum Sepolia + Arc Testnet）
3. https://faucets.chain.link/sepolia → 给 **Cast + Wallet1 + Wallet2** 领 ETH gas
4. 每个地址多领几次，确保余额充足（特别是 Sepolia USDC 需要至少 10 以上用于 Gateway）

## 输出

完成后列出所有钱包地址、ID，确认 .env 文件包含所有必要变量。
将 .env 复制到后续项目目录使用。
