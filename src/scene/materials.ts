/* ============================================================================
 * 场景材质
 *
 * 统一 Metallic-Roughness：柜体是烤漆金属，低 metalness、中等 roughness，
 * 高光靠主光和半球光形成，不在贴图里画高光。
 * 颜色取自 参考画面 的采样，再按 ACES 色调映射
 * 与曝光 1.06 反推回 albedo。
 * ========================================================================== */

export const PALETTE = {
  /** 门面：更奶的婴儿蓝，偏白偏柔 */
  door: '#d4e4f3',
  /** 门内侧：比外侧再亮一点 */
  doorInner: '#e6f0f9',
  /** 柜壳与立柱：浅奶蓝 */
  frame: '#b8cfe4',
  /** 顶盖：受光最足 */
  cap: '#cadded',
  /** 底座 */
  plinth: '#b6cde2',
  /** 柜腔内壁：明亮的浅蓝 */
  cavity: '#6f9cc4',
  /** 柜腔后壁比侧壁亮一点 */
  cavityBack: '#86b0d4',
  /** 隔板 */
  shelf: '#b0cbe2',
  /** 把手底板 */
  handlePlate: '#9fb4c6',
  /** 把手蓝色嵌条 */
  handleGrip: '#7aa8cc',
  /** 通风槽底衬 */
  ventBack: '#8aa2b8',
} as const

/** 柜体烤漆的通用参数 */
export const PAINT = { roughness: 0.52, metalness: 0.08 } as const
/** 柜腔内壁：更哑，避免内部出现不该有的反光 */
export const MATTE = { roughness: 0.82, metalness: 0.02 } as const
/** 把手：金属感稍强 */
export const METAL = { roughness: 0.36, metalness: 0.42 } as const
