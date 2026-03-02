---
name: arc-deploy-foundry
description: Deploy 5 smart contracts to Arc Testnet via Foundry
disable-model-invocation: true
---

# Deploy Smart Contracts to Arc Testnet via Foundry

Deploy 5 smart contracts to Arc Testnet using Foundry, all owned by the cast wallet.

## Windows Notes
- Set Foundry PATH before each use: `export PATH="$HOME/.foundry/bin:$PATH"`

## Step 1: Initialize Project

```bash
export PATH="$HOME/.foundry/bin:$PATH"
mkdir -p ~/hello-arc && cd ~/hello-arc
forge init . --force
forge install OpenZeppelin/openzeppelin-contracts
```

Add remapping to `foundry.toml`:
```toml
remappings = ["@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/"]
```

Delete default files under src/ and test/.

## Step 2: Create 5 Contracts

Copy the following contract files to the project's `src/` directory:

- [HelloArchitect.sol](contracts/HelloArchitect.sol)
- [ArcToken.sol](contracts/ArcToken.sol)
- [ArcNFT.sol](contracts/ArcNFT.sol)
- [ArcMultiToken.sol](contracts/ArcMultiToken.sol)
- [ArcAirdrop.sol](contracts/ArcAirdrop.sol)

## Step 3: Compile

```bash
forge build
```
Ensure no errors.

## Step 4: Deploy Each Contract

Read CAST_PRIVATE_KEY from .env, set variables, then deploy one by one:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.testnet.arc.network"
PK="<read from .env>"

forge create src/HelloArchitect.sol:HelloArchitect --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcToken.sol:ArcToken --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcNFT.sol:ArcNFT --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcMultiToken.sol:ArcMultiToken --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcAirdrop.sol:ArcAirdrop --rpc-url $RPC --private-key $PK --broadcast
```

Record the `Deployed to:` address after each deployment.

## Step 5: Save Contract Addresses

Append the 5 contract addresses to .env:
```
HELLO_ARCHITECT=0x...
ARC_TOKEN=0x...
ARC_NFT=0x...
ARC_MULTI_TOKEN=0x...
ARC_AIRDROP=0x...
```

## Output
List all contract addresses and deployment transaction hashes.
