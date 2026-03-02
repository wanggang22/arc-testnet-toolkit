---
name: arc-deploy-templates
description: Deploy 4 Circle template contracts to Arc Testnet
disable-model-invocation: true
---

# Deploy Circle Template Contracts to Arc Testnet

Deploy 4 template contracts to the SCA wallet using Circle Smart Contract Platform SDK.

## Prerequisites
- .env contains CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, SCA_WALLET_ID
- @circle-fin/smart-contract-platform is installed

If dependencies are not installed:
```bash
npm install @circle-fin/smart-contract-platform
```

## Deployment Script

Copy [deploy-templates.mjs](scripts/deploy-templates.mjs) to the project directory and run:

```bash
node deploy-templates.mjs
```

If status is still pending after 30 seconds, wait and re-query:
```javascript
// Query individually
const res = await scpClient.getContract({ id: "contractId" });
console.log(res.data.contract);
```

## Known Gotchas
- **name must be alphanumeric** — no hyphens (e.g., "ERC-20" errors, use "ERC20Token")
- **royaltyPercent** is a number type, not royaltyBps
- Must include **fee** and **name** fields, otherwise errors
- Response is in `res.data.contractIds` and `res.data.transactionId`
- Check status: `scpClient.getContract({ id })` → `res.data.contract`

## Output
List all contract addresses and deployment status, confirm .env is updated.
