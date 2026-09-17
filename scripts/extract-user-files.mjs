// Better PPT extractor. The rels parser was failing because the URL
// contains '/' which broke the [^/]*? pattern.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

const require = createRequire(import.meta.url)
const JSZip = require(resolve(ROOT, 'node_modules/jszip'))

const OUT = resolve(ROOT, '.extract')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

async function loadAll(p) {
  const buf = readFileSync(p)
  const zip = await JSZip.loadAsync(buf)
  const out = {}
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue
    out[entry.name] = await entry.async('nodebuffer')
  }
  return out
}

function cleanSlideText(xml) {
  return xml
    .replace(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g, (_m, t) => t)
    .replace(/<a:p\b[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n')
}

function cleanText(xml) {
  return xml
    .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (_m, t) => t)
    .replace(/<w:tab\s*\/>/g, '\t')
    .replace(/<w:br\s*\/>/g, '\n')
    .replace(/<w:p\b[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n')
}

function relsToMap(xml) {
  const m = {}
  // Match each <Relationship ... /> element, where the URL may contain /
  // Use a more careful regex: find <Relationship then a series of attr=value pairs, then />
  const re = /<Relationship\b([^>]*?)\/?>(?:\s*<\/Relationship>)?/g
  let r
  while ((r = re.exec(xml)) !== null) {
    const attrs = r[1]
    const idMatch = attrs.match(/\bId="([^"]+)"/)
    const tgtMatch = attrs.match(/\bTarget="([^"]+)"/)
    const typeMatch = attrs.match(/\bType="([^"]+)"/)
    if (!idMatch) continue
    m[idMatch[1]] = {
      target: tgtMatch ? tgtMatch[1] : '',
      type: typeMatch ? typeMatch[1] : '',
    }
  }
  return m
}

const PPT_DIR = 'C:\\Users\\徐诗怡\\.minimax\\v2\\assets\\2026\\09\\16'
const path = require('node:path')

function findUserFile(nameMatch) {
  for (const f of readdirSync(PPT_DIR)) {
    if (nameMatch(f)) return path.join(PPT_DIR, f)
  }
  return null
}

async function mapSlideMedia(pptxPath) {
  const all = await loadAll(pptxPath)
  const slideFiles = Object.keys(all)
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .sort()
  const out = []
  for (const sf of slideFiles) {
    const idx = basename(sf, '.xml').replace('slide', '')
    const relKey = `ppt/slides/_rels/slide${idx}.xml.rels`
    const rel = relKey && all[relKey] ? relsToMap(all[relKey].toString('utf8')) : {}

    // Find image + hyperlink relationships by rId in slide xml
    const slideXml = all[sf].toString('utf8')

    // image targets
    const media = []
    const hyperlinks = {}
    for (const [id, info] of Object.entries(rel)) {
      if (info.target.startsWith('../media/')) {
        media.push({ id, path: `ppt/media/${info.target.replace('../media/', '')}` })
      } else if (info.target.startsWith('http')) {
        hyperlinks[id] = info.target
      }
    }

    // Each blip element references a rId; pair that to a media file
    const blips = []
    const blipRe = /<a:blip\b[^>]*r:embed="([^"]+)"[^>]*>/g
    let m
    while ((m = blipRe.exec(slideXml)) !== null) {
      const id = m[1]
      const match = media.find((x) => x.id === id)
      if (match) blips.push(match.path)
    }

    // hyperlinks (hlinkClick elements reference a rId)
    const hlRe = /<a:hlinkClick\b[^>]*r:id="([^"]+)"[^>]*>/g
    while ((m = hlRe.exec(slideXml)) !== null) {
      const id = m[1]
      if (hyperlinks[id]) blips.push({ hyperlink: hyperlinks[id] })
    }

    out.push({ slide: sf, slideIdx: idx, blips })
  }
  return out
}

async function main() {
  const pptx = findUserFile((f) => f.includes('作品集') && f.endsWith('.pptx'))
  const resume = findUserFile((f) => f.includes('简历底版'))
  const descs = findUserFile((f) => f.includes('作品集文字描述'))

  if (pptx) {
    const mediaDir = join(OUT, 'ppt-media')
    if (existsSync(mediaDir)) {
      for (const f of readdirSync(mediaDir)) {
        try {
          require('node:fs').unlinkSync(join(mediaDir, f))
        } catch {}
      }
    } else mkdirSync(mediaDir, { recursive: true })

    const all = await loadAll(pptx)
    const mediaIndex = {}
    let n = 0
    // preserve original filenames
    for (const [name, data] of Object.entries(all)) {
      if (!name.startsWith('ppt/media/')) continue
      n += 1
      const ext = extname(name).toLowerCase()
      const base = basename(name, ext)
      const safe = `${base}${ext || '.bin'}`
      writeFileSync(join(mediaDir, safe), data)
      mediaIndex[name] = safe
    }

    const slideMedia = await mapSlideMedia(pptx)
    let summary = `# PPT slide → media map\n\npptx: ${pptx}\n\n## media files\n`
    for (const [orig, safe] of Object.entries(mediaIndex)) {
      summary += `- ${orig} -> .extract/ppt-media/${safe}\n`
    }
    summary += `\n## slides\n`
    for (const s of slideMedia) {
      const xml = all[s.slide].toString('utf8')
      const text = cleanSlideText(xml).trim()
      summary += `\n### slide ${s.slideIdx}\n`
      summary += `text:\n\`\`\`\n${text}\n\`\`\`\n`
      summary += `media (${s.blips.length}):\n`
      for (const b of s.blips) {
        if (typeof b === 'string') {
          summary += `  - ${b} -> .extract/ppt-media/${mediaIndex[b] || '???'}\n`
        } else {
          summary += `  - hyperlink: ${b.hyperlink}\n`
        }
      }
    }
    writeFileSync(join(OUT, 'ppt-slides.md'), summary)

    console.log(`wrote ${OUT}\\ppt-media\\* (${n} files)`)
    console.log(`wrote ${OUT}\\ppt-slides.md`)
  }

  if (resume) {
    const all = await loadAll(resume)
    const xml = all['word/document.xml'].toString('utf8')
    const cleaned = cleanText(xml)
    writeFileSync(join(OUT, 'resume-clean.txt'), cleaned)
    console.log(`wrote ${OUT}\\resume-clean.txt (${cleaned.length} chars)`)
  }

  if (descs) {
    const all = await loadAll(descs)
    const xml = all['word/document.xml'].toString('utf8')
    const cleaned = cleanText(xml)
    writeFileSync(join(OUT, 'descriptions-clean.txt'), cleaned)
    console.log(`wrote ${OUT}\\descriptions-clean.txt (${cleaned.length} chars)`)
  }
}

main().catch((e) => {
  console.error('extract failed:', e)
  process.exit(1)
})