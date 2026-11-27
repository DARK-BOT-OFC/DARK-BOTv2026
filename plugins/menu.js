/********************************************
*                DARK-BOT-OFC                *
********************************************/
const fs = require('fs');
const path = require('path');
const { isOwner } = require('../owners');

module.exports = {
    name: 'menu',
    description: 'Muestra el menú principal de comandos',
    help: ['menu', 'help'],
    run: async (sock, sender, m, args) => {
        const prefix = '.';
        const estadoModo = global.opts && global.opts.self ? '🔒 Privado (Solo Owner)' : '🌐 Público';
        
        let userJid = m.sender || sender;
        let soyYo = isOwner(userJid, sock);
        
        let username = soyYo ? 'Carlos (Owner)' : (sender || 'Usuario');
        let rolText = soyYo ? 'Owner (Acceso Total 👑)' : 'Usuario';

        let menuText = `
*╭━━❍  𝕯𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ  ❍━━╮*
*┃ ╭━━━━━━━━━━━━━━━━╮*
*┃ ┃ ╭┈────────────╮*
*┃ ┃ │❍  𝐌𝐄𝐍𝐔 𝐏𝐑𝐈𝐍𝐂𝐈𝐏𝐀𝐋 ❍*
*┃ ┃ ╰┈────────────╯*
*┃ ╰━━━━━━━━━━━━━━━━╯*
*┣━▢ ❤𝐇𝐎𝐋𝐀, ${username}❤*•
*┃╭━━━━━━━━━━━━━━━━╾•*
*┃┃  ❍ ⚡ DARK-BOTv2026 ❍*
*┃┣━━━━━━━━━━━━━━━━╾•*
*┃┃ ⋄ CREADOR: Carlos-ofc*
*┃┃ ⋄ ESTADO: ${estadoModo}*
*┃┃  ROL: ${rolText}*
*┃╰━━━━━━━━━━━━━━━━╾•*
*╰━━╼  𝕮ᐃ⃟𝖗𝖑𝖔𝖘-⃫⍉𝕱𝕮ꤲ  ╾━━╯*
*╭────────────────────╮*
   📂 *Comandos Generales:*
• \`${prefix}menu\` - Muestra este menú
• \`${prefix}menufun\` - menú de funciones
• \`${prefix}info\` - Información del bot
• \`${prefix}owner\` - Contacto del creador
• \`${prefix}estado\` - Estado del bot


  👑 *Panel de Administración:*
• \`${prefix}ownermenu\` (o \`${prefix}panel\`) - Abre el menú de Owner
*╰────────────────────╯*
`.trim();

        let chatId = m.chat || m;
        let imagePath = path.join(__dirname, '../Menu2.jpg');

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, { 
                image: fs.readFileSync(imagePath), 
                caption: menuText, 
                quoted: m 
            });
        } else {
            await sock.sendMessage(chatId, { text: menuText }, { quoted: m });
        }
    }
};
