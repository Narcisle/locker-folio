// Build the WORK_VARIANTS map and WORK_ASSETS array snippets for
// src/experience/assetManifest.ts from scripts/ppt-asset-manifest.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const data = JSON.parse(readFileSync(resolve(ROOT, 'scripts/ppt-asset-manifest.json'), 'utf8'))

function fullFileOf(files) {
  return files.find((f) => !f.width)
}
function variantsOf(files) {
  return files.filter((f) => f.width).sort((a, b) => a.width - b.width)
}

const lines = []

function blockVariants(prefix, list) {
  for (const item of list) {
    const full = fullFileOf(item.files)
    const variants = variantsOf(item.files)
    lines.push(`  '${prefix}/${item.slug}.webp': [`)
    for (const v of variants) {
      lines.push(
        `    { width: ${v.width}, url: '${prefix}/${item.slug}-${v.width}.webp', bytes: ${v.bytes}, version: '${v.version}' },`,
      )
    }
    lines.push('  ],')
  }
}

// Posters (existing)
blockVariants('/assets/posters', [
  { slug: 'baituan', files: [{ path: '/assets/posters/baituan.webp', bytes: 179936, version: '1d233026' }, { width: 400, path: '/assets/posters/baituan-400.webp', bytes: 38648, version: '42591a6e' }, { width: 700, path: '/assets/posters/baituan-700.webp', bytes: 82334, version: '319ef8f9' }] },
  { slug: 'wenhua', files: [{ path: '/assets/posters/wenhua.webp', bytes: 213546, version: '8ba83788' }, { width: 400, path: '/assets/posters/wenhua-400.webp', bytes: 27432, version: '339ba85d' }, { width: 700, path: '/assets/posters/wenhua-700.webp', bytes: 62792, version: '6aeb74d9' }] },
  { slug: 'qiuyuan', files: [{ path: '/assets/posters/qiuyuan.webp', bytes: 231156, version: '384e209d' }, { width: 400, path: '/assets/posters/qiuyuan-400.webp', bytes: 43254, version: '032ddfdc' }, { width: 700, path: '/assets/posters/qiuyuan-700.webp', bytes: 96324, version: 'bb5b3107' }] },
  { slug: 'recruit1', files: [{ path: '/assets/posters/recruit1.webp', bytes: 144924, version: '0918e8ed' }, { width: 400, path: '/assets/posters/recruit1-400.webp', bytes: 36096, version: 'dace2b98' }, { width: 700, path: '/assets/posters/recruit1-700.webp', bytes: 70272, version: 'c0d18c8e' }] },
  { slug: 'recruit2', files: [{ path: '/assets/posters/recruit2.webp', bytes: 244894, version: '99aac174' }, { width: 400, path: '/assets/posters/recruit2-400.webp', bytes: 47744, version: '68dd69fa' }, { width: 700, path: '/assets/posters/recruit2-700.webp', bytes: 107394, version: '77e45b5a' }] },
])

// Photos from PPT
blockVariants('/assets/photo', data.photos)
blockVariants('/assets/articles', data.articles)
blockVariants('/assets/notes', data.notes)
blockVariants('/assets/cover', [data.video])

// WORK_ASSETS entries
const assetLines = []
for (const p of data.photos) {
  const f = fullFileOf(p.files)
  assetLines.push(
    `  lazyAsset('photo.${p.slug}', '/assets/photo/${p.slug}.webp', 'work.photo', ${f.bytes}, '${f.version}'),`,
  )
}
for (const a of data.articles) {
  const f = fullFileOf(a.files)
  assetLines.push(
    `  lazyAsset('article.${a.slug}', '/assets/articles/${a.slug}.webp', 'work.article', ${f.bytes}, '${f.version}'),`,
  )
}
for (const n of data.notes) {
  const f = fullFileOf(n.files)
  assetLines.push(
    `  lazyAsset('note.${n.slug}', '/assets/notes/${n.slug}.webp', 'work.note', ${f.bytes}, '${f.version}'),`,
  )
}
for (const p of [
  { slug: 'baituan', bytes: 179936, version: '1d233026' },
  { slug: 'wenhua', bytes: 213546, version: '8ba83788' },
  { slug: 'qiuyuan', bytes: 231156, version: '384e209d' },
  { slug: 'recruit1', bytes: 144924, version: '0918e8ed' },
  { slug: 'recruit2', bytes: 244894, version: '99aac174' },
]) {
  assetLines.push(
    `  lazyAsset('poster.${p.slug}', '/assets/posters/${p.slug}.webp', 'work.poster', ${p.bytes}, '${p.version}'),`,
  )
}
const v = data.video
const vf = fullFileOf(v.files)
assetLines.push(
  `  lazyAsset('cover.v1', '/assets/cover/v1.webp', 'work.cover', ${vf.bytes}, '${vf.version}'),`,
)

writeFileSync(
  resolve(ROOT, 'scripts/asset-manifest-snippet.txt'),
  '===== WORK_VARIANTS =====\n' + lines.join('\n') + '\n===== WORK_ASSETS =====\n' + assetLines.join('\n') + '\n',
)

console.log(lines.length, 'variant lines;', assetLines.length, 'asset lines')