/********************************************
*                DARK-BOT-OFC                *
********************************************/
const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'info',
    description: 'Muestra información detallada del bot con imagen',
    help: ['info', 'infobot', 'estado'],
    command: ['info', 'infobot', 'estado'],
    run: async (sock, sender, m, args) => {
        const prefix = '.';
        const estadoModo = global.opts && global.opts.self ? '🔒 Privado (Solo Owner)' : '🌐 Público';
        
        // Calcular el tiempo activo (Uptime)
        let uptime = clockString(process.uptime() * 1000);
        
        // Uso de memoria del sistema
        let totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
        let freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
        
        let infoText = `
*╭━━❍  𝕯𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ  ❍━━╮*
*┃ ╭━━━━━━━━━━━━━━━━╮*
*┃ ┃ ╭┈────────────╮*
*┃ ┃ │❍  𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂𝐈Ó𝐍 ❍*
*┃ ┃ ╰┈────────────╯*
*┃ ┃ ╰━━━━━━━━━━━━━━━━╯*
*┣━━▢ 🤖𝐃𝐀𝐑𝐊-𝐁𝐎𝐓𝐯2026 🤖*•
*┃╭━━━━━━━━━━━━━━━━╾•*
*┃┃ ⋄ 👑 CREADOR: Carlos-ofc*
*┃┃ ⋄ 🚀 MOTOR: Baileys Core*
*┃┃ ⋄ 🕒 ACTIVO: ${uptime}*
*┃┃ ⋄ 🌎 ESTADO: ${estadoModo}*
*┃┃ ⋄ 💻 RAM LIBRE: ${freeMem} MB / ${totalMem} MB*
*┃┃ ⋄ 📂 PREFIJO: [ ${prefix} ]*
*┃╰━━━━━━━━━━━━━━━━╾•*
*╰━━━╼ 𝕮ᐃ⃟𝖗𝖑𝖔𝖘-⃫⍉𝕱𝕮ꤲ ╾━━━╯*

> _DARK-BOTv2026 está optimizado para ofrecer la máxima velocidad y estabilidad en Termux._
`.trim();

        let chatId = m.chat || m;

        // Ruta de la imagen en la subcarpeta galería dentro de la raíz
        let imagePath = path.join(__dirname, '../galería/grupos-oficiales.jpg');

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, { 
                image: fs.readFileSync(imagePath), 
                caption: infoText, 
                quoted: m 
            });
        } else {
            await sock.sendMessage(chatId, { text: infoText }, { quoted: m });
        }
    }
};

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
