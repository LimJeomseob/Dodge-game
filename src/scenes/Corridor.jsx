import { useMemo, useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Shape, Label, StartPad } from '../ui/Shapes.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { insideWithMargin, dist } from '../engine/geometry.js'
import { CORRIDOR } from '../data/maps.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.corridor

/**
 * 원작 p18 「3 스테이지 통로」.
 *
 * 추출한 기둥들은 y=48 아래를 꽉 채우고 있어서, 실제로 가로지를 수 있는 길은
 * 화면 맨 위 48px 짜리 좁은 띠 하나뿐이다. 왼쪽 끝에서 오른쪽 끝 출구까지
 * 그 띠를 따라가되, 띠를 오가는 빨간 점과 기둥 사이에서 솟구치는 점을 피해야 한다.
 */
// 원작에서 열린 띠는 화면 맨 위였지만, 거기엔 HUD 가 겹친다.
// 기둥을 상하로 뒤집어 같은 구조를 유지한 채 통로를 화면 아래쪽으로 옮겼다.
const BAND_TOP = 496
const BAND_BOTTOM = 536

export default function Corridor({ onClear, onDeath, vp, paused }) {
  const { pillars, dots } = useMemo(() => {
    const s = split(CORRIDOR)
    return { ...s, pillars: s.pillars.map(flipY) }
  }, [])

  // 기둥 사이 빈틈(세로 통로)의 x 중심 — 여기서 점이 솟아오른다
  const gaps = useMemo(() => findGaps(pillars), [pillars])

  const patrol = useMemo(
    () =>
      dots.map((d, i) => ({
        // 띠를 좌우로 왕복하는 점
        phase: (i / Math.max(1, dots.length)) * Math.PI * 2,
        y: BAND_TOP + 6 + (i % 3) * 13,
        speed: T.dotSpeed * (0.8 + (i % 4) * 0.15),
      })),
    [dots]
  )

  const risers = useMemo(
    () => gaps.map((x, i) => ({ x, phase: i * 0.8, height: 150 + (i % 3) * 60 })),
    [gaps]
  )

  const [frame, setFrame] = useState({ dots: [], risers: [], cursor: null })
  const cleared = useRef(false)

  const start = { x: 24, y: 516 }
  const exit = { x: 924, y: 516 }
  const exitR = vp.target(T.exitRadius)
  const margin = vp.margin(T.margin)
  const dotR = vp.mobile ? 13 : 16

  const { pointer, armed } = useDodgeScene({
    startPoint: start,
    onDeath,
    paused,
    armRadius: vp.target(26),
    check: (dt, t, c) => {
      const span = 960 - 2 * dotR
      const moving = patrol.map((p) => ({
        // 삼각파로 좌우 등속 왕복
        x: dotR + triangle(t * p.speed + p.phase * 200, span),
        y: p.y,
      }))
      // 기둥 사이 세로 통로에서 점이 아래 띠를 향해 내려왔다 올라간다
      const rising = risers.map((r) => ({
        x: r.x,
        y: BAND_TOP - (Math.sin(t * 1.6 + r.phase) * 0.5 + 0.5) * r.height,
      }))
      setFrame({ dots: moving, risers: rising, cursor: { x: c.x, y: c.y, touch: c.touch } })

      if (!cleared.current && dist(c.x, c.y, exit.x, exit.y) <= exitR) {
        cleared.current = true
        sfx('clear')
        onClear()
        return false
      }

      for (const p of pillars) if (insideWithMargin(c.x, c.y, p, margin)) return true
      for (const m of moving) if (dist(c.x, c.y, m.x, m.y) <= dotR) return true
      for (const r of rising) if (dist(c.x, c.y, r.x, r.y) <= dotR) return true
      return false
    },
  })

  const cursor = frame.cursor

  return (
    <>
      <Stage pointerRef={pointer.ref} bind={pointer.bind} background="#ffffff">
        {pillars.map((p, i) => (
          <Shape key={i} s={p} />
        ))}
        {frame.risers.map((d, i) => (
          <circle key={`r${i}`} cx={d.x} cy={d.y} r={dotR} fill="#ff6b00" pointerEvents="none" />
        ))}
        {frame.dots.map((d, i) => (
          <circle key={`d${i}`} cx={d.x} cy={d.y} r={dotR} fill="#ff0000" pointerEvents="none" />
        ))}

        <Label x={480} y={64} size={22} fill="#fff" stroke="#00b0f0">
          3 스테이지 — 맨 아래 좁은 길로 오른쪽 끝까지
        </Label>

        <g pointerEvents="none">
          <circle cx={exit.x} cy={exit.y} r={exitR} fill="#00b0f0" stroke="#fff" strokeWidth="3">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <text x={exit.x} y={exit.y} fontSize="14" fill="#fff" textAnchor="middle" dominantBaseline="middle">
            출구
          </text>
        </g>

        <StartPad x={start.x} y={start.y} armed={armed} r={vp.target(18)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && <TazolMan x={cursor.x} y={cursor.y} scale={0.65} />}
      </Stage>
      {!armed && <ArmHint mobile={vp.mobile} />}
    </>
  )
}

/** 0..span 사이를 등속 왕복하는 삼각파 */
function triangle(v, span) {
  const m = ((v % (span * 2)) + span * 2) % (span * 2)
  return m < span ? m : span * 2 - m
}

/** 도형을 화면 상하로 뒤집는다 */
function flipY(s) {
  return { ...s, pts: s.pts.map(([x, y]) => [x, 540 - y]) }
}

function split(shapes) {
  const pillars = []
  const dots = []
  for (const s of shapes) {
    if (s.t === 'circle' && s.fill === '#ff0000') dots.push(s)
    else if (s.t !== 'circle') pillars.push(s)
  }
  return { pillars, dots }
}

/** 기둥 x 구간 사이의 빈틈 중심을 구한다 */
function findGaps(pillars) {
  const spans = pillars
    .map((p) => {
      const xs = p.pts.map((q) => q[0])
      return [Math.min(...xs), Math.max(...xs)]
    })
    .sort((a, b) => a[0] - b[0])
  const gaps = []
  for (let i = 1; i < spans.length; i++) {
    const gapStart = spans[i - 1][1]
    const gapEnd = spans[i][0]
    if (gapEnd - gapStart > 24) gaps.push((gapStart + gapEnd) / 2)
  }
  return gaps
}
