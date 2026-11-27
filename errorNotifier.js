// ==========================================
//      🚨 DARK-BOTv2026 Error Notifier 🚨
// ==========================================

const OWNER_JID = '584123261234@s.whatsapp.net';
const COOLDOWN_MS = 15 * 1000;

let activeSock = null;
let lastSentAt = 0;
let lastSignature = '';
let isSending = false;

function setNotifierSocket(sock) {
  if (sock) {
    activeSock = sock;
  }
}

function explainError(err) {
  const msg = String((err && (err.message || err.stack || err)) || '');
  const code = (err && err.code) || '';

  if (/Cannot find module|MODULE_NOT_FOUND/i.test(msg) || code === 'MODULE_NOT_FOUND') {
    return 'Falta instalar un paquete o la ruta del require(...) está mal escrita. Revisa el nombre del archivo o ejecuta npm install.';
  }
  if (/ENOENT/i.test(msg) || code === 'ENOENT') {
    return 'No existe un archivo o carpeta esperada (por ejemplo, una imagen en galería/, sesión o ruta mal puesta).';
  }
  if (/EACCES|EPERM/i.test(msg) || code === 'EACCES' || code === 'EPERM') {
    return 'Termux o Node no tiene permiso sobre ese archivo o carpeta. Revisa permisos o storage.';
  }
  if (/ETIMEDOUT|ECONNRESET|EAI_AGAIN|ENOTFOUND|network|fetch failed|socket hang up/i.test(msg)) {
    return 'Hubo un corte o caída de internet, DNS o servidor externo al consultar red/API.';
  }
  if (/Connection Closed|Stream Errored|restart required|401|428|515/i.test(msg)) {
    return 'Se cerró o reinició el socket de WhatsApp/Baileys (por red, sesión o conflicto de conexión).';
  }
  if (/SyntaxError|Unexpected token|Unexpected end of JSON/i.test(msg)) {
    return 'Hay un error de sintaxis en algún archivo .js o un JSON corrupto/incompleto.';
  }
  if (/ENOSPC/i.test(msg) || code === 'ENOSPC') {
    return 'El almacenamiento del dispositivo en Termux está lleno y no puede escribir archivos.';
  }
  if (/out of memory|heap out of memory|ENOMEM/i.test(msg)) {
    return 'Termux se quedó sin memoria RAM disponible al procesar algo pesado (como video, imagen o descarga).';
  }

  return 'Ocurrió una excepción no controlada en ejecución; revisa el archivo y la línea del error específico.';
}

function formatReport(source, err) {
  const errName = (err && err.name) || 'Error';
  const errMsg = (err && err.message) || String(err || 'Error desconocido');
  const rawStack = (err && err.stack) ? String(err.stack) : errMsg;
  const shortStack = rawStack.split('\n').slice(0, 6).join('\n').slice(0, 1200);
  const reason = explainError(err);
  const timeStr = new Date().toLocaleString('es-VE', { hour12: false });

  return [
    '🚨 *ALERTA DE ERROR — DARK-BOTv2026*',
    `🕒 *Hora:* ${timeStr}`,
    `📍 *Origen:* ${source}`,
    `⚠️ *Tipo:* ${errName}`,
    '',
    '❌ *Error específico:*',
    `\`${errMsg.slice(0, 400)}\``,
    '',
    '💡 *Por qué sucedió:*',
    reason,
    '',
    '📋 *Detalle técnico:*',
    `\`\`\`${shortStack}\`\`\``
  ].join('\n');
}

async function notifyOwnerError(source, err) {
  console.error(`\n[ERROR ${source}]:`, err);

  const signature = `${source}:${(err && err.message) || String(err)}`;
  const now = Date.now();

  if (signature === lastSignature && now - lastSentAt < COOLDOWN_MS) {
    return;
  }

  if (!activeSock || !activeSock.user || isSending) {
    return;
  }

  isSending = true;
  lastSignature = signature;
  lastSentAt = now;

  try {
    await activeSock.sendMessage(OWNER_JID, {
      text: formatReport(source, err)
    });
  } catch (sendErr) {
    console.error('[ERROR NOTIFIER FALLÓ AL ENVIAR]:', sendErr.message || sendErr);
  } finally {
    isSending = false;
  }
}

function registerProcessErrorHandlers() {
  if (global.__darkBotErrorHandlersRegistered) return;
  global.__darkBotErrorHandlersRegistered = true;

  process.on('uncaughtException', (err) => {
    notifyOwnerError('uncaughtException', err);
  });

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    notifyOwnerError('unhandledRejection', err);
  });
}

module.exports = {
  setNotifierSocket,
  notifyOwnerError,
  registerProcessErrorHandlers
};
