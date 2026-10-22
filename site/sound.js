// Sound of the landing page: the ambient track in a loop and effects made right in the browser
// with Web Audio — the flashlight's click, the lamp's crackle and her scream. It moves in silence.
// Browsers allow sound only after a click or a key press, so it starts on the first one
// (unless the visitor turned it off: the choice is kept in localStorage).

const KEY = "gm-sound"
const TRACK = "site/ambient.mp3"

let ctx = null
let master = null // everything → master → compressor → speakers
let music = null // the track's gain (ducked during the scare)
let muffle = null // low-pass on the track: the dark sounds closed-in
let starting = null

function readPreference() {
  try {
    return localStorage.getItem(KEY) !== "off"
  } catch {
    return true
  }
}

let enabled = readPreference()

/** White noise, made once and reused by every effect */
let noise = null
function noiseBuffer() {
  if (noise) return noise
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

/** A gain node with an attack–decay envelope, connected to master */
function envelope(peak, attack, decay, at = ctx.currentTime) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
  gain.connect(master)
  return gain
}

function noiseSource(at, length) {
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer()
  source.start(at, Math.random() * Math.max(0, 2 - length), length)
  return source
}

async function start() {
  if (ctx) {
    if (ctx.state === "suspended") await ctx.resume()
    return
  }
  ctx = new AudioContext()
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -14
  compressor.ratio.value = 6
  compressor.connect(ctx.destination)
  master = ctx.createGain()
  master.gain.value = 0.85
  master.connect(compressor)

  muffle = ctx.createBiquadFilter()
  muffle.type = "lowpass"
  muffle.frequency.value = 7000
  music = ctx.createGain()
  music.gain.value = 0.0001
  muffle.connect(music)
  music.connect(master)

  const response = await fetch(TRACK)
  const buffer = await ctx.decodeAudioData(await response.arrayBuffer())
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.connect(muffle)
  source.start()
  // fade in, not a jump
  music.gain.setValueAtTime(0.0001, ctx.currentTime)
  music.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 4)
}

/**
 * A woman's scream, synthesised: short (~0.45 s) and sharp. A voice-like source (harmonics falling
 * off as in a throat, not a buzzing saw) jumps up in pitch, wobbles and breaks; the formants of an
 * open "A" shape it, distortion tears it, breath rushes through it, and the hallway echoes it.
 */
const SCREAM = {
  length: 0.45,
  pitch: [640, 980, 760], // start, held, end (Hz)
  tilt: 0.8, // how fast the harmonics fall off
  sub: 0.1, // subharmonic: the voice breaking
  jitter: 0.06, // pitch wobble, share of the pitch
  drive: 2.8, // rasp
  air: 0.6, // breath
  room: 0.28, // echo of the hallway
  formants: [
    [950, 3, 1.3],
    [1500, 3.5, 1.0],
    [3100, 4.5, 0.7],
    [4300, 6, 0.35],
  ],
  formantRise: 1.12,
}

let hallway = null
function hallwayEcho() {
  if (hallway) return hallway
  hallway = ctx.createBuffer(2, ctx.sampleRate * 0.9, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = hallway.getChannelData(c)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.5)
  }
  return hallway
}

function scream(at, v = SCREAM) {
  const len = v.length

  const n = 40
  const imag = new Float32Array(n)
  for (let k = 1; k < n; k++) imag[k] = 1 / Math.pow(k, v.tilt)
  const throat = ctx.createPeriodicWave(new Float32Array(n), imag)

  // voice → mouth (formants) → rasp → envelope → dry + hallway echo
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(1, at + 0.012)
  env.gain.setValueAtTime(1, at + len * 0.55)
  env.gain.exponentialRampToValueAtTime(0.35, at + len * 0.8)
  env.gain.exponentialRampToValueAtTime(0.0001, at + len)

  const rasp = ctx.createWaveShaper()
  const curve = new Float32Array(2048)
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / 2047) * 2 - 1) * v.drive)
  rasp.curve = curve
  rasp.oversample = "4x"
  rasp.connect(env)

  const mouth = ctx.createGain()
  for (const [f, q, level] of v.formants) {
    const band = ctx.createBiquadFilter()
    band.type = "bandpass"
    band.frequency.setValueAtTime(f, at)
    band.frequency.linearRampToValueAtTime(f * v.formantRise, at + len)
    band.Q.value = q
    const gain = ctx.createGain()
    gain.gain.value = level
    mouth.connect(band).connect(gain).connect(rasp)
  }

  // unsteady loudness
  const shimmer = ctx.createGain()
  const shake = ctx.createBiquadFilter()
  shake.type = "lowpass"
  shake.frequency.value = 70
  const shakeDepth = ctx.createGain()
  shakeDepth.gain.value = 0.35
  noiseSource(at, len).connect(shake).connect(shakeDepth).connect(shimmer.gain)
  shimmer.connect(mouth)

  const [p0, p1, p2] = v.pitch
  for (const [ratio, level, detune] of [
    [1, 1, 0],
    [1, 0.6, 22],
    [0.5, v.sub, 0],
  ]) {
    const osc = ctx.createOscillator()
    osc.setPeriodicWave(throat)
    osc.detune.value = detune
    osc.frequency.setValueAtTime(p0 * ratio, at)
    osc.frequency.exponentialRampToValueAtTime(p1 * ratio, at + 0.05)
    osc.frequency.exponentialRampToValueAtTime(p1 * 1.06 * ratio, at + len * 0.6)
    osc.frequency.exponentialRampToValueAtTime(p2 * ratio, at + len)
    const jitter = ctx.createBiquadFilter()
    jitter.type = "lowpass"
    jitter.frequency.value = 45
    const jitterDepth = ctx.createGain()
    jitterDepth.gain.value = p1 * ratio * v.jitter
    noiseSource(at, len).connect(jitter).connect(jitterDepth).connect(osc.frequency)
    const gain = ctx.createGain()
    gain.gain.value = level
    osc.connect(gain).connect(shimmer)
    osc.start(at)
    osc.stop(at + len)
  }

  const air = ctx.createGain()
  air.gain.value = v.air
  noiseSource(at, len).connect(air).connect(mouth)

  const room = ctx.createConvolver()
  room.buffer = hallwayEcho()
  const wet = ctx.createGain()
  wet.gain.value = v.room
  const dry = ctx.createGain()
  dry.gain.value = 0.5
  // the scream is the loudest thing on the page
  const loud = ctx.createGain()
  loud.gain.value = 1.6
  env.connect(dry).connect(loud)
  env.connect(room).connect(wet).connect(loud)
  loud.connect(master)
}

const ready = () => enabled && ctx && ctx.state === "running" && music

export const sound = {
  get enabled() {
    return enabled
  },

  /** "off" before the first gesture, then the AudioContext state; for checks */
  get state() {
    return ctx ? `${ctx.state}${music ? "+music" : ""}` : "off"
  },

  /** Turns the sound on or off (button); remembered for the next visit */
  async setEnabled(on) {
    enabled = on
    try {
      localStorage.setItem(KEY, on ? "on" : "off")
    } catch {
      // storage blocked: the choice lasts until reload
    }
    if (on) {
      starting ??= start().catch((error) => console.warn("[sound]", error))
      await starting
      await ctx?.resume()
    } else await ctx?.suspend()
  },

  /** First click or key press anywhere: start, if the visitor has not turned the sound off */
  unlock() {
    if (!enabled || starting) return
    starting = start().catch((error) => console.warn("[sound]", error))
  },

  /** Brightness of the scene 0…1: the darker it is, the more muffled the music */
  level(light) {
    if (!ready()) return
    const target = 600 + Math.min(1, light) * 6400
    muffle.frequency.setTargetAtTime(target, ctx.currentTime, 0.08)
  },

  /** The flashlight's switch: a dry click */
  click() {
    if (!ready()) return
    const at = ctx.currentTime
    const filter = ctx.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.value = 2500
    noiseSource(at, 0.03).connect(filter).connect(envelope(0.18, 0.002, 0.03, at))
  },

  /** The ceiling lamp sputters: an electric buzz with crackle */
  lamp() {
    if (!ready()) return
    const at = ctx.currentTime
    const hum = ctx.createOscillator()
    hum.type = "sawtooth"
    hum.frequency.value = 100
    const band = ctx.createBiquadFilter()
    band.type = "bandpass"
    band.frequency.value = 1200
    band.Q.value = 2
    const out = envelope(0.12, 0.005, 0.3, at)
    hum.connect(band).connect(out)
    hum.start(at)
    hum.stop(at + 0.35)
    const crackle = ctx.createBiquadFilter()
    crackle.type = "highpass"
    crackle.frequency.value = 3000
    noiseSource(at, 0.25).connect(crackle).connect(envelope(0.2, 0.003, 0.22, at))
  },

  /** Right in front of you: the music drops out and she screams */
  scare() {
    if (!ready()) return
    const at = ctx.currentTime
    // the track vanishes, then slowly comes back after the scream
    music.gain.cancelScheduledValues(at)
    music.gain.setValueAtTime(0.55, at)
    music.gain.exponentialRampToValueAtTime(0.0001, at + 0.03)
    music.gain.setValueAtTime(0.0001, at + 1.6)
    music.gain.exponentialRampToValueAtTime(0.55, at + 5)

    scream(at)

    // a low hit under the first moment
    const thump = ctx.createOscillator()
    thump.type = "sine"
    thump.frequency.setValueAtTime(85, at)
    thump.frequency.exponentialRampToValueAtTime(32, at + 0.5)
    thump.connect(envelope(0.8, 0.004, 0.6, at))
    thump.start(at)
    thump.stop(at + 0.7)
  },
}

// start on the first gesture; stay quiet in hidden tabs
for (const type of ["pointerdown", "keydown"]) addEventListener(type, () => sound.unlock(), { capture: true })
document.addEventListener("visibilitychange", () => {
  if (!ctx || !enabled) return
  if (document.hidden) ctx.suspend()
  else ctx.resume()
})
