import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.env.HOME || process.env.USERPROFILE, 'compliance-check', '.env') });

const API_KEY = process.env.CIRCLE_API_KEY;
if (!API_KEY) { console.error('Missing CIRCLE_API_KEY in .env'); process.exit(1); }

const CAST_ADDRESS = process.env.CAST_ADDRESS || '0x2eA729df4b0E44Bf1dD9C5277292641F0f7A3571';
const WALLET1_ADDRESS = process.env.WALLET1_ADDRESS || '0xc3ac5ee4369d107ff4ef702ea130611ada0ca84c';
const WALLET2_ADDRESS = '0x5a548b9b6617663c4a5bdad4ffb9784baa2a46d9';
// Tornado Cash Router (known sanctioned address for comparison)
const TORNADO_ADDRESS = '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b';

const BASE_URL = 'https://api.circle.com/v1/w3s/compliance/screening/addresses';

async function screenAddress(address, chain, label) {
  console.log(`\n[Screening] ${label}: ${address.slice(0, 10)}...${address.slice(-6)} (${chain})`);

  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        idempotencyKey: randomUUID(),
        address,
        chain,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(`  Status: ${res.status}`);
      console.log(`  Error: ${errText.slice(0, 200)}`);
      return { label, address, result: `ERROR_${res.status}`, details: errText.slice(0, 100) };
    }

    const data = await res.json();
    const result = data.data?.result || data.result || 'UNKNOWN';
    const decision = data.data?.decision || data.decision;

    console.log(`  Result: ${result}`);

    if (decision) {
      if (decision.riskSignals && decision.riskSignals.length > 0) {
        for (const signal of decision.riskSignals) {
          console.log(`  Risk: ${signal.riskScore} | ${signal.riskCategory} | ${signal.riskType}`);
        }
      } else {
        console.log(`  Risk Signals: None`);
      }
    }

    return { label, address: address.slice(0, 10) + '...' + address.slice(-6), result, decision };
  } catch (e) {
    console.log(`  Request failed: ${e.message}`);
    return { label, address: address.slice(0, 10) + '...' + address.slice(-6), result: 'FETCH_ERROR', details: e.message };
  }
}

async function main() {
  console.log('=== Circle Compliance Screening ===');
  console.log(`API: ${BASE_URL}`);

  const results = [];

  // Screen on multiple chains to show breadth
  results.push(await screenAddress(CAST_ADDRESS, 'ETH', 'Cast (ETH)'));
  results.push(await screenAddress(CAST_ADDRESS, 'MATIC', 'Cast (MATIC)'));
  results.push(await screenAddress(WALLET1_ADDRESS, 'ETH', 'W1 (ETH)'));
  results.push(await screenAddress(WALLET2_ADDRESS, 'ETH', 'W2 (ETH)'));
  results.push(await screenAddress(TORNADO_ADDRESS, 'ETH', 'Tornado (test)'));

  // Summary
  console.log('\n=== Summary ===');
  console.log('─'.repeat(60));
  console.log(`${'Label'.padEnd(20)} ${'Address'.padEnd(20)} ${'Result'.padEnd(12)}`);
  console.log('─'.repeat(60));
  for (const r of results) {
    console.log(`${r.label.padEnd(20)} ${r.address.padEnd(20)} ${r.result.padEnd(12)}`);
  }
  console.log('─'.repeat(60));

  console.log('\n=== Done ===\n');
}

main().catch(e => { console.error(e); process.exit(1); });
