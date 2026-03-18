// ERC-8004 AI Agent Registration on Arc Testnet
// 全流程：创建钱包 → 注册身份 → 记录信誉 → 请求验证 → 验证响应

import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createPublicClient, http, parseAbiItem, getContract, keccak256, toHex } from "viem";
import { config } from "dotenv";

config();

// ── 配置 ──────────────────────────────────────────
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;

if (!CIRCLE_API_KEY || !CIRCLE_ENTITY_SECRET) {
  console.error("❌ 缺少 CIRCLE_API_KEY 或 CIRCLE_ENTITY_SECRET，请检查 .env");
  process.exit(1);
}

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

const METADATA_URI =
  process.env.METADATA_URI ||
  "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

const RPC_URL = "https://rpc.testnet.arc.network/";

// ── Circle Client ──────────────────────────────────
const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: CIRCLE_API_KEY,
  entitySecret: CIRCLE_ENTITY_SECRET,
});

// ── 工具函数 ────────────────────────────────────────
async function waitForTx(txId, label = "TX") {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { data } = await circleClient.getTransaction({ id: txId });
    const state = data?.transaction?.state;
    if (state === "COMPLETE") {
      const txHash = data.transaction.txHash;
      console.log(`  ✅ ${label}: https://testnet.arcscan.app/tx/${txHash}`);
      return txHash;
    }
    if (state === "FAILED") {
      console.error(`  ❌ ${label} 失败:`, JSON.stringify(data?.transaction, null, 2));
      throw new Error(`${label} failed`);
    }
    if (i % 5 === 0) process.stdout.write(".");
  }
  throw new Error(`${label} timeout`);
}

async function sendContractTx(walletAddress, contractAddress, abiSig, abiParams, label) {
  console.log(`\n⏳ ${label}...`);
  const tx = await circleClient.createContractExecutionTransaction({
    walletAddress,
    blockchain: "ARC-TESTNET",
    contractAddress,
    abiFunctionSignature: abiSig,
    abiParameters: abiParams,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });
  return waitForTx(tx.data?.id, label);
}

// ── Step 1: 创建钱包 ────────────────────────────────
console.log("═══════════════════════════════════════════════");
console.log("  ERC-8004 AI Agent Registration on Arc Testnet");
console.log("═══════════════════════════════════════════════\n");

console.log("📦 Step 1: 创建 Developer-Controlled 钱包...");

const walletSet = await circleClient.createWalletSet({
  name: `ERC8004-Agent-${Date.now()}`,
});
const walletSetId = walletSet.data?.walletSet?.id;

const walletsResponse = await circleClient.createWallets({
  blockchains: ["ARC-TESTNET"],
  count: 2,
  walletSetId: walletSetId ?? "",
  accountType: "SCA",
});

const ownerWallet = walletsResponse.data?.wallets?.[0];
const validatorWallet = walletsResponse.data?.wallets?.[1];

console.log(`  Owner:     ${ownerWallet.address} (id: ${ownerWallet.id})`);
console.log(`  Validator: ${validatorWallet.address} (id: ${validatorWallet.id})`);

// ── Step 2: 注册 Agent 身份 ──────────────────────────
const registerHash = await sendContractTx(
  ownerWallet.address,
  IDENTITY_REGISTRY,
  "register(string)",
  [METADATA_URI],
  "Step 2: 注册 Agent 身份 (IdentityRegistry.register)"
);

// ── Step 3: 查询 Agent ID ────────────────────────────
console.log("\n🔍 Step 3: 查询 Agent ID...");

const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

const latestBlock = await publicClient.getBlockNumber();
const fromBlock = latestBlock > 10000n ? latestBlock - 10000n : 0n;

const transferLogs = await publicClient.getLogs({
  address: IDENTITY_REGISTRY,
  event: parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ),
  args: { to: ownerWallet.address },
  fromBlock,
  toBlock: latestBlock,
});

if (transferLogs.length === 0) {
  throw new Error("未找到 Transfer 事件，注册可能失败");
}

const agentId = transferLogs[transferLogs.length - 1].args.tokenId.toString();

const identityContract = getContract({
  address: IDENTITY_REGISTRY,
  abi: [
    {
      name: "ownerOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [{ name: "", type: "address" }],
    },
    {
      name: "tokenURI",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [{ name: "", type: "string" }],
    },
  ],
  client: publicClient,
});

const owner = await identityContract.read.ownerOf([BigInt(agentId)]);
const tokenURI = await identityContract.read.tokenURI([BigInt(agentId)]);

console.log(`  Agent ID:  ${agentId}`);
console.log(`  Owner:     ${owner}`);
console.log(`  Metadata:  ${tokenURI}`);

// ── Step 4: 记录信誉 ────────────────────────────────
const tag = "successful_trade";
const feedbackHash = keccak256(toHex(tag));

await sendContractTx(
  validatorWallet.address,
  REPUTATION_REGISTRY,
  "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
  [agentId, "95", "0", tag, "", "", "", feedbackHash],
  "Step 4: 记录信誉 (ReputationRegistry.giveFeedback)"
);

// ── Step 5: 请求验证 ────────────────────────────────
const requestURI = "ipfs://bafkreiexamplevalidationrequest";
const requestHash = keccak256(toHex(`kyc_verification_request_agent_${agentId}`));

await sendContractTx(
  ownerWallet.address,
  VALIDATION_REGISTRY,
  "validationRequest(address,uint256,string,bytes32)",
  [validatorWallet.address, agentId, requestURI, requestHash],
  "Step 5: 请求验证 (ValidationRegistry.validationRequest)"
);

// ── Step 6: 验证响应 ────────────────────────────────
await sendContractTx(
  validatorWallet.address,
  VALIDATION_REGISTRY,
  "validationResponse(bytes32,uint8,string,bytes32,string)",
  [requestHash, "100", "", "0x" + "0".repeat(64), "kyc_verified"],
  "Step 6: 验证响应 (ValidationRegistry.validationResponse)"
);

// ── Step 7: 验证状态查询 ──────────────────────────────
console.log("\n🔍 Step 7: 验证状态查询...");

const validationContract = getContract({
  address: VALIDATION_REGISTRY,
  abi: [
    {
      name: "getValidationStatus",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "requestHash", type: "bytes32" }],
      outputs: [
        { name: "validatorAddress", type: "address" },
        { name: "agentId", type: "uint256" },
        { name: "response", type: "uint8" },
        { name: "responseHash", type: "bytes32" },
        { name: "tag", type: "string" },
        { name: "lastUpdate", type: "uint256" },
      ],
    },
  ],
  client: publicClient,
});

const [valAddr, , valResponse, , valTag] =
  await validationContract.read.getValidationStatus([requestHash]);

console.log(`  Validator: ${valAddr}`);
console.log(`  Response:  ${valResponse} (100 = passed)`);
console.log(`  Tag:       ${valTag}`);

// ── 完成 ─────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════");
console.log("  ✅ ERC-8004 AI Agent 注册全流程完成！");
console.log("═══════════════════════════════════════════════");
console.log(`  Agent ID:       ${agentId}`);
console.log(`  Owner Wallet:   ${ownerWallet.address}`);
console.log(`  Validator:      ${validatorWallet.address}`);
console.log(`  Reputation:     95 (${tag})`);
console.log(`  Validation:     ${valResponse === 100 ? "PASSED ✅" : "FAILED ❌"}`);
console.log(`  Register TX:    https://testnet.arcscan.app/tx/${registerHash}`);
console.log("═══════════════════════════════════════════════\n");
