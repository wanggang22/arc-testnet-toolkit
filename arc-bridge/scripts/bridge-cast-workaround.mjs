// Workaround for Cast wallet bridging on Windows.
// createViemAdapterFromPrivateKey fails with RPC error 156001 on Windows.
// Solution: Bridge W1(Sepolia) -> W1(Arc), then transfer W1(Arc) -> Cast(Arc).
BigInt.prototype.toJSON = function() { return this.toString(); };
import { BridgeKit } from "@circle-fin/bridge-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from "dotenv";
dotenv.config();

const kit = new BridgeKit();
const adapter = createCircleWalletsAdapter({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});
const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const w1Address = process.env.WALLET1_ADDRESS;
const castAddress = process.env.CAST_ADDRESS;

// Step 1: Bridge W1 Sepolia -> W1 Arc (1 USDC)
console.log("=== Step 1: Bridge W1(Sepolia) -> W1(Arc) 1 USDC ===");
try {
  const r = await kit.bridge({
    from: { adapter, chain: "Ethereum_Sepolia", address: w1Address },
    to: { adapter, chain: "Arc_Testnet", address: w1Address },
    token: "USDC",
    amount: "1",
  });
  console.log("State:", r.state);
  for (const s of r.steps || []) {
    console.log(`  ${s.name}: ${s.state} ${s.txHash || ""}`);
  }
} catch (e) {
  console.error("Bridge failed:", e?.response?.data || e.message);
  process.exit(1);
}

// Step 2: Find W1's Arc wallet ID and transfer to Cast
console.log("\n=== Step 2: Transfer USDC from W1 -> Cast on Arc ===");
try {
  const wallets = await client.listWallets({ blockchain: "ARC-TESTNET" });
  const w1Arc = wallets.data?.wallets?.find(
    (w) => w.address?.toLowerCase() === w1Address.toLowerCase()
  );
  if (!w1Arc) {
    console.error("W1 Arc wallet not found!");
    process.exit(1);
  }
  console.log("W1 Arc wallet ID:", w1Arc.id);
  const tx = await client.createTransaction({
    amount: ["0.5"],
    destinationAddress: castAddress,
    blockchain: "ARC-TESTNET",
    walletId: w1Arc.id,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });
  console.log("Transfer state:", tx.data?.state);
} catch (e) {
  console.error("Transfer failed:", e?.response?.data?.message || e.message);
}

console.log("\n=== Cast bridge workaround complete! ===");
