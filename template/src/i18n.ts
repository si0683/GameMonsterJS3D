import { platform } from "./platform"

// Player-facing texts. The language comes from the platform (Yandex: ysdk.environment.i18n.lang,
// otherwise the browser) — moderation on game portals requires it.
const texts = {
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
  },
}

// Russian for the CIS languages, English for everyone else
const RU = ["ru", "be", "kk", "uk", "uz"]

export const t = () => (RU.includes(platform.lang) ? texts.ru : texts.en)
