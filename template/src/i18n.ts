import { platform } from "./platform"

// Player-facing texts. The language comes from the platform (Yandex: ysdk.environment.i18n.lang,
// otherwise the browser) — moderation on game portals requires it.
export const texts = {
  ru: {
    title: "Моя 3D-игра",
    goal: "Соберите все монеты",
    play: "Играть",
    again: "Ещё раз",
    win: "Победа!",
    time: (seconds: string) => `Все монеты за ${seconds} с`,
    best: (seconds: string) => `Рекорд: ${seconds} с`,
    coins: "Монеты",
    seconds: "с",
    controls: "WASD или стрелки — катиться, пробел — прыжок",
    sound: "Звук",
    music: "Музыка",
    off: "выкл",
    noAds: "Убрать рекламу",
  },
  en: {
    title: "My 3D Game",
    goal: "Collect all the coins",
    play: "Play",
    again: "Play again",
    win: "You win!",
    time: (seconds: string) => `All coins in ${seconds} s`,
    best: (seconds: string) => `Best: ${seconds} s`,
    coins: "Coins",
    seconds: "s",
    controls: "WASD or arrows — roll, space — jump",
    sound: "Sound",
    music: "Music",
    off: "off",
    noAds: "Remove ads",
  },
}

// Russian for the CIS languages, English for everyone else
const RU = ["ru", "be", "kk", "uk", "uz"]

/** Which text set a platform language gets */
export function pickLanguage(lang: string): keyof typeof texts {
  return RU.includes(lang.slice(0, 2).toLowerCase()) ? "ru" : "en"
}

export const t = () => texts[pickLanguage(platform.lang)]

/** "Звук: 75%" / "Звук: выкл" */
export function volumeLabel(key: "sound" | "music", volume: number): string {
  return `${t()[key]}: ${volume > 0 ? `${Math.round(volume * 100)}%` : t().off}`
}
