module.exports = {
    command: [],
    help: ['bienvenida (automático)'],
    tags: ['group'],

    onLoad(sock) {
        if (!sock || typeof sock.ev?.on !== 'function') return;

        sock.ev.on('group-participants.update', async (anu) => {
            try {
                const jid = anu.id;
                
                // Verificar si la base de datos y la bienvenida están activadas
                if (!global.db?.chats?.[jid]?.welcome) return;

                const groupMetadata = await sock.groupMetadata(jid).catch(() => null);
                const groupName = groupMetadata?.subject || 'este grupo';
                const totalMiembros = groupMetadata?.participants?.length || 'varios';
                
                const defaultAvatar = 'https://i.ibb.co/3Fh9V6p/avatar-default.png';

                for (let participant of anu.participants) {
                    const userJid = typeof participant === 'string' ? participant : (participant.id || participant.jid || '');
                    if (!userJid) continue;

                    // Extraer solo los números limpios para mostrar en texto (ej. 584123261234)
                    const cleanNumber = userJid.replace(/[^0-9]/g, '');

                    let ppUrl;
                    try {
                        ppUrl = await sock.profilePictureUrl(userJid, 'image');
                    } catch (e) {
                        ppUrl = defaultAvatar;
                    }

                    // 🟢 ENTRADA AL GRUPO ('add')
                    if (anu.action === 'add') {
                        const textoBienvenida = 
`╭━━━━━━━━━━━━━━━━━━━━╮
┃  ✨ *¡BIENVENIDO/A!* ✨
╰━━━━━━━━━━━━━━━━━━━━╯

👋 ¡Hola +${cleanNumber}! Qué alegría tenerte en *${groupName}*.

📝 *FICHA DE PRESENTACIÓN*
╭────────────────────
│ 📸 *Foto:* (Envía una tuya)
│ 🎂 *Edad:* 
│ 📍 *De dónde eres:* 
╰────────────────────

👥 Contigo ya somos *${totalMiembros}* miembros.
📌 _Lee las reglas en la descripción y disfruta tu estadía._`;

                        await sock.sendMessage(jid, {
                            image: { url: ppUrl },
                            caption: textoBienvenida,
                            mentions: [userJid] // Esto realiza la etiqueta oficial de WhatsApp alfanumérica sin fallar
                        });
                    }

                    // 🔴 SALIDA O EXPULSIÓN ('remove')
                    if (anu.action === 'remove') {
                        const textoDespedida = 
`╭━━━━━━━━━━━━━━━━━━━━╮
┃   👋 *¡HASTA PRONTO!* 🥀
╰━━━━━━━━━━━━━━━━━━━━╯

+${cleanNumber} ha salido de *${groupName}*.

📉 Ahora quedamos *${totalMiembros}* miembros en el grupo.
✨ _¡Te deseamos mucho éxito en tu camino!_`;

                        await sock.sendMessage(jid, {
                            image: { url: ppUrl },
                            caption: textoDespedida,
                            mentions: [userJid]
                        });
                    }
                }
            } catch (err) {
                console.error('[WELCOME PLUGIN ERROR]:', err);
            }
        });
    }
};
