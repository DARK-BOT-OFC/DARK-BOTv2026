const { sticker } = require('../lib/sticker.js')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { promisify } = require('util')

const execAsync = promisify(exec)
const MAX_SECONDS = 10

const sendTextReply = async (conn, chatId, text, quoted) => {
  if (typeof conn.reply === 'function') {
    return await conn.reply(chatId, text, quoted)
  }
  return await conn.sendMessage(chatId, { text }, { quoted })
}

const isUrl = (text) => {
  return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png|webp)(\?.*)?$/i.test(
    String(text || '').trim()
  )
}

function escapeDrawtext(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\r?\n/g, ' ')
    .trim()
}

function wrapTextLines(rawText, maxCharsPerLine = 16, maxLines = 3) {
  const words = String(rawText || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['STICKER']

  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxCharsPerLine) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word.length > maxCharsPerLine ? word.slice(0, maxCharsPerLine) : word
      if (lines.length >= maxLines) break
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  return lines.slice(0, maxLines)
}

async function searchReferenceImage(query) {
  const cleanQuery = String(query || '').trim()
  if (!cleanQuery) return null

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    Accept: 'text/html,application/json,*/*;q=0.8'
  }

  try {
    const searchPageUrl = `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&iax=images&ia=images`
    const pageRes = await fetch(searchPageUrl, { headers })
    const html = await pageRes.text()
    const vqdMatch =
      html.match(/vqd=["']?([a-zA-Z0-9_-]+)["']?/) || html.match(/vqd=([a-zA-Z0-9_-]+)/)

    if (vqdMatch && vqdMatch[1]) {
      const apiUrl = `https://duckduckgo.com/i.js?l=es-es&o=json&q=${encodeURIComponent(cleanQuery)}&vqd=${encodeURIComponent(vqdMatch[1])}&f=,,,,,&p=1`
      const imgJsonRes = await fetch(apiUrl, {
        headers: {
          ...headers,
          Referer: 'https://duckduckgo.com/'
        }
      })
      const data = await imgJsonRes.json()
      const results = Array.isArray(data?.results) ? data.results : []

      for (const item of results.slice(0, 8)) {
        const candidateUrl = item?.image || item?.thumbnail
        if (!candidateUrl) continue
        try {
          const dlRes = await fetch(candidateUrl, {
            headers,
            signal: AbortSignal.timeout(7000)
          })
          if (!dlRes.ok) continue
          const contentType = dlRes.headers.get('content-type') || ''
          if (!/image\/(jpeg|jpg|png|webp)/i.test(contentType)) continue
          const buf = Buffer.from(await dlRes.arrayBuffer())
          if (buf.length > 2000 && buf.length < 8 * 1024 * 1024) {
            return buf
          }
        } catch {
          continue
        }
      }
    }
  } catch {
    // Continuar al respaldo
  }

  try {
    const wikiApi = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=6&prop=imageinfo&iiprop=url|mime&format=json&origin=*`
    const wikiRes = await fetch(wikiApi, {
      headers,
      signal: AbortSignal.timeout(7000)
    })
    const wikiData = await wikiRes.json()
    const pages = Object.values(wikiData?.query?.pages || {})

    for (const p of pages) {
      const info = p?.imageinfo?.[0]
      if (!info?.url || !/image\/(jpeg|jpg|png|webp)/i.test(info?.mime || '')) continue
      try {
        const dlRes = await fetch(info.url, {
          headers,
          signal: AbortSignal.timeout(7000)
        })
        if (!dlRes.ok) continue
        const buf = Buffer.from(await dlRes.arrayBuffer())
        if (buf.length > 2000 && buf.length < 8 * 1024 * 1024) {
          return buf
        }
      } catch {
        continue
      }
    }
  } catch {
    // Sin imagen remota
  }

  return null
}

async function renderTextOverImage(baseImageBuffer, text) {
  const tmpDir = os.tmpdir()
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const outPath = path.join(tmpDir, `st_text_${id}.png`)
  const lines = wrapTextLines(text, 16, 3)
  const fontSize = lines.length >= 3 ? 42 : lines.length === 2 ? 48 : 54
  const lineHeight = fontSize + 8
  const topMargin = 28
  const startY = topMargin

  const drawFilters = lines.map((line, idx) => {
    const safeLine = escapeDrawtext(line)
    const yPos = startY + idx * lineHeight
    return `drawtext=text='${safeLine}':fontcolor=white:fontsize=${fontSize}:borderw=4:bordercolor=black@0.9:shadowcolor=black@0.75:shadowx=2:shadowy=2:x=(w-text_w)/2:y=${yPos}`
  })

  try {
    let inputArg = ''
    let inPath = null

    if (Buffer.isBuffer(baseImageBuffer) && baseImageBuffer.length > 0) {
      inPath = path.join(tmpDir, `st_bg_${id}.img`)
      await fs.promises.writeFile(inPath, baseImageBuffer)
      inputArg = `-i "${inPath}"`
    } else {
      inputArg = `-f lavfi -i color=c=#1e293b:s=512x512:d=1`
    }

    const filterComplex = Buffer.isBuffer(baseImageBuffer)
      ? `[0:v]scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,crop=512:512,format=rgba,${drawFilters.join(',')}[out]`
      : `[0:v]format=rgba,${drawFilters.join(',')}[out]`

    await execAsync(
      `ffmpeg -y ${inputArg} -filter_complex "${filterComplex}" -map "[out]" -frames:v 1 "${outPath}"`
    )

    if (inPath) await fs.promises.unlink(inPath).catch(() => {})
    if (!fs.existsSync(outPath)) return null
    return await fs.promises.readFile(outPath)
  } catch {
    const fallbackOut = path.join(tmpDir, `st_fb_${id}.png`)
    await execAsync(
      `ffmpeg -y -f lavfi -i color=c=#1e293b:s=512x512:d=1 -frames:v 1 "${fallbackOut}"`
    ).catch(() => {})
    if (fs.existsSync(fallbackOut)) {
      const buf = await fs.promises.readFile(fallbackOut)
      await fs.promises.unlink(fallbackOut).catch(() => {})
      return buf
    }
    return null
  } finally {
    await fs.promises.unlink(outPath).catch(() => {})
  }
}

async function toWebpDirect(inputBuffer, isVideo = false) {
  const tmpDir = os.tmpdir()
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const ext = isVideo ? '.mp4' : '.jpg'
  const inputPath = path.join(tmpDir, `in_${id}${ext}`)
  const outputPath = path.join(tmpDir, `out_${id}.webp`)

  try {
    await fs.promises.writeFile(inputPath, inputBuffer)
    const cmd = isVideo
      ? `ffmpeg -y -i "${inputPath}" -t 8 -vf "scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,crop=512:512,format=rgba,fps=10,setsar=1" -c:v libwebp -lossless 0 -q:v 35 -loop 0 -an -vsync 0 -fs 850000 "${outputPath}"`
      : `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,crop=512:512,format=rgba,setsar=1" -c:v libwebp -lossless 0 -q:v 75 -an "${outputPath}"`
    await execAsync(cmd)
    if (!fs.existsSync(outputPath)) return null
    return await fs.promises.readFile(outputPath)
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {})
    await fs.promises.unlink(outputPath).catch(() => {})
  }
}

const buildStickerGuideBox = (usedPrefix, command) => {
  const p = usedPrefix || '.'
  const cmd = command || 's'
  return `✨ *GUÍA DE STICKERS* ✨
━━━━━━━━━━━━━━━

📌 *¿Cómo usarlo?*
Responde a una *imagen*, *vídeo* (≤10s), *sticker* o escribe *texto*.

🖼️ *Foto / Vídeo / WebP*
• ${p}${cmd} *(respondiendo al archivo)*
• ${p}${cmd} <url_imagen>

✍️ *Texto + Imagen*
• ${p}${cmd} hola mundo
• ${p}${cmd} gato sorprendido

━━━━━━━━━━━━━━━`
}


let handler = async (m, { conn, args, usedPrefix, command }) => {
  let stiker = false

  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''
    const hasQuotedMedia = Boolean(m.quoted && /webp|image|video/g.test(mime))
    const hasDirectMedia = Boolean(!m.quoted && /webp|image|video/g.test(mime))
    const textInput = (args || []).join(' ').trim()

    if (hasQuotedMedia || hasDirectMedia) {
      const isVid = /video/g.test(mime)
      if (isVid) {
        const videoSeconds = q.msg?.seconds || q.seconds || 0
        if (videoSeconds > MAX_SECONDS) {
          return await sendTextReply(
            conn,
            m.chat,
            `⚠️ *_El vídeo debe ser de ${MAX_SECONDS} segundos o menos._*`,
            m
          )
        }
      }

      const img = await q.download?.()
      if (!img) {
        return await sendTextReply(conn, m.chat, buildStickerGuideBox(usedPrefix, command), m)
      }

      try {
        stiker = await sticker(img, false, global.packname || 'DARK-BOT', global.author || '2026')
      } catch (e) {
        console.error('[STICKER LIB ERROR]:', e)
        stiker = await toWebpDirect(img, isVid)
      }

      if (!Buffer.isBuffer(stiker) || stiker.length === 0) {
        stiker = await toWebpDirect(img, isVid)
      }
    } else if (textInput) {
      if (isUrl(textInput)) {
        try {
          stiker = await sticker(false, textInput, global.packname || 'DARK-BOT', global.author || '2026')
        } catch (e) {
          console.error('[STICKER URL ERROR]:', e)
        }
      } else {
        const refImg = await searchReferenceImage(textInput)
        const composedImg = await renderTextOverImage(refImg, textInput)

        if (Buffer.isBuffer(composedImg) && composedImg.length > 0) {
          try {
            stiker = await sticker(
              composedImg,
              false,
              global.packname || 'DARK-BOT',
              global.author || '2026'
            )
          } catch (e) {
            console.error('[STICKER TEXT LIB ERROR]:', e)
            stiker = await toWebpDirect(composedImg, false)
          }
        }
      }
    } else {
      return await sendTextReply(conn, m.chat, buildStickerGuideBox(usedPrefix, command), m)
    }
  } catch (e) {
    console.error('[PLUGIN CATCH ERROR]:', e)
  } finally {
    if (Buffer.isBuffer(stiker) && stiker.length > 0) {
      await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
    }
  }
}

handler.help = ['s', 'sticker', 'stiker']
handler.tags = ['sticker']
handler.command = ['s', 'sticker', 'stiker']

module.exports = handler
