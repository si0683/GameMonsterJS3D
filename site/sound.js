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
 * A woman's scream, synthesised: two slightly detuned high voices (~1 kHz) that break and waver,
 * shaped by vowel formants sliding from "a" to "i", roughened by distortion, with breath on top.
 */
function scream(at) {
  const length = 1.7
  const voice = ctx.createGain()
  voice.gain.setValueAtTime(0.0001, at)
  voice.gain.exponentialRampToValueAtTime(0.5, at + 0.04)
  voice.gain.setValueAtTime(0.5, at + 0.9)
  voice.gain.linearRampToValueAtTime(0.35, at + 1.3)
  voice.gain.exponentialRampToValueAtTime(0.0001, at + length)

  // vowel formants in parallel: "a" opening into a shrill "i"
  const formants = [
    [950, 520, 6, 1.0],
    [1500, 2600, 7, 0.8],
    [3000, 3300, 9, 0.5],
    [4200, 4400, 11, 0.3],
  ]
  const mouth = ctx.createGain()
  for (const [from, to, q, level] of formants) {
    const band = ctx.createBiquadFilter()
    band.type = "bandpass"
    band.Q.value = q
    band.frequency.setValueAtTime(from, at)
    band.frequency.linearRampToValueAtTime(to, at + 0.7)
    const gain = ctx.createGain()
    gain.gain.value = level * 2.4
    mouth.connect(band).connect(gain).connect(voice)
  }

  // a raw, strained throat
  const rasp = ctx.createWaveShaper()
  const curve = new Float32Array(1024)
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / 1023) * 2 - 1) * 3.5)
  rasp.curve = curve
  rasp.connect(mouth)

  // the pitch: a jump up, a wavering hold, a break and a falling end
  const pitch = [700, 1180, 1080, 1250, 1120, 1300, 980, 760]
  const times = [0, 0.1, 0.35, 0.55, 0.8, 1.0, 1.35, length]
  for (const [detune, gainLevel] of [
    [0, 0.6],
    [18, 0.45],
  ]) {
    const osc = ctx.createOscillator()
    osc.type = "sawtooth"
    osc.detune.value = detune
    times.forEach((time, i) =>
      i === 0
        ? osc.frequency.setValueAtTime(pitch[0], at)
        : osc.frequency.exponentialRampToValueAtTime(pitch[i] * (1 + (Math.random() - 0.5) * 0.04), at + time),
    )
    // vibrato that gets wilder, plus a nervous flutter
    const vibrato = ctx.createOscillator()
    vibrato.frequency.setValueAtTime(5.5, at)
    vibrato.frequency.linearRampToValueAtTime(8.5, at + length)
    const depth = ctx.createGain()
    depth.gain.setValueAtTime(15, at)
    depth.gain.linearRampToValueAtTime(70, at + length)
    vibrato.connect(depth).connect(osc.frequency)
    const flutter = noiseSource(at, length)
    const flutterLow = ctx.createBiquadFilter()
    flutterLow.type = "lowpass"
    flutterLow.frequency.value = 30
    const flutterDepth = ctx.createGain()
    flutterDepth.gain.value = 260
    flutter.connect(flutterLow).connect(flutterDepth).connect(osc.frequency)

    const level = ctx.createGain()
    level.gain.value = gainLevel
    osc.connect(level).connect(rasp)
    osc.start(at)
    vibrato.start(at)
    osc.stop(at + length)
    vibrato.stop(at + length)
  }

  // breath rushing through the scream
  const air = ctx.createBiquadFilter()
  air.type = "bandpass"
  air.frequency.value = 2800
  air.Q.value = 0.8
  const airLevel = ctx.createGain()
  airLevel.gain.value = 0.35
  noiseSource(at, length).connect(air).connect(airLevel).connect(voice)

  voice.connect(master)
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
    music.gain.setValueAtTime(0.0001, at + 2.2)
    music.gain.exponentialRampToValueAtTime(0.55, at + 6)

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
