#!/usr/bin/env node
// create-gamemonsterjs3d — copies the 3D game starter (Vite + React Three Fiber + Drei + Rapier + Howler + zustand)
// into a new folder and installs its dependencies.
//
//   npm create gamemonsterjs3d@latest my-game
//   npx create-gamemonsterjs3d my-game --no-install --no-git

import { spawnSync } from "node:child_process"
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { basename, join, relative, resolve } from "node:path"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"

const NAME = "GameMonsterJS3D"
const PACKAGE = "gamemonsterjs3d"
const STACK = "Vite · Three.js · React Three Fiber · Drei · Rapier · Howler · zustand"
const DEFAULT_DIR = "my-game"
const DEV_URL = "http://localhost:5173"
const TIPS = `Модели .glb кладите в public/models, звуки — в public/sounds`

const TEMPLATE = fileURLToPath(new URL("../template", import.meta.url))
const SKIP = new Set(["node_modules", "dist", "package-lock.json"])
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))

const color = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text)
const bold = color(1)
const dim = color(2)
const green = color(32)
const red = color(31)
const magenta = color(35)

const args = process.argv.slice(2)
const flags = new Set(args.filter((arg) => arg.startsWith("-")))
let target = args.find((arg) => !arg.startsWith("-"))

if (flags.has("-h") || flags.has("--help")) {
  console.log(`
${bold(`create-${PACKAGE}`)} ${dim(version)}

  npm create ${PACKAGE}@latest ${dim("[folder]")} ${dim("[-- --no-install --no-git]")}

  --no-install   do not run npm install
  --no-git       do not run git init
`)
  process.exit(0)
}

console.log(`\n${magenta(bold(NAME))} ${dim(version)} — ${STACK}\n`)

if (!target) {
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    target = (await rl.question(`Папка проекта ${dim(`(${DEFAULT_DIR})`)}: `)).trim()
    rl.close()
  }
  target ||= DEFAULT_DIR
}

const root = resolve(target)
if (existsSync(root) && readdirSync(root).length > 0) {
  console.error(red(`Папка «${target}» не пуста. Укажите новую папку.`))
  process.exit(1)
}

cpSync(TEMPLATE, root, {
  recursive: true,
  filter: (source) => !SKIP.has(basename(source)),
})
// npm never publishes a file called .gitignore, so the template keeps it as _gitignore
renameSync(join(root, "_gitignore"), join(root, ".gitignore"))

const pkgPath = join(root, "package.json")
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
pkg.name = toPackageName(basename(root))
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")

console.log(`${green("✔")} Проект создан: ${bold(root)}`)

const agent = (process.env.npm_config_user_agent ?? "npm").split("/")[0]
const pm = ["pnpm", "yarn", "bun"].includes(agent) ? agent : "npm"

let installed = false
if (!flags.has("--no-install")) {
  console.log(`${dim("…")} Устанавливаю зависимости (${pm} install), это займёт минуту\n`)
  installed = run(pm, ["install"], root)
  console.log(installed ? `\n${green("✔")} Зависимости установлены` : red("✖ Установка не удалась — запустите её вручную"))
}

if (!flags.has("--no-git") && run("git", ["--version"], root, true)) {
  if (run("git", ["init", "-q"], root, true)) console.log(`${green("✔")} Git-репозиторий создан`)
}

const cd = relative(process.cwd(), root) || "."
console.log(`
${bold("Дальше:")}
  cd ${cd.includes(" ") ? `"${cd}"` : cd}${installed ? "" : `\n  ${pm} install`}
  ${pm} run dev          ${dim(`# ${DEV_URL}`)}

${TIPS}
`)

function run(command, commandArgs, cwd, quiet = false) {
  const options = { cwd, stdio: quiet ? "ignore" : "inherit" }
  // npm, pnpm and yarn are .cmd files on Windows and need a shell (fixed arguments only)
  const result =
    process.platform === "win32"
      ? spawnSync([command, ...commandArgs].join(" "), { ...options, shell: true })
      : spawnSync(command, commandArgs, options)
  return result.status === 0
}

function toPackageName(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^[._]/, "")
      .replace(/[^a-z0-9-~]+/g, "-") || DEFAULT_DIR
  )
}
