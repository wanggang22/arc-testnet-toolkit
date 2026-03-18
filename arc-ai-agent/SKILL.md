---
name: arc-ai-agent
description: Arc Testnet ERC-8004 AI Agent 注册全流程（身份注册 + 信誉记录 + 凭证验证，~6笔tx）
disable-model-invocation: true
---

# Arc Testnet ERC-8004 AI Agent 注册

使用 ERC-8004 标准在 Arc Testnet 上注册 AI Agent 链上身份，包含：
- **IdentityRegistry**: 注册 Agent 身份（mint ERC-721 NFT）
- **ReputationRegistry**: 记录 Agent 信誉评分
- **ValidationRegistry**: 请求 + 响应凭证验证

## 合约地址

| 合约 | 地址 |
|------|------|
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |

## Windows 注意事项
- 使用 Git Bash，Unix 语法
- Node.js 脚本用 .mjs 扩展名 + package.json 中 `"type": "module"`
- 所有变量从 ~/arc-setup/.env 读取

## 前提
- Circle Developer Console 账号 + API Key
- Entity Secret 已注册
- .env 包含 CIRCLE_API_KEY、CIRCLE_ENTITY_SECRET

## 安装依赖

```bash
mkdir -p ~/ai-agent-register && cd ~/ai-agent-register
npm init -y
npm pkg set type=module
npm install @circle-fin/developer-controlled-wallets viem dotenv
npm install --save-dev tsx typescript @types/node
```

复制 .env 到此目录：`cp ~/arc-setup/.env ~/ai-agent-register/.env`

---

## 执行流程

将 [ai-agent-register.mjs](scripts/ai-agent-register.mjs) 复制到项目目录后运行：

```bash
cd ~/ai-agent-register
node ai-agent-register.mjs
```

### 脚本执行步骤（共 ~6 笔交易）

| # | 操作 | 合约 | 发送方 | 说明 |
|---|------|------|--------|------|
| 1 | 创建 2 个 SCA 钱包 | Circle API | - | owner + validator |
| 2 | register(metadataURI) | IdentityRegistry | owner | 注册 Agent 身份，mint NFT |
| 3 | 查询 Agent ID | IdentityRegistry | - | 读取 Transfer 事件获取 tokenId |
| 4 | giveFeedback(...) | ReputationRegistry | validator | 记录信誉评分 |
| 5 | validationRequest(...) | ValidationRegistry | owner | 发起验证请求 |
| 6 | validationResponse(...) | ValidationRegistry | validator | 验证响应（100=通过） |
| 7 | getValidationStatus() | ValidationRegistry | - | 读取验证结果 |

### 关键规则
- **ERC-8004 要求 owner 不能给自己的 agent 记录信誉**，所以需要 2 个钱包
- 信誉评分 `giveFeedback` 的 score 范围：int128
- 验证响应 score：100 = 通过，0 = 失败
- Agent 元数据上传到 IPFS，测试可用默认 URI

### 验证成功

脚本完成后会输出：
- Agent ID (tokenId)
- Owner 地址
- Metadata URI
- 信誉记录 tx hash
- 验证状态 (100 = passed)
- 所有交易的 Arcscan 链接

### Arcscan 查看
- 交易详情：`https://testnet.arcscan.app/tx/{txHash}`
