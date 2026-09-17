import { useEffect, useRef, useState } from 'react'
import { ACCOUNTS } from '../../data/content'
import BackToFolders from './BackToFolders'
import './accounts.css'

/** 数字渐进动画（进入视口后从 0 滚到目标值） */
function useCountUp(target: number, run: boolean, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf = 0
    const t0 = performance.now() + delay
    const dur = 1100
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / dur))
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, delay])
  return val
}

function StatBar({ label, value, max, run, delay }: { label: string; value: number; max: number; run: boolean; delay: number }) {
  const n = useCountUp(value, run, delay)
  return (
    <div className="ac__stat">
      <span className="ac__statLabel">{label}</span>
      <span className="ac__statTrack">
        <i className="ac__statFill" data-run={run} style={{ '--w': `${(value / max) * 100}%` } as React.CSSProperties} />
      </span>
      <span className="ac__statNum">{n}</span>
    </div>
  )
}

/** 柱形图：曝光/观看/点赞/评论（线性条，自动归一化） */
function Bars({ data, run }: { data: { k: string; v: number }[]; run: boolean }) {
  const max = Math.max(...data.map((d) => d.v), 1)
  return (
    <div className="ac__bars">
      {data.map((d) => (
        <div key={d.k} className="ac__barCol">
          <span className="ac__barVal">{d.v}</span>
          <span className="ac__barTrack">
            <i data-run={run} style={{ '--h': `${(d.v / max) * 100}%` } as React.CSSProperties} />
          </span>
          <span className="ac__barK">{d.k}</span>
        </div>
      ))}
    </div>
  )
}

/** 雷达图：多维度表现（SVG 多边形） */
function Radar({ data }: { data: { k: string; v: number; max: number }[] }) {
  const n = data.length
  const cx = 62
  const cy = 62
  const R = 46
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  const rings = [0.25, 0.5, 0.75, 1].map((f) => data.map((_, i) => pt(i, R * f).join(',')).join(' '))
  const poly = data.map((d, i) => pt(i, R * Math.min(1, d.v / d.max)).join(',')).join(' ')
  const nodes = data.map((d, i) => ({ ...d, p: pt(i, R * Math.min(1, d.v / d.max)) }))
  return (
    <svg className="ac__radar" viewBox="0 0 124 124" role="img" aria-label="笔记数据雷达图">
      {rings.map((r, i) => (
        <polygon key={i} points={r} fill={i === 3 ? 'rgba(138,92,246,0.05)' : 'none'} stroke="rgba(20,22,26,0.14)" strokeWidth="0.6" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(20,22,26,0.14)" strokeWidth="0.6" />
      })}
      <polygon points={poly} fill="rgba(138,92,246,0.3)" stroke="#8a5cf6" strokeWidth="1.4" strokeLinejoin="round" />
      {nodes.map((d, i) => (
        <circle key={i} cx={d.p[0]} cy={d.p[1]} r="2.4" fill="#7240e8" />
      ))}
      {data.map((d, i) => {
        const [x, y] = pt(i, R + 13)
        return (
          <text key={d.k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="ac__radarLabel">
            {d.k}
          </text>
        )
      })}
    </svg>
  )
}

function AccountCard({ a, i, active }: { a: (typeof ACCOUNTS)[number]; i: number; active: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)
  const [tapped, setTapped] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setSeen(true)),
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const on = active && seen
  /* 点击卡片：放大 + 数据重新弹现 */
  const handleTap = () => {
    setTapped((t) => !t)
    window.setTimeout(() => setTapped(false), 1400)
  }
  const run = on || tapped
  const maxStat = Math.max(a.stats.following, a.stats.followers, a.stats.likes, 1)

  return (
    <section
      ref={ref}
      className="ac__card"
      data-on={on}
      data-tapped={tapped}
      onClick={handleTap}
      style={{ '--i': i } as React.CSSProperties}
    >
      <span className="ac__secNo">{String(i + 1).padStart(2, '0')}</span>
      <span className="ac__secType">{i === 0 ? 'LIFE' : 'GAME'}</span>

      {/* 手机 mockup：账号主页截图 */}
      <div className="ac__phone" aria-hidden>
        <div className="ac__phoneTop">
          <span className="ac__dot" />
          <span className="ac__speaker" />
        </div>
        <img src={`/assets/accounts/${a.home}.webp`} alt={`${a.nickname} 主页`} draggable={false} />
        <span className="ac__tag">{a.tag}</span>
      </div>

      {/* 右侧信息 */}
      <div className="ac__info">
        <span className="ac__kicker">
          XIAOHONGSHU ACCOUNT · {String(i + 1).padStart(2, '0')} · {a.style}
        </span>
        <h2 className="ac__name">{a.nickname}</h2>
        <p className="ac__meta">
          {a.handle} · {a.ip} · {a.tag}
        </p>
        <p className="ac__bio">“{a.bio}”</p>

        <div className="ac__stats">
          <StatBar label="关注" value={a.stats.following} max={maxStat} run={run} delay={150} />
          <StatBar label="粉丝" value={a.stats.followers} max={maxStat} run={run} delay={300} />
          <StatBar label="获赞与收藏" value={a.stats.likes} max={maxStat} run={run} delay={450} />
        </div>

        {/* 代表笔记 */}
        <div className="ac__notes">
          {a.notes.map((n) => (
            <div key={n.cover} className="ac__note">
              <img src={`/assets/accounts/${n.cover}.webp`} alt={n.title} draggable={false} loading="lazy" />
              <div className="ac__noteBody">
                <strong>{n.title}</strong>
                <span className="ac__noteMeta">
                  {n.date} · 浏览 {n.plays} · 点赞 {n.likes}
                </span>
                <span className="ac__insight">{n.insight}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 数据图表洞察（点击卡片可重新弹现） */}
        <div className="ac__chart" data-run={run} key={tapped ? 'b' : 'a'}>
          <h3 className="ac__chartTitle">{a.chart.label}</h3>
          <div className="ac__chartRow">
            <Bars data={a.chart.rows} run={run} />
            <div className="ac__radarBox">
              <Radar data={a.chart.radar} />
              <ul className="ac__radarLegend">
                {a.chart.radar.map((r) => (
                  <li key={r.k}>
                    <span>{r.k}</span>
                    <em>{r.v}</em>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="ac__analysis">{a.chart.analysis}</p>
        </div>

        <a
          className="ac__open"
          href={a.href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
        >
          VIEW ON XIAOHONGSHU
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M2 10 10 2M4 2h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  )
}

/**
 * SELECTED WORK › ACCOUNT OPS —— 账号运营
 *
 * 两个小红书账号分屏展示、上下交错摆放：
 * 01 生活类「栀白」· 真实经历型（兼职/成长记录），02 游戏类「世界在下小鱼」· 视觉审美型。
 * 点击账号卡片有放大动效，数据统计与图表随之重新弹现。
 */
export default function AccountsView() {
  return (
    <div className="wv ac">
      <BackToFolders />
      <span className="wv__ghost ac__ghost">ACCOUNT OPS</span>

      <header className="ac__head">
        <span className="ac__kicker ac__kicker--head">XIAOHONGSHU OPERATION · 从 0 到 1</span>
        <h1 className="ac__title">
          账号<span>运营</span>
        </h1>
        <p className="ac__sub">
          两个小红书账号的日常运营：生活类「栀白」× 游戏类「世界在下小鱼」，
          以数据图表还原单篇笔记的曝光、互动与内容表现。
        </p>
      </header>

      <div className="ac__grid">
        {ACCOUNTS.map((a, i) => (
          <AccountCard key={a.id} a={a} i={i} active />
        ))}
      </div>
    </div>
  )
}
