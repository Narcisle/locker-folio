#!/usr/bin/env bun
/**
 * About 工牌的内容校正（整改方案 §4.5 / §6.5）。
 *
 * §4.5 点名：「当前工牌是空白模板叠加通用头像与占位信息，内容细节不足」。
 * 实测比这还糟 —— 照片框里连头像都没有，三条信息线是空的，
 * 而这块牌子正是自动推近终点上满屏的那个近景主体。
 *
 * ── 参考 ──────────────────────────────────────────────
 * 白色竖版卡：左上照片框（青色细边 + 卡通女孩头像）、
 * 右侧竖排「基本信息」、最右一条青色竖条上写白色竖排 ABOUT ME、
 * 照片下方三行「值在线上、极小标签在线下」。
 *
 * ── 为什么是合成而不是重新生成 ──────────────────────────────
 * 现有 idcard2.webp 的**形体是对的**：白卡 + 右侧色条 + 照片框 + 三条信息线 +
 * 顶部卡扣挂环，软塑质感和左上主光也和其它素材一致。
 * 缺的只是内容。重新生成会赌上整个风格一致性（用户明确指出过风格不统一是
 * 最大问题），而合成只往上加内容，形体、材质、光照一个像素都不动。
 *
 * 头像用仓库里已有的 obj2/stk1.webp（红帽金发女孩）裁头肩 ——
 * 参考里工牌头像和门上那张人物贴纸本来就是同一个角色，
 * 复用还顺带保证了风格零偏差，也不用引入新的授权来源。
 *
 * ── 信息内容 ────────────────────────────────────────────────
 * 参考上是真人的姓名 / 生日 / 学校。**不照抄真人信息**，
 * 按 src/data/content.ts 里 ABOUT 已有的匿名化字段（NAME 姓名 / MAJOR 专业 /
 * CLASS 班级）填占位值，视觉密度与参考一致。
 *
 *   bun run scripts/assets/build-badge.mjs
 */

import { join } from 'node:path'
import sharp from 'sharp'

sharp.cache(false)

const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '')
const BLANK = join(ROOT, 'scripts/assets/masters/idcard-blank.webp')
const AVATAR = join(ROOT, 'public/assets/obj2/stk1.webp')
const OUT = join(ROOT, 'public/assets/obj/idcard2.webp')

/** 画布尺寸与卡面特征，全部是在 masters/idcard-blank.webp 上量出来的像素坐标 */
const W = 430
const H = 760
/** 照片框内框（灰色内凹的里边） */
const PHOTO = { x: 46, y: 216, w: 170, h: 212 }
/** 「基本信息」竖排可用的竖条区域（照片右缘到蓝条左缘之间） */
const CN = { x: 228, y: 216, w: 92, h: 212 }
/** 右侧色条 */
const BAND = { x: 328, y: 137, w: 101, h: 622 }
/** 三条信息线的 y，以及可写区的左端 */
const LINES = [530, 599, 667]
const LINE_X = 46

/** 取色自参考帧：青色偏灰、低饱和，符合「低饱和粉彩」的风格约束 */
const TEAL = '#3E9EB0'
const INK = '#17303D'
const LABEL = '#9DB0BB'

/**
 * 右侧色条的目标色。
 * 现素材是饱和的天蓝 HSV(202°, 0.85, 0.90)；参考帧里工牌那条（
 * 未被 About 浮层洗白的一帧）实测是 (80,154,157)/(70,173,172) 这一带的
 * **青绿**，H≈182°、S≈0.6。既贴参考也贴「低饱和粉彩」的风格约束，
 * 所以把色相拉到 186°、饱和度乘 0.72，明度原样保留（保住原有的软塑受光）。
 */
const BAND_HUE = 186
const BAND_SAT_SCALE = 0.72

/** 与 src/data/content.ts 的 ABOUT.fields 对齐的匿名占位内容 */
const ROWS = [
  { value: 'KEESU', label: 'NAME / 姓名' },
  { value: 'DESIGNER', label: 'MAJOR / 专业' },
  { value: '2026', label: 'CLASS / 班级' },
]

/* ── 头像：从贴纸上裁头肩，按照片框比例填满 ─────────────── */

const av = await sharp(AVATAR).metadata()
/*
 * stk1 是站姿全身（183×336）。照片框比例 0.80，取上半身：
 * 左右各让 4%（帽檐和头发要留住），上边留 2%，高度按框比例反推。
 */
const cropX = Math.round(av.width * 0.04)
const cropW = av.width - cropX * 2
const cropY = Math.round(av.height * 0.02)
const cropH = Math.min(av.height - cropY, Math.round(cropW / (PHOTO.w / PHOTO.h)))

const avatar = await sharp(AVATAR)
  .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
  .resize(PHOTO.w, PHOTO.h, { fit: 'cover', kernel: 'lanczos3' })
  // 贴纸自带白色描边，裁进照片框里正好当相纸白边，不额外处理
  .png()
  .toBuffer()

/* ── 文字层：一张与卡等大的透明 SVG ───────────────────────── */

const cnChars = ['基', '本', '信', '息']
const cnSize = 44
const cnStep = 50
const cnTop = CN.y + 34

const aboutText = 'ABOUT ME'
const bandCx = BAND.x + BAND.w / 2

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- 照片框的青色细边，对齐参考 -->
  <rect x="${PHOTO.x - 3}" y="${PHOTO.y - 3}" width="${PHOTO.w + 6}" height="${PHOTO.h + 6}"
        fill="none" stroke="${TEAL}" stroke-width="3" />

  <!-- 竖排「基本信息」 -->
  ${cnChars
    .map(
      (c, i) =>
        `<text x="${CN.x + CN.w / 2}" y="${cnTop + i * cnStep}" text-anchor="middle"
        font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="${cnSize}"
        fill="${INK}">${c}</text>`,
    )
    .join('\n  ')}

  <!-- 色条上的竖排 ABOUT ME：整体旋转 90°，与参考的阅读方向一致 -->
  <text transform="translate(${bandCx} ${BAND.y + 118}) rotate(90)"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700"
        font-size="40" letter-spacing="5" fill="#FFFFFF" dominant-baseline="central"
        >${aboutText}</text>

  <!-- 三行信息：值压在线上，极小标签在线下 -->
  ${ROWS.map((r, i) => {
    const y = LINES[i]
    return `<text x="${LINE_X}" y="${y - 9}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-weight="700" font-size="34" letter-spacing="1" fill="${TEAL}">${r.value}</text>
  <text x="${LINE_X + 2}" y="${y + 24}" font-family="PingFang SC, Helvetica Neue, sans-serif"
        font-size="15" letter-spacing="1.2" fill="${LABEL}">${r.label}</text>`
  }).join('\n  ')}
</svg>`

/* ── 色条改色 ─────────────────────────────────────────────── */

function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, mx ? d / mx : 0, mx]
}

function hsvToRgb(h, s, v) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const t = h / 60
  const [r, g, b] =
    t < 1 ? [c, x, 0] : t < 2 ? [x, c, 0] : t < 3 ? [0, c, x]
    : t < 4 ? [0, x, c] : t < 5 ? [x, 0, c] : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

/** 只动「明显偏蓝」的像素，卡面白、阴影和描边一律不碰 */
function retintBand(buf, w, h) {
  let n = 0
  for (let y = 0; y < h; y++) {
    for (let x = BAND.x - 4; x < w; x++) {
      const i = (y * w + x) * 4
      if (buf[i + 3] < 8) continue
      const r = buf[i]
      const g = buf[i + 1]
      const b = buf[i + 2]
      if (b - r < 45) continue
      const [, sat, val] = rgbToHsv(r, g, b)
      const [nr, ng, nb] = hsvToRgb(BAND_HUE, sat * BAND_SAT_SCALE, val)
      buf[i] = nr
      buf[i + 1] = ng
      buf[i + 2] = nb
      n++
    }
  }
  return n
}

/* ── 合成 ─────────────────────────────────────────────────── */

const composed = await sharp(BLANK)
  .ensureAlpha()
  .composite([
    { input: avatar, left: PHOTO.x, top: PHOTO.y },
    { input: Buffer.from(svg), left: 0, top: 0 },
  ])
  .raw()
  .toBuffer({ resolveWithObject: true })

/*
 * composite 会把结果按原图 alpha 裁形，但文字层是画在整张画布上的，
 * 落在卡外（挂环两侧的透明区）的笔画必须清掉，否则会出现悬空的字。
 * 用底图的 alpha 做一次掩膜即可。
 */
const base = await sharp(BLANK).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const out = composed.data
const retinted = retintBand(out, W, H)
for (let i = 0; i < W * H; i++) {
  if (base.data[i * 4 + 3] < 8) out[i * 4 + 3] = 0
  else if (out[i * 4 + 3] > base.data[i * 4 + 3]) out[i * 4 + 3] = base.data[i * 4 + 3]
}

await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toFile(OUT)

console.log(`→ ${OUT.replace(ROOT + '/', '')}（色条改色 ${retinted} 像素）`)
console.log('  记得跑 `bun run assets:bleed` 与 `bun run scripts/assets/sync-manifest.mjs`')

