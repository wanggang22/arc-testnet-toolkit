// Workaround for Cast wallet bridging on Windows.
// createViemAdapterFromPrivateKey fails with RPC error 156001 on Windows.
// Solution:
//   1. Cast transfers USDC to W1 on Sepolia (Cast has private key, uses cast/viem)
//   2. W1 bridges to itself on Arc (Circle adapter works fine)
//   3. W1 transfers USDC to Cast on Arc (Circle SDK)
BigInt.prototype.toJSON = function() { return this.toString(); };
import { BridgeKit } from "@circle-fin/bridge-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";
dotenv.config();

const BRIDGE_AMOUNT = "1"; // USDC to bridge
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const w1Address = process.env.WALLET1_ADDRESS;
const castAddress = process.env.CAST_ADDRESS;

const kit = new BridgeKit();
const circleAdapter = createCircleWalletsAdapter({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});
const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

// Step 1: Cast transfers USDC to W1 on Sepolia
console.log("=== Step 1: Cast -> W1 on Sepolia (transfer USDC) ===");
const account = privateKeyToAccount(process.env.CAST_PRIVATE_KEY);
const transport = http("https://ethereum-sepolia-rpc.publicnode.com");
const walletClient = createWalletClient({ account, chain: sepolia, transport });
const publicClient = createPublicClient({ chain: sepolia, transport });
const erc20Abi = parseAbi(["function transfer(address,uint256) returns (bool)"]);

try {
  const amount = BigInt(BRIDGE_AMOUNT) * 1000000n; // 6 decimals on Sepolia
  const hash = await walletClient.writeContract({
    address: USDC_SEPOLIA,
    abi: erc20Abi,
    functionName: "transfer",
    args: [w1Address, amount],
  });
  console.log("Tx:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("Confirmed. Waiting 10s for Circle to pick up...");
  await new Promise((r) => setTimeout(r, 10000));
} catch (e) {
  console.error("Transfer failed:", e.message);
  process.exit(1);
}

// Step 2: Bridge W1 Sepolia -> W1 Arc
console.log("\n=== Step 2: Bridge W1(Sepolia) -> W1(Arc) ===");
try {
  const r = await kit.bridge({
    from: { adapter: circleAdapter, chain: "Ethereum_Sepolia", address: w1Address },
    to: { adapter: circleAdapter, chain: "Arc_Testnet", address: w1Address },
    token: "USDC",
    amount: BRIDGE_AMOUNT,
  });
  console.log("State:", r.state);
  for (const s of r.steps || []) {
    console.log(`  ${s.name}: ${s.state} ${s.txHash || ""}`);
  }
} catch (e) {
  console.error("Bridge failed:", e?.response?.data || e.message);
  process.exit(1);
}

// Step 3: W1 transfers USDC to Cast on Arc
console.log("\n=== Step 3: W1 -> Cast on Arc (transfer USDC) ===");
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
    amount: [BRIDGE_AMOUNT],
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
