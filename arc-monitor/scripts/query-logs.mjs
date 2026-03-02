import { CircleSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import dotenv from "dotenv";
dotenv.config();

const scpClient = new CircleSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

console.log("=== Event Logs ===\n");
try {
  const logs = await scpClient.listEventLogs({
    blockchain: "ARC-TESTNET",
    contractAddress: process.env.ARC_TOKEN,
  });
  const events = logs.data?.eventLogs || [];
  console.log(`Found ${events.length} events`);
  for (const e of events.slice(0, 5)) {
    console.log(`  Block ${e.blockNumber} | ${e.eventSignature} | tx: ${e.transactionHash?.substring(0, 20)}...`);
  }
} catch (err) {
  console.error("Query failed:", err?.response?.data?.message || err.message);
}
