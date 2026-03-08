/**
 * Nanopayments Buyer — Deposit + Pay x402 APIs + Withdraw
 * 自动完成完整的 Nanopayments 流程
 */
import "dotenv/config";
import { GatewayClient } from "@circle-fin/x402-batching/client";

BigInt.prototype.toJSON = function() { return this.toString(); };

const PRIVATE_KEY = process.env.CAST_PRIVATE_KEY;
const CAST_ADDRESS = process.env.CAST_ADDRESS;

if (!PRIVATE_KEY || !CAST_ADDRESS) {
  console.error("ERROR: CAST_PRIVATE_KEY and CAST_ADDRESS required in .env");
  process.exit(1);
}

const SELLER_BASE = "http://localhost:4402";
const ENDPOINTS = [
  { path: "/api/joke", price: "$0.0001", desc: "Joke" },
  { path: "/api/weather", price: "$0.001", desc: "Weather" },
  { path: "/api/premium", price: "$0.01", desc: "Premium" },
];

async function main() {
  console.log("\n========================================");
  console.log("  Nanopayments Buyer — Full Flow");
  console.log("========================================\n");

  // --- 初始化 GatewayClient ---
  console.log("[1/6] Initializing GatewayClient on Arc Testnet...");
  const client = new GatewayClient({
    chain: "arcTestnet",
    privateKey: PRIVATE_KEY,
  });
  console.log(`  Buyer address: ${CAST_ADDRESS}\n`);

  // --- 检查余额 ---
  console.log("[2/6] Checking balances...");
  let balances = await client.getBalances();
  console.log(`  Wallet balance:  ${balances.wallet ?? "N/A"}`);
  console.log(`  Gateway balance: ${balances.gateway ?? "N/A"}\n`);

  // --- Deposit ---
  console.log("[3/6] Depositing 1 USDC to Gateway...");
  try {
    const depositResult = await client.deposit("1");
    console.log(`  Approve tx: ${depositResult.approveTxHash ?? "skipped"}`);
    console.log(`  Deposit tx: ${depositResult.depositTxHash ?? "done"}`);
  } catch (err) {
    if (err.message?.includes("already")) {
      console.log("  Already deposited, skipping.");
    } else {
      console.log(`  Deposit note: ${err.message}`);
    }
  }

  // 重新检查余额
  balances = await client.getBalances();
  console.log(`  Gateway balance after deposit: ${balances.gateway ?? "N/A"}\n`);

  // --- 检查 x402 支持 ---
  console.log("[4/6] Checking x402 batching support...");
  for (const ep of ENDPOINTS) {
    const url = `${SELLER_BASE}${ep.path}`;
    try {
      const support = await client.supports(url);
      console.log(`  ${ep.path}: ${support ? "SUPPORTED" : "not supported"}`);
    } catch {
      console.log(`  ${ep.path}: check failed (server may not be running)`);
    }
  }
  console.log();

  // --- 逐个付款 ---
  console.log("[5/6] Making payments to x402 endpoints...\n");
  let payCount = 0;

  for (const ep of ENDPOINTS) {
    const url = `${SELLER_BASE}${ep.path}`;
    console.log(`  --- ${ep.desc} (${ep.price}) ---`);
    console.log(`  URL: ${url}`);

    try {
      const result = await client.pay(url);
      console.log(`  Status: ${result.status ?? "OK"}`);
      console.log(`  Response: ${JSON.stringify(result.data)}`);
      payCount++;
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
    console.log();
  }

  console.log(`  Payments completed: ${payCount}/${ENDPOINTS.length}\n`);

  // --- 查询最终余额 ---
  balances = await client.getBalances();
  console.log("[6/6] Final balances:");
  console.log(`  Wallet balance:  ${balances.wallet ?? "N/A"}`);
  console.log(`  Gateway balance: ${balances.gateway ?? "N/A"}`);

  // --- Withdraw ---
  if (balances.gateway && parseFloat(balances.gateway) > 0) {
    console.log(`\n  Withdrawing remaining Gateway balance...`);
    try {
      const withdrawResult = await client.withdraw(balances.gateway);
      console.log(`  Withdraw tx: ${withdrawResult.withdrawTxHash ?? "done"}`);
    } catch (err) {
      console.log(`  Withdraw note: ${err.message}`);
    }
  }

  // 最终余额
  const finalBalances = await client.getBalances();
  console.log(`\n  Final wallet balance:  ${finalBalances.wallet ?? "N/A"}`);
  console.log(`  Final gateway balance: ${finalBalances.gateway ?? "N/A"}`);

  console.log("\n========================================");
  console.log("  Nanopayments flow complete!");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
