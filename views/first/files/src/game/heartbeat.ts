import { Howler } from "howler"

import { save } from "../save"

// Sounds made in code with Web Audio, through Howler's own context and master volume — so they
// follow the menu's sound setting and go quiet with the rest when the platform pauses the game.

const audio = () => {
  const howler = Howler as unknown as { ctx?: AudioContext; masterGain?: GainNode }
  return howler.ctx && howler.masterGain && howler.ctx.state === "running"
    ? { ctx: howler.ctx, out: howler.masterGain }
    : null
}

/** One heartbeat ("lub-dub"), louder with danger 0…1 */
export function heartbeat(danger: number) {
  const a = audio()
  const volume = save.get().settings.sound
  if (!a || volume <= 0) return
  const { ctx, out } = a
  for (const [delay, level] of [
    [0, 1],
    [0.16, 0.7],
  ]) {
    const at = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(62, at)
    osc.frequency.exponentialRampToValueAtTime(34, at + 0.14)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.9 * level * volume * (0.3 + 0.7 * danger), at + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2)
    osc.connect(gain).connect(out)
    osc.start(at)
    osc.stop(at + 0.22)
  }
}

/** It got you: a harsh burst of noise with a falling howl */
export function caughtSting() {
  const a = audio()
  const volume = save.get().settings.sound
  if (!a || volume <= 0) return
  const { ctx, out } = a
  const at = ctx.currentTime
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const source = ctx.createBufferSource()
  source.buffer = noise
  const band = ctx.createBiquadFilter()
  band.type = "bandpass"
  band.Q.value = 1.2
  band.frequency.setValueAtTime(3200, at)
  band.frequency.exponentialRampToValueAtTime(500, at + 0.7)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.9 * volume, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.8)
  source.connect(band).connect(gain).connect(out)
  source.start(at)
}
