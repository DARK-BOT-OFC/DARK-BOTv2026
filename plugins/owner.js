/********************************************
*                DARK-BOT-OFC                *
********************************************/
const { isOwner } = require('../owners'); // Importamos la función de verificación centralizada

module.exports = {
    name: 'owner',
    description: 'Muestra la información y tarjeta de contacto del creador',
    help: ['owner', 'creator', 'dueño'],
    command: ['owner', 'creator', 'dueño'],
    run: async (sock, sender, m, args) => {
        // Verificamos si quien escribe (sender o m.sender) es el owner real
        let userJid = m.sender || sender;
        let soyYo = isOwner(userJid, sock);

        let ownerText = `
*╭━━❍𝕯𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ-[🄼🄳]❍━━╮*
*┃ ╭━━━━━━━━━━━━━━━━╮*
*┃ ┃ ╭┈────────────╮*
*┃ ┃ │❍   𝐂𝐑𝐄𝐀𝐃𝐎𝐑   ❍*
*┃ ┃ ╰┈────────────╯*
*┃ ┃ ╰━━━━━━━━━━━━━━━━╯*
*┣━━━▢ 👑 𝐃𝐀𝐑𝐊-𝐁𝐎𝐓𝐯2026 👑*•
*┃╭━━━━━━━━━━━━━━━━╾•*
*┃┃ ⋄ 👤 Nombre: Carlos-ofc*
*┃┃ ⋄ 📱 Número Principal: +58 412-3261234*
*┃┃ ⋄ 💻 ROL: ${soyYo ? '👑 Creador / Owner (Acceso Total)' : 'Desarrollador'}*
*┃╰━━━━━━━━━━━━━━━━╾•*
*╰━━━╼𝕯𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ-[🄼🄳]╾━━━╯*

> _Este es el contacto oficial del creador principal de DARK-BOTv2026._
`.trim();

        let chatId = m.chat || m;

        // Enviamos el texto decorado
        await sock.sendMessage(chatId, { text: ownerText }, { quoted: m });

        // Tarjeta de contacto vCard oficial con tu número correcto
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      'FN:Carlos-ofc [Owner Principal]\n' +
                      'ORG:DARK-BOTv2026;\n' +
                      'TEL;type=CELL;type=VOICE;waid=584123261234:+58 412-3261234\n' +
                      'END:VCARD';

        await sock.sendMessage(chatId, {
            contacts: {
                displayName: 'Carlos-ofc 👑',
                contacts: [{ vcard }]
            }
        }, { quoted: m });
    }
};
