// The platform this build is made for. Created with VK Bridge (VK Games) (npm create … -- --sdk=vk).
// To build without the SDK, import from "./none" instead.
// guard() keeps the game running when an SDK call fails or never answers.
import { guard } from "./guard"
import { platform as current } from "./vk"

export const platform = guard(current)
export type { Features, Platform, Product, Purchase, SaveData } from "./types"
