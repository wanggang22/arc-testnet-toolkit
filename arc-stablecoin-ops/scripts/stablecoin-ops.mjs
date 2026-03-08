import { createWalletClient, createPublicClient, http, parseUnits, formatUnits, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.env.HOME || process.env.USERPROFILE, 'deploy-contracts', '.env') });

const PRIVATE_KEY = process.env.CAST_PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error('Missing CAST_PRIVATE_KEY in .env'); process.exit(1); }

const W1 = process.env.WALLET1_ADDRESS || '0xc3ac5ee4369d107ff4ef702ea130611ada0ca84c';

const arcTestnet = defineChain({
  id: 9000,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
});

const EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
const USDC = '0x3600000000000000000000000000000000000000';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const FX_ESCROW = '0x867650F5eAe8df91445971f14d89fd84F0C9a9f8';
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
];

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

let okCount = 0, failCount = 0;

async function waitTx(hash, label) {
  console.log(`  ${label} tx: ${hash}`);
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30_000 });
    const ok = receipt.status === 'success';
    console.log(`  ${label} ${ok ? 'OK' : 'FAILED'}`);
    ok ? okCount++ : failCount++;
    return receipt;
  } catch (e) {
    console.log(`  ${label} receipt error: ${e.message}`);
    failCount++;
    return null;
  }
}

async function tryWrite(address, abi, functionName, args, label) {
  try {
    const hash = await walletClient.writeContract({ address, abi, functionName, args });
    return await waitTx(hash, label);
  } catch (e) {
    console.log(`  ${label} FAILED: ${e.shortMessage || e.message}`);
    failCount++;
    return null;
  }
}

async function main() {
  console.log(`\n=== Arc Stablecoin Extended Ops ===`);
  console.log(`Wallet: ${account.address}\n`);

  // Step 1: Balances
  console.log('[1/8] Check balances...');
  const ethBal = await publicClient.getBalance({ address: account.address });
  const eurcBal = await publicClient.readContract({ address: EURC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  const usdcBal = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  console.log(`  ETH:  ${formatUnits(ethBal, 18)}`);
  console.log(`  EURC: ${formatUnits(eurcBal, 6)}`);
  console.log(`  USDC: ${formatUnits(usdcBal, 18)}`);

  // Step 2: EURC approve → Permit2
  console.log('\n[2/8] EURC approve → Permit2...');
  const approveAmt = parseUnits('100', 6); // 100 EURC
  await tryWrite(EURC, ERC20_ABI, 'approve', [PERMIT2, approveAmt], 'EURC→Permit2');

  // Step 3: EURC approve → FxEscrow
  console.log('\n[3/8] EURC approve → FxEscrow...');
  await tryWrite(EURC, ERC20_ABI, 'approve', [FX_ESCROW, approveAmt], 'EURC→FxEscrow');

  // Step 4: EURC transfer → Wallet1
  if (eurcBal > 10000n) { // > 0.01 EURC
    console.log('\n[4/8] EURC transfer → Wallet1...');
    const transferAmt = eurcBal > 100000n ? 10000n : eurcBal / 4n; // 0.01 or 25%
    await tryWrite(EURC, ERC20_ABI, 'transfer', [W1, transferAmt], `EURC transfer ${formatUnits(transferAmt, 6)}`);
  } else {
    console.log('\n[4/8] EURC balance too low for transfer, skipping');
  }

  // Step 5: EURC self-transfer
  if (eurcBal > 5000n) {
    console.log('\n[5/8] EURC self-transfer...');
    const selfAmt = eurcBal > 50000n ? 5000n : eurcBal / 10n;
    await tryWrite(EURC, ERC20_ABI, 'transfer', [account.address, selfAmt], `EURC self-transfer ${formatUnits(selfAmt, 6)}`);
  } else {
    console.log('\n[5/8] EURC balance too low for self-transfer, skipping');
  }

  // Step 6: USDC approve → Permit2
  console.log('\n[6/8] USDC approve → Permit2...');
  const usdcApproveAmt = parseUnits('10', 18); // 10 USDC (18 decimals on Arc)
  await tryWrite(USDC, ERC20_ABI, 'approve', [PERMIT2, usdcApproveAmt], 'USDC→Permit2');

  // Step 7: Read EURC token info
  console.log('\n[7/8] Read EURC token info...');
  try {
    const name = await publicClient.readContract({ address: EURC, abi: ERC20_ABI, functionName: 'name' });
    const symbol = await publicClient.readContract({ address: EURC, abi: ERC20_ABI, functionName: 'symbol' });
    const supply = await publicClient.readContract({ address: EURC, abi: ERC20_ABI, functionName: 'totalSupply' });
    console.log(`  Name: ${name}, Symbol: ${symbol}, Supply: ${formatUnits(supply, 6)}`);
  } catch (e) {
    console.log(`  Token info read error: ${e.message}`);
  }

  // Step 8: Read FxEscrow contract info
  console.log('\n[8/8] Read FxEscrow contract...');
  try {
    // Try calling a view function if available
    const code = await publicClient.getCode({ address: FX_ESCROW });
    console.log(`  FxEscrow bytecode size: ${code ? (code.length - 2) / 2 : 0} bytes`);
    console.log(`  Contract exists: ${code && code !== '0x' ? 'YES' : 'NO'}`);
  } catch (e) {
    console.log(`  FxEscrow read error: ${e.message}`);
  }

  // Check Permit2 allowances
  try {
    const eurcAllowance = await publicClient.readContract({ address: EURC, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, PERMIT2] });
    const usdcAllowance = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, PERMIT2] });
    console.log(`  Permit2 allowances: EURC=${formatUnits(eurcAllowance, 6)}, USDC=${formatUnits(usdcAllowance, 18)}`);
  } catch (e) {
    console.log(`  Allowance check error: ${e.message}`);
  }

  // Final balances
  console.log('\n[Final Balances]');
  const finalEurc = await publicClient.readContract({ address: EURC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  const finalUsdc = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  console.log(`  EURC: ${formatUnits(finalEurc, 6)}`);
  console.log(`  USDC: ${formatUnits(finalUsdc, 18)}`);

  console.log(`\n=== Done: ${okCount} OK / ${failCount} FAIL ===\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
