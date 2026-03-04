import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// The Circle SDK has a helper to generate the entity secret ciphertext
// We need to use forge to encrypt with Circle's RSA public key
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
console.log("Entity Secret (raw):", entitySecret);

// Fetch Circle's public key
const response = await fetch("https://api.circle.com/v1/w3s/config/entity/publicKey", {
  headers: { "Authorization": `Bearer ${process.env.CIRCLE_API_KEY}` }
});
const data = await response.json();
console.log("Public key response:", JSON.stringify(data, null, 2));

if (data.data?.publicKey) {
  const publicKey = data.data.publicKey;
  const entitySecretBuf = Buffer.from(entitySecret, "hex");

  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    entitySecretBuf
  );

  const ciphertext = encrypted.toString("hex");
  console.log("\n=== Entity Secret Ciphertext (paste this in Console) ===");
  console.log(ciphertext);
}
