---
name: arc-deploy-foundry
description: Foundry 合约部署到 Arc Testnet（5 个合约）
disable-model-invocation: true
---

# Foundry 合约部署到 Arc Testnet

用 Foundry 部署 5 个智能合约到 Arc Testnet，全部归属 cast 钱包。

## Windows 注意事项
- 每次使用 Foundry 前：`export PATH="$HOME/.foundry/bin:$PATH"`

## Step 1: 初始化项目

```bash
export PATH="$HOME/.foundry/bin:$PATH"
mkdir -p ~/hello-arc && cd ~/hello-arc
forge init . --force
forge install OpenZeppelin/openzeppelin-contracts
```

在 `foundry.toml` 中添加 remapping：
```toml
remappings = ["@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/"]
```

删除 src/ 和 test/ 下的默认文件。

## Step 2: 创建 5 个合约

将以下合约文件复制到项目的 `src/` 目录：

- [HelloArchitect.sol](contracts/HelloArchitect.sol)
- [ArcToken.sol](contracts/ArcToken.sol)
- [ArcNFT.sol](contracts/ArcNFT.sol)
- [ArcMultiToken.sol](contracts/ArcMultiToken.sol)
- [ArcAirdrop.sol](contracts/ArcAirdrop.sol)

## Step 3: 编译

```bash
forge build
```
确保无报错。

## Step 4: 逐个部署

从 .env 读取 CAST_PRIVATE_KEY，设置变量后逐个部署：

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.testnet.arc.network"
PK="从.env读取"

forge create src/HelloArchitect.sol:HelloArchitect --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcToken.sol:ArcToken --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcNFT.sol:ArcNFT --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcMultiToken.sol:ArcMultiToken --rpc-url $RPC --private-key $PK --broadcast
forge create src/ArcAirdrop.sol:ArcAirdrop --rpc-url $RPC --private-key $PK --broadcast
```

每次部署后记录 `Deployed to:` 地址。

## Step 5: 保存合约地址

将 5 个合约地址追加到 .env：
```
HELLO_ARCHITECT=0x...
ARC_TOKEN=0x...
ARC_NFT=0x...
ARC_MULTI_TOKEN=0x...
ARC_AIRDROP=0x...
```

## 输出
列出所有合约地址和部署交易哈希。
