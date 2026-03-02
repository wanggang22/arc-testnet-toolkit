---
name: arc-setup
description: Arc Testnet environment setup (Foundry + Circle wallets + testnet tokens)
disable-model-invocation: true
---

# Arc Testnet Environment Setup

Set up the complete Arc Testnet development environment. Execute each step in order, confirming success before proceeding.

## Windows Notes
- Use Git Bash with Unix-style syntax (forward slashes, /dev/null, etc.)
- No grep, sed, tail, cut in bash — write all logic in .mjs scripts
- Foundry PATH must be set each time: `export PATH="$HOME/.foundry/bin:$PATH"`
- Node.js scripts use .mjs extension + `"type": "module"` in package.json

## Step 1: Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
export PATH="$HOME/.foundry/bin:$PATH"
foundryup
forge --version && cast --version
```

## Step 2: Create Cast Wallet

```bash
export PATH="$HOME/.foundry/bin:$PATH"
cast wallet new
```

Record the Address and Private Key. This is the primary wallet (has private key for airdrop claims).

## Step 3: Circle Developer Console

**Pause with AskUserQuestion, prompt user to complete manually:**
1. Go to https://console.circle.com and sign up / log in
2. Settings → API Keys → Create → Select **Standard** (not Client)
3. Copy the API Key (format: `TEST_API_KEY:xxx:xxx`)
4. Continue after user provides the API Key

## Step 4: Create Project + Generate Entity Secret

```bash
mkdir -p ~/arc-setup && cd ~/arc-setup
npm init -y
npm install @circle-fin/developer-controlled-wallets @circle-fin/smart-contract-platform dotenv
```

Add `"type": "module"` to package.json.

Copy [generate-entity-secret.mjs](scripts/generate-entity-secret.mjs) to the project directory and run:

```bash
node generate-entity-secret.mjs
```

**Pause with AskUserQuestion**, wait for user to confirm Entity Secret is registered in Console.

Then create `.env`:

```
CIRCLE_API_KEY=<user-provided value>
CIRCLE_ENTITY_SECRET=<just generated value>
CAST_PRIVATE_KEY=<private key from Step 2>
CAST_ADDRESS=<address from Step 2>
ARC_RPC=https://rpc.testnet.arc.network
```

## Step 5: Create Circle Managed Wallets

Copy [create-wallets.mjs](scripts/create-wallets.mjs) to the project directory and run:

```bash
node create-wallets.mjs
```

## Step 6: Claim Testnet Tokens

**Pause with AskUserQuestion, prompt user to claim tokens manually:**
1. https://faucet.circle.com → Claim USDC + EURC for **Cast wallet** (select Arc Testnet)
2. https://faucet.circle.com → Claim USDC for **Wallet1, Wallet2** (select Ethereum Sepolia + Arc Testnet)
3. https://faucets.chain.link/sepolia → Claim ETH gas for **Cast + Wallet1 + Wallet2**
4. Claim multiple times per address to ensure sufficient balance (Sepolia USDC needs at least 10+ for Gateway)

## Output

List all wallet addresses and IDs, confirm .env contains all required variables.
Copy .env to subsequent project directories.
