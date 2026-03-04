import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { execSync } from "child_process";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.CAST_PRIVATE_KEY;
const ADDRESS = process.env.CAST_ADDRESS;

const GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
const GATEWAY_MINTER = "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";
const SOURCE_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const DEST_USDC = "0x3600000000000000000000000000000000000000";
const TRANSFER_AMOUNT = "3000000"; // 3 USDC (6 decimals)，扣除 ~2 USDC fee 后到账约 1 USDC

function padAddress(addr) {
  return "0x" + addr.replace("0x", "").toLowerCase().padStart(64, "0");
}

async function checkBalance() {
  const res = await fetch("https://gateway-api-testnet.circle.com/v1/balances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "USDC", sources: [{ domain: 0, depositor: ADDRESS }] }),
  });
  const data = await res.json();
  return parseFloat(data.balances?.[0]?.balance || "0");
}

// ============================================================
// PHASE 1: Poll balance until deposit is confirmed
// ============================================================
console.log("=== Phase 1: Waiting for Gateway balance ===");
console.log(`Depositor: ${ADDRESS}`);
console.log("Polling every 60 seconds...\n");

let balance = await checkBalance();
let attempt = 0;
while (balance < 3) {
  attempt++;
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] Attempt ${attempt}: balance = ${balance} USDC (need >= 3). Waiting 60s...`);
  await new Promise(r => setTimeout(r, 60000));
  balance = await checkBalance();
}
console.log(`\nBalance confirmed: ${balance} USDC\n`);

// ============================================================
// PHASE 2: Sign EIP-712 BurnIntent
// ============================================================
console.log("=== Phase 2: Signing EIP-712 BurnIntent ===");

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain: sepolia, transport: http() });
const salt = "0x" + crypto.randomBytes(32).toString("hex");

// Build spec — 注意：签名用 BigInt，API 用 string，分开构建避免混淆
const specForSign = {
  version: 1,
  sourceDomain: 0,
  destinationDomain: 26,
  sourceContract: padAddress(GATEWAY_WALLET),
  destinationContract: padAddress(GATEWAY_MINTER),
  sourceToken: padAddress(SOURCE_USDC),
  destinationToken: padAddress(DEST_USDC),
  sourceDepositor: padAddress(ADDRESS),
  destinationRecipient: padAddress(ADDRESS),
  sourceSigner: padAddress(ADDRESS),
  destinationCaller: "0x" + "0".repeat(64),
  value: BigInt(TRANSFER_AMOUNT),
  salt,
  hookData: "0x",
};

const types = {
  TransferSpec: [
    { name: "version", type: "uint32" },
    { name: "sourceDomain", type: "uint32" },
    { name: "destinationDomain", type: "uint32" },
    { name: "sourceContract", type: "bytes32" },
    { name: "destinationContract", type: "bytes32" },
    { name: "sourceToken", type: "bytes32" },
    { name: "destinationToken", type: "bytes32" },
    { name: "sourceDepositor", type: "bytes32" },
    { name: "destinationRecipient", type: "bytes32" },
    { name: "sourceSigner", type: "bytes32" },
    { name: "destinationCaller", type: "bytes32" },
    { name: "value", type: "uint256" },
    { name: "salt", type: "bytes32" },
    { name: "hookData", type: "bytes" },
  ],
  BurnIntent: [
    { name: "maxBlockHeight", type: "uint256" },
    { name: "maxFee", type: "uint256" },
    { name: "spec", type: "TransferSpec" },
  ],
};

const signature = await walletClient.signTypedData({
  domain: { name: "GatewayWallet", version: "1" },
  types,
  primaryType: "BurnIntent",
  message: { maxBlockHeight: 999999999n, maxFee: 3000000n, spec: specForSign },
});
console.log("Signature:", signature.substring(0, 30) + "...");

// ============================================================
// PHASE 3: Submit to Gateway API
// ============================================================
console.log("\n=== Phase 3: Submitting to Gateway API ===");

// API 版本：所有数值用 string，不能有 BigInt
const specForApi = {
  version: 1,
  sourceDomain: 0,
  destinationDomain: 26,
  sourceContract: padAddress(GATEWAY_WALLET),
  destinationContract: padAddress(GATEWAY_MINTER),
  sourceToken: padAddress(SOURCE_USDC),
  destinationToken: padAddress(DEST_USDC),
  sourceDepositor: padAddress(ADDRESS),
  destinationRecipient: padAddress(ADDRESS),
  sourceSigner: padAddress(ADDRESS),
  destinationCaller: "0x" + "0".repeat(64),
  value: TRANSFER_AMOUNT,
  salt,
  hookData: "0x",
};

const transferRes = await fetch("https://gateway-api-testnet.circle.com/v1/transfer", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([{
    burnIntent: { maxBlockHeight: "999999999", maxFee: "3000000", spec: specForApi },
    signature,
  }]),
});

const statusCode = transferRes.status;
const transferData = await transferRes.json();
console.log("HTTP Status:", statusCode);

if (statusCode !== 200 && statusCode !== 201) {
  console.error("Gateway API error:", JSON.stringify(transferData, null, 2));
  process.exit(1);
}

// ⚠️ 关键：API 返回字段叫 "signature"，不是 "operatorSig"
const attestation = transferData.attestation;
const operatorSig = transferData.signature;

if (!attestation || !operatorSig) {
  console.error("Missing attestation or signature in response:");
  console.error(JSON.stringify(transferData, null, 2));
  process.exit(1);
}

console.log("Transfer ID:", transferData.transferId);
console.log("Fee:", transferData.fees?.total, "USDC");
console.log("Attestation:", attestation.substring(0, 40) + "...");
console.log("OperatorSig:", operatorSig.substring(0, 40) + "...");

// ============================================================
// PHASE 4: gatewayMint on Arc Testnet
// ============================================================
console.log("\n=== Phase 4: gatewayMint on Arc Testnet ===");

const RPC = "https://rpc.testnet.arc.network";
const cmd = `export PATH="$HOME/.foundry/bin:$PATH" && cast send ${GATEWAY_MINTER} "gatewayMint(bytes,bytes)" "${attestation}" "${operatorSig}" --rpc-url ${RPC} --private-key ${PRIVATE_KEY}`;

try {
  const output = execSync(cmd, { encoding: "utf-8", shell: "bash", timeout: 120000 });
  console.log(output);

  // Extract status from output
  if (output.includes("status") && output.includes("1")) {
    console.log("\n=== SUCCESS! USDC minted on Arc Testnet ===");
  }
} catch (err) {
  console.error("Mint failed:", err.stderr || err.message);
  console.error("\nSaving attestation data for manual retry...");
  const fs = await import("fs");
  fs.writeFileSync("mint-data.json", JSON.stringify({ attestation, operatorSig }, null, 2));
  console.error("Saved to mint-data.json. Retry with:");
  console.error(`cast send ${GATEWAY_MINTER} "gatewayMint(bytes,bytes)" "<attestation>" "<operatorSig>" --rpc-url ${RPC} --private-key $PK`);
  process.exit(1);
}

// ============================================================
// Verify final balance
// ============================================================
console.log("\n=== Verifying Arc balance ===");
try {
  const arcBal = execSync(
    `export PATH="$HOME/.foundry/bin:$PATH" && cast balance ${ADDRESS} --rpc-url ${RPC}`,
    { encoding: "utf-8", shell: "bash" }
  ).trim();
  const arcUsdc = (Number(arcBal) / 1e18).toFixed(6);
  console.log(`Arc USDC balance: ${arcUsdc} USDC`);
} catch {
  console.log("Could not check Arc balance (non-critical).");
}

// Check remaining Gateway balance
const remaining = await checkBalance();
console.log(`Remaining Gateway balance: ${remaining} USDC`);

console.log("\n=== Gateway flow complete! ===");
