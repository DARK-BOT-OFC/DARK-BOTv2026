const { isOwner } = require('./owners.js');
const fs = require('fs');
const path = require('path');
const { smsg } = require('./simple.js');

// 1. CARGAR LA BASE DE DATOS INDEPENDIENTE AL INICIO
require('./database');

// Configuraciones globales iniciales
global.opts = global.opts || { self: false }; // false = Público, true = Privado (Solo Owner)
global.owner = global.owner || [];
global.db = global.db || { chats: {}, users: {} };

const commands = new Map();
const passiveListeners = [];
const loadedPlugins = [];
const pluginsPath = path.join(__dirname, 'plugins');

// Cargar plugins de la carpeta de forma robusta
if (fs.existsSync(pluginsPath)) {
    const pluginFiles = fs.readdirSync(pluginsPath).filter((file) => file.endsWith('.js'));

    for (const file of pluginFiles) {
        const filePath = path.join(pluginsPath, file);
        try {
            delete require.cache[require.resolve(filePath)];
            const plugin = require(filePath);
            if (!plugin) continue;

            loadedPlugins.push(plugin);

            if (typeof plugin.listener === 'function') {
                passiveListeners.push(plugin);
            }

            const cmdNames = plugin.command || plugin.help || (plugin.name ? [plugin.name] : []);
            const cmds = Array.isArray(cmdNames) ? cmdNames : [cmdNames];

            for (const c of cmds) {
                if (c instanceof RegExp) {
                    commands.set(c.toString(), plugin);
                } else if (typeof c === 'string' && c.trim()) {
                    const cleanCmd = c.trim().toLowerCase();
                    commands.set(cleanCmd, plugin);
                    console.log(`[PLUGIN LOADER] Cargado: .${cleanCmd}`);
                }
            }
        } catch (err) {
            console.error(`[PLUGIN LOADER] Error al cargar ${file}:`, err);
        }
    }
}

// Inicializar onLoad de los plugins una vez que el socket esté activo
const initPluginsOnLoad = (sockInstance) => {
    for (const plugin of loadedPlugins) {
        if (typeof plugin.onLoad === 'function') {
            try {
                plugin.onLoad(sockInstance);
            } catch (e) {
                console.error('[ONLOAD ERROR]:', e);
            }
        }
    }
};

const audiosMap = {
    'a': './media/a.mp3',
    'hola': './media/Hola.mp3',
    'anadieleimporta': './media/dylan1.mp3',
    'araara': './media/Ara.mp3',
    'mierdadebot': './media/insultar.mp3',
    'miardadebot': './media/insultar.mp3',
    'meardadebot': './media/insultar.mp3',
    'banate': './media/Banate.mp3',
    'baneado': './media/baneado.mp3',
    'bff': './media/bff.mp3',
    'bebitofiufiu': './media/bff.mp3',
    'buenasnoches': './media/boanoite.mp3',
    'boanoite': './media/boanoite.mp3',
    'buenastardes': './media/boatarde.mp3',
    'boatarde': './media/boatarde.mp3',
    'buenosdias': './media/Buenos-dias-2.mp3',
    'chicalgante': './media/chica lgante.mp3',
    'diagnosticadocongay': './media/DiagnosticadoConGay.mp3',
    'diagnosticadogay': './media/DiagnosticadoConGay.mp3',
    'esputo': './media/Es putoo.mp3',
    'esputoo': './media/Es putoo.mp3',
    'felizcumpleanos': './media/Feliz cumple.mp3',
    'happybirthday': './media/Feliz cumple.mp3',
    'fiestadeladmin': './media/admin.mp3',
    'fiestadeladministrador': './media/fiesta.mp3',
    'fiestadeladmin3': './media/Fiesta1.mp3',
    'atenciongrupo': './media/Fiesta1.mp3',
    'avisoimportante': './media/Fiesta1.mp3',
    'gemidos': './media/gemi2.mp3',
    'gemime': './media/gemi2.mp3',
    'gime': './media/gemi2.mp3',
    'gemi2': './media/gemi2.mp3',
    'audiohentai': './media/hentai.mp3',
    'hentai': './media/hentai.mp3',
    'sexo': './media/maau1.mp3',
    'horadesexo': './media/maau1.mp3',
    'laoracion': './media/ora.mp3',
    'labiblia': './media/ora.mp3',
    'maricatu': './media/cancion.mp3',
    'cancion1': './media/cancion.mp3',
    'maricaquien': './media/cancion.mp3',
    'murioelgrupo': './media/Murio.m4a',
    'grupomuerto': './media/Murio.m4a',
    'feliznavidad': './media/navidad.m4a',
    'merrychristmas': './media/navidad.m4a',
    'nochedepaz': './media/Noche.mp3',
    'nochedeamor': './media/Noche.mp3',
    'nyapasu': './media/otaku.mp3',
    'nyanpasu': './media/otaku.mp3',
    'gambure': './media/otaku.mp3',
    'yabure': './media/otaku.mp3',
    'homevengo': './media/vengo.mp3',
    'ohmevengo': './media/vengo.mp3',
    'omevengo': './media/vengo.mp3',
    'onichan': './media/Onichan.mp3',
    'oonichan': './media/Onichan.mp3',
    'pasapack': './media/Elmo.mp3',
    'vendestunudes': './media/Elmo.mp3',
    'pasavideohot': './media/Elmo.mp3',
    'pasatupack': './media/Elmo.mp3',
    'pasafotoshot': './media/Elmo.mp3',
    'vendestupack': './media/Elmo.mp3',
    'quienestusenpaibotsito': './media/Tu.mp3',
    'quienestusempaibotsito': './media/Tu.mp3',
    'rawr': './media/rawr.mp3',
    'raawwr': './media/rawr.mp3',
    'siu': './media/siu.mp3',
    'siiuu': './media/siu.mp3',
    'siuuu': './media/siu.mp3',
    'teamo': './media/Te-amo.mp3',
    'ootio': './media/oh_tio.mp3',
    'tioquerico': './media/oh_tio.mp3',
    'unpato': './media/pato.mp3',
    'uwu': './media/UwU.mp3',
    'vetealavrg': './media/vete a la verga.mp3',
    'vetealaverga': './media/vete a la verga.mp3',
    'fiestaviernes': './media/viernes.mp3',
    'viernes': './media/viernes.mp3',
    'vivan': './media/vivan.mp3',
    'vivanlosnovios': './media/vivan.mp3',
    'yamete': './media/Yamete-kudasai.mp3',
    'yametekudasai': './media/Yamete-kudasai.mp3',
    'epico': './media/Epico.mp3',
    'estovaaserepico': './media/Epico.mp3',
    'shitpost': './media/shitpost.mp3',
    'bienvenido': './media/bienvenido.mp3',
    'welcome': './media/bienvenido.mp3',
    'callafandebts': './media/callafandebts.mp3',
    'movistar': './media/movistar.mp3',
    'pinchemovistar': './media/movistar.mp3',
    'reglas': './media/reglasgrupo.mp3',
    'lasreglasdelgrupo': './media/reglasgrupo.mp3',
    'wtf': './media/wtf.mp3',
    'nodigasmamadas': './media/mmds.mp3',
    'mamadas': './media/mmds.mp3',
    'marico': './media/Efrain_gay.mp3',
    'gay': './media/Efrain_gay.mp3',
    'gey': './media/Efrain_gay.mp3',
    'mamalo': './media/mmgvo.mp3',
    'merwebo': './media/mmgvo.mp3',
    'mamaguevo': './media/mmgvo.mp3',
    'mmgvo': './media/mmgvo.mp3',
    'crack': './media/crack.mp3',
    'chad': './media/crack.mp3',
    'patria': './media/vivachavez.mp3',
    'socialismo': './media/vivachavez.mp3',
    'chavez': './media/vivachavez.mp3',
    'vivaelcomandante': './media/vivachavez.mp3',
    'hanbre': './media/hambre.mp3',
    'hambre': './media/hambre.mp3',
    'estanlistoschicos': './media/estan.mp3',
    'sicapitan': './media/estan.mp3',
    'amigo': './media/amigorodri.mp3',
    'mierda': './media/amigorodri.mp3',
    'carajo': './media/amigorodri.mp3',
    'seprendio': './media/seprendio.mp3',
    'rumba': './media/seprendio.mp3',
    'maldito': './media/maldito.mp3',
    'jodete': './media/maldito.mp3',
    'quienerestu': './media/quienere.mp3',
    'callate': './media/callate.mp3',
    'puta': './media/callate.mp3',
    'tumama': './media/tumama.mp3',
    'chavizta': './media/chavizta.mp3',
    'maduro': './media/chavizta.mp3',
    'yoquiero': './media/yoquiero.mp3',
    'fumado': './media/yoquiero.mp3',
    'barnei': './media/barnei.mp3',
    'varni': './media/barnei.mp3',
    'barny': './media/barnei.mp3',
    'barni': './media/barnei.mp3'
};

const handler = async (sock, chatUpdate) => {
    try {
        if (!global._pluginsLoaded) {
            global._pluginsLoaded = true;
            initPluginsOnLoad(sock);
        }

        const { messages, type } = chatUpdate || {};
        if (type !== 'notify' || !Array.isArray(messages) || !messages[0]) return;

        const msg = messages[0];
        if (!msg.message) return;

        const m = smsg(sock, msg);
        if (!m || !m.chat || !m.sender) return;

        const senderNumber = m.sender.replace(/[^0-9]/g, '');
        const userIsOwner = isOwner(m.sender, sock);

        if (msg.key?.fromMe && !userIsOwner) return;

        // Respetar modo privado (self = true) antes de procesar audios o listeners
        if (global.opts?.self && !userIsOwner) return;

        global.db.chats = global.db.chats || {};
        if (!global.db.chats[m.chat]) {
            global.db.chats[m.chat] = { autosticker: false, audios: true, simi: false };
        }

        global.db.users = global.db.users || {};
        if (!global.db.users[m.sender]) {
            global.db.users[m.sender] = {};
        }

        const chat = global.db.chats[m.chat];
        if (chat.audios === undefined) chat.audios = true;
        if (chat.simi === undefined) chat.simi = false;

        const textMessage = m.text || m.caption || '';
        const prefix = '.';

        // ==========================================
        // SISTEMA DE AUDIOS INTELIGENTE Y BLINDADO
        // ==========================================
        if (!chat.isBanned && chat.audios && textMessage) {
            const rawText = textMessage.toLowerCase().trim();
            const textClean = rawText
                .replace(/[\s\W_]+/g, '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            let vn = null;
            for (const key in audiosMap) {
                if (key === 'a' ? textClean === 'a' : textClean.includes(key)) {
                    vn = audiosMap[key];
                    break;
                }
            }

            if (vn && fs.existsSync(vn)) {
                try {
                    const stats = fs.statSync(vn);
                    if (stats.size >= 500) {
                        await sock.sendPresenceUpdate('recording', m.chat);
                        const audioBuffer = fs.readFileSync(vn);
                        await sock.sendMessage(
                            m.chat,
                            { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false },
                            { quoted: m }
                        );
                        return;
                    }
                } catch (e) {
                    console.error('[AUDIO ERROR]:', e);
                }
            }
        }

        // ==========================================
        // EJECUTAR LISTENERS PASIVOS (COMO SIMI Y AUTOSTICKER)
        // ==========================================
        if (!textMessage.startsWith(prefix) && !m.fromMe) {
            for (const plugin of passiveListeners) {
                try {
                    await plugin.listener(sock, m, chat, userIsOwner);
                } catch (e) {
                    console.error('[LISTENER ERROR]:', e);
                }
            }
        }

        if (!textMessage.startsWith(prefix) || textMessage.trim() === '.') return;

        const args = textMessage.slice(prefix.length).trim().split(/ +/);
        const commandName = (args.shift() || '').toLowerCase();
        if (!commandName) return;

        let command = commands.get(commandName);

        if (!command) {
            for (const [, val] of commands.entries()) {
                if (val.command instanceof RegExp && val.command.test(commandName)) {
                    command = val;
                    break;
                }
            }
        }

        if (!command) {
            if (['enable', 'disable', 'enableautosticker', 'disableautosticker'].includes(commandName)) {
                await sock.sendMessage(
                    m.chat,
                    { text: '*[❗] Esta función y sus comandos de configuración solo se pueden utilizar dentro de los grupos.*' },
                    { quoted: m }
                );
                return;
            }
            await m.reply('❌ Comando no reconocido. Usa `.menu` para ver los plugins disponibles.');
            return;
        }

        if (command.rowner && !userIsOwner) {
            await m.reply('⚠️ *¡Acceso denegado!* Este comando es de uso exclusivo para el propietario del bot.');
            return;
        }

        if (typeof command.run === 'function') {
            await command.run(sock, senderNumber, m, args, { isOwner: userIsOwner, commandName, conn: sock });
        } else if (typeof command === 'function') {
            await command(m, { conn: sock, usedPrefix: prefix, command: commandName, args, isOwner: userIsOwner });
        }
    } catch (error) {
        console.error('[ERROR] Error general en handler:', error);
    }
};

module.exports = handler;
