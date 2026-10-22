// Sound of the landing page: the ambient track in a loop and effects made right in the browser
// with Web Audio — the flashlight's click, a breath in the dark, the lamp's crackle, the scare.
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
  source.start(at, Math.random(), length)
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

  /** It moves in the dark: a slow, close exhale */
  breath() {
    if (!ready()) return
    const at = ctx.currentTime
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.Q.value = 0.9
    filter.frequency.setValueAtTime(700, at)
    filter.frequency.exponentialRampToValueAtTime(260, at + 1.3)
    noiseSource(at, 1.6).connect(filter).connect(envelope(0.35, 0.35, 1.1, at))
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

  /** Right in front of you: the music drops out and a screech hits */
  scare() {
    if (!ready()) return
    const at = ctx.currentTime
    // the track vanishes for a moment
    music.gain.cancelScheduledValues(at)
    music.gain.setValueAtTime(0.55, at)
    music.gain.exponentialRampToValueAtTime(0.0001, at + 0.04)
    music.gain.setValueAtTime(0.0001, at + 1.4)
    music.gain.exponentialRampToValueAtTime(0.55, at + 4)

    // a dissonant screech sliding up
    const screech = envelope(0.5, 0.008, 1.3, at)
    for (const [from, to] of [
      [220, 660],
      [233, 700],
      [311, 990],
    ]) {
      const osc = ctx.createOscillator()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(from, at)
      osc.frequency.exponentialRampToValueAtTime(to, at + 0.6)
      osc.connect(screech)
      osc.start(at)
      osc.stop(at + 1.4)
    }
    // a burst of noise sweeping up
    const sweep = ctx.createBiquadFilter()
    sweep.type = "bandpass"
    sweep.Q.value = 1.5
    sweep.frequency.setValueAtTime(800, at)
    sweep.frequency.exponentialRampToValueAtTime(4000, at + 0.5)
    noiseSource(at, 0.9).connect(sweep).connect(envelope(0.6, 0.005, 0.8, at))
    // and a thump you feel
    const thump = ctx.createOscillator()
    thump.type = "sine"
    thump.frequency.setValueAtTime(90, at)
    thump.frequency.exponentialRampToValueAtTime(35, at + 0.5)
    thump.connect(envelope(0.9, 0.004, 0.6, at))
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
