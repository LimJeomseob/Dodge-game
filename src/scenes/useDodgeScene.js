import { useCallback, useRef, useState } from 'react'
import usePointer from '../hooks/usePointer.js'
import useGameLoop from '../hooks/useGameLoop.js'
import { findSafeSpot } from '../engine/geometry.js'
import { sfx } from '../audio/chiptune.js'
import { markArmHintSeen, shouldShowArmHint } from '../ui/hints.js'

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

  // 조작법 안내는 첫 스테이지에서만. 씬 진입 시점에 한 번 정해 두고 바꾸지 않는다.
  const hintAllowed = useRef(shouldShowArmHint()).current

  const kill = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDeath()
  }, [onDeath])

  // 시작 지점을 짚은 순간을 0초로 삼는다.
  // 그렇지 않으면 생존 시간(레이저·얼음)이 시작 전부터 흘러, 가만히 기다렸다가
  // 출발하는 것만으로 스테이지가 끝나 버린다.
  const armedAt = useRef(0)

  useGameLoop((dt, elapsed) => {
    const c = pointer.posRef.current
    if (!c.active) return
    if (!armedRef.current) {
      const d = Math.hypot(c.x - start.current.x, c.y - start.current.y)
      if (d <= armRadius) {
        armedRef.current = true
        armedAt.current = elapsed
        setArmed(true)
        markArmHintSeen()
        sfx('click')
      }
      return
    }
    if (check(dt, elapsed - armedAt.current, c)) kill()
  }, !paused && !doneRef.current)

  return { pointer, armed, start: start.current, kill, doneRef, showHint: hintAllowed && !armed }
}
