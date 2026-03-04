# Circle 开发者平台知识图谱

## 一、平台总览

Circle 是 USDC/EURC 发行方，围绕稳定币构建了完整的开发者基础设施。
Arc 是 Circle 自己的区块链，作为核心结算层。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Circle Developer Platform                     │
├─────────────┬──────────────┬──────────────┬─────────────────────┤
│  Build      │  Move        │  Pay         │  Manage             │
│  Onchain    │  Crosschain  │  Payments    │  Liquidity          │
├─────────────┼──────────────┼──────────────┼─────────────────────┤
│ Wallets     │ Bridge Kit   │ CPN          │ Circle Mint         │
│ Contracts   │ CCTP         │              │ StableFX            │
│ Gas         │ Gateway      │              │                     │
│ Compliance  │              │              │                     │
└─────────────┴──────────────┴──────────────┴─────────────────────┘
```

---

## 二、Build Onchain（链上构建）

### 2.1 Wallets（钱包即服务）

| 类型 | 控制方 | 密钥管理 | 适用场景 |
|------|--------|----------|----------|
| **Dev-Controlled** | 开发者 | Circle MPC 托管 | 后端自动化、API 管理资金 |
| **User-Controlled** | 用户 | 设备端存储 + MPC | Passkey/社交登录、用户自主管理 |
| **Modular** | 可配置 | 智能合约账户 | 可插拔模块、自定义逻辑 |

- 账户类型：EOA（外部拥有账户）+ SCA（智能合约账户）
- 支持资产：ERC-20、ERC-721、ERC-1155（EVM）、SPL（Solana）
- SDK：RESTful API + Web/iOS/Android SDK

### 2.2 Smart Contracts（智能合约）

| 功能 | 说明 |
|------|------|
| **模板部署** | 预审计的 ERC-20/721/1155/Airdrop 模板，API 一键部署 |
| **合约导入** | 导入外部部署的合约到 Circle 平台管理 |
| **事件监控** | 创建 Event Monitor，配合 Webhook 实时推送 |
| **合约管理** | 通过 API 查询合约状态、事件日志 |

⚠️ 实测：SDK (`@circle-fin/smart-contract-platform`) 部分方法有 bug，建议直接用 fetch API。

### 2.3 Gas Abstraction（Gas 抽象）

| 产品 | 机制 | 说明 |
|------|------|------|
| **Gas Station** | Circle 赞助 | Circle 代付 gas 费 |
| **Paymaster** | USDC 付 gas | ERC-4337 paymaster，用 USDC 替代原生代币付 gas |

### 2.4 Compliance（合规）

- 交易筛查（Transaction Screening）
- 规则管理（Rule Management）
- 告警调查（Alert Investigation）

---

## 三、Move Crosschain（跨链转账）

### 3.1 三种跨链方式对比

| | Bridge Kit | CCTP | Gateway |
|---|---|---|---|
| **定位** | SDK 快速集成 | 协议级 burn-and-mint | 链抽象统一余额 |
| **速度** | 取决于底层 | Fast: 8-20s / Standard: 15-19min | < 500ms（余额建立后） |
| **原理** | 封装 CCTP | 源链 burn → 目标链 mint | 存入余额 → 即时 mint |
| **特点** | 几行代码 | 无需许可、Hooks 可组合 | 统一余额、非托管 |
| **适合** | 简单跨链需求 | 精细控制、自动化、合约集成 | 多链应用、用户无感跨链 |
| **机制** | 原生 USDC（无 wrapped） | 原生 USDC（无 wrapped） | 签名授权、7天无信任提款 |

### 3.2 CCTP 详情
- 核心：源链 burn USDC → 目标链 mint USDC，1:1，无流动性池
- Fast Transfer: ~8-20 秒
- Standard Transfer: ~15-19 分钟（ETH/L2）
- Hooks: 到账后自动触发后续操作
- 用例：跨链流动性、跨链 swap、跨链支付、可组合应用

### 3.3 Gateway 详情
- 核心：统一 USDC 余额，跨链即时可用
- 完全无需许可（permissionless）
- 非托管：签名授权 + 7 天无信任提款
- 用例：链抽象、跨链流动性、支付路由、资金管理
- ⚠️ 实测：fee ~2 USDC，Sepolia→Arc 单向，存 6 到账约 1

---

## 四、Pay（支付网络）

### Circle Payments Network (CPN)
- **定位**：机构级跨境支付基础设施
- **功能**：近即时结算、多币种 FX 报价、智能路由、合规集成
- **流程**：报价 → 创建支付 → 链上 USDC 交易 → 法币兑换到账
- **参与方**：银行、交易所、支付公司（需 KYC/AML）
- **面向**：机构客户，非普通开发者

---

## 五、Manage Liquidity（流动性管理）

### 5.1 Circle Mint
- 1:1 铸造/赎回 USDC 和 EURC
- 支持银行存取款
- API 或 Web UI 操作
- 面向机构客户

### 5.2 StableFX
- 机构级 FX 引擎
- 多流动性提供商聚合报价
- **在 Arc 区块链上结算**（亚秒 finality）
- 原子结算（同时结算或全不结算）
- USDC/EURC 交易对
- 面向银行、交易所、OTC

---

## 六、Assets（数字资产）

| 资产 | 类型 | 说明 |
|------|------|------|
| **USDC** | 美元稳定币 | 最受信赖的数字美元，支付/DeFi/结算 |
| **EURC** | 欧元稳定币 | MiCA 合规 |
| **xReserve** | 品牌稳定币 | 100% USDC 储备背书，定制品牌 |
| **USYC** | 货币市场基金 | 链上收益，实时申购赎回 |

### USDC 关键技术参数
| 链 | 地址 | Decimals |
|----|------|----------|
| Arc Testnet | `0x3600000000000000000000000000000000000000` | 18（原生代币） |
| ETH Sepolia | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6 |

---

## 七、SDK 全览

| SDK | 包名 | 语言 | 用途 |
|-----|------|------|------|
| Bridge Kit | `@circle-fin/bridge-kit` | TS | CCTP 跨链 |
| Dev-Controlled Wallets | `@circle-fin/developer-controlled-wallets` | TS/Python | 托管钱包 |
| Modular Wallets | npm/GitHub | JS/TS/Swift/Kotlin | 模块化钱包 |
| User-Controlled (Client) | GitHub | JS/TS/Kotlin/Swift | 用户钱包前端 |
| User-Controlled (Server) | npm/PyPI | TS/Python | 用户钱包后端 |
| Contracts SDK | `@circle-fin/smart-contract-platform` | TS/Python | 合约管理 ⚠️有bug |
| Mint Payouts | `circle-nodejs-sdk` | Node.js | 加密出金 |
| Bridge Adapters | `@circle-fin/adapter-circle-wallets` / `adapter-viem-v2` | TS | 桥接适配器 |

---

## 八、示例项目

| 类别 | 项目 | 技术栈 |
|------|------|--------|
| Wallets | AI Escrow 合约 | TypeScript |
| Wallets | 自主支付系统 | Python |
| Wallets | 智能账户 Gasless | JS/React |
| Wallets | Telegram Bot | - |
| Paymaster | USDC 付 gas | TypeScript |
| Circle Mint | 支付流演示 | Vue |
| CCTP | 跨链 USDC 转账 | TypeScript/React |
| CCTP | Telegram 跨链 Bot | - |
| Research | AI 意图驱动交易 | JS/Python |
| Research | USDC 信用应用 | TypeScript |

---

## 九、Arc 区块链定位

```
Arc = Circle 的核心结算层
├── StableFX 在 Arc 上结算（亚秒 finality）
├── USDC 是 Arc 的原生代币（18 decimals）
├── Gateway 支持 Sepolia → Arc 跨链
├── CCTP 支持 Ethereum ↔ Arc 转账
└── 全套开发者工具（钱包、合约、监控、Gas 抽象）
```

---

## 十、产品矩阵（按用户类型）

| 用户类型 | 可用产品 |
|----------|----------|
| **普通开发者** | Wallets、Contracts、Gas Abstraction、Bridge Kit、CCTP、Gateway |
| **DApp 开发者** | + Modular Wallets、Paymaster、Hooks |
| **金融机构** | + CPN、Circle Mint、StableFX、xReserve |
| **合规团队** | + Compliance（交易筛查、规则管理） |

---

## 十一、关键 API 端点

| 功能 | 端点 |
|------|------|
| 健康检查 | `GET /ping` |
| 创建钱包 | `POST /v1/w3s/developer/wallets` |
| 导入合约 | `POST /v1/w3s/contracts/import` |
| 部署模板 | `POST /v1/w3s/contracts/deploy` |
| 创建监控 | `POST /v1/w3s/contracts/monitors` |
| 查询事件 | `GET /v1/w3s/contracts/events` |
| Gateway 余额 | `POST https://gateway-api-testnet.circle.com/v1/balances` |
| Gateway 转账 | `POST https://gateway-api-testnet.circle.com/v1/transfer` |

Base URL: `https://api.circle.com`
