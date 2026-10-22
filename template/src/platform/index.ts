// The platform this build is made for. Created without an SDK (npm create … -- --sdk=none).
// guard() keeps the game running when an SDK call fails or never answers.
import { guard } from "./guard"
import { platform as current } from "./none"

export const platform = guard(current)
export type { Platform, SaveData } from "./types"
