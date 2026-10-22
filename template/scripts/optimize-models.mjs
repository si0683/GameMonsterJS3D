// npm run optimize — compresses every model from models/ into public/models/ (what the game loads).
// gltf-transform: merges and welds meshes, compresses geometry with meshopt (decoded by drei's
// useGLTF out of the box), converts textures to WebP and caps them at 1024 px.
// Unchanged models are skipped; `npm run optimize -- --force` redoes all of them.
// The tool is downloaded by npx on first use, so it does not weigh down npm install.

import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { basename, extname, join } from "node:path"

const SOURCE = "models"
const TARGET = join("public", "models")
const TOOL = "@gltf-transform/cli@4.5.1"
const force = process.argv.includes("--force")

if (!existsSync(SOURCE)) {
  console.log(`Put source models (.glb / .gltf) into ${SOURCE}/ and run again.`)
  process.exit(0)
}
mkdirSync(TARGET, { recursive: true })

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`
let failed = 0
let done = 0

for (const file of readdirSync(SOURCE)) {
  const ext = extname(file).toLowerCase()
  if (ext !== ".glb" && ext !== ".gltf") continue
  const input = join(SOURCE, file)
  const output = join(TARGET, `${basename(file, extname(file))}.glb`)
  if (!force && existsSync(output) && statSync(output).mtimeMs >= statSync(input).mtimeMs) continue

  const args = ["-y", TOOL, "optimize", input, output]
  args.push("--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024")
  // Through the shell: npx is a .cmd file on Windows. Fixed arguments; paths with spaces are quoted
  const command = ["npx", ...args].map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)).join(" ")
  const result = spawnSync(command, { stdio: ["ignore", "ignore", "inherit"], shell: true })
  if (result.status !== 0) {
    failed++
    console.error(`✖ ${input}`)
    continue
  }
  done++
  console.log(`✔ ${input} ${kb(statSync(input).size)} → ${output} ${kb(statSync(output).size)}`)
}

console.log(done || failed ? `Optimized: ${done}, failed: ${failed}` : "All models are up to date.")
process.exit(failed ? 1 : 0)
