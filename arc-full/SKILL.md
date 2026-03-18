---
name: arc-full
description: Arc Testnet full workflow — orchestrates all arc-* skills
disable-model-invocation: true
---

# Arc Testnet Full Workflow

Execute all Arc Testnet tutorial operations in order, maximizing on-chain interaction records.
Each phase corresponds to an independent skill and can be called separately.

## Windows Notes
- Use Git Bash, Unix syntax
- Foundry PATH: `export PATH="$HOME/.foundry/bin:$PATH"`
- No grep/sed/tail/cut in bash — write all logic in .mjs scripts
- Node.js scripts use .mjs extension + `"type": "module"` in package.json

## Execution Order

### Phase 1: Environment Setup (`/arc-setup`)
1. Install Foundry (forge, cast)
2. Create cast wallet (keep private key for airdrops)
3. **Manual**: Register on Circle Developer Console + create API Key (Standard, not Client)
4. Generate Entity Secret → **script auto-registers via API**
5. Create Circle wallets (2 EOA on ARC+Sepolia + 1 SCA on ARC)
6. Create Solana wallet (for cross-chain bridging)
7. **Manual**: Claim test tokens
   - https://faucet.circle.com → Cast wallet: USDC + EURC (Arc Testnet + Solana Devnet)
   - https://faucet.circle.com → Wallet1, Wallet2: USDC (Ethereum Sepolia + Arc Testnet)
   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia → ETH gas
   - https://faucet.solana.com/ → SOL gas for Solana wallet

### Phase 2: Contract Deployment (`/arc-deploy-foundry` + `/arc-deploy-templates`)
8. Foundry deploy 5 contracts to cast wallet:
   - HelloArchitect, ArcToken (ERC-20), ArcNFT (ERC-721), ArcMultiToken (ERC-1155), ArcAirdrop
9. Circle template deploy 4 contracts to SCA wallet:
   - Airdrop, ERC-20, ERC-721, ERC-1155

### Phase 3: Contract Interactions (`/arc-interactions`)
10. Cast wallet: ~18 interactions
    - HelloArchitect: setGreeting x2
    - ERC-20: transfer x2, approve x2, mint x1
    - ERC-721: mint x3, transferFrom x1
    - ERC-1155: mint x3, safeTransferFrom x1
    - Airdrop: airdropERC20 x1
    - EURC: transfer x2
11. SCA wallet: ~10 interactions
    - ERC-20: mintTo, transfer x2, approve
    - Airdrop: airdropERC20
    - ERC-721: mintTo x2
    - ERC-1155: mintTo x3

### Phase 4: Cross-chain (`/arc-bridge` + `/arc-gateway`)
12. Bridge Kit — **4 directions, 5 bridges**:
    - Bridge 1-2: Sepolia → Arc (W1 + W2, Circle Wallets adapter)
    - Bridge 3: Solana → Arc (Solana adapter → Viem Cast EOA)
    - Bridge 4: Arc → Sepolia (Viem Cast EOA both sides)
    - Bridge 5: Arc → Solana (Viem → Solana adapter)
    - Requires `@circle-fin/adapter-solana` package
    - .env needs `SOLANA_ADDRESS` + `SOLANA_PRIVATE_KEY`
    - Solana directions need SOL gas (even Arc→Solana, mint executes on Solana)
13. Gateway (two scripts):
    - `gateway-deposit.mjs`: Check Sepolia USDC + ETH → Approve → Deposit
    - `gateway-complete.mjs`: Poll balance → EIP-712 signature → API → gatewayMint → verify

### Phase 5: XyloNet DeFi (`/arc-xylonet`)
14. XyloNet platform DeFi operations, ~16 on-chain transactions
    - PayX tips ×3, DEX Swap ×2, Vault deposit, CCTP Bridge, Add liquidity

### Phase 6: Nanopayments (`/arc-nanopay`)
15. Seller server + Buyer flow
    - `nanopay-seller.mjs`: Express x402 server (3 paid endpoints)
    - `nanopay-buyer.mjs`: Deposit 1 USDC → Pay 3 endpoints → Withdraw

### Phase 7: Monitoring (`/arc-monitor`)
16. Import Foundry contracts to Circle, create 4 event monitors
17. Trigger a transaction → verify webhook notification

### Phase 8: AI Agent Registration (`/arc-ai-agent`)
18. ERC-8004 AI Agent onchain identity — **Cast ~5 tx + SCA ~4 tx**:
    - Contracts: IdentityRegistry / ReputationRegistry / ValidationRegistry
    - Cast version: New Validator EOA → transfer gas → register → giveFeedback → validationRequest → validationResponse
    - SCA version: Circle API creates 2 SCA wallets → auto-completes all 4 steps
    - ERC-8004 requires owner ≠ validator (no self-dealing)
    - Cast Validator EOA needs native USDC for gas (1 USDC is enough)

## Required .env Variables

```
CIRCLE_API_KEY=...
CIRCLE_ENTITY_SECRET=...
CAST_PRIVATE_KEY=0x...
CAST_ADDRESS=0x...
WALLET1_ADDRESS=0x...
WALLET2_ADDRESS=0x...
SCA_WALLET_ID=...
SCA_ADDRESS=0x...
SOLANA_ADDRESS=...
SOLANA_PRIVATE_KEY=...
HELLO_ARCHITECT=0x...
ARC_TOKEN=0x...
ARC_NFT=0x...
ARC_MULTI_TOKEN=0x...
ARC_AIRDROP=0x...
SCA_ERC20=0x...
SCA_ERC721=0x...
SCA_ERC1155=0x...
SCA_AIRDROP=0x...
```

## Key Notes
- Focus operations on cast wallet (has private key for airdrops/claims)
- SCA wallet has no private key, only used for Circle template deployment
- Arc USDC is native token (**18 decimals**), Sepolia/Solana is **6 decimals**
- Circle template contract names must be **alphanumeric only** (no hyphens)

## Circle SDK Known Issues
- **Entity Secret**: Must use RSA-OAEP SHA-256 encrypt → **base64** encode (hex returns 400)
- **SCP SDK deployContractTemplate**: Buggy, use direct fetch API instead
- **Template deploy API**: Needs `idempotencyKey` (top-level), `feeLevel` (top-level)
- **Bridge Kit BigInt**: JSON.stringify errors, need `BigInt.prototype.toJSON` fix
- **Solana adapter**: Package `@circle-fin/adapter-solana`, export `createSolanaAdapterFromPrivateKey`
- **Solana gas**: Even Arc→Solana needs SOL on destination (mint tx on Solana)
- **SCP SDK monitors**: Broken, use direct fetch API (`/v1/w3s/contracts/monitors`)
- **ERC-8004**: Owner ≠ validator required; Cast version needs separate Validator EOA with USDC gas

## Total Interactions (tested)
- Foundry deploy: 5 tx
- Circle template deploy: 4 tx
- Cast interactions: ~18 tx
- SCA interactions: ~10 tx
- Bridge: ~10 tx (5 bridges × 4 directions: Sepolia↔Arc + Solana↔Arc)
- Gateway: ~4 tx (approve + deposit + API transfer + gatewayMint)
- XyloNet: ~16 tx (Tip/Swap/Deposit/Bridge/LP)
- Nanopayments: ~6 tx (deposit + 3 x402 payments + withdraw)
- Monitor: ~8 tx (import + monitors + trigger)
- ERC-8004 AI Agent: ~9 tx (Cast 5 + SCA 4)
- **Total ~90 on-chain interactions**
