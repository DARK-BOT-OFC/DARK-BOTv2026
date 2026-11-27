const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawn } = require('child_process')
const webp = require('node-webpmux')

const tmp = path.join(__dirname, '../tmp')

if (!fs.existsSync(tmp)) {
  fs.mkdirSync(tmp, { recursive: true })
}

function detectVideoBuffer(img) {
  if (!Buffer.isBuffer(img) || img.length < 12) return false
  const chunk = img.slice(0, 12).toString('utf8')
  const hex = img.slice(0, 4).toString('hex')
  if (chunk.includes('ftyp')) return true
  if (hex === '1a45dfa3') return true
  if (img[0] === 0x00 && img[1] === 0x00 && img[2] === 0x00) return true
  return false
}

/**
 * Conversión de Imagen/Video a Sticker usando FFmpeg nativo (Optimizado para Termux)
 */
function sticker(img, url, packname = 'DARK-BOT', author = '2026') {
  return new Promise(async (resolve, reject) => {
    const timestamp = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`
    let inp = null
    let out = null

    try {
      if (!img && url) {
        const res = await fetch(url)
        img = Buffer.from(await res.arrayBuffer())
      }

      if (!Buffer.isBuffer(img) || img.length === 0) {
        return reject(new Error('Buffer de entrada vacío o inválido.'))
      }

      const isVideo = detectVideoBuffer(img)
      const ext = isVideo ? '.mp4' : '.jpg'
      inp = path.join(tmp, timestamp + ext)
      out = path.join(tmp, timestamp + '.webp')

      await fs.promises.writeFile(inp, img)

      const args = isVideo
        ? [
            '-y',
            '-i', inp,
            '-vcodec', 'libwebp',
            '-vf', 'scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,crop=512:512,format=rgba,fps=8,setsar=1',
            '-r', '8',
            '-loop', '0',
            '-t', '5',
            '-q:v', '30',
            '-compression_level', '6',
            '-preset', 'default',
            '-an',
            out
          ]
        : [
            '-y',
            '-i', inp,
            '-vf', 'scale=512:512:force_original_aspect_ratio=increase:flags=lanczos,crop=512:512,format=rgba,setsar=1',
            '-vcodec', 'libwebp',
            '-lossless', '0',
            '-q:v', '75',
            '-compression_level', '4',
            '-an',
            '-preset', 'default',
            out
          ]

      let stderrLog = ''
      const ff = spawn('ffmpeg', args)

      ff.stderr.on('data', (chunk) => {
        stderrLog += chunk.toString()
      })

      ff.on('error', async (err) => {
        await fs.promises.unlink(inp).catch(() => {})
        await fs.promises.unlink(out).catch(() => {})
        reject(err)
      })

      ff.on('close', async (code) => {
        try {
          const exists = fs.existsSync(out)
          const stats = exists ? await fs.promises.stat(out) : null

          await fs.promises.unlink(inp).catch(() => {})

          if (!exists || !stats || stats.size === 0) {
            await fs.promises.unlink(out).catch(() => {})
            return reject(
              new Error(`FFmpeg no generó un webp válido (code=${code}): ${stderrLog.slice(-300)}`)
            )
          }

          const buffer = await fs.promises.readFile(out)
          await fs.promises.unlink(out).catch(() => {})

          const finalized = await addExif(buffer, packname, author)
          resolve(finalized)
        } catch (err) {
          await fs.promises.unlink(out).catch(() => {})
          reject(err)
        }
      })
    } catch (e) {
      if (inp) await fs.promises.unlink(inp).catch(() => {})
      if (out) await fs.promises.unlink(out).catch(() => {})
      reject(e)
    }
  })
}

/**
 * Añadir Metadatos EXIF al Webp
 */
async function addExif(webpSticker, packname, author, categories = [''], extra = {}) {
  try {
    const img = new webp.Image()
    const stickerPackId = crypto.randomBytes(32).toString('hex')
    const json = {
      'sticker-pack-id': stickerPackId,
      'sticker-pack-name': packname,
      'sticker-pack-publisher': author,
      'emojis': categories,
      ...extra
    }
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ])
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
    const exif = Buffer.concat([exifAttr, jsonBuffer])
    exif.writeUIntLE(jsonBuffer.length, 14, 4)
    await img.load(webpSticker)
    img.exif = exif
    return await img.save(null)
  } catch (err) {
    return webpSticker
  }
}

const support = {
  ffmpeg: true,
  ffprobe: true,
  ffmpegWebp: true,
  convert: true,
  magick: false,
  gm: false,
  find: false
}

module.exports = {
  sticker,
  addExif,
  support
}
