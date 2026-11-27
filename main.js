const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const readline = require('readline');
const pino = require('pino');
const PhoneNumber = require('awesome-phonenumber');
const handler = require('./handler');
const { isOwner } = require('./owners.js');
const { detectNationAndRegion } = require('./lib/regiones');
const { setNotifierSocket, notifyOwnerError } = require('./errorNotifier');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// Mapa en memoria para asignar una IP falsa distinta a cada persona
const fakeIpByUser = new Map();

function getFakeIpForUser(userKey) {
    if (fakeIpByUser.has(userKey)) {
        return fakeIpByUser.get(userKey);
    }

    let ip;
    do {
        const oct1 = Math.floor(Math.random() * 223) + 1;
        const oct2 = Math.floor(Math.random() * 256);
        const oct3 = Math.floor(Math.random() * 256);
        const oct4 = Math.floor(Math.random() * 254) + 1;
        ip = `${oct1}.${oct2}.${oct3}.${oct4}`;
    } while (Array.from(fakeIpByUser.values()).includes(ip));

    fakeIpByUser.set(userKey, ip);
    return ip;
}

function formatInternationalNumber(rawJid) {
    if (!rawJid) return 'Desconocido';
    const isLid = rawJid.endsWith('@lid');
    let cleanPart = rawJid.split('@')[0];
    if (cleanPart.includes(':')) {
        cleanPart = cleanPart.split(':')[0];
    }
    const digits = cleanPart.replace(/[^0-9]/g, '');
    if (!digits) return isLid ? 'LID: Desconocido' : 'Desconocido';
    if (isLid) return `LID:${digits}`;
    if (digits.length < 7 || digits.length > 15) return '+' + digits;
    try {
        const intl = PhoneNumber('+' + digits).getNumber('international');
        return intl || ('+' + digits);
    } catch {
        return '+' + digits;
    }
}

async function resolveRealSenderJid(sock, rawJid, groupMeta = null) {
    if (!rawJid) return rawJid;
    if (!rawJid.endsWith('@lid')) return rawJid;

    try {
        if (sock.signalRepository?.lidMapping?.getPNForLID) {
            const pn = await sock.signalRepository.lidMapping.getPNForLID(rawJid);
            if (pn) return pn;
        }
    } catch {}

    if (groupMeta?.participants?.length) {
        const cleanTarget = rawJid.split(':')[0];
        const found = groupMeta.participants.find((p) => {
            const pId = p.id ? p.id.split(':')[0] : '';
            const pLid = p.lid ? p.lid.split(':')[0] : '';
            return pId === cleanTarget || pLid === cleanTarget;
        });
        if (found?.jid && !found.jid.endsWith('@lid')) return found.jid;
        if (found?.phoneNumber) {
            const num = String(found.phoneNumber).replace(/[^0-9]/g, '');
            if (num) return `${num}@s.whatsapp.net`;
        }
    }

    return rawJid;
}

function formatTimeNow() {
    return new Date().toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function getMessageDescription(m) {
    const msg = m.message || {};
    const msgType = Object.keys(msg)[0] || '';

    const text =
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        '';

    if (text) return text;
    if (msgType === 'stickerMessage' || msg.stickerMessage) return '[📦 STICKER]';
    if (msgType === 'audioMessage' || msg.audioMessage || msgType === 'pttMessage' || msg.pttMessage) {
        const isVoice = msg.audioMessage?.ptt || msg.pttMessage;
        return isVoice ? '[🎤 NOTA DE VOZ / AUDIO]' : '[🎵 AUDIO]';
    }
    if (msgType === 'imageMessage' || msg.imageMessage) return '[📷 IMAGEN]';
    if (msgType === 'videoMessage' || msg.videoMessage) return '[🎥 VIDEO]';
    if (msgType === 'documentMessage' || msg.documentMessage) return '[📄 DOCUMENTO]';
    if (msgType === 'contactMessage' || msg.contactMessage || msg.contactsArrayMessage || msg.contactsArrayMessage) {
        return '[👤 CONTACTO]';
    }
    if (msgType === 'locationMessage' || msg.locationMessage || msg.liveLocationMessage || msg.liveLocationMessage) {
        return '[📍 UBICACIÓN]';
    }
    return msgType ? `[MEDIA: ${msgType}]` : '[SIN CONTENIDO]';
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_bot');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    setNotifierSocket(sock);

    if (!sock.authState.creds.registered) {
        console.log('\n[DARK-BOTv2026] Dispositivo no vinculado.');
        let phoneNumber = await question('Introduce tu número de WhatsApp (ej: 58412xxxxxxx): ');
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        let formattedPairingNumber = '+' + phoneNumber;
        try {
            formattedPairingNumber = PhoneNumber('+' + phoneNumber).getNumber('international') || ('+' + phoneNumber);
        } catch {
            formattedPairingNumber = '+' + phoneNumber;
        }

        console.log(`\n[DARK-BOTv2026] Generando código para ${formattedPairingNumber}...`);
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(` 🔑 CÓDIGO DE EMPAREJAMIENTO: ${code}`);
                console.log(`========================================\n`);
                console.log('Ingresa este código en WhatsApp > Dispositivos vinculados.');
            } catch (err) {
                console.error('[DARK-BOTv2026] Error al generar código:', err);
                await notifyOwnerError('main/requestPairingCode', err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            setNotifierSocket(sock);
            console.log('\n========================================');
            console.log('  🚀 DARK-BOTv2026 CONECTADO Y ACTIVO  ');
            console.log('  OPERATOR: Carlos-ofc                  ');
            console.log('========================================\n');
        } else if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`⚠️ [DARK-BOTv2026] Conexión cerrada (Código: ${reason}). Reconectando...`);

            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Sesión cerrada permanentemente. Borra "sesion_bot" y reinicia.');
                process.exit(0);
            } else {
                startBot();
            }
        }
    });

    // --- MANEJADOR DE MENSAJES ENTRANTES ---
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m) return;

            let remoteJid = m.key.remoteJid;
            let participant = m.key.participant;
            let isFromMe = m.key.fromMe;
            let isGroup = remoteJid.endsWith('@g.us');

            // Nombre del grupo y metadatos si aplica (el grupo no lleva IP)
            let groupName = 'N/A';
            let groupMeta = null;
            if (isGroup) {
                try {
                    groupMeta = await sock.groupMetadata(remoteJid);
                    groupName = groupMeta?.subject || remoteJid;
                } catch {
                    groupName = remoteJid;
                }
            }

            // Determinar el JID real del remitente
            let senderJid = isGroup ? (participant || remoteJid) : remoteJid;
            if (isFromMe && sock.user && sock.user.id) {
                senderJid = sock.user.id;
            }
            senderJid = await resolveRealSenderJid(sock, senderJid, groupMeta);

            // Extraer y formatear el número de teléfono en formato internacional
            const senderNumber = formatInternationalNumber(senderJid);
            const nationInfo = detectNationAndRegion(senderJid);
            const ubicacionTexto = nationInfo.isLid
                ? `${nationInfo.flag} ${nationInfo.country} (${nationInfo.region})`
                : `${nationInfo.flag} ${nationInfo.country} — ${nationInfo.region}${nationInfo.prefix ? ` [${nationInfo.prefix}]` : ''}`;

            let senderName = m.pushName || 'Sin Nombre';
            if (isFromMe) {
                senderName = '🤖DATK-BOT🤖';
            }

            const userKey = senderNumber && senderNumber !== 'Desconocido' ? senderNumber : senderJid;
            const fakeIp = getFakeIpForUser(userKey);
            const horaMensaje = formatTimeNow();
            const tipoChat = isGroup ? 'GRUPO' : 'CHAT PRIVADO';
            const iconoTipo = isGroup ? '👥' : '💬';
            const contenidoMensaje = getMessageDescription(m);

            // Registro limpio y visual en la consola de Termux
            console.log('╭──────────────────────────────────────────');
            console.log(`│ 🕒 HORA          : ${horaMensaje}`);
            console.log(`│ ${iconoTipo} TIPO DE CHAT  : ${tipoChat}`);
            if (isGroup) {
                console.log(`│ 🏷️  GRUPO         : ${groupName}`);
            }
            console.log(`│ 👤 USUARIO       : ${senderName} (${senderNumber})`);
            console.log(`│ 🌍 NACIÓN/REGIÓN : ${ubicacionTexto}`);
            console.log(`│ 🌐 IP RASTREADA  : ${fakeIp}`);
            console.log(`│ 📄 MENSAJE       : ${contenidoMensaje}`);
            console.log('╰──────────────────────────────────────────');

            // Pasamos el socket y el evento completo al handler central
            await handler(sock, chatUpdate);

        } catch (error) {
            console.error('[DARK-BOTv2026] Error en el handler de mensajes:', error);
            await notifyOwnerError('main/messages.upsert', error);
        }
    });
}

module.exports = startBot;
