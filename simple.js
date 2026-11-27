const { proto, getContentType, downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * Serializador universal y completo para Baileys (DARK-BOTv2026).
 * @param {import('@whiskeysockets/baileys').WASocket} conn 
 * @param {import('@whiskeysockets/baileys').WAMessage} m 
 */
function smsg(conn, m) {
    if (!m) return m;
    
    // 1. Metadatos principales de la clave y el chat
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : (m.isGroup ? m.key.participant : m.chat);
    }

    // 2. Extracción y normalización del contenido del mensaje
    if (m.message) {
        m.mtype = getContentType(m.message);
        
        // Soporte para mensajes temporales o de una sola visualización (ViewOnce)
        m.msg = (m.mtype === 'viewOnceMessage' || m.mtype === 'viewOnceMessageV2' || m.mtype === 'ephemeralMessage') 
            ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] 
            : m.message[m.mtype];

        // Extracción de texto o captions de manera inteligente
        m.body = (m.mtype === 'conversation') ? m.message.conversation :
                 (m.mtype === 'imageMessage') ? m.msg.caption :
                 (m.mtype === 'videoMessage') ? m.msg.caption :
                 (m.mtype === 'extendedTextMessage') ? m.msg.text :
                 (m.mtype === 'buttonsResponseMessage') ? m.msg.selectedButtonId :
                 (m.mtype === 'listResponseMessage') ? m.msg.singleSelectReply.selectedRowId :
                 (m.mtype === 'templateButtonReplyMessage') ? m.msg.selectedId : 
                 (m.msg && typeof m.msg.text === 'string') ? m.msg.text : '';
        
        m.text = m.body || '';

        // Detección de mensajes citados (Quoted)
        let quoted = m.msg?.contextInfo?.quotedMessage;
        if (quoted) {
            let type = getContentType(quoted);
            m.quoted = {
                mtype: type,
                msg: quoted[type],
                sender: m.msg.contextInfo.participant,
                fromMe: m.msg.contextInfo.participant === (conn.user.id.split(':')[0] + '@s.whatsapp.net'),
                key: {
                    remoteJid: m.chat,
                    fromMe: m.msg.contextInfo.participant === (conn.user.id.split(':')[0] + '@s.whatsapp.net'),
                    id: m.msg.contextInfo.stanzaId,
                    participant: m.msg.contextInfo.participant
                }
            };
            
            // Función de descarga para el mensaje citado
            m.quoted.download = async () => {
                let mediaType = type.replace('Message', '').toLowerCase();
                if (mediaType === 'viewonce') mediaType = 'image'; // Fallback común
                try {
                    let stream = await downloadContentFromMessage(m.quoted.msg, mediaType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    return buffer;
                } catch (e) {
                    console.error('[QUOTED DOWNLOAD ERROR]:', e);
                    return null;
                }
            };
        } else {
            m.quoted = null;
        }

        // ==========================================
        // 📥 FUNCIÓN DE DESCARGA MULTIMEDIA UNIVERSAL (m.download)
        // ==========================================
        m.download = async () => {
            let mediaMsg = m.msg;
            let type = '';
            
            if (/image/.test(m.mtype) || mediaMsg.mimetype || m.mtype === 'imageMessage') type = 'image';
            else if (/video/.test(m.mtype) || mediaMsg.mimetype || m.mtype === 'videoMessage') type = 'video';
            else if (/audio/.test(m.mtype) || mediaMsg.mimetype || m.mtype === 'audioMessage') type = 'audio';
            else if (/document/.test(m.mtype) || mediaMsg.mimetype || m.mtype === 'documentMessage') type = 'document';

            if (!type) return null;

            try {
                let stream = await downloadContentFromMessage(mediaMsg, type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
            } catch (e) {
                console.error('[MEDIA DOWNLOAD ERROR]:', e);
                return null;
            }
        };

        // ==========================================
        // 🤖 FUNCIÓN DE RESPUESTA RÁPIDA (m.reply)
        // ==========================================
        m.reply = async (text, chat = m.chat, options = {}) => {
            const cleanChat = chat.replace(/[^0-9]/g, '');
            
            console.log(`\n┌────────────────────────────────────────`);
            console.log(`│ 🤖 RESPUESTA DEL BOT`);
            console.log(`├────────────────────────────────────────`);
            console.log(`│ 📤 Para   : +${cleanChat}`);
            console.log(`│ 📝 Texto  : "${text}"`);
            console.log(`└────────────────────────────────────────\n`);
            
            return conn.sendMessage(chat, { text: text, ...options }, { quoted: m });
        };
    }

    return m;
}

module.exports = { smsg };
