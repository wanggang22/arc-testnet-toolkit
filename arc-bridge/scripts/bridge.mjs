// Patch BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString(); };

import { BridgeKit } from "@circle-fin/bridge-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import dotenv from "dotenv";
dotenv.config();

const circleAdapter = createCircleWalletsAdapter({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const kit = new BridgeKit();

// === Bridge 1: Wallet1 (Circle 托管钱包) ===
console.log("=== Bridge: Wallet1 → Arc (1 USDC) ===");
try {
  const r1 = await kit.bridge({
    from: { adapter: circleAdapter, chain: "Ethereum_Sepolia", address: process.env.WALLET1_ADDRESS },
    to: { adapter: circleAdapter, chain: "Arc_Testnet", address: process.env.WALLET1_ADDRESS },
    token: "USDC",
    amount: "1",
  });
  console.log("Result:", JSON.stringify(r1, null, 2));
} catch (err) {
  console.error("Wallet1 bridge failed:", err?.response?.data || err.message);
}

// === Bridge 2: Wallet2 (Circle 托管钱包) ===
console.log("\n=== Bridge: Wallet2 → Arc (1 USDC) ===");
try {
  const r2 = await kit.bridge({
    from: { adapter: circleAdapter, chain: "Ethereum_Sepolia", address: process.env.WALLET2_ADDRESS },
    to: { adapter: circleAdapter, chain: "Arc_Testnet", address: process.env.WALLET2_ADDRESS },
    token: "USDC",
    amount: "1",
  });
  console.log("Result:", JSON.stringify(r2, null, 2));
} catch (err) {
  console.error("Wallet2 bridge failed:", err?.response?.data || err.message);
}

// === Bridge 3: Cast 钱包 ===
// NOTE: createViemAdapterFromPrivateKey fails on Windows (RPC error 156001).
// Workaround: bridge W1 -> W1 on Arc, then transfer W1 -> Cast on Arc.
// See bridge-cast-workaround.mjs for the full working script.
console.log("\n=== Bridge: W1(Sepolia) → W1(Arc) for Cast (1 USDC) ===");
try {
  const r3 = await kit.bridge({
    from: { adapter: circleAdapter, chain: "Ethereum_Sepolia", address: process.env.WALLET1_ADDRESS },
    to: { adapter: circleAdapter, chain: "Arc_Testnet", address: process.env.WALLET1_ADDRESS },
    token: "USDC",
    amount: "1",
  });
  console.log("Result:", JSON.stringify(r3, null, 2));
  console.log("\nNOTE: Run bridge-cast-workaround.mjs to transfer from W1 to Cast on Arc.");
} catch (err) {
  console.error("Cast bridge failed:", err?.response?.data || err.message);
}

console.log("\n=== Bridges submitted! ===");
console.log("ETH Sepolia confirmations take ~15 minutes.");
