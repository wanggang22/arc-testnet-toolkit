---
name: arc-xylonet
description: XyloNet/PayX DeFi 自动交互（Tip/Swap/Deposit/Bridge/LP）
disable-model-invocation: true
---

# XyloNet 自动交互

自动执行 XyloNet 平台上的 DeFi 交互操作，产生 ~18 笔链上交易。

## 操作内容

| 操作 | 笔数 | 合约 |
|------|------|------|
| PayX Tip ×3 | 6 | 3×approve + 3×tip (0xA312) |
| Swap USDC→EURC | 2 | approve + swap (0x7374) |
| Swap EURC→USDC | 2 | approve + swap (0x7374) |
| Vault Deposit | 2 | approve + deposit (0x240E) |
| Bridge CCTP | 2 | increaseAllowance + bridge (0xC556) |
| Add Liquidity | 3 | 2×approve + addLiquidity (0x3DF3) |
| **总计** | **~18笔** | |

## 执行方式

```bash
node D:/wwwwwwwwwwwww/arc/xylonet-auto/xylonet-auto.mjs
```

## 技术细节
- 使用 Foundry `cast send` 直接发链上交易
- 钱包: Cast (0x1561...88fB)
- 每笔用量: 1 USDC/EURC (6 decimals = 1000000)
- 每次操作间隔 5-8 秒
- 无外部依赖，仅用 Node.js 内置 child_process

## 合约地址
- USDC: 0x3600000000000000000000000000000000000000
- EURC: 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
- PayX: 0xA312c384770B7b49E371DF4b7AF730EFEF465913
- DEX: 0x73742278c31a76dBb0D2587d03ef92E6E2141023
- Vault: 0x240Eb85458CD41361bd8C3773253a1D78054f747
- Bridge: 0xC5567a5E3370d4DBfB0540025078e283e36A363d
- LP Pool: 0x3DF3966F5138143dce7a9cFDdC2c0310ce083BB1

## 脚本位置
`D:\wwwwwwwwwwwww\arc\xylonet-auto\xylonet-auto.mjs`
