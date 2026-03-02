import { CircleSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import dotenv from "dotenv";
dotenv.config();

const scpClient = new CircleSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const monitors = [
  {
    name: "ERC-20 Transfer",
    contractAddress: process.env.ARC_TOKEN,
    eventSignature: "Transfer(address,address,uint256)",
  },
  {
    name: "ERC-20 Approval",
    contractAddress: process.env.ARC_TOKEN,
    eventSignature: "Approval(address,address,uint256)",
  },
  {
    name: "ERC-721 Transfer",
    contractAddress: process.env.ARC_NFT,
    eventSignature: "Transfer(address,address,uint256)",
  },
  {
    name: "ERC-1155 TransferSingle",
    contractAddress: process.env.ARC_MULTI_TOKEN,
    eventSignature: "TransferSingle(address,address,address,uint256,uint256)",
  },
];

console.log("=== Creating Event Monitors ===\n");
for (const m of monitors) {
  if (!m.contractAddress) {
    console.log(`${m.name}: SKIPPED (contract address not in .env)`);
    continue;
  }
  try {
    const res = await scpClient.createEventMonitor({
      blockchain: "ARC-TESTNET",
      contractAddress: m.contractAddress,
      eventSignature: m.eventSignature,
    });
    console.log(`${m.name}: created (ID: ${res.data?.id || "ok"})`);
  } catch (err) {
    // "already exists" is OK
    const msg = err?.response?.data?.message || err.message;
    if (msg.includes("already")) {
      console.log(`${m.name}: already exists (OK)`);
    } else {
      console.error(`${m.name}: FAILED - ${msg}`);
    }
  }
}

// List all monitors
console.log("\n=== All Event Monitors ===\n");
try {
  const list = await scpClient.listEventMonitors({ blockchain: "ARC-TESTNET" });
  for (const m of list.data?.eventMonitors || []) {
    console.log(`  ${m.contractAddress} | ${m.eventSignature} | ${m.status}`);
  }
} catch (err) {
  console.error("List failed:", err.message);
}
