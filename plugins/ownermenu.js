/********************************************
*                DARK-BOT-OFC                *
********************************************/
const fs = require('fs');
const path = require('path');
const { isOwner } = require('../owners');

// Función exacta basada en tu enable.js para leer los estados de la base de datos
function getConfigStatus(chatId) {
    try {
        let chat = global.db && global.db.chats && global.db.chats[chatId] ? global.db.chats[chatId] : {};
        return {
            bienvenida: chat.welcome ?? false, // En tu enable.js se guarda como chat.welcome
            antilink: chat.antilink ?? false,   // En tu enable.js se guarda como chat.antilink
        };
    } catch (e) {
        return { bienvenida: false, antilink: false };
    }
}

// Función auxiliar para verificar si un usuario es administrador del grupo
async function isAdmin(sock, chatId, userJid) {
    try {
        if (!chatId.endsWith('@g.us')) return false;
        let groupMetadata = await sock.groupMetadata(chatId);
        let participants = groupMetadata.participants || [];
        let userParticipant = participants.find(p => p.id === userJid);
        return userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');
    } catch (e) {
        return false;
    }
}

module.exports = {
    name: 'ownermenu',
    description: 'Menú de administración para el creador y administradores del grupo',
    help: ['ownermenu', 'panel', 'menuowner'],
    command: ['ownermenu', 'panel', 'menuowner'],
    run: async (sock, sender, m, args) => {
        let userJid = m.sender || sender;
        let chatId = m.chat || m;

        // Validaciones de permisos (Owner o Admin del grupo)
        let isUserOwner = isOwner(userJid, sock);
        let isUserAdmin = false;
        if (!isUserOwner) {
            isUserAdmin = await isAdmin(sock, chatId, userJid);
        }

        if (!isUserOwner && !isUserAdmin) {
            await sock.sendMessage(chatId, { 
                text: '⚠️ *¡Acceso denegado!* Este menú es de uso exclusivo para los administradores del grupo y el propietario del bot.' 
            }, { quoted: m });
            return;
        }

        const prefix = '.';
        
        // Estado del modo global del bot
        const isSelf = global.opts && global.opts.self;
        const estadoModoTexto = isSelf ? '🔒 Privado (Solo Owner)' : '🌐 Público';
        const publicIcon = !isSelf ? '🟢' : '🔴';
        const privateIcon = isSelf ? '🟢' : '🔴';

        // Obtenemos los estados actuales directamente de global.db.chats
        const status = getConfigStatus(chatId);

        // Iconos dinámicos en tiempo real para bienvenida y antilink
        const bienvenidaIcon = status.bienvenida ? '🟢' : '🔴';
        const antilinkIcon = status.antilink ? '🟢' : '🔴';

        let invokedBy = m.pushName || (userJid ? userJid.split('@')[0] : 'Usuario');
        let rolText = isUserOwner ? 'Owner (Acceso Absoluto)' : 'Administrador de Grupo';

        let ownerMenuText = `
*╭━━❍  𝕯𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ  ❍━━╮*
*┃ ╭━━━━━━━━━━━━━━━━╮*
*┃ ┃ ╭┈────────────╮*
*┃ ┃ │❍𝐏𝐀𝐍𝐄𝐋 𝐃𝐄 𝐂𝐎𝐍𝐓𝐑𝐎𝐋❍*
*┃ ┃ ╰┈────────────╯*
*┃ ┃ ╰━━━━━━━━━━━━━━━━╯*
*┣▢ 👑 𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐈𝐃Ο, ${invokedBy.toUpperCase()}*•
*┃╭━━━━━━━━━━━━━━━━╾•*
*┃┃  ❍ ⚡ PANEL DE GESTIÓN ❍*
*┃┣━━━━━━━━━━━━━━━━╾•*
*┃┃ ⋄ ESTADO GLOBAL: ${estadoModoTexto}*
*┃┃ ⋄ ROL: ${rolText}*
*┃╰━━━━━━━━━━━━━━━━╾•*
*╰━━━╼ 𝕮ᐃ⃟𝖗𝖑𝖔𝖘-⃫⍉𝕱𝕮ꤲ ╾━━━╯*
*╭────────────────────╮*
👑 *Comandos de Propietario / Control:*
• ${publicIcon} \`${prefix}public\` ➔ Cambiar a Público
• ${privateIcon} \`${prefix}private\` ➔ Cambiar a Privado
• ⚙️ \`${prefix}modo\` ➔ Estado general
• 🔄 \`${prefix}restart\` ➔ Reiniciar bot
• 🔄 PARA ACTUALIZAR MANUALMENTE ESCRIBE \`git pull\` DENTRO DE LA CARPETA DEL BOT EN TERMUX

⚙️ *Gestión de Grupos y Seguridad:*
• ${bienvenidaIcon} \`${prefix}enable / disable bienvenida\`
• ${antilinkIcon} \`${prefix}enable / disable antilink\`
*╰────────────────────╯*
> _Utiliza estas herramientas con precaución para administrar el núcleo de DARK-BOTv2026._
`.trim();

        let imagePath = path.join(__dirname, '../galería/darkbot3.jpg');

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, { 
                image: fs.readFileSync(imagePath), 
                caption: ownerMenuText, 
                quoted: m 
            });
        } else {
            await sock.sendMessage(chatId, { text: ownerMenuText }, { quoted: m });
        }
    }
};
