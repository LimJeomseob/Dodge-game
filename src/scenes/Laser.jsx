import { useMemo, useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Shape, Label, StartPad } from '../ui/Shapes.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { insideWithMargin, dist } from '../engine/geometry.js'
import { LASER } from '../data/maps.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.laser

// 추출 도형 중 위/아래 벽 (y 로 판별)
const FIELD_TOP = 148
const FIELD_BOTTOM = 374

/**
 * 원작 p19 「캐릭터가 레이저를 발사합니다 조심하세요!!! (추신: 팔도 위 아래로 움직임)」.
 *
 * 왼쪽 캐릭터의 팔이 상하로 왕복하고, 팔 끝에서 레이저가 오른쪽으로 날아온다.
 * 위아래 벽 사이 좁은 필드에서 survive 초를 버티면 통과.
 */
export default function Laser({ onClear, onDeath, vp, paused }) {
  // 위/아래 벽 + 발사자 몸통(여기 숨어서 버티지 못하게 막는다)
  const walls = useMemo(
    () => [
      ...LASER.filter(isWall),
      {
        t: 'poly',
        pts: [
          [10, 150],
          [136, 150],
          [136, 330],
          [10, 330],
        ],
        fill: '#00b0f0',
      },
    ],
    []
  )

  const [frame, setFrame] = useState({ armY: 260, bolts: [], left: T.survive, cursor: null })
  const boltsRef = useRef([])
  const lastFireRef = useRef(0)
  const cleared = useRef(false)

  const start = { x: 300, y: 260 }
  const margin = vp.margin(T.margin)
  const boltR = vp.mobile ? T.boltR * 0.85 : T.boltR

  const { pointer, armed } = useDodgeScene({
    startPoint: start,
    onDeath,
    paused,
    armRadius: vp.target(28),
    check: (dt, t, c) => {
      // 팔 상하 왕복
      const armY = 260 + Math.sin((t / T.armPeriod) * Math.PI * 2) * 92

      // 발사
      if (t - lastFireRef.current >= T.fireInterval) {
        lastFireRef.current = t
        boltsRef.current.push({ x: 150, y: armY, id: `${t}` })
        sfx('hit')
      }
      // 이동 + 화면 밖 제거
      boltsRef.current = boltsRef.current
        .map((b) => ({ ...b, x: b.x + T.boltSpeed * dt }))
        .filter((b) => b.x < 1010)

      const left = Math.max(0, T.survive - t)
      setFrame({ armY, bolts: boltsRef.current, left, cursor: { x: c.x, y: c.y, touch: c.touch } })

      if (!cleared.current && left <= 0) {
        cleared.current = true
        sfx('clear')
        onClear()
        return false
      }

      for (const w of walls) if (insideWithMargin(c.x, c.y, w, margin)) return true
      for (const b of boltsRef.current) if (dist(c.x, c.y, b.x, b.y) <= boltR) return true
      return false
    },
  })

  const cursor = frame.cursor

  return (
    <>
      <Stage pointerRef={pointer.ref} bind={pointer.bind} background="#ffffff">
        {walls.map((w, i) => (
          <Shape key={i} s={w} />
        ))}

        {/* 발사자 — 몸통은 고정, 팔만 상하로 움직인다 */}
        <g pointerEvents="none">
          <circle cx="62" cy="189" r="44" fill="#00b0f0" />
          <rect x="21" y="224" width="88" height="98" fill="#00b0f0" />
          <line x1="70" y1="250" x2="150" y2={frame.armY} stroke="#00b0f0" strokeWidth="26" strokeLinecap="round" />
          <circle cx="150" cy={frame.armY} r="18" fill="#ff0000" />
        </g>

        {frame.bolts.map((b) => (
          <g key={b.id} pointerEvents="none">
            <line x1={b.x - 34} y1={b.y} x2={b.x} y2={b.y} stroke="#ff6b6b" strokeWidth="6" opacity="0.6" />
            <circle cx={b.x} cy={b.y} r={boltR} fill="#ff0000" />
          </g>
        ))}

        <Label x={560} y={FIELD_TOP - 40} size={20} fill="#fff" stroke="#00b0f0">
          레이저를 발사합니다 조심하세요!!! (팔도 위 아래로 움직임)
        </Label>
        <Label x={560} y={FIELD_BOTTOM + 46} size={30} fill="#fff" stroke="#00b0f0">
          {frame.left.toFixed(1)} 초 버티기
        </Label>

        <StartPad x={start.x} y={start.y} armed={armed} r={vp.target(20)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && <TazolMan x={cursor.x} y={cursor.y} scale={0.8} />}
      </Stage>
      {!armed && <ArmHint mobile={vp.mobile} />}
    </>
  )
}

/** 위/아래 벽만 장애물로 쓴다 (발사자 몸통은 따로 그린다) */
function isWall(s) {
  if (s.t !== 'poly') return false
  const ys = s.pts.map((p) => p[1])
  const xs = s.pts.map((p) => p[0])
  const wide = Math.max(...xs) - Math.min(...xs) > 700
  return wide && (Math.max(...ys) <= FIELD_TOP + 5 || Math.min(...ys) >= FIELD_BOTTOM - 5)
}
