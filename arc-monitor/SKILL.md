---
name: arc-monitor
description: Arc Testnet 合约事件监控（Webhook + 日志查询）
disable-model-invocation: true
---

# Arc Testnet 合约事件监控

用 Circle Smart Contract Platform SDK 创建事件监控器，配合 Webhook 接收实时通知。

## 前提
- .env 包含 CIRCLE_API_KEY、CIRCLE_ENTITY_SECRET
- .env 包含已部署的合约地址（ARC_TOKEN、ARC_NFT、ARC_MULTI_TOKEN）
- 已安装 @circle-fin/smart-contract-platform

如果依赖未安装：
```bash
npm install @circle-fin/smart-contract-platform dotenv
```

## Step 1: 获取 Webhook URL

**用 AskUserQuestion 暂停，提示用户：**
1. 打开 https://webhook.site → 自动生成一个 URL
2. 复制该 URL
3. 去 Circle Developer Console → Webhooks → 添加该 URL
4. 用户提供 URL 后，追加到 .env：`WEBHOOK_URL=https://webhook.site/xxx`

## Step 2: 创建事件监控器

将 [create-monitors.mjs](scripts/create-monitors.mjs) 复制到项目目录后运行：

```bash
node create-monitors.mjs
```

## Step 3: 触发事件验证 Webhook

执行一笔合约交互来触发事件：

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.testnet.arc.network"
# Transfer 1 token to trigger Transfer event
cast send $ARC_TOKEN "transfer(address,uint256)" $WALLET1_ADDRESS 1000000000000000000 --rpc-url $RPC --private-key $CAST_PRIVATE_KEY
```

**用 AskUserQuestion 暂停，提示用户打开 webhook.site 页面检查是否收到推送通知。**

## Step 4: 查询事件日志（可选）

将 [query-logs.mjs](scripts/query-logs.mjs) 复制到项目目录后运行：

```bash
node query-logs.mjs
```

## Webhook 通知内容
收到的推送包含：事件签名、合约地址、交易哈希、区块信息、topics、data。

## 输出
确认监控器创建成功，webhook 能收到事件通知。
