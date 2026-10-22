// The platform this build is made for. Created with the Yandex Games SDK (npm create … -- --sdk=yandex).
// To build without the SDK, import from "./none" instead.
// guard() keeps the game running when an SDK call fails or never answers.
import { guard } from "./guard"
import { platform as current } from "./yandex"

export const platform = guard(current)
export type { Platform, SaveData } from "./types"
