// Debug: dump rels for slide 1 and look at media on layout/master
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const require = createRequire(import.meta.url)
const JSZip = require(resolve(ROOT, 'node_modules/jszip'))

const PPT_DIR = 'C:\\Users\\徐诗怡\\.minimax\\v2\\assets\\2026\\09\\16'
const { readdirSync } = require('node:fs')
function find(nameMatch) {
  for (const f of readdirSync(PPT_DIR)) if (nameMatch(f)) return require('node:path').join(PPT_DIR, f)
  return null
}
const pptx = find((f) => f.includes('作品集') && f.endsWith('.pptx'))
const buf = readFileSync(pptx)

async function main() {
  const zip = await JSZip.loadAsync(buf)
  // Print first rels file
  for (const k of Object.keys(zip.files)) {
    if (k.includes('slide1.xml.rels') || k.includes('slide6.xml.rels') || k.includes('presentation.xml.rels')) {
      console.log(`===== ${k} =====`)
      const x = await zip.file(k).async('string')
      console.log(x.substring(0, 4000))
    }
  }
  // Also list all files in ppt/
  console.log('\n===== keys (sample) =====')
  for (const k of Object.keys(zip.files)) {
    if (k.includes('media') || k.includes('slide') || k.includes('layout')) {
      console.log(` ${k}`)
    }
  }
}
main()