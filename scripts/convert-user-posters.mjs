// Convert 5 user-provided PNGs into the WebP variants the lock-folio
// PostersDeck expects: full size + 400 / 700 retina variants.
//
// Run with the project's installed sharp so the libvips binary matches
// the host OS. Falls back to the global install if not present locally.

import { readdirSync, statSync, existsSync, mkdirSync, rmSync, renameSync } from 'node:fs'
import { dirname, join, resolve, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

const candidates = [
  resolve(ROOT, 'node_modules/sharp'),
  process.env.SHARP_PATH,
  'C:\\Users\\徐诗怡\\AppData\\Local\\Temp\\node-extracted\\node-v22.11.0-win-x64\\node_modules\\sharp',
].filter(Boolean)

let sharp
for (const c of candidates) {
  try {
    sharp = createRequire(import.meta.url)(c)
    break
  } catch {}
}

if (!sharp) {
  console.error('Cannot load sharp. Tried:')
  for (const c of candidates) console.error('  -', c)
  process.exit(1)
}

const USER_DIR =
  'C:\\Users\\徐诗怡\\.minimax\\v2\\assets\\2026\\09\\16'
const OUT_DIR = resolve(ROOT, 'public/assets/posters')

const POSTERS = [
  {
    src: '百团大战.png',
    slug: 'baituan',
    title: '百团大战 · BAITUAN DAZHAN',
  },
  {
    src: '文化大观园.png',
    slug: 'wenhua',
    title: '声入万卷 · WENHUA DAGUANYUAN',
  },
  {
    src: '游园会.png',
    slug: 'qiuyuan',
    title: '盛世国庆·遇中秋 · NATIONAL & MID-AUTUMN',
  },
  {
    src: '招新1.png',
    slug: 'recruit1',
    title: '华音社招新 · RECRUITMENT I',
  },
  {
    src: '招新2.png',
    slug: 'recruit2',
    title: '华音社招新 · RECRUITMENT II',
  },
]

const VARIANTS = [400, 700]

function findFile(dir, name) {
  if (!existsSync(dir)) return null
  for (const f of readdirSync(dir)) {
    if (f === name) return join(dir, f)
  }
  return null
}

// Locate the user PNGs. The uploader writes them under
// /v2/assets/<yyyy>/<mm>/<dd>/<timestamp>-<id>_<short>-<filename>.png
// so we scan that day's directory for the matching filename suffix.
const userFiles = []
for (const p of POSTERS) {
  const dir = USER_DIR
  let found = null
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      // match by the part after the last '-' before the extension
      const baseNoExt = basename(f, extname(f))
      if (baseNoExt.endsWith('-' + p.src.replace(/\.png$/i, ''))) {
        found = join(dir, f)
        break
      }
    }
  }
  if (!found) {
    console.error(`! 找不到用户素材：${p.src}（扫描目录：${dir}）`)
    process.exit(1)
  }
  userFiles.push({ ...p, userPath: found })
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

// Wipe the existing 11 poster files so stale posters don't sneak in
const slugSet = new Set(POSTERS.map((p) => p.slug))
const removed = []
for (const f of readdirSync(OUT_DIR)) {
  const base = basename(f, '.webp')
  if (!base) continue
  const slug = base.replace(/-\d+$/, '')
  if (!slugSet.has(slug)) {
    rmSync(join(OUT_DIR, f))
    removed.push(f)
  }
}
console.log(`  · 已清理 ${removed.length} 张旧海报文件`)

const manifest = []

for (const item of userFiles) {
  const input = item.userPath
  const baseOut = join(OUT_DIR, item.slug)

  // Full-size WebP (the deck falls back to this if a variant is missing)
  const fullBuf = await sharp(input)
    .webp({ quality: 80 })
    .toBuffer()
  writeFileSync(`${baseOut}.webp`, fullBuf)
  manifest.push({
    url: `/assets/posters/${item.slug}.webp`,
    bytes: fullBuf.length,
    version: createHash('sha256').update(fullBuf).digest('hex').slice(0, 8),
  })

  // Variant files (-400, -700)
  for (const w of VARIANTS) {
    const buf = await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    const variantPath = `${baseOut}-${w}.webp`
    writeFileSync(variantPath, buf)
    manifest.push({
      url: `/assets/posters/${item.slug}-${w}.webp`,
      bytes: buf.length,
      version: createHash('sha256').update(buf).digest('hex').slice(0, 8),
    })
  }
  console.log(`  ✓ ${item.slug} (full + ${VARIANTS.join(' / ')})`)
}

writeFileSync(
  resolve(ROOT, 'scripts/user-posters-manifest.json'),
  JSON.stringify(
    {
      posters: POSTERS,
      files: manifest,
    },
    null,
    2,
  ),
)

console.log('\nDone.')