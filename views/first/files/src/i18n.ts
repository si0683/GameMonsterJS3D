import { platform } from "./platform"

// Player-facing texts. The language comes from the platform (Yandex: ysdk.environment.i18n.lang,
// otherwise the browser) — moderation on game portals requires it.
export const texts = {
  ru: {
    title: "Тёмный этаж",
    goal: "Найди все ключи и выход. Не дай ему себя увидеть.",
    play: "Войти",
    again: "Ещё раз",
    escaped: "Ты выбрался",
    caught: "Он тебя нашёл",
    caughtHint: "Он слышит шаги. Бегай только когда нужно.",
    time: (seconds: string) => `Выход за ${seconds} с`,
    best: (seconds: string) => `Рекорд: ${seconds} с`,
    keys: "Ключи",
    exitOpen: "выход открыт",
    seconds: "с",
    clickToLook: "Кликните, чтобы осматриваться мышью",
    controls: "Мышь — смотреть, WASD — идти, Shift — бежать, Esc — отпустить мышь",
    controlsTouch: "Левая половина экрана — идти, правая — смотреть. До края — бег.",
    sound: "Звук",
    music: "Музыка",
    off: "выкл",
    noAds: "Убрать рекламу",
  },
  en: {
    title: "The Dark Floor",
    goal: "Find every key and the way out. Do not let it see you.",
    play: "Enter",
    again: "Try again",
    escaped: "You got out",
    caught: "It found you",
    caughtHint: "It hears footsteps. Run only when you must.",
    time: (seconds: string) => `Out in ${seconds} s`,
    best: (seconds: string) => `Best: ${seconds} s`,
    keys: "Keys",
    exitOpen: "exit open",
    seconds: "s",
    clickToLook: "Click to look around with the mouse",
    controls: "Mouse — look, WASD — walk, Shift — run, Esc — release the mouse",
    controlsTouch: "Left half of the screen — walk, right half — look. Push to the edge to run.",
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
