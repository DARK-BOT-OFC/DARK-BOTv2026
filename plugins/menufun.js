/********************************************
*                DARK-BOT-OFC                *
********************************************/
const fs = require('fs');
const path = require('path');
const { isOwner } = require('../owners');

module.exports = {
    name: 'menufun',
    description: 'Muestra el menú de entretenimiento y funciones multimedia',
    help: ['menufun', 'fun'],
    run: async (sock, sender, m, args) => {
        const prefix = '.';
        let userJid = m.sender || sender;
        let soyYo = isOwner(userJid, sock);
        let username = soyYo ? 'Carlos (Owner)' : (sender || 'Usuario');

        // Leer el estado actual del chat desde la base de datos
        let chatId = m.chat;
        if (!global.db.chats) global.db.chats = {};
        if (!global.db.chats[chatId]) global.db.chats[chatId] = { autosticker: false, audios: true, simi: false };
        let chat = global.db.chats[chatId];

        // Definir los indicadores visuales según el estado
        let simiStatus = chat.simi ? '🟢 ACTIVO' : '🔴 DESACTIVADO';
        let audiosStatus = chat.audios ? '🟢 ACTIVO' : '🔴 DESACTIVADO';
        let stickerStatus = chat.autosticker ? '🟢 ACTIVO' : '🔴 DESACTIVADO';

        let funMenuText = `
*╭──[  ༒𝕯𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ   ]──╮*
    🎢\`MENU DE DIVERSIÓN\`🎮
*│   👤 User:* ${username}   *│
*╰────────────────────╯*
*╭───────────────────╮*
🤖 *CHATS*
• Simi: \`${prefix}enable / disable simi\`
   ↳ Estado: *${simiStatus}*

🔊 *MULTIMEDIA*
• Audios: \`${prefix}enable / disable audios\`
   ↳ Estado: *${audiosStatus}*

✨ *STICKERS*
• personalizado: \`${prefix}s + texto\`
• Atajo: Envía foto con \`${prefix}s\`
• Auto: \`${prefix}enable / disable autosticker\`
   ↳ Estado: *${stickerStatus}*
   
 🏳️‍🌈 *HACER GEY*
• Atajo: \`.gay/marico/gey\`

🎵 *Descargar Música*
• MP3 \`.play <canción>\`
• VIDEO \`.play2 <canción>\`

🤖 *IA*
• Pide a la IA \`${prefix}bot + texto\`

⚙️ *CONFIGURACIÓN*
• Usa \`${prefix}enable [función]\` para activar.
*╰────────────────────╯*
`.trim();

        let imagePath = path.join(__dirname, '../Menu2.jpg');

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, { 
                image: fs.readFileSync(imagePath), 
                caption: funMenuText, 
                quoted: m 
            });
        } else {
            await sock.sendMessage(chatId, { text: funMenuText }, { quoted: m });
        }
    }
};
