const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawn } = require('child_process')

const tmp = path.join(__dirname, '../tmp')

if (!fs.existsSync(tmp)) {
  fs.mkdirSync(tmp, { recursive: true })
}

function buildHeadphonesFilter(customPngPath) {
  const baseCanvas =
    'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black,format=rgba'

  if (customPngPath && fs.existsSync(customPngPath)) {
    return {
      complex: true,
      filter: `[0:v]${baseCanvas}[bg];[1:v]scale=72:72[hp];[bg][hp]overlay=14:14`
    }
  }

  return {
    complex: false,
    filter: [
      baseCanvas,
      'drawbox=x=16:y=16:w=56:h=56:color=black@0.65:t=fill',
      'drawbox=x=24:y=24:w=40:h=8:color=white@0.95:t=fill',
      'drawbox=x=22:y=32:w=8:h=22:color=white@0.95:t=fill',
      'drawbox=x=58:y=32:w=8:h=22:color=white@0.95:t=fill',
      'drawbox=x=18:y=36:w=8:h=16:color=white@0.95:t=fill',
      'drawbox=x=62:y=36:w=8:h=16:color=white@0.95:t=fill'
    ].join(',')
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    let stderrLog = ''
    const ff = spawn('ffmpeg', args)

    ff.stderr.on('data', (chunk) => {
      stderrLog += chunk.toString()
    })

    ff.on('error', reject)
    ff.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`FFmpeg falló (code=${code}): ${stderrLog.slice(-300)}`))
    })
  })
}

async function createAudioSticker(videoBuffer, options = {}) {
  if (!Buffer.isBuffer(videoBuffer) || videoBuffer.length === 0) {
    throw new Error('Buffer de video vacío o inválido.')
  }

  const maxDuration = String(options.maxDuration || 10)
  const headphonePng = options.headphonePng || path.join(__dirname, '../assets/headphones.png')
  const id = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`

  const inFile = path.join(tmp, `as_in_${id}.mp4`)
  const outClip = path.join(tmp, `as_clip_${id}.mp4`)
  const outVoice = path.join(tmp, `as_voice_${id}.ogg`)

  try {
    await fs.promises.writeFile(inFile, videoBuffer)

    const filterInfo = buildHeadphonesFilter(headphonePng)
    const clipArgs = filterInfo.complex
      ? [
          '-y',
          '-i', inFile,
          '-i', headphonePng,
          '-t', maxDuration,
          '-filter_complex', filterInfo.filter,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-c:a', 'aac',
          '-b:a', '96k',
          outClip
        ]
      : [
          '-y',
          '-i', inFile,
          '-t', maxDuration,
          '-vf', filterInfo.filter,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-c:a', 'aac',
          '-b:a', '96k',
          outClip
        ]

    const voiceArgs = [
      '-y',
      '-i', inFile,
      '-t', maxDuration,
      '-vn',
      '-acodec', 'libopus',
      '-b:a', '64k',
      outVoice
    ]

    await Promise.all([runFfmpeg(clipArgs), runFfmpeg(voiceArgs)])

    const clipBuffer =
      fs.existsSync(outClip) && (await fs.promises.stat(outClip)).size > 0
        ? await fs.promises.readFile(outClip)
        : null

    const voiceBuffer =
      fs.existsSync(outVoice) && (await fs.promises.stat(outVoice)).size > 0
        ? await fs.promises.readFile(outVoice)
        : null

    return { clipBuffer, voiceBuffer }
  } finally {
    await Promise.all([
      fs.promises.unlink(inFile).catch(() => {}),
      fs.promises.unlink(outClip).catch(() => {}),
      fs.promises.unlink(outVoice).catch(() => {})
    ])
  }
}

module.exports = {
  createAudioSticker
}
