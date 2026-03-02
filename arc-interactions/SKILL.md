---
name: arc-interactions
description: Arc Testnet 合约交互刷记录（~28 笔）
disable-model-invocation: true
---

# Arc Testnet 合约交互刷记录

对已部署的合约做大量交互，增加链上活动记录。

## Windows 注意事项
- 每次使用 cast 前：`export PATH="$HOME/.foundry/bin:$PATH"`
- 所有变量从 .env 文件读取

## Part 1: Cast 钱包交互（Foundry cast，约 20 笔）

从 .env 读取变量后，逐条执行：

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.testnet.arc.network"
PK="$CAST_PRIVATE_KEY"
SELF="$CAST_ADDRESS"
```

### HelloArchitect（2 笔）
```bash
cast send $HELLO_ARCHITECT "setGreeting(string)" "Hello from Arc!" --rpc-url $RPC --private-key $PK
cast send $HELLO_ARCHITECT "setGreeting(string)" "Building on Arc Network" --rpc-url $RPC --private-key $PK
```

### ERC-20 ArcToken（5 笔）
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

### ERC-721 ArcNFT（4 笔）
```bash
cast send $ARC_NFT "mint(address)" $SELF --rpc-url $RPC --private-key $PK
cast send $ARC_NFT "mint(address)" $SELF --rpc-url $RPC --private-key $PK
cast send $ARC_NFT "mint(address)" $WALLET1_ADDRESS --rpc-url $RPC --private-key $PK
# Transfer tokenId 0 to Wallet2
cast send $ARC_NFT "transferFrom(address,address,uint256)" $SELF $WALLET2_ADDRESS 0 --rpc-url $RPC --private-key $PK
```

### ERC-1155 ArcMultiToken（4 笔）
```bash
cast send $ARC_MULTI_TOKEN "mint(address,uint256,uint256)" $SELF 1 100 --rpc-url $RPC --private-key $PK
cast send $ARC_MULTI_TOKEN "mint(address,uint256,uint256)" $SELF 2 50 --rpc-url $RPC --private-key $PK
cast send $ARC_MULTI_TOKEN "mint(address,uint256,uint256)" $WALLET1_ADDRESS 1 25 --rpc-url $RPC --private-key $PK
cast send $ARC_MULTI_TOKEN "safeTransferFrom(address,address,uint256,uint256,bytes)" $SELF $WALLET2_ADDRESS 1 10 0x --rpc-url $RPC --private-key $PK
```

### Airdrop（1 笔）
```bash
# 前面已 approve ARC_TOKEN 给 ARC_AIRDROP
cast send $ARC_AIRDROP "airdropERC20(address,address[],uint256[])" $ARC_TOKEN "[$WALLET1_ADDRESS,$WALLET2_ADDRESS]" "[1000000000000000000000,1000000000000000000000]" --rpc-url $RPC --private-key $PK
```

### EURC 转账（2 笔）
```bash
EURC="0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a"
# EURC is 6 decimals, transfer 0.1 EURC
cast send $EURC "transfer(address,uint256)" $WALLET1_ADDRESS 100000 --rpc-url $RPC --private-key $PK
cast send $EURC "transfer(address,uint256)" $WALLET2_ADDRESS 100000 --rpc-url $RPC --private-key $PK
```

## Part 2: Circle SCA 钱包交互（约 10 笔）

将 [sca-interactions.mjs](scripts/sca-interactions.mjs) 复制到项目目录后运行：

```bash
node sca-interactions.mjs
```

## 目标
Cast 钱包约 ~18 笔，SCA 钱包约 ~10 笔，总计 ~28 笔链上交互。
