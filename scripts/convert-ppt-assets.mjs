// Convert PPT media into the lock-folio asset directories + variants.
//
//   photos  p1..p12   ← image28..image39      (full + 300/600/900)
//   video   v1        ← image27 (cover)       (full + 480/640/960) + media1.mp4
//   articles a1..a3    ← image19, 20, 21       (full + 420/760)
//   notes   n1..n9    ← image1..image9        (full + 400/700)
//   avatar           ← user-supplied JPG      (full + 360/640)
//
// Outputs JSON manifest so content.ts / assetManifest.ts can read it.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

const require = createRequire(import.meta.url)
const sharp = require(resolve(ROOT, 'node_modules/sharp'))

const SRC = resolve(ROOT, '.extract/ppt-media')
const OUT = resolve(ROOT, 'public/assets')

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

function findFile(name) {
  for (const f of readdirSync(SRC)) {
    if (f.toLowerCase() === name.toLowerCase()) return join(SRC, f)
  }
  return null
}

async function writeVariants(srcPath, slug, dirName, widths) {
  const outDir = join(OUT, dirName)
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const files = []

  // Full-size
  const fullBuf = await sharp(srcPath).webp({ quality: 82 }).toBuffer()
  const fullPath = join(outDir, `${slug}.webp`)
  writeFileSync(fullPath, fullBuf)
  files.push({
    path: `/assets/${dirName}/${slug}.webp`,
    bytes: fullBuf.length,
    version: createHash('sha256').update(fullBuf).digest('hex').slice(0, 8),
  })

  // Variants
  for (const w of widths) {
    const buf = await sharp(srcPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
    const p = join(outDir, `${slug}-${w}.webp`)
    writeFileSync(p, buf)
    files.push({
      path: `/assets/${dirName}/${slug}-${w}.webp`,
      width: w,
      bytes: buf.length,
      version: createHash('sha256').update(buf).digest('hex').slice(0, 8),
    })
  }
  return files
}

async function copyAs(srcPath, dstPath) {
  const data = await sharp(srcPath).webp({ quality: 82 }).toBuffer()
  writeFileSync(dstPath, data)
  return {
    path: dstPath.replace(resolve(ROOT, 'public'), '').replace(/\\/g, '/'),
    bytes: data.length,
    version: createHash('sha256').update(data).digest('hex').slice(0, 8),
  }
}

async function copyFile(srcPath, dstPath) {
  const data = readFileSync(srcPath)
  writeFileSync(dstPath, data)
  return {
    path: dstPath.replace(resolve(ROOT, 'public'), '').replace(/\\/g, '/'),
    bytes: data.length,
    version: createHash('sha256').update(data).digest('hex').slice(0, 8),
  }
}

const manifest = { photos: [], video: null, articles: [], notes: [], avatar: null, videoFile: null }

// 12 photos (slides 10/11/12: image28..image39)
const photoSrc = [
  'image28.jpeg', 'image29.jpeg', 'image30.jpeg', 'image31.jpeg',
  'image32.jpeg', 'image33.jpg',  'image34.jpeg', 'image35.jpeg',
  'image36.jpeg', 'image37.jpeg', 'image38.jpg',  'image39.jpeg',
]
for (let i = 0; i < photoSrc.length; i += 1) {
  const src = findFile(photoSrc[i])
  if (!src) throw new Error(`missing ${photoSrc[i]}`)
  const slug = `p${i + 1}`
  const files = await writeVariants(src, slug, 'photo', [300, 600, 900])
  manifest.photos.push({ slug, files })
  console.log(`✓ photo ${slug} <- ${photoSrc[i]}`)
}

// 1 video (cover = image27.png, file = media1.mp4)
{
  const coverSrc = findFile('image27.png')
  if (!coverSrc) throw new Error('missing image27.png')
  const files = await writeVariants(coverSrc, 'v1', 'cover', [480, 640, 960])
  // copy the mp4 too
  const mp4 = join(SRC, 'media1.mp4')
  const mp4Dst = join(OUT, 'video/v1.mp4')
  if (!existsSync(join(OUT, 'video'))) mkdirSync(join(OUT, 'video'), { recursive: true })
  const mp4Info = await copyFile(mp4, mp4Dst)
  manifest.video = { slug: 'v1', files, file: mp4Info }
  console.log(`✓ video v1 (cover + mp4)`)
}

// 3 articles (公众号长文): image19, image20, image21 -> a1, a2, a3
const articleSrc = ['image19.png', 'image20.png', 'image21.png']
for (let i = 0; i < articleSrc.length; i += 1) {
  const src = findFile(articleSrc[i])
  if (!src) throw new Error(`missing ${articleSrc[i]}`)
  const slug = `a${i + 1}`
  const files = await writeVariants(src, slug, 'articles', [420, 760])
  manifest.articles.push({ slug, files })
  console.log(`✓ article ${slug} <- ${articleSrc[i]}`)
}

// 9 notes (实习爆款笔记): image1..image9 -> n1..n9
const noteSrc = [
  'image1.jpeg', 'image2.jpeg', 'image3.jpeg', 'image4.jpeg',
  'image5.jpeg', 'image6.jpeg', 'image7.jpeg', 'image8.jpeg', 'image9.jpeg',
]
for (let i = 0; i < noteSrc.length; i += 1) {
  const src = findFile(noteSrc[i])
  if (!src) throw new Error(`missing ${noteSrc[i]}`)
  const slug = `n${i + 1}`
  const files = await writeVariants(src, slug, 'notes', [400, 700])
  manifest.notes.push({ slug, files })
  console.log(`✓ note ${slug} <- ${noteSrc[i]}`)
}

// Avatar: copy the user-supplied JPG into /assets/avatar/
{
  const avatarSrc =
    'C:\\Users\\徐诗怡\\.minimax\\v2\\assets\\2026\\09\\16\\13-33-44-822-asset_20260916-133344-822_d35cf51ad26e_c6ea9f8a-e454e8fc147ad19bebaea9449d4ef734.jpg'
  const outDir = join(OUT, 'avatar')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  // generate webp + small variants
  const files = await writeVariants(avatarSrc, 'avatar', 'avatar', [256, 512])
  manifest.avatar = { slug: 'avatar', files }
  console.log(`✓ avatar from user JPG`)
}

writeFileSync(resolve(ROOT, 'scripts/ppt-asset-manifest.json'), JSON.stringify(manifest, null, 2))
console.log('\nDone.')