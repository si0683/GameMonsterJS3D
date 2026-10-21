import { Howl } from "howler"

// Howler.js: sound effects and music. Files live in public/sounds.
// Browsers allow sound only after a click or key press — the menu button starts it.
const url = (file: string) => `${import.meta.env.BASE_URL}sounds/${file}`

export const sounds = {
  coin: new Howl({ src: [url("coin.wav")], volume: 0.5 }),
  jump: new Howl({ src: [url("jump.wav")], volume: 0.4 }),
  win: new Howl({ src: [url("win.wav")], volume: 0.6 }),
  music: new Howl({ src: [url("music.mp3")], loop: true, volume: 0.3, html5: true }),
}
