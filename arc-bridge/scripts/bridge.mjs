// Patch BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString(); };

import { BridgeKit } from "@circle-fin/bridge-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { createSolanaAdapterFromPrivateKey } from "@circle-fin/adapter-solana";
import dotenv from "dotenv";
dotenv.config();

const circleAdapter = createCircleWalletsAdapter({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const castAdapter = createViemAdapterFromPrivateKey({
  privateKey: process.env.CAST_PRIVATE_KEY,
});

const solAdapter = createSolanaAdapterFromPrivateKey({
  privateKey: process.env.SOLANA_PRIVATE_KEY,
});

const kit = new BridgeKit();

let ok = 0, fail = 0;

async function bridge(name, from, to) {
  console.log(`\n=== ${name} ===`);
  try {
    const r = await kit.bridge({ from, to, token: "USDC", amount: "1" });
    const steps = r.steps.map(s => `${s.name}:${s.state}`).join(" → ");
    console.log(`✓ ${steps}`);
    if (r.steps.find(s => s.explorerUrl)) {
      r.steps.filter(s => s.explorerUrl).forEach(s => console.log(`  ${s.name}: ${s.explorerUrl}`));
    }
    ok++;
  } catch (err) {
    console.error(`✗ ${err?.response?.data?.message || err.message}`);
    fail++;
  }
}

// --- Direction 1: Sepolia → Arc (Circle Wallets) ---
await bridge("Bridge 1: Wallet1 Sepolia → Arc (1 USDC)",
  { adapter: circleAdapter, chain: "Ethereum_Sepolia", address: process.env.WALLET1_ADDRESS },
  { adapter: circleAdapter, chain: "Arc_Testnet", address: process.env.WALLET1_ADDRESS },
);

await bridge("Bridge 2: Wallet2 Sepolia → Arc (1 USDC)",
  { adapter: circleAdapter, chain: "Ethereum_Sepolia", address: process.env.WALLET2_ADDRESS },
  { adapter: circleAdapter, chain: "Arc_Testnet", address: process.env.WALLET2_ADDRESS },
);

// --- Direction 2: Solana → Arc ---
await bridge("Bridge 3: Solana → Arc (1 USDC)",
  { adapter: solAdapter, chain: "Solana_Devnet" },
  { adapter: castAdapter, chain: "Arc_Testnet" },
);

// --- Direction 3: Arc → Sepolia ---
await bridge("Bridge 4: Arc → Sepolia (1 USDC)",
  { adapter: castAdapter, chain: "Arc_Testnet" },
  { adapter: castAdapter, chain: "Ethereum_Sepolia" },
);

// --- Direction 4: Arc → Solana ---
await bridge("Bridge 5: Arc → Solana (1 USDC)",
  { adapter: castAdapter, chain: "Arc_Testnet" },
  { adapter: solAdapter, chain: "Solana_Devnet" },
);

console.log(`\n=== Done! ${ok} succeeded, ${fail} failed ===`);
