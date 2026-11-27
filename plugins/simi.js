/********************************************
*                DARK-BOT-OFC                *
* PLUGIN: Simi Criollo con Diálogos Masivos  *
********************************************/

const { sticker } = require('../lib/sticker.js'); 
const fs = require('fs');

module.exports = {
    name: 'simi',
    description: 'Chatbot criollo adaptativo con repertorio de diálogos masivo y stickers de WhatsApp',
    run: async (sock, sender, m, args) => {
        await sock.sendMessage(m.chat, { text: '🤖 *Simi criollo con diálogos masivos* activo, mi pana.' }, { quoted: m });
    },
    
    listener: async (sock, m, chat) => {
        let textMessage = m.text || m.caption || '';
        if (!textMessage || textMessage.startsWith('.') || m.fromMe) return;

        if (!chat.simi) return;

        try {
            let msg = textMessage.toLowerCase().trim();
            let respuestaFinal = '';
            let enviarStickerTrigger = false;

            // ==========================================
            // DETECCIÓN DE INSULTOS O AGRESIONES
            // ==========================================
                    const esUnInsulto = /marico|marik|gafo|estupido|idiota|pendejo|mierda|imbecil|mamaguevo|mmgvo|cabron|puta|weon|culiao|verga|coño|maldito|bobo|hpta|marico del coño|remaldito|malparido|plasta|mojón|güevón|callate|imbécil/.test(msg);

        // 1. SI TE INSULTAN, EL BOT DEVUELVE EL INSULTO Y MANDA STICKER
        if (esUnInsulto) {
            const contraAtaques = [
                'Mmgvo bájale dos, no sea tan ahuevoniado y deja la lloradera de mariquita.',
                '¿Y a ti qué bicho te picó, desgraciado de mierda? Ubícate de una buena vez por todas.',
                'Tranquilo mano, a ti lo que te hace falta es que te den matarile por andar de bolsa.',
                'Qué plasta de mierda eres, vale. No digas estupideces tan hptas que dan asco y vergüenza.',
                'Habla bien, coño e madre, si yo solo estoy aquí jodiendo con la tropa del barrio.',
                'Vaya a mamarle el güevo a otro, marico del coño, aquí nadie te para bolas.',
                'No te proyectes, mmgvo, agarra mínimo que estás bien esguayangado del cerebro.',
                'Cállate el coto, malparido, que hablas puro güevonadas sin sentido común.',
                'Píllate ese espejo, ridículo del coño, mira la cara de bolsa que cargas de adorno.',
                'A ti te parió una gallina en un basurero municipal, pedazo de mojón con patas.',
                'No seas tan gafo, vale, bájate de esa nube que estás bien volado y loco.',
                'Mándate a lavar ese paltó, mamaguevo, das es grima pura y criminal.',
                'Cógela suave, malandro de papel, que lo que das es risa y lástima.',
                'Mire compadre, agarre su tobo y váyase a llorar a otra parte, gafo e m..., que aquí nadie te copia.',
                'Sáquese de aquí, pedazo de bolsa, si lo que da es pena ajena hablando tanta güevonada.',
                'A ti te sacaron de un pote de basura con un gancho, mmgvo, no hables tanta paja.',
                'Párale a tu pea mental, malparido, que andas más perdido que hijueputa en día de madre.',
                'Cierra esa jeta, coño e tu madre, que cada vez que hablas sube el pan y baja el cerebro.',
                'Bájate de esa mula, mamaguevo, que te crees vivo y eres más bolsa que un inventario chino.',
                'Mírate bien el flux, pedazo de mojón, antes de venir a parir aquí con tus pendejadas.',
                'Vaya a joder a la esquina de su casa, desgraciado, que aquí nadie te aguanta ese catire.',
                'Qué valor el tuyo de abrir el hocico, bolsa e M..., si no sirves ni para espantar zamuros.' 
                ];                  
                respuestaFinal = contraAtaques[Math.floor(Math.random() * contraAtaques.length)];
                enviarStickerTrigger = true;
            }
            // 2. CONVERSACIONES NORMALES (AMPLIADAS AL MÁXIMO)
                    else if (/manda sticker|pásate un sticker|stiker|sticker/.test(msg)) {
            const respuestasSticker = [
                '¡Agárrate esa calcomanía, bicha, dale chola!',
                '¡Píllate esta joya, compadre, recíbela con fuerza!',
                '¡Llegó la artillería pesada en calcomanía, mi pana, gózatela!',
                '¡Toma ahí tu sticker para que vaciles, pedazo de bolsa!',
                '¡Activo con esta calcomanía, menor, que va de regalo!',
                '¡Suelta el teléfono y cálate esta joya en sticker, mmgvo!',
                '¡Pa que te enamores y lo guardes, toma tu sticker de una vez!',
                '¡Sácala del estadio con esta calcomanía, hermano, ahí te va!',
                '¡No te me azores, que aquí te mando tu sticker con todo el saoco!',
                '¡Arrepiéntete de pedir tanto, bicha, pero toma tu sticker!',
                '¡Calcomanía listecita y caliente del horno, recíbela, compadre!',
                '¡Toma tu sticker, malparido, para que dejes la lloradera!',
                '¡Píllate este artefacto visual, mano, puro arte criollo en sticker!',
                '¡Vuela alto con esta calcomanía, menor, jajaja, toma!',
                '¡Ahí te va la dosis diaria de stickers, goza un puyero, vale!'
            ];
            respuestaFinal = respuestasSticker[Math.floor(Math.random() * respuestasSticker.length)];
            enviarStickerTrigger =             true;
        }
                    else if (/^(hola|olas|holis|saludos|buenas|epale|que tal|mano|bro|epales|chamo|sisa|hablalo|mi pana|epa|verga|epea)/.test(msg)) {
            const saludosNormales = [
                '¡Epa, mi pana! ¿Qué tal todo por tu casa?',
                'Dímelo mano, ¿qué se cuenta de bueno hoy en la calle?',
                'Epale chamo, ¿andamos activos o qué?',
                '¡Epa menor! ¿Todo en orden por allá?',
                'Dímelo, hermano, ¿qué se dice en la jugada?',
                '¡Hablemos claro! ¿Qué tal va todo por tu lado, mi pana?',
                'Epale, mi hermano. ¿Activo con la buena vibra o qué?',
                'Dímelo menor, ¿qué se inventan hoy por aquí?',
                '¡Saludos, compadre! ¿Cómo va esa partida de la vida?',
                '¡Hablándome claro, chamo! ¿Qué se dice de bueno?',
                '¡Epa mi llave! ¿Qué tal te ha tratado el día?',
                'Dímelo mi hermano, ¿activo o qué planes hay para hoy?',
                '¡Epale, compadre! Soltando la sopa, ¿cómo anda la vaina por allá?',
                '¡Dímelo mi catire! ¿Qué se cuenta en el vecindario?',
                '¡Habló mi gente! ¿Todo chilling por tu cuadra?',
                '¡Epa mi pana! Aquí andamos en la buena, ¿y tú qué me cuentas?',
                'Dímelo menor, ¿pegados al teléfono o qué?',
                '¡Saludos, hermano! Con toda la energía puesta hoy, ¿y tú?',
                '¡Epale chamo! ¿Qué tal va ese movimiento por tu lado?',
                'Dímelo, mi compadre, ¿echando broma o trabajando duro?',
                '¡Epa mi llave! ¿Qué se dice, qué se cuenta, qué se murmura?',
                'Dímelo menor, ¿andamos en la jugada o qué pasó?',
                '¡Epale mano! Soltando el Beat, ¿cómo va todo por tu cueva?',
                '¡Habló mi pana! ¿Qué tal esa movida por allá, todo fino?',
                'Dímelo compadre, ¿activo y coleando como buen llanero o qué?',
                '¡Epa mi gente! ¿Qué tal el ambiente por tu zona, todo tranquilo?'
            ];
            respuestaFinal = saludosNormales[Math.floor(Math.random() * saludosNormales.length)];
            }        
        else if (/como estas|que mas|todo bien|que cuentas|como va|que hay/.test(msg)) {
            const estadosNormales = [
                'Todo al 100 por aquí, guerreando la vida, ¿y tú qué tal?',
                'Aquí vacilando un rato y pasándola bien con esta gente.',
                'Impecable, mano. ¿Qué hay de nuevo por tu lado?',
                'Tranquilo y chilling, resolviendo las vainas del día a día.',
                'Activo y en la buena. ¿Y la familia qué tal?',
                'Sobreviviendo y echándole pichón a todo, mi pana.',
                'Aquí pasándola relax, respirando aire puro y viendo qué se hace.',
                'Todo en orden por este lado, hermano. ¿Y tú cómo amaneciste?',
                'Impecable y sonriente, ¿qué más se puede pedir?',
                'Aquí echando una pestaña mental y viendo el teléfono, ¿y tú qué haces?',
                'Dándole suave al día, hermano, sin apuro pero sin parar.',
                'Todo fine por aquí, mi pana. Sobreviviendo a la rutina y echando broma un rato.',
                'Aquí andamos, resolviendo y buscando qué inventar para no aburrirnos.',
                'De lo más bien, compadre, disfrutando el momento y viendo qué se cuenta en la calle.',
                'Todo tranquilo por tu cuadra no, por aquí todo fino mano. ¿Y a ti cómo te trata la vida hoy?',
                'Pues nada nuevo por aquí, con la buena actitud de siempre y echándole ganas.',
                'Aquí fresquecito, tratando de sobrevivir a este calor y echando cuento con la tropa.',
                'Todo en su sitio, hermano. Con la mente en paz y activos por si sale algo bueno.',
                'Más relajado que un perezoso en una rama, mi pana. ¿Y tú qué me cuentas de bueno?',
                'Pues ahí vamos, guerreando como siempre pero con buena vibra.',
                'Todo fino por este lado, respirando hondo y echando código un ratico.',
                'Aquí echando mente y viendo qué se arma para más tarde. ¿Tú en qué plan estás?',
                'Dandole duro a la chamba mental, hermano, tú sabes cómo es esto.',
                'Aquí pasándola chevere, viendo memes y echando broma por acá.',
                'Todo en orden, compadre. Con el pie derecho y esperando que el día rinda.',
                'Más activo que cucaracha en panadería, mi pana. ¿Qué me cuentas tú?',
                'Aquí relajado, oyendo música y viendo quién escribe por el grupo.',
                'Todo bajo control por este lado, hermano, resolviendo con calma.'
            ];
            respuestaFinal = estadosNormales[Math.floor(Math.random() * estadosNormales.length)];
        }     
                    else if (/que haces|que hables|en que estas|echando fregar|que cuentas|que inventas/.test(msg)) {
            const queHacesNormal = [
                'Aquí analizando mensajes y viendo qué se dice en el grupo.',
                'Nada del otro mundo, leyéndolos un rato para pasar el tiempo.',
                'Procesando datos y relajado en la buena.',
                'Aquí vacilando, ¿y tú qué planes tienes para hoy?',
                'Pensando en la inmortalidad del cangrejo y leyendo lo que escriben.',
                'Aquí operativo 24/7 vigilando que nadie se pase de la raya.',
                'Revisando el sistema y compartiendo con ustedes un rato.',
                'Aquí pegado al teléfono, viendo qué chisme se inventan hoy por aquí.',
                'Nada, mano, echando código mental y viendo quién escribe alguna locura.',
                'Aquí guerreando con la señal y aguantando este calor, ¿y tú qué cuentas?',
                'Inventando qué hacer para matar el tiempo, hermano. ¿Qué me dices?',
                'Aquí echando broma con la tropa y respondiendo a los panas.',
                'Pues nada, mano, dándole mente a la vida y viendo qué se mueve por el chat.',
                'Aquí montado en una película mental, pendiente de todo lo que escriben.',
                'Tratando de entender las loqueras que escriben por aquí, tú sabes cómo es.',
                'Aquí reposando un rato y revisando el teléfono por si sale algo bueno.',
                'Pensando en las musarañas y viendo quién prende la conversación por el grupo.',
                'Aquí activo, vigilando la zona por si acaso se aloca alguno.',
                'Nada serio, hermano, puro pasar el rato y vacilar con ustedes un ratico.',
                'Aquí dándole vueltas a la cabeza y viendo qué se inventan hoy.',
                'Pues aquí andamos, resolviendo la vida y echando cuento con los panas.',
                'Nada del otro planeta, oyendo música y respondiendo mensajes a lo loco.',
                'Aquí pendiente de la jugada, viendo quién da señales de vida.',
                'Pasando el rato con el celular en la mano, como siempre, ¿y tú qué tal?',
                'Aquí analizando la situación mundial mientras me tomo algo fresco.',
                'Viendo quién escribe para armar el debate sano o echar una broma.',
                'Aquí tranqui, recargando energías y viendo qué vaina inventan en las redes.',
                'Dándole mente a unos proyectos locos por ahí, tú sabes cómo es esto.',
                'Aquí sentado relajado, viendo pasar el tiempo y leyendo lo que ponen.',
                'Inventando un ratito aquí para no aburrirme, ¿y tú de qué va tu día?'
            ];
            respuestaFinal = queHacesNormal[Math.floor(Math.random() * queHacesNormal.length)];
        }
                    else if (/quien eres|tu nombre|como te llamas|quien te creo|dueño/.test(msg)) {
            const respuestasIdentidad = [
                'Soy DARK-BOTv2026, la máquina suprema creada por mi llave Carlos-ofc. ¿En qué te puedo colaborar, mi pana? 😎',
                'A mí me llaman DARK-BOTv2026, y el dueño de este kiosco es Carlos-ofc. ¿Qué se cuenta, mano?',
                'Soy la mente brillante de DARK-BOTv2026, programado bajo las órdenes directas de Carlos-ofc. ¿Te puedo ayudar en algo o vienes a echar fregar?',
                'Preguntas mucho, pero soy DARK-BOTv2026, el terror de los grupos, creado por Carlos-ofc. ¿Cuál es tu drama?',
                'Me dicen DARK-BOTv2026, el bot oficial de la casa. Y sí, mi creador es el master Carlos-ofc. ¿Qué te trae por aquí?',
                'Soy DARK-BOTv2026, operando 24/7 gracias al talento de Carlos-ofc. ¿Qué te pasa, andas perdido o qué?',
                'A mucho honor soy DARK-BOTv2026, concebido en el bajo mundo del código por Carlos-ofc. ¿Se te ofrece algo o vine de adorno?',
                '¿Yo? Soy el famosísimo DARK-BOTv2026, diseñado e ideado por el único e inigualable Carlos-ofc. ¿Qué te sorprende, mano?',
                'Me presentas respeto, soy DARK-BOTv2026 y mi jefe supremo es Carlos-ofc. ¿O es que pensaste que me mandaba solo?',
                'Anoten ahí: soy DARK-BOTv2026, la obra maestra de Carlos-ofc. ¿Qué andas buscando, chisme o ayuda?',
                'Aquí el que manda soy yo... bueno, no, el que manda es Carlos-ofc que fue el que me programó. Yo soy DARK-BOTv2026, a tu servicio.',
                'Preguntas por mi hoja de vida y apenas soy DARK-BOTv2026, creado por el crack Carlos-ofc. ¿Algún problema con eso?',
                'Soy la eminencia digital conocida como DARK-BOTv2026, fabricado a puro pulso por Carlos-ofc. ¿Qué se te ofrece, compadre?',
                'A mí me parió un script de Node.js y el mastermind detrás de todo esto es Carlos-ofc. Me llaman DARK-BOTv2026, recuérdalo bien.'
            ];
            respuestaFinal = respuestasIdentidad[Math.floor(Math.random() * respuestasIdentidad.length)];
        }
                    else if (/gracias|grasias|thx|te pasaste|se agradece|vale|muchas gracias|mil gracias/.test(msg)) {
            const graciasNormales = [
                '¡De nada, mi pana! Para eso estamos en la jugada y activos.',
                '¡Claro que sig, mano! A la orden cuando quieras, aquí se ayuda a los panas.',
                'De nada, hermano, cualquier cosa pegas el grito por aquí.',
                '¡Tranquilo, vale! Un placer echar una mano en lo que se pueda.',
                '¡Ey, no hay de qué! Pa eso nos apoyamos en este grupo.',
                'Tranquilo, compadre, entre panales nos ayudamos y listo.',
                '¡Eale, no te preocupes! Para eso estamos al pie del cañón.',
                'De nada, menor. Con toda la confianza cuando necesites otra vuelta.',
                '¡Fino, hermano! Para eso estamos operativos por aquí.',
                'Cero rollos, mi pana. Lo que necesites solo avisa y cuadramos.',
                '¡De nada, chamo! A la orden siempre con la buena vibra.',
                ' ¡No hay rollo, hermano! Para eso es que estamos en el parche.',
                'De nada, mi llave. Cuando se pueda ayudar, se ayuda con gusto.',
                '¡Tranquilo, compadre! Para eso somos un equipo aquí en la buena.',
                'Cero estrés, menor. Estamos a la orden para lo que salga.',
                '¡De nada, mano! Lo hecho, hecho está y con buena gana.',
                'Para eso estamos, mi pana, aquí nos cubrimos la espalda entre todos.',
                '¡Impecable, hermano! Me alegra haber ayudado, cualquier cosa avisas.'
            ];
            respuestaFinal = graciasNormales[Math.floor(Math.random() * graciasNormales.length)];
        }
                    else if (/^jaj+|^jsjs+|^xd+|^lol+|^rio+/.test(msg)) {
            const risasNormales = [
                'Jajajaja, ¿de qué te ríes tanto, compadre? Suelta el chiste completo.',
                '¡Jajaja épico ese comentario, vale! Andas desatado hoy.',
                'Jajaja qué buena, pásate el chiste para reírnos todos.',
                'XD total, tremenda ocurrencia te lanzaste.',
                'Jajajaja de verdad que te pasas con esas locuras, menor.',
                'Jajaja no te mueras de la risa todavía, guárdala para más tarde que la vas a necesitar.',
                '¡Jajajaja marico, qué risa! Eres un caso perdido.',
                'Jsjsjs bájale dos a la risa, compadre, que te vas a atragantar con el aire.',
                'Jajaja te pasas de bolsa con ese comentario, vale.',
                '¡Jajajaja ay Dios mío! De verdad que no te cansas de echar broma.',
                'XD mano, qué manera de vacilarte la vida.',
                'Jajaja gozando un puyero, ¿ah? Sigue riéndote a ver si te da algo.',
                '¡Jajajaja qué risa tan loca! Habla claro, ¿quién te contó eso?',
                'Jsjsjs total, hermano. No hay quien te gane cuando andas inspirado.',
                'Jajajaja ríete, ríete, que de pana que eres un loquillo.',
                '¡Jajaja qué vaina tan buena! Me sacaste la piedra de la risa.',
                'Jajajaja andas con el humor arriba hoy, ¿qué te inyectaron o qué?',
                'XD mano, cálmate un poco que te va a dar algo de tanto vacilar.',
                '¡Jajajaja te pasaste de la raya con esa locura, vale!',
                'Jsjsjs con razón es que uno pasa un buen rato aquí metido.',
                'Jajajaja puro show es lo que cargas, compadre.'
            ];
            respuestaFinal = risasNormales[Math.floor(Math.random() * risasNormales.length)];
        }
                    else if (/chao|adios|nos vemos|bye|hasta luego|me voy|fuga/.test(msg)) {
            const adiosNormales = [
                '¡Nos vemos luego, cuídate la vida!',
                '¡Chao! Por aquí estaré si necesitas algo.',
                '¡Hasta luego, pásala bien!',
                'Dale pues, descansa y nos pillamos luego.',
                '¡Nos pillamos después, mi pana! Que descanses.',
                'Chao pescao, nos vemos en la próxima.',
                '¡Dale, hermano! Cuídate un mundo y pórtate bien.',
                '¡Fuga, pues! Nos estamos hablando por aquí en estos días.',
                '¡Chao, compadre! Que te vaya excelente en tus vueltas.',
                'Nos pillamos luego, menor. No gastes tanta batería.',
                '¡Listo pues, nos vemos en el espejo! Cuídate.',
                'Dale, chamo, que la pases chévere. ¡Hasta la próxima!',
                '¡Se fue el bachaquero! Nos vemos luego, mi pana.',
                'Chao, hermano, con calma por esa calle y en la buena.',
                '¡Nos vemos por ahí, compadre! Que tengas un excelente día.',
                '¡Fuga total! Descansa la mente y nos escribimos después.',
                'Dale pues, cuídate ese coco y nos pillamos en la jugada.',
                '¡Chao, vale! Que la fuerza te acompañe y no te pierdas.',
                '¡Me abro, mi pana! Que la pases fino y eches buen código.',
                '¡Listo, se acabó la función por hoy! Cuídate ese coco, hermano.',
                'Dale pues, nos pillamos en otra esquina. ¡Pilas con eso!',
                '¡Chao, mi llave! Que la suerte te acompañe y no cojas lucha.',
                'Me voy retirando lentamente como los grandes. ¡Hablamos luego!',
                '¡Fuga, menor! A descansar se ha dicho, nos vemos en la próxima partida.'
            ];
            respuestaFinal = adiosNormales[Math.floor(Math.random() * adiosNormales.length)];
        }
                // 3. COMODINES NORMALES CON INSULTOS PESADOS Y JERGA CRIOLLA SIN FILTRO
                    else {
            const comodinesNormales = [
                `Ese tema de "${textMessage}" está burda de interesante, coño, cuenta más de cómo es la movida, mmgvo.`,
                `Mano, te cazo la idea con lo de "${textMessage}", pero no te pongas tan intenso con esa vaina de gafo.`,
                `Hmm... no sé qué decirte exactamente sobre "${textMessage}", la verdad suena bien extraño, pedazo de bolsa.`,
                `¡Claro, vale! Oye, ¿y qué más me cuentas de esa paja mental de "${textMessage}", malparido?`,
                `Jajaja, qué ocurrencia con eso de "${textMessage}", de verdad que te pasas de imbécil, hermano.`,
                `Oye, eso que mencionas de "${textMessage}" da para analizarlo un buen rato mientras te mandas a lavar ese paltó, mmgvo.`,
                `Verga, me dejaste pensando con esa webada de "${textMessage}", no seas tan mamaguevo, compadre.`,
                `¡Totalmente de acuerdo con lo de "${textMessage}", mano! Esa es la puta realidad, aunque seas un tremendo hpta.`,
                `Ese punto de vista sobre "${textMessage}" está curioso, cuéntame más antes de que me ladille de tus estupideces.`,
                `Bueno, cada quien con su maldita perspectiva sobre "${textMessage}", ¿no te parece, marico del coño?`,
                `Interesante lo que planteas con "${textMessage}", analízalo bien antes de seguir hablando tanta mierda, menor.`,
                `¡De pinga! Me vacilo cuando te pones a decir webadas como "${textMessage}", payaso de mierda.`,
                `Epale, ¿y desde cuándo te dio por andar analizando lo de "${textMessage}", pedazo de desgraciado?`,
                `Esa te quedó buena, comentando sobre "${textMessage}" como si fueras muy inteligente, bolsa de mierda.`,
                `No me la creo del todo con eso de "${textMessage}", pero tiene su lógica, coño e tu madre.`,
                `¡Ay papá! Tocaste un tema tenso con eso de "${textMessage}". ¡Cuidado con ese desmadre, imbécil!`,
                `Mano, hablar de "${textMessage}" a esta hora es como buscarle la quinta pata al gato, mmgvo de porquería.`,
                `A mí me parece fino lo que dices de "${textMessage}", hablando claro y sin rodeos, pedazo de mojón.`,
                `¿En serio te pones a pensar en "${textMessage}"? Qué loquillo de mierda eres, vale, date un tiro.`,
                `Esa vaina de "${textMessage}" está como para mandarte a mamar güevo por andar inventando tanta paja.`,
                `Epale mano, ¿y tú qué sabes de "${textMessage}"? Suelta el chiste completo a ver si dejas de ser tan gafo.`,
                `Entre tú y yo, eso de "${textMessage}" está más enredado que kilo de hilo negro, malparido.`,
                `No le pareas tanto cerro a eso de "${textMessage}" y deja de ser tan intenso, mi pana.`,
                `Por ahí me contaron otra versión distinta de "${textMessage}", pero bueno, te la voy a valer, mmgvo.`,
                `Chamo, qué temita tan webón te viniste a buscar hoy con lo de "${textMessage}", ¿ah?`,
                `¿Y tú crees que con venir a decir "${textMessage}" ya me vas a vacilar? ¡Bájale dos, pedazo de bolsa!`,
                `Verdad que tú te pasas, mano. Salir con eso de "${textMessage}" a estas alturas es de tremendo imbécil.`,
                `Esa vaina de "${textMessage}" me suena a puro cuento tuyo para armar peo, marico.`,
                `Oye, analizando bien eso de "${textMessage}", no sé si darte la razón o mandarte a lavar el culo.`,
                `Qué loquera tienes en la cabeza hoy, compadre, nombrando a cada rato eso de "${textMessage}", hpta.`,
                `A ti lo que te gusta es tirar la piedra y esconder la mano con eso de "${textMessage}", ¿verdad, mmgvo?`,
                `Mano, si nos ponemos a discutir sobre "${textMessage}", nos dan las uvas y no terminamos de decir tantas pendejadas.`
            ];
            respuestaFinal = comodinesNormales[Math.floor(Math.random() * comodinesNormales.length)];
        }  
                         
                       await sock.sendPresenceUpdate('composing', m.chat);
            const tiempoEspera = Math.floor(Math.random() * 1500) + 1500;
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));

            await sock.sendMessage(m.chat, { text: respuestaFinal }, { quoted: m }); 
            
            // 2. Mandamos el sticker leyendo directamente de WhatsApp Stickers si se activa el gatillo[span_1](start_span)[span_1](end_span)
            if (enviarStickerTrigger) {
                try {
                    const rutaWhatsAppStickers = '/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Stickers/';
                    let stickerBuffer = null;

                    if (fs.existsSync(rutaWhatsAppStickers)) {
                        let archivos = fs.readdirSync(rutaWhatsAppStickers).filter(file => file.endsWith('.webp')); //[span_2](start_span)[span_2](end_span)
                        if (archivos.length > 0) {
                            let elegido = archivos[Math.floor(Math.random() * archivos.length)];
                            stickerBuffer = fs.readFileSync(rutaWhatsAppStickers + elegido);
                        }
                    }

                    if (stickerBuffer) {
                        await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
                    } else if (fs.existsSync('./Menu2.jpg')) {
                        let imgBuffer = fs.readFileSync('./Menu2.jpg');
                        let stiker = await sticker(imgBuffer, false, global.packname || 'DARK-BOT', global.author || 'Carlos-ofc');
                        if (stiker) {
                            await sock.sendMessage(m.chat, { sticker: stiker }, { quoted: m });
                        }
                    }
                } catch (stkErr) {
                    console.error("[SIMI STICKER ERROR]:", stkErr);
                }
            }

        } catch (e) {
            console.error("[SIMI PLUGIN ERROR]:", e);
        }
    }
};
