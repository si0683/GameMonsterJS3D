// Packs dist/ into game.zip with index.html at the archive root —
// the format game portals expect (Yandex Games console, itch.io, VK Play…).
// No dependencies: a minimal ZIP writer on top of node:zlib.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { crc32, deflateRawSync } from "node:zlib"

const SOURCE = "dist"
const TARGET = "game.zip"

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else files.push(path)
  }
}
walk(SOURCE)
if (!files.some((file) => relative(SOURCE, file) === "index.html")) {
  console.error("dist/index.html not found — run the build first")
  process.exit(1)
}

const local = []
const central = []
let offset = 0
for (const file of files) {
  const name = Buffer.from(relative(SOURCE, file).split(sep).join("/"))
  const data = readFileSync(file)
  const packed = deflateRawSync(data, { level: 9 })
  const crc = crc32(data)

  const header = Buffer.alloc(30)
  header.writeUInt32LE(0x04034b50, 0) // local file header
  header.writeUInt16LE(20, 4) // version needed
  header.writeUInt16LE(0x0800, 6) // UTF-8 names
  header.writeUInt16LE(8, 8) // deflate
  header.writeUInt32LE(crc, 14)
  header.writeUInt32LE(packed.length, 18)
  header.writeUInt32LE(data.length, 22)
  header.writeUInt16LE(name.length, 26)
  local.push(header, name, packed)

  const entry = Buffer.alloc(46)
  entry.writeUInt32LE(0x02014b50, 0) // central directory header
  entry.writeUInt16LE(20, 4)
  entry.writeUInt16LE(20, 6)
  entry.writeUInt16LE(0x0800, 8)
  entry.writeUInt16LE(8, 10)
  entry.writeUInt32LE(crc, 16)
  entry.writeUInt32LE(packed.length, 20)
  entry.writeUInt32LE(data.length, 24)
  entry.writeUInt16LE(name.length, 28)
  entry.writeUInt32LE(offset, 42)
  central.push(entry, name)

  offset += header.length + name.length + packed.length
}

const centralSize = central.reduce((sum, part) => sum + part.length, 0)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0) // end of central directory
end.writeUInt16LE(files.length, 8)
end.writeUInt16LE(files.length, 10)
end.writeUInt32LE(centralSize, 12)
end.writeUInt32LE(offset, 16)

const zip = Buffer.concat([...local, ...central, end])
writeFileSync(TARGET, zip)
console.log(`${TARGET}: ${files.length} files, ${(zip.length / 1024 / 1024).toFixed(2)} MB`)
