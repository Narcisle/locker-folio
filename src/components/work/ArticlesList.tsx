import { useEffect, useRef } from 'react'
import { ARTICLES } from '../../data/content'
import BackToFolders from './BackToFolders'
import { releaseImages, SIZES, workImage } from './imageSources'
import './articles.css'

/**
 * SELECTED WORK › DESIGN › 公众号长文
 *
 * 三张公众号文章封面卡。每张卡：
 *   - 大图（cover）+ 标题 / 副标题 / 文案简介
 *   - 右上角"VIEW ON WECHAT"按钮指向原文链接
 *   - 悬浮轻微抬升，营造类似编辑报纸的层次感
 */
export default function ArticlesList({ active: _active }: { active: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    return () => releaseImages(root)
  }, [])

  return (
    <div ref={rootRef} className="wv al">
      <BackToFolders />
      <header className="al__head">
        <h2 className="al__title">公众号长文 · WECHAT ARTICLES</h2>
        <p className="al__sub">
          华音社例行活动回顾三则 · 排版、封面与叙事均由本人完成，公众号原文以超链接形式给出。
        </p>
      </header>

      <div className="al__list" data-hscroll="false">
        {ARTICLES.map((a) => (
          <article key={a.no} className="al__card">
            <a
              className="al__cover"
              href={a.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`查看原文：${a.cn}`}
            >
              <img
                {...workImage('articles', a.cover)}
                sizes={SIZES.articles}
                alt={`${a.cn} 封面`}
                loading="lazy"
                decoding="async"
              />
              <span className="al__chip">VIEW ON WECHAT ↗</span>
            </a>

            <div className="al__meta">
              <span className="al__no">{a.no} ·</span>
              <h3 className="al__cn">{a.cn}</h3>
              <p className="al__sub2">{a.sub}</p>
              <p className="al__en">{a.en}</p>
              <p className="al__desc">{a.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="wv__tip">点击封面 → 跳转微信公众号原文</p>
    </div>
  )
}