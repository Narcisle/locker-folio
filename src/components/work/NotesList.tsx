import { useEffect, useRef, useState } from 'react'
import { NOTES } from '../../data/content'
import BackToFolders from './BackToFolders'
import { releaseImages, SIZES, workImage } from './imageSources'
import type { WorkAssetDir } from './imageSources'
import './notes.css'

const NOTES_DIR: WorkAssetDir = 'notes'

/**
 * SELECTED WORK › 实习成果 · 9 篇小红书爆款笔记
 *
 * 9 张卡片网格。点击任意一张进入大图详情：
 *   - 大图
 *   - 笔记标题 / 策略类型 / 数据指标（点赞 / 收藏 / 评论）
 *   - 内容简介
 *   - 跳转按钮 → 原文链接
 */
export default function NotesList() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const root = rootRef.current
    return () => releaseImages(root)
  }, [])

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const note = active !== null ? NOTES[active] : null

  return (
    <div ref={rootRef} className="wv nl">
      <BackToFolders />
      <header className="nl__head">
        <h2 className="nl__title">实习成果 · INTERNSHIP NOTES</h2>
        <p className="nl__sub">
          舒华体育股份有限公司 · 新媒体运营实习生 · 9 篇小红书爆款笔记累计曝光 420w+
        </p>
      </header>

      <div className="nl__grid">
        {NOTES.map((n, i) => (
          <button
            key={n.no}
            type="button"
            className="nl__card"
            onClick={() => setActive(i)}
            aria-label={`打开笔记：${n.title}`}
          >
            <span className="nl__no">{n.no}</span>
            <div className="nl__cover">
              <img
                {...workImage(NOTES_DIR, n.cover)}
                sizes={SIZES.notes}
                alt={n.title}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="nl__caption">{n.title}</p>
            <span className="nl__tag">{n.strategy}</span>
          </button>
        ))}
      </div>

      <p className="wv__tip">点击卡片 → 查看笔记数据与原文链接</p>

      {note && (
        <div
          className="nl__modal"
          role="dialog"
          aria-modal="true"
          aria-label={note.title}
          onClick={() => setActive(null)}
        >
          <div className="nl__modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="nl__close"
              onClick={() => setActive(null)}
              aria-label="关闭"
            >
              ×
            </button>
            <div className="nl__modal-pic">
              <img
                {...workImage(NOTES_DIR, note.cover)}
                sizes={SIZES.notes}
                alt={note.title}
                decoding="async"
              />
            </div>
            <div className="nl__modal-meta">
              <span className="nl__no">{note.no}</span>
              <h3 className="nl__modal-title">{note.title}</h3>
              <span className="nl__tag">{note.strategy}</span>
              <div className="nl__stats">
                <span className="nl__stat">{note.stats}</span>
              </div>
              <p className="nl__modal-desc">{note.desc}</p>
              <a
                className="nl__open"
                href={note.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                在小红书打开 ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}