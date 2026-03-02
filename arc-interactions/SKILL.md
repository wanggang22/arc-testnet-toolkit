---
name: arc-interactions
description: Arc Testnet contract interactions (~28 transactions)
disable-model-invocation: true
---

# Arc Testnet Contract Interactions

Execute bulk interactions on deployed contracts to maximize on-chain activity records.

## Windows Notes
- Set PATH before using cast: `export PATH="$HOME/.foundry/bin:$PATH"`
- All variables are read from the .env file

## Part 1: Cast Wallet Interactions (Foundry cast, ~20 txs)

Read variables from .env, then execute each command:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.testnet.arc.network"
PK="$CAST_PRIVATE_KEY"
SELF="$CAST_ADDRESS"
```

### HelloArchitect (2 txs)
```bash
cast send $HELLO_ARCHITECT "setGreeting(string)" "Hello from Arc!" --rpc-url $RPC --private-key $PK
cast send $HELLO_ARCHITECT "setGreeting(string)" "Building on Arc Network" --rpc-url $RPC --private-key $PK
```

### ERC-20 ArcToken (5 txs)
```bash
# Transfer to Wallet1 and Wallet2 (18 decimals, 10000 tokens)
cast send $ARC_TOKEN "transfer(address,uint256)" $WALLET1_ADDRESS 10000000000000000000000 --rpc-url $RPC --private-key $PK
cast send $ARC_TOKEN "transfer(address,uint256)" $WALLET2_ADDRESS 10000000000000000000000 --rpc-url $RPC --private-key $PK
# Approve airdrop contract
cast send $ARC_TOKEN "approve(address,uint256)" $ARC_AIRDROP 100000000000000000000000 --rpc-url $RPC --private-key $PK
# Approve Wallet1
cast send $ARC_TOKEN "approve(address,uint256)" $WALLET1_ADDRESS 50000000000000000000000 --rpc-url $RPC --private-key $PK
# Mint more tokens
cast send $ARC_TOKEN "mint(address,uint256)" $SELF 500000000000000000000000 --rpc-url $RPC --private-key $PK
```

### ERC-721 ArcNFT (4 txs)
```bash
cast send $ARC_NFT "mint(address)" $SELF --rpc-url $RPC --private-key $PK
cast send $ARC_NFT "mint(address)" $SELF --rpc-url $RPC --private-key $PK
cast send $ARC_NFT "mint(address)" $WALLET1_ADDRESS --rpc-url $RPC --private-key $PK
# Transfer tokenId 0 to Wallet2
cast send $ARC_NFT "transferFrom(address,address,uint256)" $SELF $WALLET2_ADDRESS 0 --rpc-url $RPC --private-key $PK
```

### ERC-1155 ArcMultiToken (4 txs)
```bash
cast send $ARC_MULTI_TOKEN "mint(address,uint256,uint256)" $SELF 1 100 --rpc-url $RPC --private-key $PK
cast send $ARC_MULTI_TOKEN "mint(address,uint256,uint256)" $SELF 2 50 --rpc-url $RPC --private-key $PK
cast send $ARC_MULTI_TOKEN "mint(address,uint256,uint256)" $WALLET1_ADDRESS 1 25 --rpc-url $RPC --private-key $PK
cast send $ARC_MULTI_TOKEN "safeTransferFrom(address,address,uint256,uint256,bytes)" $SELF $WALLET2_ADDRESS 1 10 0x --rpc-url $RPC --private-key $PK
```

### Airdrop (1 tx)
```bash
# ARC_TOKEN already approved for ARC_AIRDROP above
cast send $ARC_AIRDROP "airdropERC20(address,address[],uint256[])" $ARC_TOKEN "[$WALLET1_ADDRESS,$WALLET2_ADDRESS]" "[1000000000000000000000,1000000000000000000000]" --rpc-url $RPC --private-key $PK
```

### EURC Transfer (2 txs)
```bash
EURC="0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a"
# EURC is 6 decimals, transfer 0.1 EURC
cast send $EURC "transfer(address,uint256)" $WALLET1_ADDRESS 100000 --rpc-url $RPC --private-key $PK
cast send $EURC "transfer(address,uint256)" $WALLET2_ADDRESS 100000 --rpc-url $RPC --private-key $PK
```

## Part 2: Circle SCA Wallet Interactions (~10 txs)

Copy [sca-interactions.mjs](scripts/sca-interactions.mjs) to the project directory and run:

```bash
node sca-interactions.mjs
```

## Goal
Cast wallet ~18 txs, SCA wallet ~10 txs, total ~28 on-chain interactions.
