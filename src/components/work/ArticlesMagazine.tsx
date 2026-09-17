import { useEffect, useMemo, useRef, useState } from 'react'
import { ARTICLES } from '../../data/content'
import { releaseImages, SIZES, workImage } from './imageSources'
import './articles.css'

/** 当前跨页前后各保留几张纸的高分辨率解码结果 */
const KEEP = 1

type Sheet = { front: number | null }

/**
 * SELECTED WORK › DESIGN › 02 公众号推文 —— 单页翻页样刊
 *
 * 3 篇公众号推文 + 封底各占一张纸，每张纸正面承载一页内容、背面为空白纸。
 * 翻页时新的一页始终在右半完整显示，翻过去的纸留在左半（空白背面），
 * 不会出现内容被 3D 透视压缩、位置错乱的情况。翻过封底回到第一页。
 */
export default function ArticlesMagazine({ active }: { active: boolean }) {
  const [flipped, setFlipped] = useState(0)
  const bookRef = useRef<HTMLDivElement>(null)

  /* 4 张纸：3 篇推文 + 封底，每张纸只有正面内容 */
  const sheets = useMemo<Sheet[]>(() => {
    const out: Sheet[] = ARTICLES.map((_, i) => ({ front: i }))
    out.push({ front: null }) // 封底
    return out
  }, [])

  const total = sheets.length // 4
  const opened = flipped > 0
  const atEnd = flipped >= total - 1 // 停在封底

  /* 循环翻页：翻过封底回到第一页，往回翻过头落到封底 */
  const turn = (d: number) =>
    setFlipped((f) => {
      const next = f + d
      if (next >= total) return 0
      if (next < 0) return total - 1
      return next
    })

  // 关闭 DESIGN 栏目时断开所有内页引用
  useEffect(() => {
    const book = bookRef.current
    return () => releaseImages(book)
  }, [])

  const face = (a: (typeof ARTICLES)[number], onTurn: () => void) => (
    <button
      type="button"
      className="mb__face mb__face--front am__face"
      style={{ '--acc': a.accent } as React.CSSProperties}
      onClick={onTurn}
      aria-label="翻页"
    >
      {/* 封面头图满版铺满整页（cover，不拉伸变形） */}
      <img
        {...workImage('articles', a.cover)}
        sizes={SIZES.articles}
        alt={a.cn}
        decoding="async"
        draggable={false}
      />
      {/* 底部压暗渐变，托住标题 */}
      <span className="am__scrim" aria-hidden />
      {/* 顶部标签条（每篇专属主色圆点） */}
      <span className="am__top">
        <i className="am__dot" />
        WECHAT ARTICLE · {a.no}
      </span>
      {/* 底部：副标题 + 中文标题 + 原文入口 */}
      <span className="am__meta">
        <em className="am__sub">{a.sub}</em>
        <strong className="am__cn">{a.cn}</strong>
        <a
          className="am__open"
          href={a.href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          VIEW ON WECHAT ↗
        </a>
      </span>
    </button>
  )

  return (
    <div className="wv am">
      <span className="wv__ghost am__ghost">WECHAT ARTICLES</span>

      <div className="mb__stage" data-open={opened} data-active={active} data-end={atEnd}>
        <div ref={bookRef} className="mb__book">
          {/* 左半：翻过去的纸落在这一侧 */}
          <div className="mb__left" data-show={opened} />
          {sheets.map((s, i) => {
            const isFlipped = i < flipped
            /* 只挂当前跨页及相邻纸的图；翻远了直接卸掉 <img>，让解码位图被回收 */
            const near = i >= flipped - 1 - KEEP && i <= flipped + KEEP
            return (
              <div
                key={i}
                className="mb__sheet"
                data-flipped={isFlipped}
                style={{ zIndex: isFlipped ? i : total - i }}
              >
                {near &&
                  (s.front === null ? (
                    /* 封底：第 4 张纸的正面 */
                    <button
                      type="button"
                      className="mb__face mb__face--front am__face am__face--end"
                      onClick={() => turn(1)}
                      aria-label="回到第一页"
                    >
                      <span className="am__endTitle">公众号长文</span>
                      <span className="am__endSub">WECHAT ARTICLES · 华音社</span>
                    </button>
                  ) : (
                    face(ARTICLES[s.front], () => turn(1))
                  ))}
                {near && (
                  <button
                    type="button"
                    className="mb__face mb__face--back am__face am__face--blank"
                    onClick={() => turn(-1)}
                    aria-label="翻回上一页"
                  >
                    <span className="am__blankMark">WECHAT ARTICLES</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="mb__hint">
        {atEnd ? 'CLICK TO LOOP BACK TO THE FIRST PAGE' : 'CLICK PAGES TO TURN · VIEW ON WECHAT TO OPEN'}
        <svg width="22" height="9" viewBox="0 0 22 9" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M0 4.5h20M16.4 1 20 4.5 16.4 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </p>
    </div>
  )
}
