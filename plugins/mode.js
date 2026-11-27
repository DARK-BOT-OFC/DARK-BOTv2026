module.exports = {
    name: 'modo',
    command: ['modo', 'public', 'private', 'self'],
    help: ['modo <public|private>', 'public', 'private'],
    rowner: true,
    run: async (sock, sender, m, args, { commandName }) => {
        if (!global.opts) global.opts = { self: false };

        const sub = (args[0] || commandName || '').toLowerCase();

        if (['public', 'publico', 'público'].includes(sub)) {
            global.opts.self = false;
            await m.reply('🌐 *¡Bot en Modo Público!* Cualquier usuario puede usar el bot.');
        } else if (['private', 'privado', 'self'].includes(sub)) {
            global.opts.self = true;
            await m.reply('🔒 *¡Bot en Modo Privado!* Solo el propietario puede interactuar.');
        } else {
            await m.reply(
                `ℹ️ *Estado actual:* ${global.opts.self ? '🔒 Privado (Solo Owner)' : '🌐 Público'}\n\n` +
                `Usa:\n• \`.public\` o \`.modo public\`\n• \`.private\` o \`.modo private\``
            );
        }
    }
};
