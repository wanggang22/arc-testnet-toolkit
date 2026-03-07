import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.CIRCLE_API_KEY;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

// Get public key for entity secret encryption
const pkRes = await fetch("https://api.circle.com/v1/w3s/config/entity/publicKey", {
  headers: { Authorization: "Bearer " + apiKey },
});
const pkData = await pkRes.json();

function encryptEntitySecret() {
  const encrypted = crypto.publicEncrypt(
    { key: pkData.data.publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(entitySecret, "hex")
  );
  return encrypted.toString("base64");
}

// Step 1: Import Foundry-deployed contracts into Circle
console.log("=== Step 1: Importing contracts into Circle ===\n");

const contractsToImport = [
  { name: "ArcToken (ERC-20)", address: process.env.ARC_TOKEN },
  { name: "ArcNFT (ERC-721)", address: process.env.ARC_NFT },
  { name: "ArcMultiToken (ERC-1155)", address: process.env.ARC_MULTI_TOKEN },
];

for (const c of contractsToImport) {
  if (!c.address) { console.log(`${c.name}: SKIPPED (no address)`); continue; }
  try {
    const res = await fetch("https://api.circle.com/v1/w3s/contracts/import", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        name: c.name.replace(/[^a-zA-Z0-9]/g, ""),
        blockchain: "ARC-TESTNET",
        address: c.address,
      }),
    });
    const data = await res.json();
    if (res.status === 200 || res.status === 201) {
      console.log(`${c.name}: imported (${c.address})`);
    } else {
      const msg = data?.message || data?.data?.message || JSON.stringify(data);
      console.log(`${c.name}: ${msg}`);
    }
  } catch (err) {
    console.error(`${c.name}: ${err.message}`);
  }
}

// Step 2: Create Event Monitors
console.log("\n=== Step 2: Creating Event Monitors ===\n");

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

for (const m of monitors) {
  if (!m.contractAddress) { console.log(`${m.name}: SKIPPED`); continue; }
  try {
    const res = await fetch("https://api.circle.com/v1/w3s/contracts/monitors", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        blockchain: "ARC-TESTNET",
        contractAddress: m.contractAddress,
        eventSignature: m.eventSignature,
      }),
    });
    const data = await res.json();
    if (res.status === 200 || res.status === 201) {
      const id = data.data?.id || data.id;
      console.log(`${m.name}: created (ID: ${id})`);
    } else {
      const msg = data?.message || data?.data?.message || JSON.stringify(data);
      if (msg.includes("already") || msg.includes("exists")) {
        console.log(`${m.name}: already exists (OK)`);
      } else {
        console.log(`${m.name}: ${msg}`);
      }
    }
  } catch (err) {
    console.error(`${m.name}: ${err.message}`);
  }
}

// Also try SCA contracts if Foundry ones fail
console.log("\n=== Also trying SCA-deployed contracts ===\n");
const scaMonitors = [
  {
    name: "SCA ERC-20 Transfer",
    contractAddress: process.env.SCA_ERC20,
    eventSignature: "Transfer(address,address,uint256)",
  },
  {
    name: "SCA ERC-721 Transfer",
    contractAddress: process.env.SCA_ERC721,
    eventSignature: "Transfer(address,address,uint256)",
  },
  {
    name: "SCA ERC-1155 TransferSingle",
    contractAddress: process.env.SCA_ERC1155,
    eventSignature: "TransferSingle(address,address,address,uint256,uint256)",
  },
];

for (const m of scaMonitors) {
  if (!m.contractAddress) { console.log(`${m.name}: SKIPPED`); continue; }
  try {
    const res = await fetch("https://api.circle.com/v1/w3s/contracts/monitors", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        blockchain: "ARC-TESTNET",
        contractAddress: m.contractAddress,
        eventSignature: m.eventSignature,
      }),
    });
    const data = await res.json();
    if (res.status === 200 || res.status === 201) {
      const id = data.data?.id || data.id;
      console.log(`${m.name}: created (ID: ${id})`);
    } else {
      const msg = data?.message || data?.data?.message || JSON.stringify(data);
      if (msg.includes("already") || msg.includes("exists")) {
        console.log(`${m.name}: already exists (OK)`);
      } else {
        console.log(`${m.name}: ${msg}`);
      }
    }
  } catch (err) {
    console.error(`${m.name}: ${err.message}`);
  }
}

// List all monitors
console.log("\n=== All Event Monitors ===\n");
try {
  const res = await fetch("https://api.circle.com/v1/w3s/contracts/monitors?blockchain=ARC-TESTNET", {
    headers: { Authorization: "Bearer " + apiKey },
  });
  const data = await res.json();
  for (const m of data.data?.eventMonitors || []) {
    console.log(`  ${m.contractAddress} | ${m.eventSignature} | ${m.status}`);
  }
  if (!data.data?.eventMonitors?.length) {
    console.log("  (no monitors found)");
  }
} catch (err) {
  console.error("List failed:", err.message);
}
