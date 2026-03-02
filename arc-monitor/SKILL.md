---
name: arc-monitor
description: Arc Testnet contract event monitoring (Webhook + log queries)
disable-model-invocation: true
---

# Arc Testnet Contract Event Monitoring

Create event monitors using Circle Smart Contract Platform SDK with Webhook for real-time notifications.

## Prerequisites
- .env contains CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET
- .env contains deployed contract addresses (ARC_TOKEN, ARC_NFT, ARC_MULTI_TOKEN)
- @circle-fin/smart-contract-platform is installed

If dependencies are not installed:
```bash
npm install @circle-fin/smart-contract-platform dotenv
```

## Step 1: Get Webhook URL

**Pause with AskUserQuestion, prompt user:**
1. Go to https://webhook.site → a URL is auto-generated
2. Copy the URL
3. Go to Circle Developer Console → Webhooks → Add the URL
4. After user provides the URL, append to .env: `WEBHOOK_URL=https://webhook.site/xxx`

## Step 2: Create Event Monitors

Copy [create-monitors.mjs](scripts/create-monitors.mjs) to the project directory and run:

```bash
node create-monitors.mjs
```

## Step 3: Trigger Event to Verify Webhook

Execute a contract interaction to trigger an event:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.testnet.arc.network"
# Transfer 1 token to trigger Transfer event
cast send $ARC_TOKEN "transfer(address,uint256)" $WALLET1_ADDRESS 1000000000000000000 --rpc-url $RPC --private-key $CAST_PRIVATE_KEY
```

**Pause with AskUserQuestion, prompt user to check webhook.site for incoming notifications.**

## Step 4: Query Event Logs (optional)

Copy [query-logs.mjs](scripts/query-logs.mjs) to the project directory and run:

```bash
node query-logs.mjs
```

## Webhook Notification Content
Incoming notifications include: event signature, contract address, transaction hash, block info, topics, data.

## Output
Confirm monitors are created successfully and webhook receives event notifications.
