import { useEffect, useState } from 'react'
import { PPT_DECKS } from '../../data/content'
import './design.css'

/**
 * DESIGN › 03 PPT SHOWCASE —— 演示文稿展示
 *
 * 动画语感与最初网站「最后一部分」（IP 设计）一致：右侧内容物从底部升入、
 * 左侧文字渐显。每个 PPT 展示「封面 + 2 张完整内页」：右侧大图 + 底部缩略条，
 * 点击缩略图切换页面；点击大图有放大动效并切到下一张；自动轮播切换 PPT。
 */
export default function PptShowcase({ active }: { active: boolean }) {
  const [idx, setIdx] = useState(0)
  const [pg, setPg] = useState(0)
  const [bounce, setBounce] = useState(0)

  const cur = PPT_DECKS[idx]
  const gallery = [cur.cover, ...cur.gallery]

  /* 自动轮播（每 7s 切到下一份 PPT，重置到封面） */
  useEffect(() => {
    if (!active) return
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % PPT_DECKS.length)
      setPg(0)
    }, 7000)
    return () => window.clearInterval(t)
  }, [active])

  const pick = (i: number) => {
    setIdx(i)
    setPg(0)
  }

  /* 点击大图：放大动效 + 切到下一张 */
  const onMainTap = () => {
    setBounce((b) => b + 1)
    setPg((p) => (p + 1) % gallery.length)
  }

  return (
    <div className="ip pt" data-active={active}>
      {/* 右侧：当前 PPT 大图 + 内页缩略条 */}
      <div className="pt__stage">
        <button type="button" className="pt__mainBtn" onClick={onMainTap} aria-label="查看下一页">
          <div className="pt__stack" key={`${idx}-${pg}-${bounce}`}>
            <div className="pt__card pt__card--main">
              <img src={`/assets/ppt/${gallery[pg]}.webp`} alt={cur.cn} draggable={false} />
              <span className="pt__cardNo">
                {cur.no} · {pg === 0 ? 'COVER' : `PAGE ${pg}`}
              </span>
              <span className="pt__cardTag">{cur.tag}</span>
            </div>
          </div>
        </button>

        <div className="pt__thumbs">
          {gallery.map((g, i) => (
            <button
              key={g}
              type="button"
              className="pt__thumb"
              data-on={i === pg}
              onClick={() => setPg(i)}
              aria-label={`${cur.cn} 第 ${i + 1} 页`}
            >
              <img src={`/assets/ppt/${g}.webp`} alt="" draggable={false} />
              <span>{i === 0 ? '封面' : `内页 ${i}`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 左侧：说明文字 */}
      <div className="ip__copy pt__copy">
        <span className="ip__kicker">PPT DESIGN · 演示文稿</span>
        <h1 className="ip__title">Presentation</h1>
        <p className="ip__cn">PPT 制作</p>
        <p className="ip__desc">{cur.desc}</p>

        <ul className="ip__specs pt__specs">
          {PPT_DECKS.map((d, i) => (
            <li key={d.no} data-on={i === idx} onClick={() => pick(i)}>
              <span>
                {d.no} · {d.pages}P · {d.tag}
              </span>
              <em>{d.cn}</em>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
