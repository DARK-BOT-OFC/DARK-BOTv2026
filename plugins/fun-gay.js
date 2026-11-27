let handler = async (m, { conn, text, usedPrefix, command }) => {
    let fs = require('fs');
    let vn = './media/gay2.mp3';
    
    // Lógica para detectar a quién va dirigido
    let who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender);
    
    // Obtenemos la foto de perfil del objetivo seleccionado
    let avatar = await conn.profilePictureUrl(who, 'image').catch(_ => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');
    
    // URL de la API de canvas
    let url = `https://some-random-api.com/canvas/gay?avatar=${encodeURIComponent(avatar)}`;

    // 1. Enviamos la imagen generada
    await conn.sendMessage(m.chat, { 
        image: { url: url }, 
        caption: '*🏳️‍🌈 𝙼𝙸𝚁𝙴𝙽 𝙰 𝙴𝚂𝚃𝙴 𝙶𝙰𝚈 🏳️‍🌈*' 
    }, { quoted: m });

    // 2. Enviamos el audio como archivo multimedia (ptt: false) para que luzca igual al módulo de audios
    await conn.sendMessage(m.chat, { 
        audio: fs.readFileSync(vn), 
        mimetype: 'audio/mpeg', 
        ptt: false 
    }, { quoted: m });
}

handler.command = ['gay', 'gey', 'marico'];
handler.tags = ['juegos'];
handler.help = ['gay'];

module.exports = handler;
