import { useEffect, useRef } from 'react'

/**
 * requestAnimationFrame 루프. cb(dt, elapsed) 를 매 프레임 호출한다.
 * cb 는 ref 로 보관하므로 매 렌더마다 루프가 재시작되지 않는다.
 * dt 는 초 단위이며 탭 전환 등으로 튀는 것을 막기 위해 0.05s 로 제한한다.
 */
export default function useGameLoop(cb, active = true) {
  const cbRef = useRef(cb)
  cbRef.current = cb

  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    let elapsed = 0
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      elapsed += dt
      cbRef.current(dt, elapsed)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}
