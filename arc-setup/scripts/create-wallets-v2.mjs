import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

// Use existing wallet set from test
const walletSetId = "c7b39eed-59bc-5767-9a9e-a9aadad74595";
console.log("Using Wallet Set ID:", walletSetId);

// 2. Create 2 EOA wallets on ARC-TESTNET + ETH-SEPOLIA
console.log("\n=== Creating 2 EOA Wallets (ARC + Sepolia) ===");
const eoaRes = await client.createWallets({
  walletSetId,
  blockchains: ["ARC-TESTNET", "ETH-SEPOLIA"],
  count: 2,
  accountType: "EOA",
});

const walletsByAddr = {};
for (const w of eoaRes.data.wallets) {
  if (!walletsByAddr[w.address]) walletsByAddr[w.address] = {};
  walletsByAddr[w.address][w.blockchain] = w.id;
}

const addresses = Object.keys(walletsByAddr);
console.log("Wallet1:", addresses[0]);
console.log("  ARC-TESTNET ID:", walletsByAddr[addresses[0]]["ARC-TESTNET"]);
console.log("  ETH-SEPOLIA ID:", walletsByAddr[addresses[0]]["ETH-SEPOLIA"]);
console.log("Wallet2:", addresses[1]);
console.log("  ARC-TESTNET ID:", walletsByAddr[addresses[1]]["ARC-TESTNET"]);
console.log("  ETH-SEPOLIA ID:", walletsByAddr[addresses[1]]["ETH-SEPOLIA"]);

// 3. Create 1 SCA wallet on ARC-TESTNET
console.log("\n=== Creating SCA Wallet ===");
const scaRes = await client.createWallets({
  walletSetId,
  blockchains: ["ARC-TESTNET"],
  count: 1,
  accountType: "SCA",
});
const scaWallet = scaRes.data.wallets[0];
console.log("SCA Wallet:", scaWallet.address);
console.log("  ARC-TESTNET ID:", scaWallet.id);

// 4. Append to .env
const envAppend = `
WALLET_SET_ID=${walletSetId}
WALLET1_ADDRESS=${addresses[0]}
WALLET1_ARC_ID=${walletsByAddr[addresses[0]]["ARC-TESTNET"]}
WALLET1_SEPOLIA_ID=${walletsByAddr[addresses[0]]["ETH-SEPOLIA"]}
WALLET2_ADDRESS=${addresses[1]}
WALLET2_ARC_ID=${walletsByAddr[addresses[1]]["ARC-TESTNET"]}
WALLET2_SEPOLIA_ID=${walletsByAddr[addresses[1]]["ETH-SEPOLIA"]}
SCA_WALLET_ID=${scaWallet.id}
SCA_ADDRESS=${scaWallet.address}
`;
fs.appendFileSync(".env", envAppend);
console.log("\n=== Wallet IDs appended to .env ===");
