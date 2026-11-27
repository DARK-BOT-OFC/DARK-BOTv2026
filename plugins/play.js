const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

global.db = global.db || { data: { users: {} } };
global.playCache = global.playCache || {};

module.exports = {
    command: ['play', 'play1', 'play2', 'play.1', 'play.2'],
    help: ['play <canción>', 'play1', 'play2'],
    tags: ['downloader'],

    async run(sock, senderNumber, m, args, extra) {
        const jid = m.chat || m.key.remoteJid;
        
        let text = args.join(' ');
        const fullText = m.text || '';
        
        const isPlay1 = fullText.includes('play1') || fullText.includes('play.1');
        const isPlay2 = fullText.includes('play2') || fullText.includes('play.2');

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        try {
            // PASO B: Descarga local robusta para audio y video
            if (isPlay1 || isPlay2) {
                const cached = global.playCache[jid];
                if (!cached) {
                    return await sock.sendMessage(jid, { 
                        text: `*[❗] No hay ninguna búsqueda previa activa. Usa primero .play <nombre>*` 
                    }, { quoted: m });
                }

                const isVideo = isPlay2;
                await sock.sendMessage(jid, { text: `*_⏳ Descargando y preparando archivo..._*` }, { quoted: m });

                const outputFileName = `media_${Date.now()}`;
                const outputPath = path.join(tmpDir, outputFileName);

                let command = '';
                if (isVideo) {
                    // Usamos un selector de formato universal y seguro para videos
                    command = `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / b" --merge-output-format mp4 -o "${outputPath}.mp4" "${cached.url}"`;
                } else {
                    command = `yt-dlp -x --audio-format m4a --audio-quality 0 -o "${outputPath}.%(ext)s" "${cached.url}"`;
                }

                await execAsync(command);

                let finalFile = '';
                if (isVideo) {
                    if (fs.existsSync(`${outputPath}.mp4`)) {
                        finalFile = `${outputPath}.mp4`;
                    } else {
                        const files = fs.readdirSync(tmpDir);
                        const found = files.find(f => f.startsWith(outputFileName) && f.endsWith('.mp4'));
                        if (found) finalFile = path.join(tmpDir, found);
                    }
                } else {
                    if (fs.existsSync(`${outputPath}.m4a`)) {
                        finalFile = `${outputPath}.m4a`;
                    } else if (fs.existsSync(`${outputPath}.mp3`)) {
                        finalFile = `${outputPath}.mp3`;
                    } else {
                        const files = fs.readdirSync(tmpDir);
                        const found = files.find(f => f.startsWith(outputFileName));
                        if (found) finalFile = path.join(tmpDir, found);
                    }
                }

                if (!finalFile || !fs.existsSync(finalFile)) {
                    throw new Error("No se pudo generar el archivo multimedia localmente.");
                }

                if (isVideo) {
                    await sock.sendMessage(jid, { 
                        video: { url: finalFile }, 
                        caption: `🎵 *${cached.title}*\n𝕯𐊅𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(jid, { 
                        audio: { url: finalFile }, 
                        mimetype: 'audio/mp4',
                        ptt: false,
                        fileName: `${cached.title}.m4a`
                    }, { quoted: m });
                }

                // Limpieza de archivos temporales
                try {
                    if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
                } catch (err) {}

                delete global.playCache[jid];
                return;
            }

            // PASO A: Búsqueda local con yt-search
            if (!text) {
                return await sock.sendMessage(jid, { 
                    text: `[❗𝐈𝐍𝐅𝐎❗] Por favor, ingresa el texto a buscar.\n\n*Ejemplo:* \`.play canserbero maquiavélico\`` 
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { text: `*_⏳ Buscando en YouTube..._*` }, { quoted: m });

            const searchResult = await yts(text);
            const videos = searchResult?.videos;

            if (!videos || videos.length === 0) {
                return await sock.sendMessage(jid, { 
                    text: `*[❗] No se encontró ningún resultado para "${text}".*` 
                }, { quoted: m });
            }

            const first = videos[0];
            const videoUrl = first.url;
            const title = first.title;
            const thumbnail = first.thumbnail || first.image || '';

            global.playCache[jid] = { url: videoUrl, title };

            const caption = `╭─❲ 𝕯𐊅𐊅ℜ𝖐-𝕭𝖔𝖙⍉ꤲ ❭─▰\n` +
                            `│ 🎵 *Título:* ${title}\n` +
                            `│ 🔗 *Enlace:* ${videoUrl}\n` +
                            `╰─────────────────▰\n\n` +
                            `*¿Cómo deseas descargarlo?*\n` +
                            `📌 Envía *\.play1* para audio con reproductor\n` +
                            `📌 Envía *\.play2* para video (MP4)`;

            let tempFilePath = null;

            if (thumbnail) {
                try {
                    const imgRes = await fetch(thumbnail);
                    const buffer = Buffer.from(await imgRes.arrayBuffer());
                    tempFilePath = path.join(tmpDir, `thumb_${Date.now()}.jpg`);
                    fs.writeFileSync(tempFilePath, buffer);

                    await sock.sendMessage(jid, { 
                        image: { url: tempFilePath }, 
                        caption: caption 
                    }, { quoted: m });
                } catch (imgErr) {
                    await sock.sendMessage(jid, { text: caption }, { quoted: m });
                } finally {
                    if (tempFilePath && fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                }
            } else {
                await sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

        } catch (e) {
            console.error("❌ Error en plugin play:", e);
            await sock.sendMessage(jid, { 
                text: '*[❗] Ocurrió un error al procesar la solicitud. Revisa la consola.*' 
            }, { quoted: m });
        }
    }
};
