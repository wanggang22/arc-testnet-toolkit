import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from "dotenv";
dotenv.config();

try {
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
  });
  console.log("Client created OK");
  const res = await client.createWalletSet({ name: "ArcTestnetSet" });
  console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
} catch (err) {
  console.log("ERROR STATUS:", err?.response?.status);
  console.log("ERROR DATA:", JSON.stringify(err?.response?.data, null, 2));
  console.log("ERROR MSG:", err.message?.substring(0, 500));
  if (err?.response?.data?.code) {
    console.log("ERROR CODE:", err.response.data.code);
  }
}
