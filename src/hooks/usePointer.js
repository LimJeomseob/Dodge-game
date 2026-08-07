import { useCallback, useEffect, useRef, useState } from 'react'
import { STAGE_W, STAGE_H } from '../data/maps.js'
import { TOUCH_Y_OFFSET } from '../data/config.js'

/**
 * 마우스와 터치를 하나의 커서 좌표(스테이지 960x540 기준)로 통합한다.
 *
 * 화면 → 스테이지 변환은 SVG 의 getScreenCTM() 역행렬로 한다.
 * viewBox·letterbox 는 물론 세로 화면에서 무대를 90도 회전시켜도 좌표가 정확하다.
 *
 * 터치일 때는 손가락에 가려지지 않도록 커서를 화면 기준 위쪽으로
 * TOUCH_Y_OFFSET 만큼 띄운다. 회전 여부와 무관하게 "물리적으로 위" 가 되도록
 * 변환 전(화면 좌표)에서 빼준다.
 *
 * 반환:
 *   ref     — 스테이지 <svg> 에 붙일 ref
 *   posRef  — { x, y, fx, fy, active, touch } 최신 좌표 (렌더 유발 없음)
 *   pos     — 렌더용 상태
 *   bind    — <svg> 에 펼칠 이벤트 핸들러
 */
export default function usePointer() {
  const ref = useRef(null)
  const posRef = useRef({
    x: STAGE_W / 2,
    y: STAGE_H / 2,
    fx: STAGE_W / 2,
    fy: STAGE_H / 2,
    active: false,
    touch: false,
  })
  const [pos, setPos] = useState(posRef.current)

  const toStage = useCallback((clientX, clientY) => {
    const svg = ref.current
    if (!svg || !svg.getScreenCTM) return null
    const m = svg.getScreenCTM()
    if (!m) return null
    const inv = m.inverse()
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const p = pt.matrixTransform(inv)
    return { x: p.x, y: p.y }
  }, [])

  const update = useCallback(
    (clientX, clientY, isTouch, active = true) => {
      const offset = isTouch ? TOUCH_Y_OFFSET : 0
      const cursor = toStage(clientX, clientY - offset)
      const finger = offset ? toStage(clientX, clientY) : cursor
      if (!cursor || !finger) return
      const next = {
        x: cursor.x,
        y: cursor.y,
        fx: finger.x,
        fy: finger.y,
        active,
        touch: !!isTouch,
      }
      posRef.current = next
      setPos(next)
    },
    [toStage]
  )

  const onPointerMove = useCallback(
    (e) => update(e.clientX, e.clientY, e.pointerType === 'touch' || e.pointerType === 'pen', true),
    [update]
  )

  const onPointerDown = useCallback(
    (e) => {
      const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
      if (isTouch && e.currentTarget.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* 캡처 실패해도 이동 이벤트는 계속 들어온다 */
        }
      }
      update(e.clientX, e.clientY, isTouch, true)
    },
    [update]
  )

  const deactivate = useCallback(() => {
    posRef.current = { ...posRef.current, active: false }
    setPos(posRef.current)
  }, [])

  const onPointerUp = useCallback(
    (e) => {
      // 터치는 손을 떼면 커서가 사라지고, 마우스는 화면 위에 계속 남아 있다.
      if (e.pointerType === 'touch' || e.pointerType === 'pen') deactivate()
    },
    [deactivate]
  )

  // 모바일에서 게임 중 스크롤·당겨서새로고침·확대를 막는다.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prevent = (e) => e.preventDefault()
    el.addEventListener('touchmove', prevent, { passive: false })
    el.addEventListener('touchstart', prevent, { passive: false })
    return () => {
      el.removeEventListener('touchmove', prevent)
      el.removeEventListener('touchstart', prevent)
    }
  }, [])

  return {
    ref,
    posRef,
    pos,
    bind: {
      onPointerMove,
      onPointerDown,
      onPointerUp,
      onPointerLeave: deactivate,
      onPointerCancel: deactivate,
    },
  }
}
