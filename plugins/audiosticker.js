const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { sticker } = require('../lib/sticker')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')

const execAsync = util.promisify(exec)

const PENDING_TTL_MS = 120 * 1000
const MAX_MEDIA_SECONDS = 10
const pendingStickers = new Map()

async function getBuffer(media, type) {
  const stream = await downloadContentFromMessage(media, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

function isValidMediaObj(obj) {
  return Boolean(obj && typeof obj === 'object' && (obj.mediaKey || obj.directPath || obj.url))
}

function extractImageOrVideo(m, extra = {}) {
  const quoted = extra?.quoted
  const candidates = [
    quoted?.message?.imageMessage,
    quoted?.msg?.imageMessage,
    quoted?.imageMessage,
    m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage,
    m?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage,
    m?.message?.imageMessage,
    m?.msg?.imageMessage,
    quoted?.message?.videoMessage,
    quoted?.msg?.videoMessage,
    quoted?.videoMessage,
    m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage,
    m?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage,
    m?.message?.videoMessage,
    m?.msg?.videoMessage
  ]

  for (const cand of candidates) {
    if (isValidMediaObj(cand)) {
      const isVideo = Boolean(
        cand === quoted?.message?.videoMessage ||
          cand === quoted?.msg?.videoMessage ||
          cand === quoted?.videoMessage ||
          cand === m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
          cand === m?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
          cand === m?.message?.videoMessage ||
          cand === m?.msg?.videoMessage ||
          (typeof cand.mimetype === 'string' && cand.mimetype.startsWith('video/'))
      )
      return { mediaObj: cand, mediaType: isVideo ? 'video' : 'image' }
    }
  }
  return null
}

function extractAudioMessage(m, extra = {}) {
  const quoted = extra?.quoted
  const candidates = [
    quoted?.message?.audioMessage,
    quoted?.msg?.audioMessage,
    quoted?.audioMessage,
    m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage,
    m?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage,
    m?.message?.audioMessage,
    m?.msg?.audioMessage
  ]
  return candidates.find(isValidMediaObj) || null
}

function normalizeId(val) {
  if (!val) return ''
  const str = String(val).split('@')[0].split(':')[0]
  return str.replace(/\D/g, '') || str.trim()
}

function getSenderKey(senderNumber, m, extra = {}) {
  const candidates = [
    senderNumber,
    m?.sender,
    extra?.lid,
    extra?.senderLid,
    m?.senderLid,
    m?.key?.participant,
    m?.key?.remoteJid
  ]
  for (const c of candidates) {
    const clean = normalizeId(c)
    if (clean) return clean
  }
  return 'unknown'
}

function resolveMentionJid(senderNumber, m, extra = {}) {
  const rawLid =
    extra?.lid ||
    extra?.senderLid ||
    m?.senderLid ||
    m?.key?.participantLid ||
    (typeof m?.key?.participant === 'string' && m.key.participant.endsWith('@lid') ? m.key.participant : null) ||
    (typeof m?.key?.remoteJid === 'string' && m.key.remoteJid.endsWith('@lid') ? m.key.remoteJid : null) ||
    null

  if (rawLid) {
    return rawLid.includes('@') ? rawLid : `${rawLid}@lid`
  }
  return senderNumber ? `${String(senderNumber).replace(/\D/g, '')}@s.whatsapp.net` : null
}

function clearPendingEntry(key) {
  const entry = pendingStickers.get(key)
  if (entry?.timer) clearTimeout(entry.timer)
  pendingStickers.delete(key)
}

function findPendingEntry(jid, senderKey) {
  const exactKey = `${jid}:${senderKey}`
  if (pendingStickers.has(exactKey)) {
    return { key: exactKey, entry: pendingStickers.get(exactKey) }
  }

  const chatEntries = []
  for (const [k, v] of pendingStickers.entries()) {
    if (k.startsWith(`${jid}:`)) chatEntries.push({ key: k, entry: v })
  }
  if (chatEntries.length >= 1) return chatEntries[chatEntries.length - 1]

  return null
}

async function mergeMediaWithAudio(mediaBuffer, mediaType, audioBuffer, id) {
  const tmpDir = path.join(__dirname, '../tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const inMediaPath = path.join(tmpDir, `stk_in_${id}.${mediaType === 'video' ? 'mp4' : 'jpg'}`)
  const inAudioPath = path.join(tmpDir, `stk_aud_${id}.ogg`)
  const outMp4Path = path.join(tmpDir, `stk_out_${id}.mp4`)

  fs.writeFileSync(inMediaPath, mediaBuffer)
  fs.writeFileSync(inAudioPath, audioBuffer)

  const scaleFilter = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:black'
  const cmd =
    mediaType === 'video'
      ? `ffmpeg -y -stream_loop -1 -t ${MAX_MEDIA_SECONDS} -i "${inMediaPath}" -t ${MAX_MEDIA_SECONDS} -i "${inAudioPath}" -map 0:v:0 -map 1:a:0 -t ${MAX_MEDIA_SECONDS} -c:v libx264 -pix_fmt yuv420p -vf "${scaleFilter}" -c:a aac -b:a 128k -shortest "${outMp4Path}"`
      : `ffmpeg -y -loop 1 -t ${MAX_MEDIA_SECONDS} -i "${inMediaPath}" -t ${MAX_MEDIA_SECONDS} -i "${inAudioPath}" -t ${MAX_MEDIA_SECONDS} -c:v libx264 -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -vf "${scaleFilter}" -shortest "${outMp4Path}"`

  try {
    await execAsync(cmd)
    if (!fs.existsSync(outMp4Path)) {
      throw new Error('FFmpeg no generó el archivo MP4 de salida')
    }
    return fs.readFileSync(outMp4Path)
  } finally {
    for (const file of [inMediaPath, inAudioPath, outMp4Path]) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
  }
}

async function handlePendingAudio(sock, senderNumber, m, extra = {}) {
  const jid = m?.chat || m?.key?.remoteJid
  if (!jid) return false

  const audioMsg = extractAudioMessage(m, extra)
  if (!audioMsg) return false

  const senderKey = getSenderKey(senderNumber, m, extra)
  const found = findPendingEntry(jid, senderKey)
  if (!found) return false

  clearPendingEntry(found.key)

  try {
    const audioBuffer = await getBuffer(audioMsg, 'audio')
    const mentionJid = resolveMentionJid(senderNumber, m, extra) || found.entry.mentionJid

    if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
      throw new Error('Audio vacío')
    }

    const mp4Buffer = await mergeMediaWithAudio(
      found.entry.mediaBuffer,
      found.entry.mediaType,
      audioBuffer,
      `${Date.now()}_${Math.floor(Math.random() * 10000)}`
    )

    await sock.sendMessage(
      jid,
      {
        video: mp4Buffer,
        mimetype: 'video/mp4',
        caption: '🎵 *Video + Audio Fusionado (máx. 10s)*',
        ...(mentionJid ? { contextInfo: { mentionedJid: [mentionJid] } } : {})
      },
      { quoted: m }
    )

    return true
  } catch (err) {
    console.error('[audiosticker] Error al fusionar video/imagen y audio:', err)
    await sock.sendMessage(
      jid,
      { text: '❌ Hubo un error al unir el sticker con el audio (revisa que `ffmpeg` esté instalado en Termux).' },
      { quoted: m }
    ).catch(() => {})
    return true
  }
}

async function listener(sock, m, chat, userIsOwner) {
  const senderNumber = String(m?.sender || '').replace(/\D/g, '')
  return handlePendingAudio(sock, senderNumber, m, { chat, isOwner: userIsOwner })
}

module.exports = {
  command: ['audiosticker', 'asticker', 'sa'],
  help: ['audiosticker'],
  tags: ['stickers'],
  handlePendingAudio,
  listener,
  onMessage: handlePendingAudio,
  before: handlePendingAudio,
  all: handlePendingAudio,

  async run(sock, senderNumber, m, args, extra = {}) {
    const jid = m.chat || m.key?.remoteJid
    if (!jid) return

    const consumedAsAudio = await handlePendingAudio(sock, senderNumber, m, extra)
    if (consumedAsAudio) return

    const picked = extractImageOrVideo(m, extra)
    if (!picked) {
      return sock.sendMessage(
        jid,
        { text: 'Responde o envía una *imagen* o *video* con *.sa* y luego envíame el audio (tienes 2 minutos; se recortarán a 10s).' },
        { quoted: m }
      )
    }

    try {
      const mediaBuffer = await getBuffer(picked.mediaObj, picked.mediaType)
      const mentionJid = resolveMentionJid(senderNumber, m, extra)
      const packname = extra?.packname || 'DARK-BOT'
      const author = mentionJid || senderNumber || '2026'

      const webpBuffer = await sticker(mediaBuffer, null, packname, author)

      const senderKey = getSenderKey(senderNumber, m, extra)
      const key = `${jid}:${senderKey}`
      clearPendingEntry(key)

      const timer = setTimeout(() => {
        pendingStickers.delete(key)
      }, PENDING_TTL_MS)

      pendingStickers.set(key, {
        mediaBuffer,
        mediaType: picked.mediaType,
        webpBuffer,
        mentionJid,
        timer
      })

      await sock.sendMessage(
        jid,
        { text: 'Listo, *tienes 2 minutos para mandar el audio* (vídeo y audio se recortan a 10s máximo).' },
        { quoted: m }
      )
    } catch (err) {
      console.error('[audiosticker] Error al preparar media en .sa:', err)
      await sock.sendMessage(
        jid,
        { text: '❌ No pude procesar ese archivo.' },
        { quoted: m }
      ).catch(() => {})
    }
  }
}
