import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const RPC = "https://rpc.testnet.arc.network";
const PK = process.env.CAST_PRIVATE_KEY;
const SELF = process.env.CAST_ADDRESS;
const W1 = process.env.WALLET1_ADDRESS;
const W2 = process.env.WALLET2_ADDRESS;
const TOKEN = process.env.ARC_TOKEN;
const NFT = process.env.ARC_NFT;
const MULTI = process.env.ARC_MULTI_TOKEN;
const AIRDROP = process.env.ARC_AIRDROP;
const HELLO = process.env.HELLO_ARCHITECT;
const EURC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

let txCount = 0;

function cast(desc, contract, sig, ...args) {
  txCount++;
  console.log(`\n[${txCount}] ${desc}`);
  const argStr = args.map(a => `"${a}"`).join(" ");
  const cmd = `export PATH="$HOME/.foundry/bin:$PATH" && cast send ${contract} "${sig}" ${argStr} --rpc-url ${RPC} --private-key ${PK}`;
  try {
    const output = execSync(cmd, { encoding: "utf-8", shell: "bash", timeout: 60000 });
    // Extract status and tx hash
    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes("status") || line.includes("transactionHash")) {
        console.log("  " + line.trim());
      }
    }
  } catch (err) {
    console.error("  FAILED:", err.stderr?.substring(0, 200) || err.message?.substring(0, 200));
  }
}

console.log("=== Cast Wallet Interactions ===");

// HelloArchitect (already done above, but let's skip - they were done)
// Let's just do the remaining ones

// ERC-20 ArcToken (5 txs)
cast("ERC-20: Transfer 10000 to Wallet1", TOKEN, "transfer(address,uint256)", W1, "10000000000000000000000");
cast("ERC-20: Transfer 10000 to Wallet2", TOKEN, "transfer(address,uint256)", W2, "10000000000000000000000");
cast("ERC-20: Approve Airdrop 100000", TOKEN, "approve(address,uint256)", AIRDROP, "100000000000000000000000");
cast("ERC-20: Approve Wallet1 50000", TOKEN, "approve(address,uint256)", W1, "50000000000000000000000");
cast("ERC-20: Mint 500000 to self", TOKEN, "mint(address,uint256)", SELF, "500000000000000000000000");

// ERC-721 ArcNFT (4 txs)
cast("ERC-721: Mint to self #1", NFT, "mint(address)", SELF);
cast("ERC-721: Mint to self #2", NFT, "mint(address)", SELF);
cast("ERC-721: Mint to Wallet1", NFT, "mint(address)", W1);
cast("ERC-721: Transfer tokenId 0 to Wallet2", NFT, "transferFrom(address,address,uint256)", SELF, W2, "0");

// ERC-1155 ArcMultiToken (4 txs)
cast("ERC-1155: Mint token 1 x100 to self", MULTI, "mint(address,uint256,uint256)", SELF, "1", "100");
cast("ERC-1155: Mint token 2 x50 to self", MULTI, "mint(address,uint256,uint256)", SELF, "2", "50");
cast("ERC-1155: Mint token 1 x25 to Wallet1", MULTI, "mint(address,uint256,uint256)", W1, "1", "25");
cast("ERC-1155: Transfer token 1 x10 to Wallet2", MULTI, "safeTransferFrom(address,address,uint256,uint256,bytes)", SELF, W2, "1", "10", "0x");

// Airdrop (1 tx)
cast("Airdrop: ERC20 to Wallet1+Wallet2", AIRDROP, "airdropERC20(address,address[],uint256[])", TOKEN, `[${W1},${W2}]`, "[1000000000000000000000,1000000000000000000000]");

// EURC (2 txs)
cast("EURC: Transfer 0.1 to Wallet1", EURC, "transfer(address,uint256)", W1, "100000");
cast("EURC: Transfer 0.1 to Wallet2", EURC, "transfer(address,uint256)", W2, "100000");

console.log(`\n=== Done! Total transactions: ${txCount} ===`);
