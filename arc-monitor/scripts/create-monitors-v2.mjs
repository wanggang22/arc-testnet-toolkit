import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.CIRCLE_API_KEY;

// The correct endpoint for event monitors is /v1/w3s/contracts/monitors
// (discovered from SDK source code)

console.log("=== Creating Event Monitors ===\n");

const monitors = [
  {
    name: "ArcToken Transfer",
    contractAddress: process.env.ARC_TOKEN,
    eventSignature: "Transfer(address,address,uint256)",
  },
  {
    name: "ArcToken Approval",
    contractAddress: process.env.ARC_TOKEN,
    eventSignature: "Approval(address,address,uint256)",
  },
  {
    name: "ArcNFT Transfer",
    contractAddress: process.env.ARC_NFT,
    eventSignature: "Transfer(address,address,uint256)",
  },
  {
    name: "ArcMultiToken TransferSingle",
    contractAddress: process.env.ARC_MULTI_TOKEN,
    eventSignature: "TransferSingle(address,address,address,uint256,uint256)",
  },
];

for (const m of monitors) {
  if (!m.contractAddress) { console.log(`${m.name}: SKIPPED`); continue; }

  const body = {
    idempotencyKey: crypto.randomUUID(),
    blockchain: "ARC-TESTNET",
    contractAddress: m.contractAddress,
    eventSignature: m.eventSignature,
  };

  const res = await fetch("https://api.circle.com/v1/w3s/contracts/monitors", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok) {
    const id = data?.data?.eventMonitor?.id || data?.data?.id || "ok";
    console.log(`${m.name}: CREATED (ID: ${id})`);
  } else {
    const msg = data?.message || JSON.stringify(data);
    if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
      console.log(`${m.name}: already exists (OK)`);
    } else {
      console.log(`${m.name}: ${res.status} - ${msg}`);
      console.log(`  Detail: ${JSON.stringify(data, null, 2)}`);
    }
  }
}

// List all monitors
console.log("\n=== Listing All Event Monitors ===\n");
const listRes = await fetch("https://api.circle.com/v1/w3s/contracts/monitors?blockchain=ARC-TESTNET", {
  headers: { Authorization: "Bearer " + apiKey },
});
const listData = await listRes.json();
console.log("List status:", listRes.status);
const eventMonitors = listData?.data?.eventMonitors || [];
if (eventMonitors.length > 0) {
  for (const m of eventMonitors) {
    console.log(`  ${m.contractAddress} | ${m.eventSignature} | ${m.status}`);
  }
} else {
  console.log("Response:", JSON.stringify(listData, null, 2));
}
console.log(`\nTotal monitors: ${eventMonitors.length}`);
