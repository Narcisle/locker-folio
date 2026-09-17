/* ============================================================================
 * 首屏资源清单 AssetManifest
 *
 * 这里是全站资源的**唯一事实来源**：
 *   1. 每项资源记录 id / url / 类型 / 分组 / 是否首屏阻塞 / 是否 preload /
 *      预期体积 / 解码方式 / fallback / 授权来源 / 版本哈希。
 *   2. Loader 只统计本清单中的真实事件（请求完成、decode() 完成），
 *      不再使用固定计时的假进度。
 *   3. index.html 里的 <link rel="preload"> 必须与 PRELOAD_ASSETS 一一对应，
 *      开发模式下 auditPreloadLinks() 会校验两边是否漂移。
 *
 * 约定：
 *   - version 是文件内容 sha256 前 8 位，**不拼进 URL**。
 *     拼进 URL 会和 <img src="/assets/..."> 产生两次不同缓存键的请求。
 *     换图后请用下面的命令重新生成：
 *       shasum -a 256 public/assets/<path> | cut -c1-8
 *   - bytes 是磁盘上的真实传输体积，Loader 用它做加权进度，
 *     所以换图后 bytes 也要同步更新（stat -f%z）。
 * ========================================================================== */

import { useSyncExternalStore } from 'react'

/* ── 类型 ─────────────────────────────────────────────────── */

export type AssetKind = 'image' | 'font'

export type AssetGroup =
  | 'hero.prop' // 柜内立体物件：首屏阻塞
  | 'hero.decal' // 柜门贴纸：首屏阻塞，但缺失可降级
  | 'type.display' // 网页字体阶段
  | 'work.poster'
  | 'work.photo'
  | 'work.cover'
  | 'work.article'
  | 'work.note'

/** 资源失败后的处置方式 */
export type FailPolicy =
  /** 冒泡到 Loader 的错误态，提供重试；不阻止最终放行 */
  | 'error'
  /** 静默降级，只写开发期日志 */
  | 'degrade'

/**
 * 响应式派生图。由 scripts/gen-image-variants.sh 生成，
 * 运行时由 src/components/work/imageSources.ts 的 workImage() 拼成 srcset，
 * 浏览器按显示尺寸和 DPR 只取其中一张 —— 所以变体是同一份资源的不同档位，
 * 不是彼此独立的资源，登记为 entry 的子项而不是并列条目。
 */
export type AssetVariant = {
  /** 像素宽，对应 srcset 的 <w> 描述符 */
  width: number
  url: string
  bytes: number
  version: string
}

export type AssetEntry = {
  /** 稳定 ID，供状态机/热点引用 */
  id: string
  /** 站点根绝对路径，必须与 DOM 中 <img src> 完全一致 */
  url: string
  kind: AssetKind
  group: AssetGroup
  /** 首屏阻塞：Loader 必须等它 ready 才允许走到 100% */
  blocking: boolean
  /** 是否写进 index.html 的 <link rel="preload"> */
  preload: boolean
  /** 预期传输体积（字节），用于加权进度 */
  bytes: number
  /** 解码方式：图片走 HTMLImageElement.decode()，字体走 document.fonts.ready */
  decode: 'img-decode' | 'font-ready'
  /** 失败降级目标；null 表示没有备用资源 */
  fallback: string | null
  onFail: FailPolicy
  /** 单项超时上限（毫秒） */
  timeoutMs: number
  /** 内容授权来源。TODO：原始素材授权尚未确认 */
  license: string
  /** 内容哈希前 8 位 */
  version: string
  /** 响应式派生档位；首屏物件图没有变体，为空数组 */
  variants: readonly AssetVariant[]
}

const DEFAULT_TIMEOUT = 9_000
const LICENSE_TODO = 'unverified/待确认'

/** Hero 直接采样的实体表面纹理：首屏必须全部可用于渲染 */
function prop(
  id: string,
  url: string,
  bytes: number,
  version: string,
  preload = false,
): AssetEntry {
  return {
    id,
    url,
    kind: 'image',
    group: 'hero.prop',
    blocking: true,
    preload,
    bytes,
    decode: 'img-decode',
    fallback: null,
    onFail: 'error',
    timeoutMs: DEFAULT_TIMEOUT,
    license: LICENSE_TODO,
    version,
    variants: [],
  }
}

/** 柜门贴纸：首屏可见，但单张缺失不影响主结构可读，失败静默降级 */
function decal(
  id: string,
  url: string,
  bytes: number,
  version: string,
  preload = false,
): AssetEntry {
  return {
    id,
    url,
    kind: 'image',
    group: 'hero.decal',
    blocking: true,
    preload,
    bytes,
    decode: 'img-decode',
    fallback: null,
    onFail: 'degrade',
    timeoutMs: 8_000,
    license: LICENSE_TODO,
    version,
    variants: [],
  }
}

/** 作品页资源：全部非阻塞，进入对应栏目时按需加载 */
function lazyAsset(
  id: string,
  url: string,
  group: AssetGroup,
  bytes: number,
  version: string,
): AssetEntry {
  return {
    id,
    url,
    kind: 'image',
    group,
    blocking: false,
    preload: false,
    bytes,
    decode: 'img-decode',
    fallback: null,
    onFail: 'degrade',
    timeoutMs: DEFAULT_TIMEOUT,
    license: LICENSE_TODO,
    version,
    // 作品图按栏目显示宽度生成了 1x / 2x 档位，见 WORK_VARIANTS
    variants: WORK_VARIANTS[url] ?? [],
  }
}

/* ── 清单本体 ─────────────────────────────────────────────── */

/**
 * 当前 Hero 会直接交给 Three.js 的实体表面纹理。
 *
 * 唱机、书、背包、文件袋、打字机、吉他与门托盘都已经换成程序化实体网格，
 * 不再把旧透明 WebP 当作材质；右门只保留 polaroids.webp 作为三张实体卡
 * 的组合印刷层。这里必须只登记真实的纹理请求，否则 Loader 虽然
 * 显示 100%，实际上却是在等待场景根本不会用到的旧图片。
 */
const HERO_PROPS: AssetEntry[] = [
  prop('hero.posterwall', '/assets/obj/posterwall.webp', 83900, '2e4607b3', true),
  prop('hero.findaword', '/assets/obj/findaword2.webp', 30894, '193897a8', true),
  prop('hero.door4.polaroids', '/assets/obj2/polaroids.webp', 65492, 'df8d6564', true),
]

/**
 * 柜门贴花。
 *
 * `hero.decalAtlas` 是 scripts/assets/pack-decals.mjs 打的**构建期图集**。
 * DecalField 只上传这张图集；decalSpecs 里的单图 URL 只是图集 UV 的稳定键，
 * 运行时不会逐张请求。因此 Loader 也只等待这一个真实请求。
 */
const HERO_DECALS: AssetEntry[] = [
  decal('hero.decalAtlas', '/assets/obj2/doorDecals.webp', 244716, '41baddc8', true),
]

/**
 * 字体阶段。Google Fonts 由 <link rel="stylesheet"> 拉取，
 * 这里只把「字体是否可用」作为一个可计量的阶段接进进度条。
 * 超时后直接放行，字体失败绝不阻塞站点。
 */
const TYPE_STAGE: AssetEntry = {
  id: 'type.display',
  url: 'https://fonts.googleapis.com/css2?family=Ultra…',
  kind: 'font',
  group: 'type.display',
  blocking: true,
  preload: false,
  // 名义权重：不代表真实字节数，只让字体阶段在进度条里占约 2.5% 的一小格。
  // 注意 document.fonts.ready 在没有待加载字体时会立即 resolve，
  // 所以这一格常常很快就满，权重必须给小。
  bytes: 24_000,
  decode: 'font-ready',
  fallback: 'system-ui 尺寸校准回退栈（见 global.css --font-*）',
  onFail: 'degrade',
  timeoutMs: 2_500,
  license: 'Google Fonts / OFL',
  version: 'css2-2026-08',
  variants: [],
}

/**
 * 作品图的响应式派生档位。
 * 宽度必须与 scripts/gen-image-variants.sh 和 imageSources.ts 的 VARIANTS 一致；
 * 换图后用文件头的命令重新生成 bytes / version。
 */
const WORK_VARIANTS: Record<string, readonly AssetVariant[]> = {
  '/assets/posters/baituan.webp': [
    { width: 400, url: '/assets/posters/baituan-400.webp', bytes: 38648, version: '42591a6e' },
    { width: 700, url: '/assets/posters/baituan-700.webp', bytes: 82334, version: '319ef8f9' },
  ],
  '/assets/posters/wenhua.webp': [
    { width: 400, url: '/assets/posters/wenhua-400.webp', bytes: 27432, version: '339ba85d' },
    { width: 700, url: '/assets/posters/wenhua-700.webp', bytes: 62792, version: '6aeb74d9' },
  ],
  '/assets/posters/qiuyuan.webp': [
    { width: 400, url: '/assets/posters/qiuyuan-400.webp', bytes: 43254, version: '032ddfdc' },
    { width: 700, url: '/assets/posters/qiuyuan-700.webp', bytes: 96324, version: 'bb5b3107' },
  ],
  '/assets/posters/recruit1.webp': [
    { width: 400, url: '/assets/posters/recruit1-400.webp', bytes: 36096, version: 'dace2b98' },
    { width: 700, url: '/assets/posters/recruit1-700.webp', bytes: 70272, version: 'c0d18c8e' },
  ],
  '/assets/posters/recruit2.webp': [
    { width: 400, url: '/assets/posters/recruit2-400.webp', bytes: 47744, version: '68dd69fa' },
    { width: 700, url: '/assets/posters/recruit2-700.webp', bytes: 107394, version: '77e45b5a' },
  ],
  '/assets/photo/p1.webp': [
    { width: 300, url: '/assets/photo/p1-300.webp', bytes: 75886, version: 'e6179503' },
    { width: 600, url: '/assets/photo/p1-600.webp', bytes: 258138, version: '309834ab' },
    { width: 900, url: '/assets/photo/p1-900.webp', bytes: 376330, version: '49b23dee' },
  ],
  '/assets/photo/p2.webp': [
    { width: 300, url: '/assets/photo/p2-300.webp', bytes: 14382, version: 'cbcf8794' },
    { width: 600, url: '/assets/photo/p2-600.webp', bytes: 47624, version: '4a07c1b4' },
    { width: 900, url: '/assets/photo/p2-900.webp', bytes: 69102, version: '8a62cec6' },
  ],
  '/assets/photo/p3.webp': [
    { width: 300, url: '/assets/photo/p3-300.webp', bytes: 40922, version: 'c7ec5923' },
    { width: 600, url: '/assets/photo/p3-600.webp', bytes: 142510, version: 'b3323744' },
    { width: 900, url: '/assets/photo/p3-900.webp', bytes: 219908, version: 'ec1e884f' },
  ],
  '/assets/photo/p4.webp': [
    { width: 300, url: '/assets/photo/p4-300.webp', bytes: 39290, version: 'e54238db' },
    { width: 600, url: '/assets/photo/p4-600.webp', bytes: 129610, version: '873f27ca' },
    { width: 900, url: '/assets/photo/p4-900.webp', bytes: 188472, version: 'd00e0609' },
  ],
  '/assets/photo/p5.webp': [
    { width: 300, url: '/assets/photo/p5-300.webp', bytes: 25896, version: 'ebc9cc26' },
    { width: 600, url: '/assets/photo/p5-600.webp', bytes: 70944, version: 'b60e555e' },
    { width: 900, url: '/assets/photo/p5-900.webp', bytes: 94916, version: '79e4b647' },
  ],
  '/assets/photo/p6.webp': [
    { width: 300, url: '/assets/photo/p6-300.webp', bytes: 27970, version: 'fa1a360f' },
    { width: 600, url: '/assets/photo/p6-600.webp', bytes: 87326, version: '33ce23b8' },
    { width: 900, url: '/assets/photo/p6-900.webp', bytes: 149954, version: '8f3ad9e5' },
  ],
  '/assets/photo/p7.webp': [
    { width: 300, url: '/assets/photo/p7-300.webp', bytes: 22658, version: '270e746e' },
    { width: 600, url: '/assets/photo/p7-600.webp', bytes: 86746, version: 'a5b698b4' },
    { width: 900, url: '/assets/photo/p7-900.webp', bytes: 127622, version: '36c2bbb0' },
  ],
  '/assets/photo/p8.webp': [
    { width: 300, url: '/assets/photo/p8-300.webp', bytes: 46502, version: '282ce35a' },
    { width: 600, url: '/assets/photo/p8-600.webp', bytes: 165656, version: 'a317a50c' },
    { width: 900, url: '/assets/photo/p8-900.webp', bytes: 235260, version: 'a9fd3021' },
  ],
  '/assets/photo/p9.webp': [
    { width: 300, url: '/assets/photo/p9-300.webp', bytes: 44874, version: '77040d10' },
    { width: 600, url: '/assets/photo/p9-600.webp', bytes: 164364, version: 'eeb5d711' },
    { width: 900, url: '/assets/photo/p9-900.webp', bytes: 252334, version: 'bb6f6184' },
  ],
  '/assets/photo/p10.webp': [
    { width: 300, url: '/assets/photo/p10-300.webp', bytes: 45620, version: '7a863314' },
    { width: 600, url: '/assets/photo/p10-600.webp', bytes: 157632, version: '6c9dae7d' },
    { width: 900, url: '/assets/photo/p10-900.webp', bytes: 233356, version: 'f6e417d9' },
  ],
  '/assets/photo/p11.webp': [
    { width: 300, url: '/assets/photo/p11-300.webp', bytes: 45282, version: 'afb1de84' },
    { width: 600, url: '/assets/photo/p11-600.webp', bytes: 173594, version: '50347849' },
    { width: 900, url: '/assets/photo/p11-900.webp', bytes: 363878, version: '6fbc3f7b' },
  ],
  '/assets/photo/p12.webp': [
    { width: 300, url: '/assets/photo/p12-300.webp', bytes: 46452, version: '3e468552' },
    { width: 600, url: '/assets/photo/p12-600.webp', bytes: 175912, version: '812472c4' },
    { width: 900, url: '/assets/photo/p12-900.webp', bytes: 270410, version: '18ed43fd' },
  ],
  '/assets/articles/a1.webp': [
    { width: 420, url: '/assets/articles/a1-420.webp', bytes: 11382, version: 'f62f9160' },
    { width: 760, url: '/assets/articles/a1-760.webp', bytes: 19076, version: 'f62f9160' },
  ],
  '/assets/articles/a2.webp': [
    { width: 420, url: '/assets/articles/a2-420.webp', bytes: 5186, version: 'cc98fbce' },
    { width: 760, url: '/assets/articles/a2-760.webp', bytes: 13000, version: 'cc98fbce' },
  ],
  '/assets/articles/a3.webp': [
    { width: 420, url: '/assets/articles/a3-420.webp', bytes: 5190, version: 'a7f1416f' },
    { width: 760, url: '/assets/articles/a3-760.webp', bytes: 8284, version: 'a7f1416f' },
  ],
  '/assets/notes/n1.webp': [
    { width: 400, url: '/assets/notes/n1-400.webp', bytes: 40450, version: 'cfd3e82f' },
    { width: 700, url: '/assets/notes/n1-700.webp', bytes: 58606, version: 'e2a1aefb' },
  ],
  '/assets/notes/n2.webp': [
    { width: 400, url: '/assets/notes/n2-400.webp', bytes: 30428, version: '3f08e540' },
    { width: 700, url: '/assets/notes/n2-700.webp', bytes: 43840, version: 'ee5e116e' },
  ],
  '/assets/notes/n3.webp': [
    { width: 400, url: '/assets/notes/n3-400.webp', bytes: 29606, version: '2a0503f2' },
    { width: 700, url: '/assets/notes/n3-700.webp', bytes: 40962, version: '7a44b254' },
  ],
  '/assets/notes/n4.webp': [
    { width: 400, url: '/assets/notes/n4-400.webp', bytes: 26830, version: 'f34b7d85' },
    { width: 700, url: '/assets/notes/n4-700.webp', bytes: 37660, version: '8df222cf' },
  ],
  '/assets/notes/n5.webp': [
    { width: 400, url: '/assets/notes/n5-400.webp', bytes: 24296, version: '67ee2632' },
    { width: 700, url: '/assets/notes/n5-700.webp', bytes: 33942, version: 'a4a47219' },
  ],
  '/assets/notes/n6.webp': [
    { width: 400, url: '/assets/notes/n6-400.webp', bytes: 37684, version: '60cac700' },
    { width: 700, url: '/assets/notes/n6-700.webp', bytes: 53464, version: '86d3bc5d' },
  ],
  '/assets/notes/n7.webp': [
    { width: 400, url: '/assets/notes/n7-400.webp', bytes: 22540, version: '207a9846' },
    { width: 700, url: '/assets/notes/n7-700.webp', bytes: 28968, version: '107a2e11' },
  ],
  '/assets/notes/n8.webp': [
    { width: 400, url: '/assets/notes/n8-400.webp', bytes: 32050, version: '1c675fc8' },
    { width: 700, url: '/assets/notes/n8-700.webp', bytes: 42958, version: 'dfe53457' },
  ],
  '/assets/notes/n9.webp': [
    { width: 400, url: '/assets/notes/n9-400.webp', bytes: 35134, version: '5831766a' },
    { width: 700, url: '/assets/notes/n9-700.webp', bytes: 48798, version: '944e2449' },
  ],
  '/assets/cover/v1.webp': [
    { width: 480, url: '/assets/cover/v1-480.webp', bytes: 31038, version: '71da4727' },
    { width: 640, url: '/assets/cover/v1-640.webp', bytes: 46388, version: '19a2cae2' },
    { width: 960, url: '/assets/cover/v1-960.webp', bytes: 82778, version: '183949a9' },
  ],
  '/assets/cover/v2.webp': [
    { width: 480, url: '/assets/cover/v2-480.webp', bytes: 17388, version: '02fdfb62' },
    { width: 640, url: '/assets/cover/v2-640.webp', bytes: 24464, version: 'e1dbc6ef' },
    { width: 960, url: '/assets/cover/v2-960.webp', bytes: 38226, version: '362056c2' },
  ],
  '/assets/cover/v3.webp': [
    { width: 480, url: '/assets/cover/v3-480.webp', bytes: 15688, version: 'ee983bd6' },
    { width: 640, url: '/assets/cover/v3-640.webp', bytes: 21354, version: '21266124' },
    { width: 960, url: '/assets/cover/v3-960.webp', bytes: 33118, version: '5dbbbb8f' },
  ],
}

/** 作品页资源：非首屏阻塞 */
const WORK_ASSETS: AssetEntry[] = [
  lazyAsset('poster.baituan', '/assets/posters/baituan.webp', 'work.poster', 179936, '1d233026'),
  lazyAsset('poster.wenhua', '/assets/posters/wenhua.webp', 'work.poster', 213546, '8ba83788'),
  lazyAsset('poster.qiuyuan', '/assets/posters/qiuyuan.webp', 'work.poster', 231156, '384e209d'),
  lazyAsset('poster.recruit1', '/assets/posters/recruit1.webp', 'work.poster', 144924, '0918e8ed'),
  lazyAsset('poster.recruit2', '/assets/posters/recruit2.webp', 'work.poster', 244894, '99aac174'),

  lazyAsset('photo.p1', '/assets/photo/p1.webp', 'work.photo', 376330, '49b23dee'),
  lazyAsset('photo.p2', '/assets/photo/p2.webp', 'work.photo', 69102, '8a62cec6'),
  lazyAsset('photo.p3', '/assets/photo/p3.webp', 'work.photo', 219908, 'ec1e884f'),
  lazyAsset('photo.p4', '/assets/photo/p4.webp', 'work.photo', 188472, 'd00e0609'),
  lazyAsset('photo.p5', '/assets/photo/p5.webp', 'work.photo', 94916, '79e4b647'),
  lazyAsset('photo.p6', '/assets/photo/p6.webp', 'work.photo', 227880, 'b4c11bd3'),
  lazyAsset('photo.p7', '/assets/photo/p7.webp', 'work.photo', 127622, '36c2bbb0'),
  lazyAsset('photo.p8', '/assets/photo/p8.webp', 'work.photo', 235260, 'a9fd3021'),
  lazyAsset('photo.p9', '/assets/photo/p9.webp', 'work.photo', 252334, 'bb6f6184'),
  lazyAsset('photo.p10', '/assets/photo/p10.webp', 'work.photo', 233356, 'f6e417d9'),
  lazyAsset('photo.p11', '/assets/photo/p11.webp', 'work.photo', 618516, '25cd0e87'),
  lazyAsset('photo.p12', '/assets/photo/p12.webp', 'work.photo', 270410, '18ed43fd'),

  lazyAsset('article.a1', '/assets/articles/a1.webp', 'work.article', 40986, 'f62f9160'),
  lazyAsset('article.a2', '/assets/articles/a2.webp', 'work.article', 43232, 'cc98fbce'),
  lazyAsset('article.a3', '/assets/articles/a3.webp', 'work.article', 39814, 'a7f1416f'),

  lazyAsset('note.n1', '/assets/notes/n1.webp', 'work.note', 58606, 'e2a1aefb'),
  lazyAsset('note.n2', '/assets/notes/n2.webp', 'work.note', 43840, 'ee5e116e'),
  lazyAsset('note.n3', '/assets/notes/n3.webp', 'work.note', 40962, '7a44b254'),
  lazyAsset('note.n4', '/assets/notes/n4.webp', 'work.note', 37660, '8df222cf'),
  lazyAsset('note.n5', '/assets/notes/n5.webp', 'work.note', 33942, 'a4a47219'),
  lazyAsset('note.n6', '/assets/notes/n6.webp', 'work.note', 53464, '86d3bc5d'),
  lazyAsset('note.n7', '/assets/notes/n7.webp', 'work.note', 28968, '107a2e11'),
  lazyAsset('note.n8', '/assets/notes/n8.webp', 'work.note', 42958, 'dfe53457'),
  lazyAsset('note.n9', '/assets/notes/n9.webp', 'work.note', 48798, '944e2449'),

  lazyAsset('cover.v1', '/assets/cover/v1.webp', 'work.cover', 434640, '2962d642'),
  lazyAsset('cover.v2', '/assets/cover/v2.webp', 'work.cover', 59104, '9da14cee'),
  lazyAsset('cover.v3', '/assets/cover/v3.webp', 'work.cover', 49514, '093a51c9'),
]

/** 全站资源清单 */
export const ASSET_MANIFEST: readonly AssetEntry[] = [
  ...HERO_PROPS,
  ...HERO_DECALS,
  TYPE_STAGE,
  ...WORK_ASSETS,
]

/** 首屏阻塞资源：只有 Hero 真正采样的纹理 + 字体阶段 */
export const BLOCKING_ASSETS: readonly AssetEntry[] = ASSET_MANIFEST.filter((a) => a.blocking)

/** 需要在 index.html 里 <link rel="preload"> 的资源 */
export const PRELOAD_ASSETS: readonly AssetEntry[] = ASSET_MANIFEST.filter((a) => a.preload)

export const ASSETS_BY_ID: ReadonlyMap<string, AssetEntry> = new Map(
  ASSET_MANIFEST.map((a) => [a.id, a]),
)

export function assetsInGroup(group: AssetGroup): AssetEntry[] {
  return ASSET_MANIFEST.filter((a) => a.group === group)
}

/**
 * 各栏目的派生档位宽度，从清单实际登记的变体反推。
 * imageSources.ts 目前自己硬编码了一份同样的宽度表；以清单为准，
 * 两边不一致时开发期的 auditWorkImageSources() 会点名。
 */
export const VARIANT_WIDTHS: Readonly<Partial<Record<AssetGroup, readonly number[]>>> =
  ASSET_MANIFEST.reduce<Partial<Record<AssetGroup, readonly number[]>>>((acc, a) => {
    if (a.variants.length > 0 && acc[a.group] === undefined) {
      acc[a.group] = a.variants.map((v) => v.width)
    }
    return acc
  }, {})

/** 清单里登记的全部文件数（原图 + 派生档位） */
export const ASSET_FILE_COUNT = ASSET_MANIFEST.reduce(
  (n, a) => n + (a.kind === 'image' ? 1 + a.variants.length : 0),
  0,
)

const BLOCKING_BYTES = BLOCKING_ASSETS.reduce((n, a) => n + a.bytes, 0)

/* ============================================================================
 * 运行时：真实进度统计
 * ========================================================================== */

export type AssetStatus =
  | 'pending' // 尚未开始
  | 'loading' // 请求中
  | 'decoding' // 网络已完成，正在 decode()
  | 'ready' // 已 decode，可用于渲染
  | 'degraded' // 失败但允许放行
  | 'failed' // 失败且需要提示重试

export type AssetRuntime = {
  entry: AssetEntry
  status: AssetStatus
  attempts: number
  /** 请求完成耗时（毫秒） */
  netMs: number | null
  /** decode() 耗时（毫秒） */
  decodeMs: number | null
  error: string | null
}

export type LoadSnapshot = {
  /** 0–100 的真实进度，单调递增 */
  progress: number
  /** 所有阻塞资源都有了结果（成功、降级或失败） */
  settled: boolean
  /** settled 且没有需要提示的硬失败 */
  ok: boolean
  /** 正在重试中 */
  retrying: boolean
  /** 需要提示的失败项 */
  failed: readonly AssetRuntime[]
  /** 已经 ready 的阻塞项数量 */
  readyCount: number
  /** 阻塞项总数 */
  totalCount: number
  /** 从开始加载到现在（或到 settled）的毫秒数 */
  elapsedMs: number
  items: readonly AssetRuntime[]
}

/** 网络阶段在单项权重里占的比例，剩下的归 decode() */
const NET_SHARE = 0.55
const MAX_ATTEMPTS = 3
const RETRY_BACKOFF = [350, 1_000]
/**
 * 首屏加载硬预算。到点仍未结算的项一律按各自的 onFail 就地结算，
 * 保证 Loader 无论如何都会在这个时间内走完 100%，不会永久卡住。
 */
const HARD_DEADLINE_MS = 12_000

const runtimes: AssetRuntime[] = BLOCKING_ASSETS.map((entry) => ({
  entry,
  status: 'pending',
  attempts: 0,
  netMs: null,
  decodeMs: null,
  error: null,
}))

/** 持有 Image 引用，避免解码结果在 DOM 用到之前被回收 */
const warmed: HTMLImageElement[] = []

const listeners = new Set<() => void>()
let startedAt = 0
let settledAt = 0
let progressFloor = 0
let retryingCount = 0
let snapshot: LoadSnapshot = buildSnapshot()
let loadPromise: Promise<LoadSnapshot> | null = null
/** 硬预算到点后置位，正在重试的项会就地停下，不再把状态拉回 loading */
let aborted = false

function isSettled(status: AssetStatus) {
  return status === 'ready' || status === 'degraded' || status === 'failed'
}

function statusShare(rt: AssetRuntime): number {
  switch (rt.status) {
    case 'pending':
      return 0
    case 'loading':
      return 0
    case 'decoding':
      return NET_SHARE
    default:
      // ready / degraded / failed 都算已结算，保证进度不会卡住
      return 1
  }
}

function buildSnapshot(): LoadSnapshot {
  let weighted = 0
  let readyCount = 0
  const failed: AssetRuntime[] = []
  let settled = true

  for (const rt of runtimes) {
    weighted += rt.entry.bytes * statusShare(rt)
    if (rt.status === 'ready') readyCount += 1
    if (rt.status === 'failed') failed.push(rt)
    if (rt.status === 'pending' || rt.status === 'loading' || rt.status === 'decoding') {
      settled = false
    }
  }

  const raw = BLOCKING_BYTES > 0 ? (weighted / BLOCKING_BYTES) * 100 : 100
  // 单调递增：显示值只允许往上走
  progressFloor = Math.max(progressFloor, Math.min(100, raw))

  return {
    progress: settled ? 100 : Math.min(99, progressFloor),
    settled,
    ok: settled && failed.length === 0,
    retrying: retryingCount > 0,
    failed,
    readyCount,
    totalCount: runtimes.length,
    elapsedMs: startedAt === 0 ? 0 : (settledAt || performance.now()) - startedAt,
    items: runtimes,
  }
}

function emit() {
  snapshot = buildSnapshot()
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** 加载一张图片：load 事件记网络耗时，decode() 完成才算真正可渲染 */
function warmImage(rt: AssetRuntime, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    warmed.push(img)
    img.decoding = 'async'
    // 透明物件图没有跨域需求，crossOrigin 留空以复用 <img> 的缓存键
    const t0 = performance.now()
    let done = false

    const timer = window.setTimeout(() => {
      if (done) return
      done = true
      img.src = ''
      reject(new Error(`超时 ${rt.entry.timeoutMs}ms`))
    }, rt.entry.timeoutMs)

    const fail = (msg: string) => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      reject(new Error(msg))
    }

    img.onerror = () => fail('请求失败或不是可解码的图片')
    img.onload = () => {
      if (done) return
      rt.netMs = performance.now() - t0
      rt.status = 'decoding'
      emit()
      const t1 = performance.now()
      const finish = () => {
        if (done) return
        done = true
        window.clearTimeout(timer)
        rt.decodeMs = performance.now() - t1
        resolve()
      }
      // 部分浏览器对游离节点的 decode() 会抛 EncodingError，
      // 但 load 已成功说明位图可用，按成功处理即可。
      img.decode().then(finish, finish)
    }

    img.src = url
  })
}

/**
 * Loader 首屏真正用到的字面。
 * Ultra 是超粗板衬，回退栈里的 Playfair / serif 是细衬线，两者差距极大，
 * 换字的瞬间非常刺眼，所以必须点名等这一支。
 */
const CRITICAL_FACES = ['400 1em Ultra', '300 1em Inter']

function warmFonts(rt: AssetRuntime): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve()
  const t0 = performance.now()
  rt.status = 'decoding'
  emit()
  // 只等 document.fonts.ready 是不够的：还没有任何字面进入待加载队列时它会立刻
  // resolve，于是这一格瞬间就满，但 Ultra 其实还在路上。先用 fonts.load() 把
  // 关键字面显式拉起来，再等整体 ready，这一格才代表真实状态。
  const load = Promise.all(CRITICAL_FACES.map((f) => document.fonts.load(f)))
    .then(() => document.fonts.ready)
    .then(() => undefined)
  return Promise.race([
    load,
    sleep(rt.entry.timeoutMs).then(() => {
      throw new Error(`字体未在 ${rt.entry.timeoutMs}ms 内就绪，使用回退字体栈`)
    }),
  ]).then(() => {
    rt.decodeMs = performance.now() - t0
  })
}

async function runOne(rt: AssetRuntime) {
  // 字体阶段本身已经带超时，重试没有意义，只会白白吃掉首屏预算
  const maxAttempts = rt.entry.decode === 'font-ready' ? 1 : MAX_ATTEMPTS

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (aborted) break
    rt.attempts = attempt
    rt.status = 'loading'
    rt.error = null
    emit()
    try {
      if (rt.entry.decode === 'font-ready') await warmFonts(rt)
      else await warmImage(rt, rt.entry.url)
      rt.status = 'ready'
      emit()
      return
    } catch (err) {
      rt.error = err instanceof Error ? err.message : String(err)
      if (attempt < maxAttempts && !aborted) {
        await sleep(RETRY_BACKOFF[attempt - 1] ?? 1_000)
        continue
      }
    }
  }

  // 重试用尽：先试 fallback，再按 onFail 决定是否需要提示用户
  if (!aborted && rt.entry.fallback && rt.entry.decode === 'img-decode') {
    try {
      await warmImage(rt, rt.entry.fallback)
      rt.status = 'degraded'
      emit()
      return
    } catch {
      /* fallback 也失败，继续往下 */
    }
  }
  if (isSettled(rt.status)) return
  rt.status = rt.entry.onFail === 'degrade' ? 'degraded' : 'failed'
  emit()
}

/** 硬预算到点：把还没结果的项就地结算，Loader 才不会无限等下去 */
function forceSettle() {
  aborted = true
  let changed = false
  for (const rt of runtimes) {
    if (isSettled(rt.status)) continue
    rt.error = rt.error ?? `超出首屏加载预算 ${HARD_DEADLINE_MS}ms`
    rt.status = rt.entry.onFail === 'degrade' ? 'degraded' : 'failed'
    changed = true
  }
  if (changed) emit()
}

/** 启动首屏阻塞资源加载（幂等，返回同一个 promise） */
export function startBlockingLoad(): Promise<LoadSnapshot> {
  if (loadPromise) return loadPromise
  startedAt = performance.now()
  emit()
  const watchdog = window.setTimeout(forceSettle, HARD_DEADLINE_MS)
  loadPromise = Promise.all(runtimes.map(runOne)).then(() => {
    window.clearTimeout(watchdog)
    settledAt = performance.now()
    emit()
    if (import.meta.env.DEV) {
      reportToConsole()
      void auditPreloadLinks()
      void auditWorkImageSources()
    }
    return snapshot
  })
  return loadPromise
}

/** 供后续状态机 await 的就绪 promise */
export function blockingAssetsReady(): Promise<LoadSnapshot> {
  return startBlockingLoad()
}

/** 重试所有硬失败项。进度保持在原位不回退，成功后错误态自动消失 */
export function retryFailedAssets(): void {
  const broken = runtimes.filter((rt) => rt.status === 'failed')
  if (broken.length === 0) return
  // 用户显式重试：解除硬预算，并给这批资源一个新的预算窗口
  aborted = false
  window.setTimeout(forceSettle, HARD_DEADLINE_MS)
  retryingCount += broken.length
  emit()
  for (const rt of broken) {
    void runOne(rt).finally(() => {
      retryingCount = Math.max(0, retryingCount - 1)
      emit()
    })
  }
}

/** 字体阶段的资源 ID */
export const FONT_STAGE_ID = 'type.display'

/**
 * 展示字体是否已经可以用来排版（含超时降级）。
 * Loader 用它决定 WELCOME 什么时候上屏，避免细衬线回退跳成 Ultra。
 */
export function isDisplayFontReady(snap: LoadSnapshot): boolean {
  const rt = snap.items.find((i) => i.entry.id === FONT_STAGE_ID)
  return rt === undefined || isSettled(rt.status)
}

/** React 订阅入口 */
export function useBlockingAssets(): LoadSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

/* ============================================================================
 * 开发期报告
 * ========================================================================== */

function reportToConsole() {
  const rows = runtimes.map((rt) => ({
    id: rt.entry.id,
    状态: rt.status,
    分组: rt.entry.group,
    'KB': Math.round(rt.entry.bytes / 102.4) / 10,
    '网络ms': rt.netMs === null ? '-' : Math.round(rt.netMs),
    '解码ms': rt.decodeMs === null ? '-' : Math.round(rt.decodeMs),
    次数: rt.attempts,
    url: rt.entry.url,
  }))
  const bad = runtimes.filter((rt) => rt.status === 'failed' || rt.status === 'degraded')
  const total = Math.round(snapshot.elapsedMs)
  const net = Math.max(0, ...runtimes.map((r) => r.netMs ?? 0))
  const dec = Math.max(0, ...runtimes.map((r) => r.decodeMs ?? 0))

  console.groupCollapsed(
    `[assets] 首屏阻塞 ${snapshot.readyCount}/${snapshot.totalCount} ready · ` +
      `总耗时 ${total}ms · 最慢网络 ${Math.round(net)}ms · 最慢解码 ${Math.round(dec)}ms`,
  )
  console.table(rows)
  if (bad.length > 0) {
    console.warn(
      '[assets] 失败/降级资源：\n' +
        bad.map((rt) => `  ${rt.status.padEnd(8)} ${rt.entry.url}  ← ${rt.error}`).join('\n'),
    )
  }
  reportSizeDrift()
  console.groupEnd()
}

/**
 * 清单登记的体积/版本会随素材重新压制而过期，进度加权就会失真。
 * 用 Resource Timing 的真实 encodedBodySize 对账，偏差超过 5% 就点名，
 * 提示按文件头的命令重新生成 bytes 和 version。零额外请求。
 */
function reportSizeDrift() {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return
  const seen = new Map<string, number>()
  for (const e of performance.getEntriesByType('resource')) {
    const size = (e as PerformanceResourceTiming).encodedBodySize
    if (size > 0) seen.set(new URL(e.name, location.origin).pathname, size)
  }
  const drift: string[] = []
  const check = (url: string, bytes: number) => {
    const real = seen.get(url)
    if (real === undefined) return
    if (Math.abs(real - bytes) / bytes > 0.05) drift.push(`${url}  清单 ${bytes}B → 实际 ${real}B`)
  }
  for (const a of ASSET_MANIFEST) {
    if (a.kind !== 'image') continue
    check(a.url, a.bytes)
    // 派生档位也要对账：srcset 实际取的往往是变体而不是原图
    for (const v of a.variants) check(v.url, v.bytes)
  }
  if (drift.length > 0) {
    console.warn(
      '[assets] 清单登记体积已过期，请重新生成 bytes / version：\n  ' + drift.join('\n  '),
    )
  }
}

/**
 * 跨模块契约检查：imageSources.ts 的 workImage() 自己拼 srcset，
 * 那份宽度表和本清单是两处独立的真相，改了一处忘了另一处就会请求到 404。
 * 这里把它真实生成的每个 URL 拿来和清单对一遍。
 *
 * 用动态 import 是为了不把作品页模块拽进主包；生产构建里整段是死代码。
 */
async function auditWorkImageSources(): Promise<void> {
  try {
    const { workImage } = await import('../components/work/imageSources')
    const known = new Set<string>()
    for (const a of ASSET_MANIFEST) {
      known.add(a.url)
      for (const v of a.variants) known.add(v.url)
    }
    const missing: string[] = []
    for (const a of ASSET_MANIFEST) {
      const m = /^\/assets\/(photo|posters|mag|cover)\/([^/]+)\.webp$/.exec(a.url)
      if (!m) continue
      const dir = m[1] as Parameters<typeof workImage>[0]
      const { src, srcSet } = workImage(dir, m[2])
      const urls = [src, ...srcSet.split(',').map((x) => x.trim().split(/\s+/)[0])]
      for (const u of urls) {
        if (!known.has(u)) missing.push(`${u}  ← workImage('${dir}', '${m[2]}')`)
      }
    }
    if (missing.length > 0) {
      console.warn('[assets] imageSources 会请求清单里没有登记的档位：\n  ' + missing.join('\n  '))
    }
  } catch {
    /* 作品页模块不可用时跳过，这只是开发期的一致性检查 */
  }
}

/**
 * 校验 index.html 的 preload 与清单是否一致，并确认 URL 真的返回图片
 * （SPA fallback 会用 HTML 冒充 200）。
 */
export async function auditPreloadLinks(): Promise<void> {
  if (typeof document === 'undefined') return
  const declared = new Set(
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]')).map(
      (l) => new URL(l.href, location.origin).pathname,
    ),
  )
  const expected = new Set(PRELOAD_ASSETS.map((a) => a.url))

  const missing = [...expected].filter((u) => !declared.has(u))
  const extra = [...declared].filter((u) => !expected.has(u))
  if (missing.length) console.warn('[preload] 清单里标了 preload 但 index.html 没写：', missing)
  if (extra.length) console.warn('[preload] index.html 多出的 preload（清单里没有）：', extra)

  const problems: string[] = []
  await Promise.all(
    [...declared].map(async (url) => {
      try {
        const res = await fetch(url, { method: 'GET', cache: 'force-cache' })
        const type = res.headers.get('content-type') ?? ''
        if (!res.ok) problems.push(`${url} → HTTP ${res.status}`)
        else if (!type.startsWith('image/')) problems.push(`${url} → content-type ${type}（疑似 SPA fallback 返回 HTML）`)
      } catch (err) {
        problems.push(`${url} → ${err instanceof Error ? err.message : String(err)}`)
      }
    }),
  )
  if (problems.length) console.error('[preload] 预加载 URL 校验失败：\n  ' + problems.join('\n  '))
  else console.info(`[preload] ${declared.size} 条预加载 URL 全部真实返回图片`)
}

/* 模块被引入即开始加载，不等任何组件挂载（「页面启动后立即挂载资源层」） */
if (typeof window !== 'undefined') void startBlockingLoad()
