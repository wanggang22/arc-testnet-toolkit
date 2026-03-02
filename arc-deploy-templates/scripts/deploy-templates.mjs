import { CircleSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const scpClient = new CircleSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const SCA_WALLET_ID = process.env.SCA_WALLET_ID;
const FEE = { type: "level", config: { feeLevel: "MEDIUM" } };

const templates = [
  {
    envKey: "SCA_AIRDROP",
    name: "AirdropContract",
    templateId: "13e322f2-18dc-4f57-8eed-4bddfc50f85e",
    params: {},
  },
  {
    envKey: "SCA_ERC20",
    name: "ERC20Token",
    templateId: "a1b74add-23e0-4712-88d1-6b3009e85a86",
    params: { name: "ArcCoin", symbol: "ACN", initialSupply: 1000000 },
  },
  {
    envKey: "SCA_ERC721",
    name: "ERC721NFT",
    templateId: "76b83278-50e2-4006-8b63-5b1a2a814533",
    params: { name: "ArcItems", symbol: "AITM", royaltyPercent: 5 },
  },
  {
    envKey: "SCA_ERC1155",
    name: "ERC1155Multi",
    templateId: "aea21da6-0aa2-4971-9a1a-5098842b1248",
    params: { name: "ArcMulti", symbol: "AMLT", royaltyPercent: 5 },
  },
];

console.log("=== Deploying Circle Template Contracts ===\n");
const deployed = [];

for (const t of templates) {
  console.log(`Deploying ${t.name}...`);
  try {
    const res = await scpClient.deployContractTemplate({
      name: t.name,
      templateId: t.templateId,
      blockchain: "ARC-TESTNET",
      walletId: SCA_WALLET_ID,
      templateParameters: t.params,
      fee: FEE,
    });
    const contractId = res.data.contractIds?.[0];
    const txId = res.data.transactionId;
    console.log(`  contractId: ${contractId}`);
    console.log(`  transactionId: ${txId}`);
    deployed.push({ ...t, contractId, txId });
  } catch (err) {
    console.error(`  Failed: ${err?.response?.data?.message || err.message}`);
  }
}

// Wait for deployment confirmation
console.log("\nWaiting 30s for deployment confirmation...");
await new Promise(r => setTimeout(r, 30000));

console.log("\n=== Checking Deployment Status ===\n");
let envAppend = "\n";
for (const d of deployed) {
  try {
    const res = await scpClient.getContract({ id: d.contractId });
    const c = res.data.contract;
    console.log(`${d.name}:`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Address: ${c.contractAddress || "pending..."}`);
    if (c.contractAddress) {
      envAppend += `${d.envKey}=${c.contractAddress}\n`;
    }
  } catch (err) {
    console.log(`${d.name}: check failed - ${err.message}`);
  }
}

// Append to .env
if (envAppend.trim()) {
  fs.appendFileSync(".env", envAppend);
  console.log("\nContract addresses appended to .env");
}
