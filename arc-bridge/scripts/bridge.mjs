import { BridgeKit } from "@circle-fin/bridge-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import dotenv from "dotenv";
dotenv.config();

const circleAdapter = createCircleWalletsAdapter({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const kit = new BridgeKit();

// === Bridge 1: Wallet1 (Circle managed wallet) ===
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

// === Bridge 2: Wallet2 (Circle managed wallet) ===
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

// === Bridge 3: Cast wallet (has private key) ===
console.log("\n=== Bridge: Cast Wallet → Arc (1 USDC) ===");
const castAdapter = createViemAdapterFromPrivateKey({
  privateKey: process.env.CAST_PRIVATE_KEY,
});
try {
  const r3 = await kit.bridge({
    from: { adapter: castAdapter, chain: "Ethereum_Sepolia" },
    to: { adapter: circleAdapter, chain: "Arc_Testnet", address: process.env.CAST_ADDRESS },
    token: "USDC",
    amount: "1",
  });
  console.log("Result:", JSON.stringify(r3, null, 2));
} catch (err) {
  console.error("Cast bridge failed:", err?.response?.data || err.message);
}

console.log("\n=== Bridges submitted! ===");
console.log("ETH Sepolia confirmations take ~15 minutes.");
console.log("Use 'cast balance <address> --rpc-url https://rpc.testnet.arc.network' to verify.");
