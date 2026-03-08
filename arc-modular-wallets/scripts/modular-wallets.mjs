import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.env.HOME || process.env.USERPROFILE, 'modular-wallets', '.env') });

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;
const CAST_ADDRESS = process.env.CAST_ADDRESS || '0x2eA729df4b0E44Bf1dD9C5277292641F0f7A3571';

if (!API_KEY || !ENTITY_SECRET) {
  console.error('Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in .env');
  process.exit(1);
}

const BASE = 'https://api.circle.com/v1/w3s';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
};

async function api(method, path, body) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

// Get entity public key for encrypting entity secret
async function getEntityCiphertext() {
  const { data } = await api('GET', '/config/entity/publicKey');
  const publicKeyHex = data?.data?.publicKey;
  if (!publicKeyHex) throw new Error('Failed to get entity public key');

  // Use Node.js crypto to encrypt entity secret with RSA-OAEP
  const crypto = await import('crypto');
  const publicKeyPem = `-----BEGIN RSA PUBLIC KEY-----\n${publicKeyHex}\n-----END RSA PUBLIC KEY-----`;

  // Try to encrypt - if the key format doesn't match, use the raw approach
  try {
    const entitySecretBytes = Buffer.from(ENTITY_SECRET, 'hex');
    const encrypted = crypto.publicEncrypt(
      { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      entitySecretBytes
    );
    return encrypted.toString('base64');
  } catch {
    // Fallback: try with DER format
    const keyBuffer = Buffer.from(publicKeyHex, 'base64');
    const entitySecretBytes = Buffer.from(ENTITY_SECRET, 'hex');
    const encrypted = crypto.publicEncrypt(
      { key: { key: keyBuffer, format: 'der', type: 'spki' }, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      entitySecretBytes
    );
    return encrypted.toString('base64');
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pollTransaction(txId, maxWait = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const { data } = await api('GET', `/transactions/${txId}`);
    const state = data?.data?.transaction?.state;
    console.log(`  Transaction ${txId.slice(0, 8)}... state: ${state}`);
    if (state === 'COMPLETE' || state === 'FAILED' || state === 'DENIED') return data?.data?.transaction;
    await sleep(5000);
  }
  console.log('  Polling timeout');
  return null;
}

async function main() {
  console.log('=== Circle Modular Wallets (MSCA) ===\n');

  // Step 1: Get existing wallet sets
  console.log('[1/6] List wallet sets...');
  const { data: wsData } = await api('GET', '/walletSets');
  const walletSets = wsData?.data?.walletSets || [];

  if (walletSets.length === 0) {
    console.error('No wallet sets found. Create one first via arc-setup skill.');
    process.exit(1);
  }

  const walletSetId = walletSets[0].id;
  console.log(`  Using wallet set: ${walletSetId}`);

  // Step 2: Check for existing SCA wallets
  console.log('\n[2/6] Check existing SCA wallets...');
  const { data: walletsData } = await api('GET', `/wallets?walletSetId=${walletSetId}`);
  const allWallets = walletsData?.data?.wallets || [];
  const scaWallets = allWallets.filter(w => w.accountType === 'SCA');

  let scaWallet = null;

  if (scaWallets.length > 0) {
    scaWallet = scaWallets[0];
    console.log(`  Found existing SCA wallet: ${scaWallet.address}`);
    console.log(`  SCA Core: ${scaWallet.scaCore}, State: ${scaWallet.state}`);
  }

  // Step 3: Create new MSCA wallet if needed
  if (!scaWallet) {
    console.log('\n[3/6] Create new MSCA wallet (SCA, circle_6900_singleowner_v2)...');
    let ciphertext;
    try {
      ciphertext = await getEntityCiphertext();
    } catch (e) {
      console.error(`  Failed to encrypt entity secret: ${e.message}`);
      console.log('  Trying with @circle-fin/developer-controlled-wallets SDK...');

      // Fallback: use the SDK
      try {
        const { initiateDeveloperControlledWalletsClient } = await import('@circle-fin/developer-controlled-wallets');
        const client = initiateDeveloperControlledWalletsClient({ apiKey: API_KEY, entitySecret: ENTITY_SECRET });
        const createRes = await client.createWallets({
          blockchains: ['ARC-TESTNET'],
          walletSetId,
          accountType: 'SCA',
          count: 1,
          metadata: [{ name: 'MSCA-Modular' }],
        });
        scaWallet = createRes?.data?.wallets?.[0];
        if (scaWallet) {
          console.log(`  Created SCA wallet: ${scaWallet.address}`);
          console.log(`  ID: ${scaWallet.id}, Core: ${scaWallet.scaCore}`);
        }
      } catch (sdkErr) {
        console.error(`  SDK creation failed: ${sdkErr.message}`);
        console.log('  Continuing with existing EOA wallets...');
      }
    }

    if (!scaWallet && ciphertext) {
      const { data: createData, status } = await api('POST', '/developer/wallets', {
        idempotencyKey: randomUUID(),
        blockchains: ['ARC-TESTNET'],
        walletSetId,
        accountType: 'SCA',
        count: 1,
        entitySecretCiphertext: ciphertext,
        metadata: [{ name: 'MSCA-Modular' }],
      });

      if (status >= 200 && status < 300) {
        scaWallet = createData?.data?.wallets?.[0];
        console.log(`  Created SCA wallet: ${scaWallet?.address}`);
        console.log(`  ID: ${scaWallet?.id}, Core: ${scaWallet?.scaCore}`);
      } else {
        console.log(`  Create failed (${status}): ${JSON.stringify(createData).slice(0, 200)}`);
      }
    }
  } else {
    console.log('\n[3/6] SCA wallet already exists, skipping creation');
  }

  if (!scaWallet) {
    console.log('\nCould not create or find SCA wallet. Exiting.');
    process.exit(0);
  }

  // Step 4: Check SCA wallet balance
  console.log(`\n[4/6] Check SCA wallet balance...`);
  const { data: balData } = await api('GET', `/wallets/${scaWallet.id}/balances`);
  const balances = balData?.data?.tokenBalances || [];
  console.log(`  Balances: ${balances.length > 0 ? balances.map(b => `${b.amount} ${b.token?.symbol || 'unknown'}`).join(', ') : 'Empty'}`);

  // Step 5: Try a transfer (if has USDC)
  const usdcBalance = balances.find(b => b.token?.symbol === 'USDC');
  if (usdcBalance && parseFloat(usdcBalance.amount) > 0.001) {
    console.log(`\n[5/6] Transfer 0.001 USDC from MSCA → Cast wallet...`);

    let ciphertext;
    try {
      ciphertext = await getEntityCiphertext();
    } catch {
      try {
        const { initiateDeveloperControlledWalletsClient } = await import('@circle-fin/developer-controlled-wallets');
        const client = initiateDeveloperControlledWalletsClient({ apiKey: API_KEY, entitySecret: ENTITY_SECRET });
        const txRes = await client.createTransaction({
          walletId: scaWallet.id,
          destinationAddress: CAST_ADDRESS,
          amounts: ['0.001'],
          tokenAddress: '0x3600000000000000000000000000000000000000',
          fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
        });
        const txId = txRes?.data?.id;
        if (txId) {
          console.log(`  Transaction created: ${txId}`);
          const result = await pollTransaction(txId);
          console.log(`  Final state: ${result?.state || 'unknown'}`);
        }
        console.log('\n[6/6] Done (via SDK)');
        return;
      } catch (sdkErr) {
        console.log(`  SDK transfer failed: ${sdkErr.message}`);
      }
    }

    if (ciphertext) {
      const { data: txData, status } = await api('POST', '/developer/transactions/transfer', {
        idempotencyKey: randomUUID(),
        walletId: scaWallet.id,
        destinationAddress: CAST_ADDRESS,
        amounts: ['0.001'],
        tokenAddress: '0x3600000000000000000000000000000000000000',
        entitySecretCiphertext: ciphertext,
        feeLevel: 'MEDIUM',
      });

      if (status >= 200 && status < 300) {
        const txId = txData?.data?.id;
        console.log(`  Transaction: ${txId}`);
        if (txId) {
          const result = await pollTransaction(txId);
          console.log(`  Final state: ${result?.state || 'unknown'}`);
        }
      } else {
        console.log(`  Transfer failed (${status}): ${JSON.stringify(txData).slice(0, 200)}`);
      }
    }
  } else {
    console.log(`\n[5/6] SCA wallet has no USDC, skipping transfer`);
    console.log(`  Fund it via faucet: POST /v1/faucet/drips with address=${scaWallet.address}&blockchain=ARC-TESTNET`);
  }

  // Step 6: Try wallet upgrade if on old scaCore
  console.log(`\n[6/6] Check wallet upgrade...`);
  if (scaWallet.scaCore && !scaWallet.scaCore.includes('v2') && !scaWallet.scaCore.includes('v3')) {
    console.log(`  Current core: ${scaWallet.scaCore} — upgrade available to circle_6900_singleowner_v2`);
    console.log('  (Skipping auto-upgrade — run manually if desired)');
  } else {
    console.log(`  Current core: ${scaWallet.scaCore || 'N/A'} — already latest or N/A`);
  }

  // List all wallets summary
  console.log('\n=== Wallet Summary ===');
  for (const w of allWallets) {
    console.log(`  ${w.accountType?.padEnd(4)} | ${w.blockchain?.padEnd(12)} | ${w.address?.slice(0, 14)}... | ${w.state} | ${w.scaCore || 'EOA'}`);
  }

  console.log('\n=== Done ===\n');
}

main().catch(e => { console.error(e); process.exit(1); });
