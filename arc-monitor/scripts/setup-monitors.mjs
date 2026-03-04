import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.CIRCLE_API_KEY;

// Step 1: Import Foundry-deployed contracts into Circle (need idempotencyKey)
console.log("=== Step 1: Importing Foundry contracts ===\n");

const contractsToImport = [
  { name: "ArcToken", address: process.env.ARC_TOKEN },
  { name: "ArcNFT", address: process.env.ARC_NFT },
  { name: "ArcMultiToken", address: process.env.ARC_MULTI_TOKEN },
];

for (const c of contractsToImport) {
  if (!c.address) continue;
  const res = await fetch("https://api.circle.com/v1/w3s/contracts/import", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      name: c.name,
      blockchain: "ARC-TESTNET",
      address: c.address,
    }),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`${c.name}: imported OK - ${JSON.stringify(data?.data?.contractId || data)}`);
  } else {
    const msg = data?.message || JSON.stringify(data);
    console.log(`${c.name}: ${res.status} - ${msg}`);
  }
}

// Wait a bit for imports to process
await new Promise(r => setTimeout(r, 3000));

// Step 2: List all contracts to confirm
console.log("\n=== Known contracts ===\n");
const listRes = await fetch("https://api.circle.com/v1/w3s/contracts?blockchain=ARC-TESTNET", {
  headers: { Authorization: "Bearer " + apiKey },
});
const listData = await listRes.json();
const contracts = listData.data?.contracts || [];
for (const c of contracts) {
  const addr = c.contractAddress || c.proxyContract?.contractAddress || "pending";
  console.log(`  ${c.name} | ${addr} | ${c.status}`);
}

// Step 3: Create event monitors on all known contracts
console.log("\n=== Step 3: Creating Event Monitors ===\n");

// Build monitor list from all contract addresses we have
const allContracts = [
  process.env.ARC_TOKEN,
  process.env.ARC_NFT,
  process.env.ARC_MULTI_TOKEN,
  process.env.SCA_ERC20,
  process.env.SCA_ERC721,
  process.env.SCA_ERC1155,
].filter(Boolean);

const eventSigs = [
  "Transfer(address,address,uint256)",
  "TransferSingle(address,address,address,uint256,uint256)",
  "Approval(address,address,uint256)",
];

for (const addr of allContracts) {
  for (const sig of eventSigs) {
    const res = await fetch("https://api.circle.com/v1/w3s/eventMonitors", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blockchain: "ARC-TESTNET",
        contractAddress: addr,
        eventSignature: sig,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`  OK: ${addr.substring(0, 10)}... | ${sig}`);
    } else {
      const msg = data?.message || "";
      if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
        console.log(`  EXISTS: ${addr.substring(0, 10)}... | ${sig}`);
      } else {
        // Silently skip non-matching sigs (e.g. TransferSingle on ERC-20)
        if (!msg.includes("not found")) {
          console.log(`  SKIP: ${addr.substring(0, 10)}... | ${sig} - ${msg}`);
        }
      }
    }
  }
}

// Step 4: List all monitors
console.log("\n=== All Active Monitors ===\n");
const monRes = await fetch("https://api.circle.com/v1/w3s/eventMonitors?blockchain=ARC-TESTNET", {
  headers: { Authorization: "Bearer " + apiKey },
});
const monData = await monRes.json();
const monitors = monData.data?.eventMonitors || [];
if (monitors.length > 0) {
  for (const m of monitors) {
    console.log(`  ${m.contractAddress} | ${m.eventSignature} | ${m.status}`);
  }
} else {
  console.log("  No monitors found");
  console.log("  Response:", JSON.stringify(monData, null, 2));
}

console.log(`\nTotal monitors: ${monitors.length}`);
