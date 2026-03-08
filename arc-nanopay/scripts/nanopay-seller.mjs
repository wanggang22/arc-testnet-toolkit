/**
 * Nanopayments Seller — Express 服务器 + x402 支付保护
 * 启动后提供 3 个付费 API 端点
 */
import "dotenv/config";
import express from "express";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";

const SELLER_ADDRESS = process.env.CAST_ADDRESS;
if (!SELLER_ADDRESS) {
  console.error("ERROR: CAST_ADDRESS not found in .env");
  process.exit(1);
}

const app = express();
const PORT = 4402;

// 创建 Gateway 中间件，限制只接受 Arc Testnet 支付
const gateway = createGatewayMiddleware({
  sellerAddress: SELLER_ADDRESS,
  networks: ["eip155:5042002"], // Arc Testnet only
});

// 端点 1: 天气数据 — $0.001
app.get(
  "/api/weather",
  gateway.require("$0.001"),
  (req, res) => {
    console.log(`[PAID] /api/weather — payer: ${req.payment?.payer}`);
    res.json({
      city: "Arc City",
      temp: "22°C",
      condition: "Sunny on the blockchain",
      paid_by: req.payment?.payer,
      price: "$0.001",
    });
  }
);

// 端点 2: 笑话 — $0.0001
app.get(
  "/api/joke",
  gateway.require("$0.0001"),
  (req, res) => {
    console.log(`[PAID] /api/joke — payer: ${req.payment?.payer}`);
    res.json({
      joke: "Why did the smart contract go to therapy? It had too many unresolved promises.",
      paid_by: req.payment?.payer,
      price: "$0.0001",
    });
  }
);

// 端点 3: 高级内容 — $0.01
app.get(
  "/api/premium",
  gateway.require("$0.01"),
  (req, res) => {
    console.log(`[PAID] /api/premium — payer: ${req.payment?.payer}`);
    res.json({
      content: "Arc Network uses PBFT consensus with sub-second finality. USDC is the native gas token.",
      secret_tip: "Nanopayments batch thousands of txs into one onchain settlement!",
      paid_by: req.payment?.payer,
      price: "$0.01",
    });
  }
);

// 免费端点（健康检查）
app.get("/health", (req, res) => {
  res.json({ status: "ok", seller: SELLER_ADDRESS });
});

app.listen(PORT, () => {
  console.log(`\n=== Nanopay Seller Server ===`);
  console.log(`Seller address: ${SELLER_ADDRESS}`);
  console.log(`Network: Arc Testnet (chainId: 5042002)`);
  console.log(`\nEndpoints:`);
  console.log(`  GET http://localhost:${PORT}/api/weather  — $0.001`);
  console.log(`  GET http://localhost:${PORT}/api/joke     — $0.0001`);
  console.log(`  GET http://localhost:${PORT}/api/premium  — $0.01`);
  console.log(`  GET http://localhost:${PORT}/health       — free`);
  console.log(`\nWaiting for payments...\n`);
});
