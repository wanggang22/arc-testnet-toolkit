import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.CIRCLE_API_KEY;

console.log("=== Event Logs ===\n");

// Query event logs for ArcToken
const res = await fetch(`https://api.circle.com/v1/w3s/contracts/monitors/logs?blockchain=ARC-TESTNET&contractAddress=${process.env.ARC_TOKEN}`, {
  headers: { Authorization: "Bearer " + apiKey },
});
const data = await res.json();
console.log("Status:", res.status);

const events = data?.data?.eventLogs || [];
console.log(`Found ${events.length} events for ArcToken`);
for (const e of events.slice(0, 10)) {
  console.log(`  Block ${e.blockNumber} | ${e.eventSignature} | tx: ${e.transactionHash?.substring(0, 24)}...`);
}

if (events.length === 0) {
  console.log("(Events may take a few minutes to appear after monitor creation)");
  console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));
}
