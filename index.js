// ==========================================
//          ⚡ DARK-BOTv2026 ⚡
//          Enterprise Core / Carlos-ofc
// ==========================================

const { exec } = require('child_process');
const { registerProcessErrorHandlers } = require('./errorNotifier');
const startBot = require('./main');

registerProcessErrorHandlers();

const MAX_COLS = 42;
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const RED = '\x1b[31m';
const BRIGHT_RED = '\x1b[91m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function getCols() {
  const cols = process.stdout && typeof process.stdout.columns === 'number' && process.stdout.columns > 20
    ? process.stdout.columns
    : MAX_COLS;
  return Math.min(cols, MAX_COLS);
}

function centerLine(text, width, visibleLen) {
  const len = typeof visibleLen === 'number' ? visibleLen : text.length;
  const pad = Math.max(0, Math.floor((width - len) / 2));
  return `${' '.repeat(pad)}${text}`;
}

function showBanner() {
  const termCols = process.stdout && typeof process.stdout.columns === 'number' && process.stdout.columns > 20
    ? process.stdout.columns
    : MAX_COLS;
  const width = Math.min(termCols, MAX_COLS);

  console.clear();

  console.log(`${DIM}⚙️ PID #${process.pid} • Iniciando núcleo...${RESET}`);
  console.log(`${CYAN}$ [DARK-BOTv2026_CORE]${RESET}\n`);

  const frameTop = '╔══════════════════════════════════════╗';
  const frameBot = '╚══════════════════════════════════════╝';
  const artLines = [
    '║   █▀▄ ▄▀█ █▀█ █▄▀    █▄▄ █▀█ ▀█▀     ║',
    '║   █▄▀ █▀█ █▀▄ █▀▄    █▄█ █▄█  █      ║'
  ];

  const logoWidth = frameTop.length; // 40
  const centerWidth = Math.max(logoWidth, termCols);

  console.log(centerLine(`${RED}${frameTop}${RESET}`, centerWidth, logoWidth));
  for (const line of artLines) {
    console.log(centerLine(`${BRIGHT_RED}${BOLD}${line}${RESET}`, centerWidth, line.length));
  }
  console.log(centerLine(`${RED}${frameBot}${RESET}`, centerWidth, logoWidth));

  console.log('');
  console.log(centerLine(`${YELLOW}${BOLD}👑 carlos-ofc${RESET}`, centerWidth, 13));

  const sep = `${CYAN}${'─'.repeat(width)}${RESET}`;
  console.log(`\n${sep}`);
  console.log(`🧠 Core System ....... ${GREEN}[OK]${RESET}`);
  console.log(`📦 Build Version ..... ${CYAN}[v2026 1.0.0]${RESET}`);
  console.log(`🗄️  Database Sync ..... ${GREEN}[ONLINE]${RESET}`);
  console.log(`🔐 Session Restore ... ${GREEN}[SUCCESS]${RESET}`);
  console.log(`📱 WhatsApp Socket ... ${GREEN}[CONNECTED]${RESET}`);
  console.log(`🚀 Active Services ... ${YELLOW}[ALL]${RESET}`);
  console.log(`${sep}`);
}

function runGit(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

let isCheckingUpdate = false;

async function checkForUpdates() {
  if (isCheckingUpdate) return;
  isCheckingUpdate = true;

  try {
    await runGit('git fetch origin main');
    const { stdout: localHash } = await runGit('git rev-parse HEAD');
    const { stdout: remoteHash } = await runGit('git rev-parse origin/main');

    if (localHash && remoteHash && localHash !== remoteHash) {
      console.log(`\n${YELLOW}${BOLD}🔄 [AUTO-UPDATE] Nueva versión detectada en origin/main. Aplicando cambios...${RESET}`);
      await runGit('git pull origin main');
      console.log(`${GREEN}${BOLD}✅ [AUTO-UPDATE] Cambios descargados. Reiniciando núcleo...${RESET}`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`\n${DIM}[AUTO-UPDATE] Sin cambios o error de red: ${err.message}${RESET}`);
  } finally {
    isCheckingUpdate = false;
  }
}

function startAutoUpdateWatcher() {
  checkForUpdates();
  setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
}

showBanner();

startBot()
  .then(() => {
    startAutoUpdateWatcher();
  })
  .catch((err) => {
    console.error(`\n${BRIGHT_RED}${BOLD}💥 [ERROR CRÍTICO] Fallo en el núcleo:${RESET}`, err);
  });
  