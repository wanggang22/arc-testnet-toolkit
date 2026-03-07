import { execSync } from 'child_process';

// ============ 配置 ============
const CAST = 'C:\\Users\\Wang16\\.foundry\\bin\\cast.exe';
const RPC = 'https://rpc.testnet.arc.network';
const PRIVATE_KEY = '***REMOVED***';
const WALLET = '***REMOVED***';

// 合约地址
const USDC = '0x3600000000000000000000000000000000000000';
const EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
const PAYX = '0xA312c384770B7b49E371DF4b7AF730EFEF465913';
const DEX  = '0x73742278c31a76dBb0D2587d03ef92E6E2141023';
const VAULT = '0x240Eb85458CD41361bd8C3773253a1D78054f747';
const BRIDGE = '0xC5567a5E3370d4DBfB0540025078e283e36A363d';
const LP   = '0x3DF3966F5138143dce7a9cFDdC2c0310ce083BB1';

const AMT = '1000000';  // 1 USDC/EURC (6 decimals)

// ============ 工具函数 ============
function log(msg) {
  console.log(`[${new Date().toLocaleString()}] ${msg}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function cast(args) {
  const cmd = `${CAST} ${args} --rpc-url ${RPC} --private-key ${PRIVATE_KEY}`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', timeout: 30000 }).trim();
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: e.stderr || e.message };
  }
}

function sendTx(to, sig, args = '') {
  const argsStr = args ? ` ${args}` : '';
  return cast(`send ${to} "${sig}"${argsStr}`);
}

function deadline() {
  return Math.floor(Date.now() / 1000) + 3600; // 1小时后
}

// ============ 各交互操作 ============

// 1. PayX 打赏
async function doTip(username) {
  log(`  approve USDC → PayX...`);
  const a = sendTx(USDC, 'approve(address,uint256)', `${PAYX} ${AMT}`);
  if (!a.ok) { log(`    ❌ approve 失败: ${a.out}`); return false; }
  await sleep(3000);

  log(`  tip "${username}"...`);
  const t = sendTx(PAYX, 'tip(string,uint256,string)', `"${username}" ${AMT} ""`);
  if (!t.ok) { log(`    ❌ tip 失败: ${t.out}`); return false; }
  log(`    ✅ tip 成功`);
  return true;
}

// 2. DEX Swap (USDC → EURC)
async function doSwap() {
  log(`  approve USDC → DEX...`);
  const a = sendTx(USDC, 'approve(address,uint256)', `${DEX} ${AMT}`);
  if (!a.ok) { log(`    ❌ approve 失败: ${a.out}`); return false; }
  await sleep(3000);

  log(`  swap USDC → EURC...`);
  const dl = deadline();
  // swap((address,address,uint256,uint256,address,uint256))
  const s = sendTx(DEX, 'swap((address,address,uint256,uint256,address,uint256))', `"(${USDC},${EURC},${AMT},0,${WALLET},${dl})"`);
  if (!s.ok) { log(`    ❌ swap 失败: ${s.out}`); return false; }
  log(`    ✅ swap 成功`);
  return true;
}

// 3. DEX Swap 反向 (EURC → USDC)
async function doSwapReverse() {
  log(`  approve EURC → DEX...`);
  const a = sendTx(EURC, 'approve(address,uint256)', `${DEX} ${AMT}`);
  if (!a.ok) { log(`    ❌ approve 失败: ${a.out}`); return false; }
  await sleep(3000);

  log(`  swap EURC → USDC...`);
  const dl = deadline();
  const s = sendTx(DEX, 'swap((address,address,uint256,uint256,address,uint256))', `"(${EURC},${USDC},${AMT},0,${WALLET},${dl})"`);
  if (!s.ok) { log(`    ❌ swap 失败: ${s.out}`); return false; }
  log(`    ✅ swap 成功`);
  return true;
}

// 4. Vault 存款
async function doDeposit() {
  log(`  approve USDC → Vault...`);
  const a = sendTx(USDC, 'approve(address,uint256)', `${VAULT} ${AMT}`);
  if (!a.ok) { log(`    ❌ approve 失败: ${a.out}`); return false; }
  await sleep(3000);

  log(`  deposit to Vault...`);
  const d = sendTx(VAULT, 'deposit(uint256,address)', `${AMT} ${WALLET}`);
  if (!d.ok) { log(`    ❌ deposit 失败: ${d.out}`); return false; }
  log(`    ✅ deposit 成功`);
  return true;
}

// 5. Bridge 跨链
async function doBridge() {
  log(`  increaseAllowance USDC → Bridge...`);
  const a = sendTx(USDC, 'increaseAllowance(address,uint256)', `${BRIDGE} ${AMT}`);
  if (!a.ok) { log(`    ❌ increaseAllowance 失败: ${a.out}`); return false; }
  await sleep(3000);

  log(`  bridgeWithPreapproval...`);
  // bridgeWithPreapproval((uint256,uint256,uint256,bytes32,bytes32,address,address,uint32,uint32))
  const walletBytes32 = '0x000000000000000000000000' + WALLET.slice(2);
  const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const b = sendTx(BRIDGE, 'bridgeWithPreapproval((uint256,uint256,uint256,bytes32,bytes32,address,address,uint32,uint32))', `"(${AMT},0,0,${walletBytes32},${zeroBytes32},${USDC},${BRIDGE},0,1000)"`);
  if (!b.ok) { log(`    ❌ bridge 失败: ${b.out}`); return false; }
  log(`    ✅ bridge 成功`);
  return true;
}

// 6. 添加流动性
async function doAddLiquidity() {
  log(`  approve USDC → LP...`);
  const a1 = sendTx(USDC, 'approve(address,uint256)', `${LP} ${AMT}`);
  if (!a1.ok) { log(`    ❌ approve USDC 失败: ${a1.out}`); return false; }

  log(`  approve EURC → LP...`);
  const a2 = sendTx(EURC, 'approve(address,uint256)', `${LP} ${AMT}`);
  if (!a2.ok) { log(`    ❌ approve EURC 失败: ${a2.out}`); return false; }
  await sleep(3000);

  log(`  addLiquidity...`);
  const dl = deadline();
  // addLiquidity(uint256[],uint256,address,uint256)
  const lp = sendTx(LP, 'addLiquidity(uint256[],uint256,address,uint256)', `"[${AMT},${AMT}]" 0 ${WALLET} ${dl}`);
  if (!lp.ok) { log(`    ❌ addLiquidity 失败: ${lp.out}`); return false; }
  log(`    ✅ addLiquidity 成功`);
  return true;
}

// ============ 一轮执行 ============
async function runOneRound() {
  log('========== 开始 XyloNet 交互 ==========');
  let success = 0, fail = 0;

  const tasks = [
    ['PayX Tip #1', () => doTip('Xylonet_')],
    ['PayX Tip #2', () => doTip('CirclePay')],
    ['PayX Tip #3', () => doTip('ArcNetwork')],
    ['Swap USDC→EURC', () => doSwap()],
    ['Swap EURC→USDC', () => doSwapReverse()],
    ['Vault Deposit', () => doDeposit()],
    ['Bridge CCTP', () => doBridge()],
    ['Add Liquidity', () => doAddLiquidity()],
  ];

  for (const [name, fn] of tasks) {
    log(`▶ ${name}`);
    try {
      const ok = await fn();
      ok ? success++ : fail++;
    } catch (e) {
      log(`  ❌ 异常: ${e.message}`);
      fail++;
    }
    // 每次操作间隔 5-8 秒
    const delay = 5000 + Math.random() * 3000;
    await sleep(delay);
  }

  log(`========== 本轮完成: ✅${success} ❌${fail} (共${success + fail}组, ~${(success + fail) * 2}笔tx) ==========`);
  return { success, fail };
}

// ============ 主程序 ============
async function main() {
  log('XyloNet 自动交互工具');
  log(`钱包: ${WALLET}`);
  log(`操作: Tip×3, Swap×2, Deposit, Bridge, AddLiquidity (~18笔tx)`);
  await runOneRound();
}

main().catch(err => {
  log(`致命错误: ${err.message}`);
  process.exit(1);
});
