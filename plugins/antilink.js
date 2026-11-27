module.exports = {
    command: [],
    help: ['antilink (automático)'],
    tags: ['group'],

    onLoad(sock) {
        if (!sock || typeof sock.ev?.on !== 'function') return;

        // Expresión regular mejorada para detectar CUALQUIER enlace web, redes sociales, dominios o URLs
        const linkRegex = /(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+[/#?]?.*|(chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}|whatsapp\.com\/channel\/[0-9A-Za-z]{20,24}|youtu\.be\/|youtube\.com\/|facebook\.com\/|instagram\.com\/|tiktok\.com\/|t\.me\/|telegram\.me\/|[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|net|org|edu|gov|mil|co|es|ve|me|io|info|biz|cc|xyz)\b)/i;

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                if (type !== 'notify') return;
                const m = messages[0];
                if (!m || !m.message || m.key.fromMe) return;

                const jid = m.key.remoteJid;
                // Solo actuar en grupos
                if (!jid || !jid.endsWith('@g.us')) return;

                // Verificar si el antilink está activado en la base de datos del grupo
                if (!global.db?.chats?.[jid]?.antilink) return;

                // Extraer el texto del mensaje
                const msg = m.message;
                const text = msg.conversation || 
                             msg.extendedTextMessage?.text || 
                             msg.imageMessage?.caption || 
                             msg.videoMessage?.caption || '';

                if (!text || !linkRegex.test(text)) return;

                const senderJid = m.key.participant || m.participant || jid;
                const cleanNumber = senderJid.replace(/[^0-9]/g, '');

                // Comprobar metadatos del grupo
                const groupMetadata = await sock.groupMetadata(jid).catch(() => null);
                if (!groupMetadata) return;

                const participants = groupMetadata.participants || [];
                const groupAdmins = participants.filter(p => p.admin).map(p => p.id.replace(/[^0-9]/g, ''));

                // Si el remitente es administrador, ignorar
                if (groupAdmins.includes(cleanNumber)) return;

                // Validación limpia del número del bot usando el formato correcto de Baileys
                const botNumber = sock.user && sock.user.id ? sock.user.id.replace(/[^0-9]/g, '').split(':')[0] : '';
                const senderIsBot = cleanNumber === botNumber;
                
                if (senderIsBot) return;

                // Extraer la descripción del grupo para las reglas
                const groupDesc = groupMetadata?.desc ? groupMetadata.desc.trim() : 'Sin descripción establecida.';

                // 1. Eliminar el mensaje con el enlace
                try {
                    await sock.sendMessage(jid, { delete: m.key });
                } catch (e) {
                    console.error('[ANTILINK] Error al borrar mensaje:', e);
                }

                // 2. Enviar la alerta estética con las reglas y la expulsión
                const alertaTexto = 
`╭━━━━━━━━━━━━━━━━━━━━╮
┃  🚫 *¡ANTI-LINK ACTIVADO!* 🚫
╰━━━━━━━━━━━━━━━━━━━━╯

👤 *Usuario:* @${cleanNumber}
⚠️ *Motivo:* Envío de enlaces prohibidos.

📜 *REGLAS DEL GRUPO:*
${groupDesc}

💀 *Estado:* Estás expulsado por marico. 

📌 _Las normas se respetan._`;

                await sock.sendMessage(jid, {
                    text: alertaTexto,
                    mentions: [senderJid]
                });

                // 3. Expulsar al usuario infractor del grupo
                try {
                    await sock.groupParticipantsUpdate(jid, [senderJid], 'remove');
                } catch (e) {
                    console.error('[ANTILINK] Error al expulsar usuario:', e);
                }

            } catch (err) {
                console.error('[ANTILINK PLUGIN ERROR]:', err);
            }
        });
    }
};
