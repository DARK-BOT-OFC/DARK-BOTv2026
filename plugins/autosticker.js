const { sticker } = require('../lib/sticker.js')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { promisify } = require('util')

const execAsync = promisify(exec)
const MAX_SECONDS = 10
const VIDEO_INITIAL_DELAY_MS = 2000
const VIDEO_RETRY_DELAY_MS = 3000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isUrl = (text) => {
  return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png|webp)(\?.*)?$/i.test(
    String(text || '').trim()
  )
}

function isStickerMsg(obj) {
  if (!obj) return false
  const mime = (obj.msg || obj).mimetype || obj.mediaType || ''
  return (
    obj.mtype === 'stickerMessage' ||
    Boolean(obj.message?.stickerMessage) ||
    /webp/i.test(mime)
  )
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function extractMediaNode(target, mediaType) {
  if (!target) return null
  const capitalized = `${mediaType.charAt(0).toUpperCase()}${mediaType.slice(1)}Message`
  return (
    target.message?.[capitalized] ||
    target.message?.[`${mediaType}Message`] ||
    target.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[capitalized] ||
    (target.msg && (target.msg.mediaKey || target.msg.url || target.msg.directPath) ? target.msg : null)
  )
}

async function downloadMediaBuffer(m, q, mediaType, initialDelayMs = 0, retryDelayMs = 1500) {
  const targets = [m, q].filter(Boolean)

  if (initialDelayMs > 0) {
    await wait(initialDelayMs)
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0 && retryDelayMs > 0) {
      await wait(retryDelayMs)
    }

    for (const target of targets) {
      if (isStickerMsg(target)) continue

      const rawMedia = extractMediaNode(target, mediaType)
      if (rawMedia && rawMedia.mediaKey && (rawMedia.url || rawMedia.directPath)) {
        try {
          const stream = await downloadContentFromMessage(rawMedia, mediaType)
          const buf = await streamToBuffer(stream)
          if (Buffer.isBuffer(buf) && buf.length > 0) return buf
        } catch {
          // Probar fallback con target.download
        }
      }

      if (typeof target.download === 'function') {
        try {
          const buf = await target.download()
          if (Buffer.isBuffer(buf) && buf.length > 0) return buf
        } catch {
          // Continuar al siguiente intento
        }
      }
    }
  }

  return null
}

async function trimVideoBuffer(inputBuffer, maxSeconds = MAX_SECONDS) {
  const tmpDir = os.tmpdir()
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const inputPath = path.join(tmpDir, `auto_trim_in_${id}.mp4`)
  const outputPath = path.join(tmpDir, `auto_trim_out_${id}.mp4`)

  try {
    await fs.promises.writeFile(inputPath, inputBuffer)
    const cmd = `ffmpeg -y -ss 00:00:00 -i "${inputPath}" -t ${maxSeconds} -c:v libx264 -preset ultrafast -crf 28 -an "${outputPath}"`
    await execAsync(cmd)

    if (!fs.existsSync(outputPath)) return inputBuffer
    const trimmed = await fs.promises.readFile(outputPath)
    return Buffer.isBuffer(trimmed) && trimmed.length > 0 ? trimmed : inputBuffer
  } catch {
    return inputBuffer
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {})
    await fs.promises.unlink(outputPath).catch(() => {})
  }
}

async function toWebpDirect(inputBuffer, isVideo = false) {
  const tmpDir = os.tmpdir()
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const ext = isVideo ? '.mp4' : '.jpg'
  const inputPath = path.join(tmpDir, `auto_in_${id}${ext}`)
  const outputPath = path.join(tmpDir, `auto_out_${id}.webp`)

  try {
    await fs.promises.writeFile(inputPath, inputBuffer)
    const cmd = isVideo
      ? `ffmpeg -y -i "${inputPath}" -t 8 -vf "scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,crop=512:512,format=rgba,fps=10,setsar=1" -c:v libwebp -lossless 0 -q:v 35 -loop 0 -an -vsync 0 -fs 850000 "${outputPath}"`
      : `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,crop=512:512,format=rgba,setsar=1" -c:v libwebp -lossless 0 -q:v 75 -an "${outputPath}"`
    await execAsync(cmd)

    if (!fs.existsSync(outputPath)) return null
    const buf = await fs.promises.readFile(outputPath)
    return Buffer.isBuffer(buf) && buf.length > 0 ? buf : null
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {})
    await fs.promises.unlink(outputPath).catch(() => {})
  }
}

async function buildStickerWithFallback(mediaInput, isUrlInput, isVideo) {
  const packname = global.packname || 'DARK-BOT'
  const author = global.author || '2026'

  if (isUrlInput) {
    return await sticker(false, mediaInput, packname, author)
  }

  let stiker = false
  try {
    stiker = await sticker(mediaInput, false, packname, author)
  } catch {
    stiker = false
  }

  if (!Buffer.isBuffer(stiker) || stiker.length === 0) {
    stiker = await toWebpDirect(mediaInput, isVideo)
  }

  return stiker
}

module.exports = {
  name: 'autosticker',
  listener: async (sock, m, chat) => {
    if (!m?.isGroup || !chat?.autosticker || chat?.isBanned) return
    if (isStickerMsg(m) || isStickerMsg(m.quoted)) return

    let stiker = false

    try {
      const q = m.quoted ? m.quoted : m
      const mime = (q.msg || q).mimetype || (m.msg || m).mimetype || ''
      const messageType = m.mtype || ''
      const textMessage = (m.text || m.caption || '').trim()

      const isImg =
        (/image/i.test(mime) && !/webp/i.test(mime)) ||
        messageType === 'imageMessage' ||
        q.mtype === 'imageMessage'
      const isVid =
        /video/i.test(mime) ||
        messageType === 'videoMessage' ||
        q.mtype === 'videoMessage'

      if (isImg) {
        const img = await downloadMediaBuffer(m, q, 'image', 0, 800)
        if (img) {
          stiker = await buildStickerWithFallback(img, false, false)
        }
      } else if (isVid) {
        let vid = await downloadMediaBuffer(
          m,
          q,
          'video',
          VIDEO_INITIAL_DELAY_MS,
          VIDEO_RETRY_DELAY_MS
        )
        if (vid) {
          const videoSeconds = q.msg?.seconds || q.seconds || m.msg?.seconds || m.seconds || 0
          if (videoSeconds > MAX_SECONDS || videoSeconds === 0) {
            vid = await trimVideoBuffer(vid, MAX_SECONDS)
          }
          stiker = await buildStickerWithFallback(vid, false, true)
        }
      } else if (textMessage) {
        const firstWord = textMessage.split(/\s+/)[0]
        if (firstWord && isUrl(firstWord)) {
          stiker = await buildStickerWithFallback(firstWord, true, false)
        }
      }
    } catch {
      // Silenciar errores controlados
    } finally {
      if (Buffer.isBuffer(stiker) && stiker.length > 0) {
        await sock.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
      }
    }
  }
}
