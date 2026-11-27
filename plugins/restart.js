const fs = require('fs');
const path = require('path');
const { isOwner } = require('../owners');

const STATE_FILE = path.join(process.cwd(), '.restart-state.json');

module.exports = {
    command: ['restart', 'reiniciar'],
    help: ['restart'],
    tags: ['owner'],

    async run(sock, senderNumber, m, args, extra) {
        const jid = m.chat || m.key.remoteJid;
        const candidate = senderNumber || m?.key?.participant || m?.key?.remoteJid || '';

        if (!isOwner(candidate, sock)) {
            return sock.sendMessage(
                jid,
                { text: '❌ Solo el *owner* o quien ejecuta el bot pueden usar este comando.' },
                { quoted: m }
            );
        }

        try {
            fs.writeFileSync(STATE_FILE, JSON.stringify({
                jid,
                key: m?.key || null,
                timestamp: Date.now()
            }), 'utf8');
        } catch (err) {
            console.error('[RESTART] Error guardando estado:', err);
        }

        await sock.sendMessage(
            jid,
            { text: '🔄 *Reiniciando DARK-BOTv2026...*' },
            { quoted: m }
        );

        setTimeout(() => {
            process.exit(0);
        }, 800);
    }
};
