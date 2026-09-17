import { useCallback, useEffect, useRef, useState } from 'react'
import { NOTES } from '../../data/content'
import BackToFolders from './BackToFolders'
import { releaseImages, SIZES, workImage } from './imageSources'
import type { WorkAssetDir } from './imageSources'
import './website.css'

const NOTES_DIR: WorkAssetDir = 'notes'

/** 9 张卡环绕 360°，相邻夹角 40° */
const STEP = 40
const RADIUS = 560

/**
 * SELECTED WORK › INTERNSHIP NOTES —— 实习成果环形封面轮播
 *
 * 呈现效果与最初「文字作品」板块一致（3D 环形封面轮播 + 点击展开面板）：
 *   - 9 篇爆款笔记封面环绕一周，可拖拽 / 滚轮 / 键盘旋转
 *   - 点击封面展开右侧面板：标题、策略、点赞/收藏/评论数据、文案与原文链接
 *   - 光晕背景 + 下方标题/箭头/计数
 */
export default function NotesCarousel() {
  /** 连续位置（不取模），保证旋转永远沿最短方向且两侧始终有卡片 */
  const [pos, setPos] = useState(0)
  const [open, setOpen] = useState(false)
  const [drift, setDrift] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ on: false, x: 0, base: 0, moved: false })
  const wheelLock = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)

  // 关闭栏目时断开封面图引用
  useEffect(() => {
    const root = rootRef.current
    return () => releaseImages(root)
  }, [])

  const n = NOTES.length
  const idx = ((Math.round(pos) % n) + n) % n
  const cur = NOTES[idx]

  const go = useCallback((d: number) => {
    setOpen(false)
    setPos((p) => p + d)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    const onWheel = (e: WheelEvent) => {
      const now = performance.now()
      if (now - wheelLock.current < 460) return
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(d) < 12) return
      wheelLock.current = now
      go(d > 0 ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [go])

  const onDown = (e: React.PointerEvent) => {
    drag.current = { on: true, x: e.clientX, base: drift, moved: false }
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.on) return
    const dx = e.clientX - drag.current.x
    if (Math.abs(dx) > 4 && !drag.current.moved) {
      drag.current.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    setDrift(drag.current.base + dx * 0.26)
  }
  const onUp = () => {
    if (!drag.current.on) return
    drag.current.on = false
    setDragging(false)
    const steps = Math.round(drift / STEP)
    if (steps) {
      setOpen(false)
      setPos((p) => p - steps)
    }
    setDrift(0)
  }

  /* 每张卡片渲染前后各一份副本，环上任意角度都不会缺口 */
  const slots: { key: string; w: (typeof NOTES)[number]; a: number; active: boolean }[] = []
  for (let rep = -1; rep <= 1; rep++) {
    NOTES.forEach((w, i) => {
      const a = (i + rep * n - pos) * STEP + drift
      if (Math.abs(a) > 150) return
      slots.push({ key: `${rep}-${i}`, w, a, active: Math.abs(a) < STEP / 2 })
    })
  }

  return (
    <div ref={rootRef} className="wv wsc nc">
      <BackToFolders />
      <header className="nc__head">
        <h1 className="wsc__head">INTERNSHIP NOTES · 实习成果</h1>
        <p className="nc__sub">
          舒华体育股份有限公司 · 新媒体运营实习生 · 实习期间的小红书笔记累计曝光 420w+
        </p>
      </header>
      <div className="wsc__glow" aria-hidden />

      <div
        className="wsc__ring"
        data-open={open}
        data-drag={dragging}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="wsc__spin">
          {slots.map((s) => (
            <button
              key={s.key}
              type="button"
              className="wsc__card"
              data-active={s.active}
              data-gone={Math.abs(s.a) > 88}
              tabIndex={s.active ? 0 : -1}
              style={{
                transform: `rotateY(${s.a}deg) translateZ(${RADIUS}px)`,
                zIndex: 100 - Math.round(Math.abs(s.a)),
              }}
              onClick={() => {
                if (drag.current.moved) return
                if (s.active) setOpen((o) => !o)
              }}
            >
              <img
                {...workImage(NOTES_DIR, s.w.cover)}
                sizes={SIZES.notes}
                alt={s.w.title}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <span className="wsc__bar">
                <span>{s.w.no}</span>
                <span>{s.w.strategy}</span>
              </span>
            </button>
          ))}
        </div>

        <aside className="wsc__panel" data-show={open} aria-hidden={!open}>
          <span className="wsc__kicker">{cur.strategy}</span>
          <h2 className="wsc__title">{cur.title}</h2>
          <p className="nc__stats">{cur.stats}</p>
          <p className="wsc__desc">{cur.desc}</p>
          <a
            className="wsc__open"
            href={cur.href}
            target="_blank"
            rel="noreferrer noopener"
            tabIndex={open ? 0 : -1}
          >
            在小红书查看原文 ↗
          </a>
        </aside>
      </div>

      <div className="wsc__below" data-dim={open}>
        <h2 className="wsc__slug">{cur.title}</h2>
        <div className="wsc__nav">
          <button
            type="button"
            className="wsc__arrow"
            onClick={() => go(-1)}
            aria-label="上一篇笔记"
          >
            ←
          </button>
          <span className="wsc__count">
            {String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="wsc__arrow wsc__arrow--next"
            onClick={() => go(1)}
            aria-label="下一篇笔记"
          >
            →
          </button>
        </div>
        <p className="wv__tip">DRAG / SCROLL TO ROTATE · CLICK A COVER FOR DETAILS</p>
      </div>
    </div>
  )
}
