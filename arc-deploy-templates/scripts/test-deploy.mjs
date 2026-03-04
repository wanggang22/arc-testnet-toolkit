import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
const apiKey = process.env.CIRCLE_API_KEY;

// Get public key and encrypt entity secret
const pkRes = await fetch('https://api.circle.com/v1/w3s/config/entity/publicKey', {
  headers: { 'Authorization': 'Bearer ' + apiKey }
});
const pkData = await pkRes.json();
const encrypted = crypto.publicEncrypt(
  { key: pkData.data.publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  Buffer.from(entitySecret, 'hex')
);
const ciphertext = encrypted.toString('base64');

// Deploy ERC-20 template directly via API
const res = await fetch('https://api.circle.com/v1/w3s/templates/a1b74add-23e0-4712-88d1-6b3009e85a86/deploy', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    entitySecretCipherText: ciphertext,
    name: 'ERC20Token',
    blockchain: 'ARC-TESTNET',
    walletId: process.env.SCA_WALLET_ID,
    templateParameters: { name: 'ArcCoin', symbol: 'ACN', initialSupply: 1000000 },
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  }),
});
const data = await res.json();
console.log('Status:', res.status);
console.log('Response:', JSON.stringify(data, null, 2));
