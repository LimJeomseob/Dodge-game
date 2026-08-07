import { useMemo, useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Shape, Label, StartPad } from '../ui/Shapes.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { insideWithMargin, inBeam, dist, findSafeSpot, scaleShape } from '../engine/geometry.js'
import { EYEFIELD } from '../data/maps.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.eyefield

/**
 * 원작 p8 「2 스테이지 죽음의 길」.
 *
 * 빨간 도형 전부가 사망 판정. 흰 틈새가 안전 경로다.
 * v4 확정 연출:
 *   - 가장 큰 눈 = 태양. 8방향 삼각 광선이 8초에 한 바퀴 돌며 안전 틈새를 쓸고 간다.
 *   - 작은 빨간 화살촉(지그재그) = 번개. 예고 깜빡임 뒤 점등하는 순간에만 판정.
 *   - 눈동자는 커서를 시선 추적한다(연출).
 */
export default function EyeFieldStage({ onClear, onDeath, vp, paused }) {
  // 보이는 도형과 판정 도형이 항상 같도록, 축소한 결과를 렌더·판정에 함께 쓴다
  const { eyes, pupils, bolts } = useMemo(
    () => split(EYEFIELD.map((s) => scaleShape(s, T.shrink))),
    []
  )
  // 가장 큰 눈을 태양으로 삼는다
  const sun = useMemo(() => eyes.reduce((a, b) => (radiusOf(b) > radiusOf(a) ? b : a), eyes[0]), [eyes])

  const [frame, setFrame] = useState({ angle: 0, boltOn: false, boltWarn: false, cursor: null })
  const frameRef = useRef(frame)
  const cleared = useRef(false)

  const deadly = useMemo(() => eyes, [eyes])
  const exit = useMemo(() => {
    // 히든 출구: 화면 중앙부에서 도형과 가장 멀리 떨어진 지점
    const p = findSafeSpot(deadly, [0.34, 0.28, 0.66, 0.72])
    return { x: p.x, y: p.y }
  }, [deadly])

  const start = useMemo(() => findSafeSpot(deadly, [0.36, 0.02, 0.64, 0.16]), [deadly])
  const exitR = vp.target(T.exitRadius)
  const margin = vp.margin(T.margin)

  const { pointer, armed, showHint } = useDodgeScene({
    shapes: deadly,
    startPoint: start,
    onDeath,
    paused,
    armRadius: vp.target(28),
    check: (dt, t, c) => {
      const angle = ((t / T.rayPeriod) * 360) % 360
      const phase = t % T.boltPeriod
      const warn = phase < T.boltWarn
      const on = phase >= T.boltWarn && phase < T.boltWarn + T.boltStrike
      if (on && !frameRef.current.boltOn) sfx('thunder')
      frameRef.current = { angle, boltOn: on, boltWarn: warn, cursor: { x: c.x, y: c.y, touch: c.touch } }
      setFrame(frameRef.current)

      if (!cleared.current && dist(c.x, c.y, exit.x, exit.y) <= exitR) {
        cleared.current = true
        sfx('clear')
        onClear()
        return false
      }

      // 붉은 눈 본체
      for (const s of deadly) if (insideWithMargin(c.x, c.y, s, margin)) return true

      // 태양 광선 — 회전하는 부채꼴 8개
      const scx = sun.cx ?? 480
      const scy = sun.cy ?? 270
      for (let i = 0; i < T.rayCount; i++) {
        const a = angle + (360 / T.rayCount) * i
        if (inBeam(c.x, c.y, scx, scy, a, T.rayHalfAngle, T.rayLength)) return true
      }

      // 번개 — 점등 순간에만 판정
      if (on) {
        for (const b of bolts) if (insideWithMargin(c.x, c.y, boltStrikeShape(b), margin)) return true
      }
      return false
    },
  })

  const cursor = frame.cursor
  const scx = sun.cx ?? 480
  const scy = sun.cy ?? 270

  return (
    <>
      <Stage pointerRef={pointer.ref} bind={pointer.bind} background="#ffffff">
        {/* 회전하는 태양 광선 (눈 아래에 깔아 눈이 태양처럼 보이게) */}
        <g pointerEvents="none" opacity="0.85">
          {Array.from({ length: T.rayCount }, (_, i) => {
            const a = ((frame.angle + (360 / T.rayCount) * i) * Math.PI) / 180
            const half = (T.rayHalfAngle * Math.PI) / 180
            const p1 = [scx + Math.cos(a - half) * T.rayLength, scy + Math.sin(a - half) * T.rayLength]
            const p2 = [scx + Math.cos(a + half) * T.rayLength, scy + Math.sin(a + half) * T.rayLength]
            return (
              <polygon
                key={i}
                points={`${scx},${scy} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`}
                fill="#ff6b00"
                opacity="0.55"
              />
            )
          })}
        </g>

        {/* 붉은 눈 6개 */}
        {eyes.map((s, i) => (
          <Shape key={`e${i}`} s={s} />
        ))}
        {/* 눈동자 — 커서를 따라 조금씩 움직인다 */}
        {pupils.map((p, i) => {
          const follow = pupilOffset(p, cursor)
          return (
            <g key={`p${i}`} transform={`translate(${follow.dx} ${follow.dy})`} pointerEvents="none">
              <Shape s={p} />
            </g>
          )
        })}

        {/* 번개 — 예고(반투명) → 점등(불투명) */}
        {bolts.map((b, i) => (
          <g key={`b${i}`} pointerEvents="none">
            <Shape s={b} opacity={frame.boltOn ? 1 : frame.boltWarn ? 0.35 : 0.12} fill="#ff0000" />
            {frame.boltOn && <Shape s={boltStrikeShape(b)} fill="#fff200" opacity="0.9" />}
          </g>
        ))}

        <Label x={480} y={30} size={22} fill="#fff" stroke="#c00000">
          2라운드 준비 됐어 ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ
        </Label>
        <Label x={480} y={512} size={22} fill="#fff" stroke="#c00000">
          2 스테이지 죽음의 길
        </Label>

        {/* 히든 출구 — 작고 은근하게 */}
        <g pointerEvents="none">
          <circle cx={exit.x} cy={exit.y} r={exitR} fill="#111" opacity="0.85" />
          <circle cx={exit.x} cy={exit.y} r={exitR * 0.5} fill="#00b0f0">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />
          </circle>
        </g>

        <StartPad x={start.x} y={start.y} armed={armed} r={vp.target(18)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && <TazolMan x={cursor.x} y={cursor.y} color="#000" />}
      </Stage>
      {showHint && <ArmHint mobile={vp.mobile} />}
    </>
  )
}

/** 추출 도형을 눈 본체 / 눈동자 / 번개로 분류한다 */
function split(shapes) {
  const eyes = []
  const pupils = []
  const bolts = []
  for (const s of shapes) {
    if (s.fill === '#000000') pupils.push(s)
    else if (s.t === 'poly' && polyArea(s.pts) < 4000) bolts.push(s)
    else eyes.push(s)
  }
  return { eyes, pupils, bolts }
}

function polyArea(pts) {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }
  return Math.abs(a / 2)
}

function radiusOf(s) {
  if (s.t === 'circle') return s.r
  if (s.t === 'ellipse') return Math.max(s.rx, s.ry)
  return 0
}

/** 눈동자가 커서 쪽으로 최대 pupilFollow 만큼 쏠린다 */
function pupilOffset(p, cursor) {
  if (!cursor) return { dx: 0, dy: 0 }
  const cx = p.cx ?? 0
  const cy = p.cy ?? 0
  const d = dist(cx, cy, cursor.x, cursor.y)
  if (d < 1) return { dx: 0, dy: 0 }
  const k = Math.min(1, d / 300) * T.pupilFollow
  return { dx: ((cursor.x - cx) / d) * k, dy: ((cursor.y - cy) / d) * k }
}

/** 번개는 점등 시 지그재그 도형 위치에서 바닥까지 내리꽂힌다 */
const strikeCache = new WeakMap()
function boltStrikeShape(b) {
  if (strikeCache.has(b)) return strikeCache.get(b)
  const xs = b.pts.map((p) => p[0])
  const ys = b.pts.map((p) => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const top = Math.min(...ys)
  const w = 13
  // 지그재그 낙뢰 기둥
  const pts = []
  const seg = 6
  for (let i = 0; i <= seg; i++) {
    const y = top + ((540 - top) / seg) * i
    pts.push([cx + (i % 2 ? w : -w) * 1.6, y])
  }
  for (let i = seg; i >= 0; i--) {
    const y = top + ((540 - top) / seg) * i
    pts.push([cx + (i % 2 ? w : -w) * 1.6 + w, y])
  }
  const shape = { t: 'poly', pts, fill: '#fff200' }
  strikeCache.set(b, shape)
  return shape
}
