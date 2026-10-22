import { Howl } from "howler"

import type { Settings } from "./save"

// Howler.js: sound effects and music. Files live in public/sounds.
// Browsers allow sound only after a click or key press — the menu button starts it.
const url = (file: string) => `${import.meta.env.BASE_URL}sounds/${file}`

/** Each sound's own loudness; the player's settings (menu) scale it */
const BASE = { coin: 0.5, jump: 0.4, win: 0.6, music: 0.3 }

export const sounds = {
  coin: new Howl({ src: [url("coin.wav")], volume: BASE.coin }),
  jump: new Howl({ src: [url("jump.wav")], volume: BASE.jump }),
  win: new Howl({ src: [url("win.wav")], volume: BASE.win }),
  music: new Howl({ src: [url("music.mp3")], loop: true, volume: BASE.music, html5: true }),
}

/** Apply the volume settings: effects follow `sound`, the music follows `music` */
export function applyVolumes(settings: Settings) {
  sounds.coin.volume(BASE.coin * settings.sound)
  sounds.jump.volume(BASE.jump * settings.sound)
  sounds.win.volume(BASE.win * settings.sound)
  sounds.music.volume(BASE.music * settings.music)
}
