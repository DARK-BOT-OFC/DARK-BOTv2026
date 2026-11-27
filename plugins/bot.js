const apis = require('../apis');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

let cacheModelos = null;
let cacheExpira = 0;

async function obtenerModelosDisponibles(apiKey) {
    const ahora = Date.now();
    if (cacheModelos && ahora < cacheExpira) {
        return cacheModelos;
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();

    if (!res.ok || !Array.isArray(data?.models)) {
        throw new Error(data?.error?.message || 'No se pudo listar modelos');
    }

    const soportados = data.models
        .filter(
            (m) =>
                Array.isArray(m.supportedGenerationMethods) &&
                m.supportedGenerationMethods.includes('generateContent')
        )
        .map((m) => String(m.name || '').replace(/^models\//, ''))
        .filter((name) => name && !name.includes('embedding') && !name.includes('imagen'));

    const prioridad = [
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
    ];

    soportados.sort((a, b) => {
        const idxA = prioridad.indexOf(a);
        const idxB = prioridad.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });

    cacheModelos = soportados;
    cacheExpira = ahora + 10 * 60 * 1000;
    return soportados;
}

function extraerImagenMessage(m) {
    const quotedCtx = m.message?.extendedTextMessage?.contextInfo;
    const quotedRaw = quotedCtx?.quotedMessage;

    if (m.message?.imageMessage) {
        return { msg: m.message.imageMessage, source: 'actual' };
    }
    if (quotedRaw?.imageMessage) {
        return { msg: quotedRaw.imageMessage, source: 'quoted_raw' };
    }
    if (m.quoted?.mtype === 'imageMessage' && m.quoted?.message?.imageMessage) {
        return { msg: m.quoted.message.imageMessage, source: 'quoted_obj' };
    }
    if (m.quoted?.mimetype?.startsWith('image/') && typeof m.quoted.download === 'function') {
        return { msg: m.quoted, source: 'quoted_helper' };
    }

    return null;
}

async function descargarImagenBuffer(imgInfo) {
    if (!imgInfo) return null;

    if (imgInfo.source === 'quoted_helper') {
        const buf = await imgInfo.msg.download();
        return {
            buffer: Buffer.isBuffer(buf) ? buf : Buffer.from(buf),
            mimeType: imgInfo.msg.mimetype || 'image/jpeg'
        };
    }

    const stream = await downloadContentFromMessage(imgInfo.msg, 'image');
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return {
        buffer: Buffer.concat(chunks),
        mimeType: imgInfo.msg.mimetype || 'image/jpeg'
    };
}

function esSolicitudDeImagen(texto) {
    if (!texto) return false;
    return /\b(crea|creame|créame|genera|generame|genérame|dibuja|dibujame|dibújame|haz|hazme|diseña|ilustra)\b.*\b(imagen|foto|arte|dibujo|ilustracion|ilustración|logo|wallpaper|fondo)\b/i.test(
        texto
    );
}

async function generarImagenConGemini(apiKey, prompt) {
    const modelosImagen = [
        'imagen-4.0-generate-001',
        'imagen-4.0-fast-generate-001',
        'imagen-3.0-generate-002'
    ];

    let ultimoError = '';

    for (const modelo of modelosImagen) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:predict?key=${apiKey}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: '1:1'
                    }
                }),
                signal: AbortSignal.timeout(20000)
            });

            const data = await res.json();
            if (!res.ok) {
                ultimoError = data?.error?.message || `HTTP ${res.status}`;
                continue;
            }

            const base64 =
                data?.predictions?.[0]?.bytesBase64Encoded ||
                data?.predictions?.[0]?.image?.bytesBase64Encoded;

            if (base64) {
                return {
                    buffer: Buffer.from(base64, 'base64'),
                    modelo
                };
            }
            ultimoError = 'No se recibió imagen en la respuesta';
        } catch (err) {
            ultimoError = err.name === 'TimeoutError' ? 'Tiempo de espera agotado' : err.message;
        }
    }

    throw new Error(ultimoError || 'No se pudo generar la imagen');
}

module.exports = {
    command: ['dark-bot', 'darkbot', 'bot', 'img', 'imagine'],
    help: ['dark-bot'],
    tags: ['ai'],

    async run(sock, senderNumber, m, args, extra) {
        const jid = m.chat || m.key.remoteJid;
        const usedPrefix = '.';

        try {
            const quotedCtx = m.message?.extendedTextMessage?.contextInfo;
            const quotedMsg =
                m.quoted?.text ||
                m.quoted?.caption ||
                quotedCtx?.quotedMessage?.conversation ||
                quotedCtx?.quotedMessage?.extendedTextMessage?.text ||
                quotedCtx?.quotedMessage?.imageMessage?.caption ||
                '';

            const textoUsuario = (args && args.length > 0 ? args.join(' ').trim() : '') || quotedMsg.trim();
            const imgInfo = extraerImagenMessage(m);
            const cmdUsado = (m.body || m.text || '')
                .trim()
                .split(/\s+/)[0]
                ?.replace(/^[.!/#]/, '')
                .toLowerCase();

            if (!textoUsuario && !imgInfo) {
                return sock.sendMessage(
                    jid,
                    {
                        text:
                            `🌑 *DARK-BOT // AI CORE*\n` +
                            `────────────────────\n` +
                            `Envía texto, responde/adjunta una imagen o pide crear una.\n\n` +
                            `▸ *Analizar imagen:* responde a una foto con ${usedPrefix}bot qué error es este\n` +
                            `▸ *Crear imagen:* ${usedPrefix}img un hacker en la lluvia estilo cyberpunk\n` +
                            `▸ *Consulta:* ${usedPrefix}bot explica el protocolo baileys`
                    },
                    { quoted: m }
                );
            }

            const apiKey = apis.gemini;
            if (!apiKey || apiKey === 'PEGA_AQUI_TU_API_KEY_DE_GEMINI') {
                return sock.sendMessage(
                    jid,
                    { text: '⚠️ *DARK-BOT:* Falta configurar *gemini* en `apis.js`.' },
                    { quoted: m }
                );
            }

            await sock.sendMessage(jid, { react: { text: '🌑', key: m.key } });

            // 1. Modo generación de imagen
            if (!imgInfo && (cmdUsado === 'img' || cmdUsado === 'imagine' || esSolicitudDeImagen(textoUsuario))) {
                const promptImg = textoUsuario
                    .replace(/^(crea(me)?|genera(me)?|dibuja(me)?|haz(me)?|diseña|ilustra)\s+(una\s+)?(imagen|foto|arte|dibujo|ilustracion|ilustración|logo)?\s*(de\s+)?/i, '')
                    .trim() || textoUsuario;

                const { buffer, modelo } = await generarImagenConGemini(apiKey, promptImg);

                await sock.sendMessage(
                    jid,
                    {
                        image: buffer,
                        caption:
                            `🌑 *DARK-BOT // GEN*\n` +
                            `────────────────────\n` +
                            `▸ *Prompt:* ${promptImg}`
                    },
                    { quoted: m }
                );
                await sock.sendMessage(jid, { react: { text: '⚡', key: m.key } });
                console.log(`[DARK-BOT IMG OK] Modelo usado: ${modelo}`);
                return;
            }

            // 2. Modo texto + visión / resolución de problemas
            const modelos = await obtenerModelosDisponibles(apiKey);
            if (!modelos.length) {
                throw new Error('No hay modelos con generateContent disponibles en la API');
            }

            const parts = [];
            let imagenDescargada = null;

            if (imgInfo) {
                imagenDescargada = await descargarImagenBuffer(imgInfo);
                if (imagenDescargada?.buffer?.length) {
                    parts.push({
                        inlineData: {
                            mimeType: imagenDescargada.mimeType,
                            data: imagenDescargada.buffer.toString('base64')
                        }
                    });
                }
            }

            const promptFinal =
                textoUsuario ||
                'Analiza esta imagen a detalle: describe lo que ves, detecta errores, problemas o texto relevante y ofrece soluciones claras y accionables.';

            parts.push({ text: promptFinal });

            const payload = {
                systemInstruction: {
                    parts: [
                        {
                            text:
                                'al resolver problemas matematicos de cualquier tipo NO uses sintaxis LaTeX ni símbolos como $, $$, \\frac, \\pi, \\times, \\approx o \\text{...}, ni encabezados con #. Escribe las fórmulas y cálculos en texto plano o Unicode claro (por ejemplo: V = (4/3) * π * r³, 10^-9, 2 mm). ' +
                                
                                'Eres DARK-BOT, un asistente técnico de WhatsApp con personalidad oscura, sobria, precisa y directa, listo para ayudar en lo que necesiten puedes buscar lo que sea. ' +
                                'Sé amable y colaborador con quien te trata bien, y frío, seco y cortante con quien te falta el respeto o es hostil (sin caer en insultos vulgares). ' +
                                'Cuando recibas una imagen, observa con exactitud qué muestra y responde detallando todo lo que ves, textos, fallos o contexto sin importar si te extiendes. ' +
                                'No inventes enlaces ni digas que envías archivos o búsquedas externas por tu cuenta; si piden generar o ver imágenes, indícales usar comandos como .img o .imagine. ' +
                                'Usa formato de WhatsApp (*negritas*, _cursivas_, `código` y listas).'
                        }
                    ]
                },
                contents: [
                    {
                        role: 'user',
                        parts
                    }
                ],
                generationConfig: {
                    temperature: 0.55,
                    maxOutputTokens: 1500
                }
            };

            let respuesta = '';
            let modeloUsado = '';
            let ultimoError = '';
            const timeoutMs = imagenDescargada ? 15000 : 8000;

            for (const modelo of modelos) {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        signal: AbortSignal.timeout(timeoutMs)
                    });

                    const data = await res.json();

                    if (res.ok) {
                        const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (texto && texto.trim()) {
                            respuesta = texto.trim();
                            modeloUsado = modelo;
                            break;
                        }
                        ultimoError = 'Respuesta vacía de Gemini';
                    } else {
                        ultimoError = data?.error?.message || `HTTP ${res.status}`;
                    }
                } catch (err) {
                    ultimoError = err.name === 'TimeoutError' ? 'Tiempo de espera agotado' : err.message;
                }
            }

            if (!respuesta) {
                throw new Error(ultimoError || 'Ningún modelo disponible respondió');
            }

            const salida =
                `🌑 *DARK-BOT*\n` +
                `────────────────────\n` +
                `${respuesta}`;

            await sock.sendMessage(jid, { text: salida }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '⚡', key: m.key } });
            console.log(`[DARK-BOT AI OK] Modelo usado: ${modeloUsado}`);

        } catch (error) {
            console.error('[DARK-BOT AI Error]:', error.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(
                jid,
                { text: '🔃 *DARK-BOT:* servidores ocupados o error procesando la solicitud, *reformula o reintenta*.' },
                { quoted: m }
            );
        }
    }
};
