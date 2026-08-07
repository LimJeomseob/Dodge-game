import { useEffect, useState } from 'react'
import { scaleForViewport } from '../data/config.js'

/** 화면 크기와 방향을 추적해 모바일 보정값을 돌려준다. */
export default function useViewport() {
  const read = () => {
    const w = typeof window === 'undefined' ? 1280 : window.innerWidth
    const h = typeof window === 'undefined' ? 720 : window.innerHeight
    return { width: w, height: h, portrait: h > w, ...scaleForViewport(w) }
  }
  const [vp, setVp] = useState(read)

  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setVp(read()))
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  return vp
}
