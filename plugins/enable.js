const normalizeNum = (jid = '') => String(jid).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
    if (!m.isGroup) {
        return await conn.sendMessage(
            m.chat,
            { text: '*[❗] Esta función y sus comandos de configuración solo se pueden utilizar dentro de los grupos.*' },
            { quoted: m }
        );
    }

    const sender = m.sender || m.key?.participant || m.participant || '';
    const senderNum = normalizeNum(sender);

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
    const participants = groupMetadata?.participants || [];

    const userIsAdmin = participants.some((p) => {
        const isAdminRole = p.admin === 'admin' || p.admin === 'superadmin';
        if (!isAdminRole) return false;
        const pNum = normalizeNum(p.id || p.jid || '');
        return p.id === sender || p.jid === sender || (senderNum && pNum && senderNum === pNum);
    });

    const ownerList = Array.isArray(global.owner)
        ? global.owner.map((v) => normalizeNum(Array.isArray(v) ? v[0] : v))
        : [];
    const botOwner = senderNum ? ownerList.includes(senderNum) : false;

    if (!userIsAdmin && !botOwner && !isOwner) {
        return await conn.sendMessage(
            m.chat,
            { text: '*[❗] Lo siento, este comando solo puede ser utilizado por los **Administradores** del grupo o el **Owner** del bot.*' },
            { quoted: m }
        );
    }

    const cmdLower = (command || '').toLowerCase();
    const isDisableCmd = /^(disable|apagar|desactivar|off|false|0)$/i.test(cmdLower);
    const isEnable = !isDisableCmd;

    let type = '';

    if (cmdLower.includes('autosticker') || cmdLower.includes('auotosticker')) {
        type = 'autosticker';
    } else if (cmdLower.includes('audios')) {
        type = 'audios';
    } else if (cmdLower.includes('simi')) {
        type = 'simi';
    } else if (cmdLower.includes('bienvenida') || cmdLower.includes('welcome')) {
        type = 'welcome';
    } else if (cmdLower.includes('antilink') || cmdLower.includes('antienlaces')) {
        type = 'antilink';
    } else if (cmdLower.includes('antiporno') || cmdLower.includes('nsfw')) {
        type = 'antiporno';
    } else {
        type = (args[0] || '').toLowerCase();
    }

    if (type === 'bienvenida') type = 'welcome';
    if (type === 'antienlaces' || type === 'antilinks') type = 'antilink';
    if (type === 'nsfw') type = 'antiporno';

    global.db = global.db || { chats: {}, users: {} };
    global.db.chats = global.db.chats || {};
    global.db.chats[m.chat] = global.db.chats[m.chat] || {};
    const chat = global.db.chats[m.chat];

    const options = {
        autosticker: 'Autosticker',
        antilink: 'Antienlaces (Antilink)',
        welcome: 'Mensaje de Bienvenida',
        antifake: 'Anti Números Falsos',
        detect: 'Detección de Cambios en Grupo',
        simi: 'Chatbot Simi',
        audios: 'Audios Automáticos',
        antiporno: 'Anti-Pornografía / NSFW'
    };

    if (!options[type]) {
        return await conn.sendMessage(
            m.chat,
            {
                text: `*[❗] Por favor especifica una función válida.*\nEjemplos:\n• ${usedPrefix}enable autosticker\n• ${usedPrefix}enable bienvenida\n• ${usedPrefix}enable antilink\n• ${usedPrefix}enable antiporno`
            },
            { quoted: m }
        );
    }

    if (chat[type] === isEnable) {
        return await conn.sendMessage(
            m.chat,
            { text: `*[ ℹ️ ] La función *${options[type]}* ya se encontraba ${isEnable ? '🟢 ACTIVADA' : '🔴 DESACTIVADA'} en este chat.*` },
            { quoted: m }
        );
    }

    chat[type] = isEnable;

    const estadoTexto = isEnable ? '🟢 *ACTIVADO*' : '🔴 *DESACTIVADO*';
    const mensajeRespuesta = `*[ ⚙️ CONFIGURACIÓN DE GRUPO ]*\n\n> La función *${options[type]}* ha sido ${estadoTexto} correctamente para este chat. ༒𝕯𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ`;

    await conn.sendMessage(m.chat, { text: mensajeRespuesta }, { quoted: m });
};

handler.help = [
    'enable autosticker', 'disable autosticker',
    'enable bienvenida', 'disable bienvenida',
    'enable antilink', 'disable antilink',
    'enable audios', 'disable audios',
    'enable antiporno', 'disable antiporno',
    'enable', 'disable'
];
handler.tags = ['group', 'config'];
handler.command = [
    'enable', 'disable', 'encender', 'apagar', 'activar', 'desactivar',
    'enableautosticker', 'disableautosticker', 'enableauotosticker',
    'enableaudios', 'disableaudios',
    'enablesimi', 'disablesimi',
    'enablebienvenida', 'disablebienvenida',
    'enableantilink', 'disableantilink',
    'enableantiporno', 'disableantiporno',
    'enablensfw', 'disablensfw'
];

module.exports = handler;
