import { createWalletClient, createPublicClient, http, parseUnits, formatUnits, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.env.HOME || process.env.USERPROFILE, 'usyc-transfer', '.env') });
if (!dotenv.config({ path: resolve(process.env.HOME || process.env.USERPROFILE, 'deploy-contracts', '.env') }).parsed) {
  dotenv.config({ path: resolve(process.env.HOME || process.env.USERPROFILE, 'usyc-transfer', '.env') });
}

const PRIVATE_KEY = process.env.CAST_PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error('Missing CAST_PRIVATE_KEY in .env'); process.exit(1); }

const arcTestnet = defineChain({
  id: 9000, // Arc testnet chain ID
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
});

const USDC = '0x3600000000000000000000000000000000000000';
const USYC = '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C';
const TELLER = '0x9fdF14c5B14173D74C08Af27AebFf39240dC105A';
// Arc USDC is 18 decimals (native), USYC is 6 decimals
const USDC_DECIMALS = 18;
const USYC_DECIMALS = 6;
const DEPOSIT_AMOUNT = parseUnits('0.5', USDC_DECIMALS); // 0.5 USDC on Arc (18 decimals)

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
];

const TELLER_ABI = [
  { name: 'deposit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_assets', type: 'uint256' }, { name: '_receiver', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'redeem', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_shares', type: 'uint256' }, { name: '_receiver', type: 'address' }, { name: '_account', type: 'address' }], outputs: [{ type: 'uint256' }] },
];

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

async function waitTx(hash, label) {
  console.log(`  ${label} tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
  console.log(`  ${label} ${receipt.status === 'success' ? 'OK' : 'FAILED'}`);
  return receipt;
}

async function main() {
  console.log(`\n=== USYC Interact (Arc Testnet) ===`);
  console.log(`Wallet: ${account.address}`);

  // Check ETH balance
  const ethBal = await publicClient.getBalance({ address: account.address });
  console.log(`\n[Balances]`);
  console.log(`  ETH: ${formatUnits(ethBal, 18)}`);

  // Check USDC balance (Arc native USDC, 18 decimals)
  const usdcBal = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  console.log(`  USDC: ${formatUnits(usdcBal, USDC_DECIMALS)}`);

  // Check USYC balance
  const usycBal = await publicClient.readContract({ address: USYC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  console.log(`  USYC: ${formatUnits(usycBal, USYC_DECIMALS)}`);

  // Detect actual USDC decimals from contract
  try {
    const actualDecimals = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: 'decimals' });
    console.log(`  USDC decimals (on-chain): ${actualDecimals}`);
  } catch {}

  if (usdcBal < DEPOSIT_AMOUNT) {
    console.error(`Insufficient USDC (need ${formatUnits(DEPOSIT_AMOUNT, USDC_DECIMALS)}). Check faucet or bridge more.`);
    process.exit(1);
  }

  // Step 1: Approve USDC to Teller
  console.log(`\n[1/5] Approve ${formatUnits(DEPOSIT_AMOUNT, USDC_DECIMALS)} USDC to Teller...`);
  const allowance = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, TELLER] });
  if (allowance >= DEPOSIT_AMOUNT) {
    console.log('  Already approved, skipping');
  } else {
    const approveTx = await walletClient.writeContract({ address: USDC, abi: ERC20_ABI, functionName: 'approve', args: [TELLER, DEPOSIT_AMOUNT] });
    await waitTx(approveTx, 'Approve');
  }

  // Step 2: Deposit USDC → USYC
  console.log(`\n[2/5] Deposit ${formatUnits(DEPOSIT_AMOUNT, USDC_DECIMALS)} USDC → USYC...`);
  try {
    const depositTx = await walletClient.writeContract({ address: TELLER, abi: TELLER_ABI, functionName: 'deposit', args: [DEPOSIT_AMOUNT, account.address] });
    await waitTx(depositTx, 'Deposit');
  } catch (e) {
    console.error(`  Deposit failed: ${e.shortMessage || e.message}`);
    console.log('  Possible cause: entitlement check, or USDC decimals mismatch.');
    console.log('  Trying with 6 decimals...');
    try {
      const altAmount = parseUnits('0.5', 6);
      const approveTx2 = await walletClient.writeContract({ address: USDC, abi: ERC20_ABI, functionName: 'approve', args: [TELLER, altAmount] });
      await waitTx(approveTx2, 'Approve(6dec)');
      const depositTx2 = await walletClient.writeContract({ address: TELLER, abi: TELLER_ABI, functionName: 'deposit', args: [altAmount, account.address] });
      await waitTx(depositTx2, 'Deposit(6dec)');
    } catch (e2) {
      console.error(`  Retry also failed: ${e2.shortMessage || e2.message}`);
    }
  }

  // Step 3: Check new USYC balance
  console.log(`\n[3/5] Check USYC balance after deposit...`);
  const newUsycBal = await publicClient.readContract({ address: USYC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  console.log(`  USYC: ${formatUnits(newUsycBal, USYC_DECIMALS)}`);

  // Step 4: Redeem 50% of USYC → USDC
  const redeemAmount = newUsycBal / 2n;
  if (redeemAmount > 0n) {
    console.log(`\n[4/5] Redeem ${formatUnits(redeemAmount, USYC_DECIMALS)} USYC → USDC...`);
    try {
      const redeemTx = await walletClient.writeContract({ address: TELLER, abi: TELLER_ABI, functionName: 'redeem', args: [redeemAmount, account.address, account.address] });
      await waitTx(redeemTx, 'Redeem');
    } catch (e) {
      console.error(`  Redeem failed: ${e.shortMessage || e.message}`);
    }
  } else {
    console.log(`\n[4/5] No USYC to redeem, skipping`);
  }

  // Step 5: Final balances
  console.log(`\n[5/5] Final balances:`);
  const finalUsdc = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  const finalUsyc = await publicClient.readContract({ address: USYC, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] });
  console.log(`  USDC: ${formatUnits(finalUsdc, USDC_DECIMALS)}`);
  console.log(`  USYC: ${formatUnits(finalUsyc, USYC_DECIMALS)}`);

  console.log(`\n=== Done ===\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
