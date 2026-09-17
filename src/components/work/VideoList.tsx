import { useEffect, useRef } from 'react'
import { VIDEOS } from '../../data/content'
import BackToFolders from './BackToFolders'
import { releaseImages, SIZES, workImage } from './imageSources'
import './video.css'

/**
 * SELECTED WORK › VIDEO 影像作品
 *
 * 三支视频纵向排列：游戏视频剪辑 / 学院“春之声”短视频 / 校级微电影。
 * 每支视频独立播放器，点封面或播放按钮开始播放；再点关封面暂停。
 */
export default function VideoList() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    return () => releaseImages(root)
  }, [])

  return (
    <div ref={rootRef} className="wv vl">
      <BackToFolders />
      <div className="vl__scroll">
        <div className="vl__inner">
          {VIDEOS.map((v) => (
            <article key={v.no} className="vl__item">
              <div className="vl__meta">
                <span className="vl__no">{v.no} ·</span>
                <h2 className="vl__title">{v.en}</h2>
                <p className="vl__cn">{v.cn}</p>
                <p className="vl__desc">{v.desc}</p>
              </div>
              <div className="vl__player">
                <video
                  className="vl__video"
                  src={v.href}
                  controls
                  preload="metadata"
                  playsInline
                  poster={`/assets/cover/${v.cover}.webp`}
                />
                <img
                  className="vl__poster-fallback"
                  {...workImage('cover', v.cover)}
                  sizes={SIZES.video}
                  alt={`${v.en} 封面`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
