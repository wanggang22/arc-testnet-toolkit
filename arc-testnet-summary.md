# Arc Testnet 全流程执行汇总

执行时间: 2026-03-03

## Phase 1: 环境搭建

### Foundry 安装
- forge 1.5.1-stable, cast 1.5.1-stable

### Cast 钱包
- 地址: `***REMOVED***`
- 私钥: `0x4f3a...ec59`

### Circle 配置
- API Key: `TEST_API_KEY:2c49...4319`
- Entity Secret: `0373...81dc`（已加密注册到 Console）

### Circle 托管钱包
| 名称 | 地址 | 类型 |
|------|------|------|
| Wallet1 | `0xc55d62b537b771f923f5ead6cc111e77e4d99531` | EOA (Arc + Sepolia) |
| Wallet2 | `0xf4e280f54e77dc6dde9ff2d0a209857b75e33fb9` | EOA (Arc + Sepolia) |
| SCA | `0x8d1990553d0d46eb7ca528b52a6c98a2585518fc` | SCA (Arc) |

Wallet Set ID: `c7b39eed-59bc-5767-9a9e-a9aadad74595`

---

## Phase 2: 合约部署

### Foundry 部署 (Cast 钱包, 5 笔)
| 合约 | 地址 |
|------|------|
| HelloArchitect | `0x6d4BD5D0D8f527E3298D3db6D5fA9DD754aaAA3E` |
| ArcToken (ERC-20) | `0xCC05Fc43cb8e985e03cBD83861BadfEF12F49d84` |
| ArcNFT (ERC-721) | `0x0D59A3442B1eCC7550A6ba181DEb23BE9A256aF3` |
| ArcMultiToken (ERC-1155) | `0x94850C213021f82305B5a829243b58D95Bb4b38e` |
| ArcAirdrop | `0x75bBa24191922D721d3b16d0F0FFF7F97b444174` |

### Circle 模板部署 (SCA 钱包, 4 笔)
| 合约 | 地址 |
|------|------|
| AirdropContract | `0x133343737d3f947247dcb3079cb03601ed5504e7` |
| ERC20Token | `0xf7bca5f7eaa39b824693b852d75e7349b8bbc75c` |
| ERC721NFT | `0xef99642f73f254dea0d6c6909910c3b8e6828309` |
| ERC1155Multi | `0xdd7893c0064009ffa2ab3d53d218152983288b18` |

---

## Phase 3: 合约交互

### Cast 钱包交互 (18 笔)
| # | 操作 | 合约 |
|---|------|------|
| 1 | HelloArchitect: setGreeting | HelloArchitect |
| 2 | HelloArchitect: setGreeting | HelloArchitect |
| 3 | ERC-20: Transfer 10000 to Wallet1 | ArcToken |
| 4 | ERC-20: Transfer 10000 to Wallet2 | ArcToken |
| 5 | ERC-20: Approve Airdrop 100000 | ArcToken |
| 6 | ERC-20: Approve Wallet1 50000 | ArcToken |
| 7 | ERC-20: Mint 500000 to self | ArcToken |
| 8 | ERC-721: Mint to self #1 | ArcNFT |
| 9 | ERC-721: Mint to self #2 | ArcNFT |
| 10 | ERC-721: Mint to Wallet1 | ArcNFT |
| 11 | ERC-721: Transfer tokenId 0 to Wallet2 | ArcNFT |
| 12 | ERC-1155: Mint token 1 x100 to self | ArcMultiToken |
| 13 | ERC-1155: Mint token 2 x50 to self | ArcMultiToken |
| 14 | ERC-1155: Mint token 1 x25 to Wallet1 | ArcMultiToken |
| 15 | ERC-1155: Transfer token 1 x10 to Wallet2 | ArcMultiToken |
| 16 | Airdrop: ERC20 to Wallet1+Wallet2 | ArcAirdrop |
| 17 | EURC: Transfer 0.1 to Wallet1 | EURC |
| 18 | EURC: Transfer 0.1 to Wallet2 | EURC |

### SCA 钱包交互 (10 笔)
| # | 操作 | 合约 |
|---|------|------|
| 1 | ERC-20: mintTo 10000 to self | SCA_ERC20 |
| 2 | ERC-20: Transfer 1000 to Wallet1 | SCA_ERC20 |
| 3 | ERC-20: Transfer 1000 to Wallet2 | SCA_ERC20 |
| 4 | ERC-20: Approve Airdrop | SCA_ERC20 |
| 5 | Airdrop: ERC20 to Wallet1+Wallet2 | SCA_Airdrop |
| 6 | ERC-721: mintTo self | SCA_ERC721 |
| 7 | ERC-721: mintTo Wallet1 | SCA_ERC721 |
| 8 | ERC-1155: mintTo token 1 x100 | SCA_ERC1155 |
| 9 | ERC-1155: mintTo token 2 x50 | SCA_ERC1155 |
| 10 | ERC-1155: mintTo token 1 x25 to Wallet1 | SCA_ERC1155 |

---

## Phase 4: 跨链转账

### Bridge Kit (CCTP v2, 2 笔成功)
| 来源 | 路径 | 金额 | 状态 |
|------|------|------|------|
| Wallet1 | ETH Sepolia → Arc Testnet | 1 USDC | 成功 |
| Wallet2 | ETH Sepolia → Arc Testnet | 1 USDC | 成功 |
| Cast | ETH Sepolia → Arc Testnet | 1 USDC | 失败 (viem RPC error) |

### Gateway (完成)
| 步骤 | 状态 | 详情 |
|------|------|------|
| Approve USDC | 完成 | tx: `0x83ea...e6cf` |
| Deposit 6 USDC | 完成 | tx: `0xffc7...4942` |
| 等待 Sepolia 确认 | 完成 | 轮询 18 次 (~18 分钟) |
| EIP-712 签名 + API 提交 | 完成 | Transfer ID: `1f4b67c1-bb0c-4c7c-8256-b2ad21af1aa8`, Fee: 2.00015 USDC |
| gatewayMint on Arc | 完成 | tx: `0x7f777235b82299155fd77397388d48968e2c5d641a32a6c2e9c764597c6a6c06` |

---

## Phase 5: 事件监控

### Webhook
- URL: `https://webhook.site/05ad9bac-3722-4abc-91cb-dea8ae690c89`
- 已在 Circle Console 注册

### 事件监控器 (4 个)
| 合约 | 事件签名 | 状态 |
|------|----------|------|
| ArcToken | Transfer(address,address,uint256) | 活跃 |
| ArcToken | Approval(address,address,uint256) | 活跃 |
| ArcNFT | Transfer(address,address,uint256) | 活跃 |
| ArcMultiToken | TransferSingle(address,address,address,uint256,uint256) | 活跃 |

### 触发验证 (1 笔)
- ERC-20 Transfer 1 ARC to Wallet1
- tx: `0x3931f6becb27344aa23f3b86431fcefa515cb41e07110f3bd6535c2161ba8b47`
- Webhook 通知已确认收到

---

## 项目目录
```
~/arc-setup/           - 环境搭建脚本 + .env (主配置)
~/hello-arc/           - Foundry 项目 (5 个 Solidity 合约)
~/deploy-contracts/    - Circle 模板部署 + SCA 交互脚本
~/crosschain-transfer/ - Bridge Kit 跨链桥接
~/gateway-transfer/    - Gateway 全流程 (进行中)
~/arc-monitor/         - 事件监控
```

---

## 交互笔数统计
| 类别 | 笔数 | 状态 |
|------|------|------|
| Foundry 部署 | 5 | 完成 |
| Circle 模板部署 | 4 | 完成 |
| Cast 交互 | 18 | 完成 |
| SCA 交互 | 10 | 完成 |
| Bridge | 2 | 完成 (3 笔中 2 笔成功) |
| Gateway | 4 | 完成 (approve + deposit + API transfer + gatewayMint) |
| Monitor 触发 | 1 | 完成 |
| **总计** | **44** | **全部完成** |

---

## 关键经验 / 踩坑记录
1. **Entity Secret 注册**：必须用 RSA-OAEP SHA-256 加密后以 **base64** 编码（不是 hex）
2. **Circle 模板部署**：SDK 有 bug，改用直接 fetch API；需要 `idempotencyKey`、`feeLevel`（顶层参数）、`defaultAdmin`、`primarySaleRecipient`、`royaltyRecipient`
3. **BigInt 序列化**：Bridge Kit 需要 `BigInt.prototype.toJSON = function() { return this.toString(); };`
4. **Arc USDC**：原生代币，**18 decimals**（Sepolia 是 6 decimals）
5. **事件监控 API**：端点是 `/v1/w3s/contracts/monitors`（不是 `/v1/w3s/eventMonitors`），需要 `idempotencyKey`
6. **合约导入**：Foundry 部署的合约需要先通过 `/v1/w3s/contracts/import` 导入 Circle 才能创建监控器
7. **Windows Git Bash**：没有 grep/sed/tail，所有逻辑写在 .mjs 脚本里
