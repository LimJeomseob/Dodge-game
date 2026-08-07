import { useCallback, useRef, useState } from 'react'
import usePointer from '../hooks/usePointer.js'
import useGameLoop from '../hooks/useGameLoop.js'
import { findSafeSpot } from '../engine/geometry.js'
import { sfx } from '../audio/chiptune.js'

/**
 * 회피 씬 공통 뼈대.
 *
 * 커서가 시작 지점(초록 점)에 닿으면 armed 가 되고, 그때부터 충돌 판정이 켜진다.
 * 시작 전에 죽지 않으므로 어디서 출발할지 몰라 억울하게 죽는 일이 없다.
 *
 * check(dt, elapsed, cursor) 를 매 프레임 호출한다.
 *   true 를 돌려주면 사망 처리.
 */
export default function useDodgeScene({
  shapes,
  startRegion,
  startPoint,
  onDeath,
  paused,
  check,
  armRadius = 30,
}) {
  const pointer = usePointer()
  const [armed, setArmed] = useState(false)
  const armedRef = useRef(false)
  const doneRef = useRef(false)

  const start = useRef(null)
  if (start.current === null) {
    start.current =
      startPoint || (shapes ? findSafeSpot(shapes, startRegion) : { x: 60, y: 480 })
  }

  const kill = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDeath()
  }, [onDeath])

  useGameLoop((dt, elapsed) => {
    const c = pointer.posRef.current
    if (!c.active) return
    if (!armedRef.current) {
      const d = Math.hypot(c.x - start.current.x, c.y - start.current.y)
      if (d <= armRadius) {
        armedRef.current = true
        setArmed(true)
        sfx('click')
      }
      return
    }
    if (check(dt, elapsed, c)) kill()
  }, !paused && !doneRef.current)

  return { pointer, armed, start: start.current, kill, doneRef }
}
