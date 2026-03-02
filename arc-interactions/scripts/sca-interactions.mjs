import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from "dotenv";
dotenv.config();

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const SCA_ID = process.env.SCA_WALLET_ID;
const SCA_ADDR = process.env.SCA_ADDRESS;
const FEE = { type: "level", config: { feeLevel: "MEDIUM" } };
const ERC20 = process.env.SCA_ERC20;
const ERC721 = process.env.SCA_ERC721;
const ERC1155 = process.env.SCA_ERC1155;
const AIRDROP = process.env.SCA_AIRDROP;
const WALLET1 = process.env.WALLET1_ADDRESS;
const WALLET2 = process.env.WALLET2_ADDRESS;

async function exec(desc, params) {
  console.log(`\n${desc}...`);
  try {
    const res = await client.createContractExecutionTransaction({
      walletId: SCA_ID,
      fee: FEE,
      ...params,
    });
    console.log(`  State: ${res.data?.state}, TxID: ${res.data?.id}`);
    await new Promise(r => setTimeout(r, 3000)); // small delay between txs
    return res.data;
  } catch (err) {
    console.error(`  Failed: ${err?.response?.data?.message || err.message}`);
  }
}

// === ERC-20 ===
await exec("ERC-20: Mint 10000 to self", {
  contractAddress: ERC20,
  abiFunctionSignature: "mintTo(address,uint256)",
  abiParameters: [SCA_ADDR, "10000000000000000000000"],
});

await exec("ERC-20: Transfer 1000 to Wallet1", {
  contractAddress: ERC20,
  abiFunctionSignature: "transfer(address,uint256)",
  abiParameters: [WALLET1, "1000000000000000000000"],
});

await exec("ERC-20: Transfer 500 to Wallet2", {
  contractAddress: ERC20,
  abiFunctionSignature: "transfer(address,uint256)",
  abiParameters: [WALLET2, "500000000000000000000"],
});

await exec("ERC-20: Approve Airdrop contract", {
  contractAddress: ERC20,
  abiFunctionSignature: "approve(address,uint256)",
  abiParameters: [AIRDROP, "5000000000000000000000"],
});

// === Airdrop ===
// Circle template Airdrop signature: airdropERC20(address,(address,uint256)[])
await exec("Airdrop: Send ERC20 to Wallet1 + Wallet2", {
  contractAddress: AIRDROP,
  abiFunctionSignature: "airdropERC20(address,(address,uint256)[])",
  abiParameters: [ERC20, [[WALLET1, "500000000000000000000"], [WALLET2, "500000000000000000000"]]],
});

// === ERC-721 ===
// Circle template ERC-721 mint signature: mintTo(address,string), second param is metadata URI
await exec("ERC-721: Mint to self", {
  contractAddress: ERC721,
  abiFunctionSignature: "mintTo(address,string)",
  abiParameters: [SCA_ADDR, "https://arc.network/nft/1"],
});

await exec("ERC-721: Mint to Wallet1", {
  contractAddress: ERC721,
  abiFunctionSignature: "mintTo(address,string)",
  abiParameters: [WALLET1, "https://arc.network/nft/2"],
});

// === ERC-1155 ===
// Circle template ERC-1155: mintTo(address,uint256,string,uint256)
// Use max uint256 as second param when minting a new token type for the first time
const MAX_UINT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
await exec("ERC-1155: Mint new token type (auto id)", {
  contractAddress: ERC1155,
  abiFunctionSignature: "mintTo(address,uint256,string,uint256)",
  abiParameters: [SCA_ADDR, MAX_UINT, "https://arc.network/token/1", "100"],
});

await exec("ERC-1155: Mint more of token id 0", {
  contractAddress: ERC1155,
  abiFunctionSignature: "mintTo(address,uint256,string,uint256)",
  abiParameters: [SCA_ADDR, "0", "https://arc.network/token/1", "50"],
});

await exec("ERC-1155: Mint to Wallet1", {
  contractAddress: ERC1155,
  abiFunctionSignature: "mintTo(address,uint256,string,uint256)",
  abiParameters: [WALLET1, "0", "https://arc.network/token/1", "25"],
});

console.log("\n=== SCA Interactions Complete ===");
