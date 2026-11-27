module.exports = {
    command: ['test'],
    description: 'Comando de prueba con argumentos',
    run: async (sock, senderNumber, m, args) => {
        // Si escribes '.test Hola mundo', args contendrá ['Hola', 'mundo']
        const argumentoTexto = args.length > 0 ? args.join(' ') : 'Ninguno';

        // Usamos m.chat para que responda correctamente al chat o grupo actual, 
        // y { quoted: m } de forma limpia o usando m.reply
        await sock.sendMessage(m.chat, { 
            text: `🧪 *PRUEBA DE PLUGIN EXITOSA*\n\n` +
                  `• Mensaje recibido correctamente.\n` +
                  `• Argumentos enviados: *${argumentoTexto}*` 
        }, { quoted: m });
    }
};
