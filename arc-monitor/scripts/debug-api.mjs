import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.CIRCLE_API_KEY;

// Test 1: Import contract - try different endpoint formats
console.log("=== Testing contract import ===\n");
const importRes = await fetch("https://api.circle.com/v1/w3s/contracts/import", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "ArcToken",
    blockchain: "ARC-TESTNET",
    address: process.env.ARC_TOKEN,
  }),
});
console.log("Import status:", importRes.status);
console.log("Import response:", JSON.stringify(await importRes.json(), null, 2));

// Test 2: List contracts to see what Circle knows about
console.log("\n=== Listing known contracts ===\n");
const listRes = await fetch("https://api.circle.com/v1/w3s/contracts?blockchain=ARC-TESTNET", {
  headers: { Authorization: "Bearer " + apiKey },
});
console.log("List status:", listRes.status);
const listData = await listRes.json();
console.log("Contracts:", JSON.stringify(listData, null, 2));

// Test 3: Try event monitor on an SCA contract
console.log("\n=== Testing event monitor creation ===\n");
const monRes = await fetch("https://api.circle.com/v1/w3s/eventMonitors", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    blockchain: "ARC-TESTNET",
    contractAddress: process.env.SCA_ERC20,
    eventSignature: "Transfer(address,address,uint256)",
  }),
});
console.log("Monitor status:", monRes.status);
console.log("Monitor response:", JSON.stringify(await monRes.json(), null, 2));

// Test 4: Try different event monitor endpoint
console.log("\n=== Testing event monitor v2 ===\n");
const monRes2 = await fetch("https://api.circle.com/v1/w3s/monitors/events", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    blockchain: "ARC-TESTNET",
    contractAddress: process.env.SCA_ERC20,
    eventSignature: "Transfer(address,address,uint256)",
  }),
});
console.log("Monitor v2 status:", monRes2.status);
console.log("Monitor v2 response:", JSON.stringify(await monRes2.json(), null, 2));
