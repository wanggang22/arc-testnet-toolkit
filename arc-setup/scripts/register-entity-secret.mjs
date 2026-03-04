import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
const apiKey = process.env.CIRCLE_API_KEY;

// 1. Get Circle's public key
console.log("Fetching Circle public key...");
const pkRes = await fetch("https://api.circle.com/v1/w3s/config/entity/publicKey", {
  headers: { "Authorization": `Bearer ${apiKey}` }
});
const pkData = await pkRes.json();
const publicKey = pkData.data.publicKey;
console.log("Got public key");

// 2. Encrypt entity secret with RSA-OAEP
const entitySecretBuf = Buffer.from(entitySecret, "hex");
console.log("Entity secret length (bytes):", entitySecretBuf.length);

const encrypted = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  entitySecretBuf
);

// Try both hex and base64 formats
const ciphertextHex = encrypted.toString("hex");
const ciphertextBase64 = encrypted.toString("base64");

console.log("Ciphertext (hex, first 100):", ciphertextHex.substring(0, 100));
console.log("Ciphertext (base64, first 100):", ciphertextBase64.substring(0, 100));

// 3. Try registering with hex
console.log("\n--- Trying hex format ---");
let regRes = await fetch("https://api.circle.com/v1/w3s/config/entity/entitySecret", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ entitySecretCipherText: ciphertextHex }),
});
let regData = await regRes.json();
console.log("Status:", regRes.status, "Response:", JSON.stringify(regData));

// 4. Try with base64
console.log("\n--- Trying base64 format ---");
regRes = await fetch("https://api.circle.com/v1/w3s/config/entity/entitySecret", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ entitySecretCipherText: ciphertextBase64 }),
});
regData = await regRes.json();
console.log("Status:", regRes.status, "Response:", JSON.stringify(regData));
