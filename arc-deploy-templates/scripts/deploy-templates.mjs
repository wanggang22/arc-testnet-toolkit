import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
dotenv.config();

const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
const apiKey = process.env.CIRCLE_API_KEY;
const SCA_WALLET_ID = process.env.SCA_WALLET_ID;
const SCA_ADDRESS = process.env.SCA_ADDRESS;

// Get public key for encrypting entity secret
const pkRes = await fetch('https://api.circle.com/v1/w3s/config/entity/publicKey', {
  headers: { 'Authorization': 'Bearer ' + apiKey }
});
const pkData = await pkRes.json();

function encryptEntitySecret() {
  const encrypted = crypto.publicEncrypt(
    { key: pkData.data.publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(entitySecret, 'hex')
  );
  return encrypted.toString('base64');
}

const templates = [
  // Airdrop already deployed: 0x133343737d3f947247dcb3079cb03601ed5504e7
  {
    envKey: "SCA_ERC20",
    name: "ERC20Token",
    templateId: "a1b74add-23e0-4712-88d1-6b3009e85a86",
    params: { name: "ArcCoin", symbol: "ACN", initialSupply: 1000000, primarySaleRecipient: SCA_ADDRESS, defaultAdmin: SCA_ADDRESS },
  },
  {
    envKey: "SCA_ERC721",
    name: "ERC721NFT",
    templateId: "76b83278-50e2-4006-8b63-5b1a2a814533",
    params: { name: "ArcItems", symbol: "AITM", royaltyPercent: 5, primarySaleRecipient: SCA_ADDRESS, royaltyRecipient: SCA_ADDRESS, defaultAdmin: SCA_ADDRESS },
  },
  {
    envKey: "SCA_ERC1155",
    name: "ERC1155Multi",
    templateId: "aea21da6-0aa2-4971-9a1a-5098842b1248",
    params: { name: "ArcMulti", symbol: "AMLT", royaltyPercent: 5, royaltyRecipient: SCA_ADDRESS, primarySaleRecipient: SCA_ADDRESS, defaultAdmin: SCA_ADDRESS },
  },
];

console.log("=== Deploying Circle Template Contracts ===\n");
const deployed = [];

for (const t of templates) {
  console.log(`Deploying ${t.name}...`);
  const ciphertext = encryptEntitySecret();
  const idempotencyKey = crypto.randomUUID();

  const res = await fetch(`https://api.circle.com/v1/w3s/templates/${t.templateId}/deploy`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entitySecretCipherText: ciphertext,
      idempotencyKey,
      name: t.name,
      blockchain: 'ARC-TESTNET',
      walletId: SCA_WALLET_ID,
      templateParameters: t.params,
      feeLevel: 'MEDIUM',
    }),
  });
  const data = await res.json();

  if (res.status === 200 || res.status === 201) {
    const contractId = data.contractIds?.[0] || data.data?.contractIds?.[0];
    const txId = data.transactionId || data.data?.transactionId;
    console.log(`  contractId: ${contractId}`);
    console.log(`  transactionId: ${txId}`);
    deployed.push({ ...t, contractId, txId });
  } else {
    console.error(`  Failed (${res.status}):`, JSON.stringify(data, null, 2));
  }
}

console.log("\nWaiting 30s for deployment confirmation...");
await new Promise(r => setTimeout(r, 30000));

console.log("\n=== Checking Deployment Status ===\n");
let envAppend = "\n";

for (const d of deployed) {
  if (!d.contractId) continue;
  const res = await fetch(`https://api.circle.com/v1/w3s/contracts/${d.contractId}`, {
    headers: { 'Authorization': 'Bearer ' + apiKey },
  });
  const data = await res.json();
  const c = data.data?.contract;
  if (c) {
    console.log(`${d.name}:`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Address: ${c.contractAddress || "pending..."}`);
    if (c.contractAddress) {
      envAppend += `${d.envKey}=${c.contractAddress}\n`;
    }
  } else {
    console.log(`${d.name}: response:`, JSON.stringify(data));
  }
}

if (envAppend.trim()) {
  fs.appendFileSync(".env", envAppend);
  console.log("\nContract addresses appended to .env");
}
