import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.CAST_PRIVATE_KEY;
const ADDRESS = process.env.CAST_ADDRESS;
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const GATEWAY = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
const DEPOSIT_AMOUNT = 6000000n; // 6 USDC (6 decimals)

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: sepolia, transport: http() });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http() });

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
]);
const gatewayAbi = parseAbi(["function deposit(address,uint256)"]);

// === Pre-flight checks ===
console.log("=== Pre-flight Checks ===\n");

// Check ETH gas
const ethBal = await publicClient.getBalance({ address: ADDRESS });
const ethAmount = Number(ethBal) / 1e18;
console.log(`ETH balance: ${ethAmount.toFixed(6)} ETH`);
if (ethBal < 1000000000000000n) { // < 0.001 ETH
  console.error("ABORT: Not enough ETH for gas. Need at least 0.001 ETH.");
  console.error("Get from: https://faucets.chain.link/sepolia");
  process.exit(1);
}

// Check USDC balance
const usdcBal = await publicClient.readContract({
  address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [ADDRESS],
});
const usdcAmount = Number(usdcBal) / 1e6;
console.log(`USDC balance: ${usdcAmount} USDC`);
if (usdcBal < DEPOSIT_AMOUNT) {
  console.error(`ABORT: Not enough USDC. Have ${usdcAmount}, need ${Number(DEPOSIT_AMOUNT) / 1e6}.`);
  console.error("Get from: https://faucet.circle.com (Ethereum Sepolia)");
  process.exit(1);
}

// Check existing Gateway balance (maybe already deposited)
const gwRes = await fetch("https://gateway-api-testnet.circle.com/v1/balances", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: "USDC", sources: [{ domain: 0, depositor: ADDRESS }] }),
});
const gwData = await gwRes.json();
const gwBalance = parseFloat(gwData.balances?.[0]?.balance || "0");
if (gwBalance >= 5) {
  console.log(`\nGateway already has ${gwBalance} USDC. You can skip deposit and run gateway-complete.mjs directly.`);
  process.exit(0);
}

console.log("\nAll checks passed! Proceeding with deposit...\n");

// === Approve ===
console.log("=== Step 1/2: Approve ===");
const approveTx = await walletClient.writeContract({
  address: USDC, abi: erc20Abi, functionName: "approve",
  args: [GATEWAY, DEPOSIT_AMOUNT],
});
console.log("Approve tx:", approveTx);
await publicClient.waitForTransactionReceipt({ hash: approveTx });
console.log("Approve confirmed.");

// === Deposit ===
console.log("\n=== Step 2/2: Deposit ===");
const depositTx = await walletClient.writeContract({
  address: GATEWAY, abi: gatewayAbi, functionName: "deposit",
  args: [USDC, DEPOSIT_AMOUNT],
});
console.log("Deposit tx:", depositTx);
await publicClient.waitForTransactionReceipt({ hash: depositTx });
console.log("Deposit confirmed on Sepolia.");

console.log("\n=== Deposit done! ===");
console.log("Now wait ~15 minutes for Sepolia finality.");
console.log("Then run: node gateway-complete.mjs");
console.log("(gateway-complete.mjs will auto-poll until balance appears)");
