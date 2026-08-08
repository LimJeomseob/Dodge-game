import { useMemo, useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Shape, Label, StartPad } from '../ui/Shapes.jsx'
import { Chaser, Shooter, SHOOTER_SHOULDER } from '../ui/Character.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { insideWithMargin, dist, stepToward } from '../engine/geometry.js'
import { LASER } from '../data/maps.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.laser
const TC = TUNING.chaser

// 추출 도형 중 위/아래 벽 (y 로 판별)
const FIELD_TOP = 148
const FIELD_BOTTOM = 374

/**
 * 추격 캐릭터는 오른쪽 화면 밖에서 걸어 들어온다.
 * 이 필드는 왼쪽이 발사자로 막혀 있어 들어올 방향이 하나뿐이다. 그래서 자리를
 * 고르는 대신, 플레이어가 오른쪽 끝에 붙어 있는 동안에는 등장을 미룬다 —
 * 코앞에서 튀어나오면 피할 방법이 없다.
 */
const CHASER_SPAWN = { x: 1030, y: 260 }
const CHASER_SPAWN_MAX_X = 760

/**
 * 발사자가 서 있는 자리 — 여기 안으로는 들어갈 수 없다(숨어서 버티지 못하게).
 *
 * 판정은 캐릭터 실루엣이 아니라 사각형이다. 팔다리 사이 틈새로 파고들 수 있으면
 * 어디까지가 죽는 곳인지 눈으로 가늠할 수 없다. 대신 캐릭터를 이 사각형을 채우는
 * 크기로 그려서 "그림도 없는 빈 데서 죽었다" 는 느낌이 나지 않게 했다.
 * 면을 옅게 칠하는 것도 같은 이유 — 파란 캐릭터가 배경에 묻히지 않게.
 */
const EMITTER_BOX = {
  t: 'poly',
  pts: [[10, 150], [136, 150], [136, 330], [10, 330]],
  fill: '#cbe9f7',
  stroke: '#1b1b1b',
  strokeWidth: 1.5,
}
// scale 1.7 이면 머리 끝~발끝(로컬 ±53)이 위 사각형 안에 딱 들어간다
const SHOOTER_AT = { x: 73, y: 240, scale: 1.7 }
const MUZZLE_X = 150
// 쏘는 팔이 붙는 어깨 — 캐릭터 로컬 좌표를 스테이지 좌표로 옮긴다
const SHOULDER = {
  x: SHOOTER_AT.x + SHOOTER_SHOULDER.x * SHOOTER_AT.scale,
  y: SHOOTER_AT.y + SHOOTER_SHOULDER.y * SHOOTER_AT.scale,
}

/**
 * 원작 p19 「캐릭터가 레이저를 발사합니다 조심하세요!!! (추신: 팔도 위 아래로 움직임)」.
 *
 * 왼쪽 캐릭터의 팔이 상하로 왕복하고, 팔 끝에서 레이저가 오른쪽으로 날아온다.
 * 거기에 추격 캐릭터가 오른쪽에서 들어와 따라붙는다 — 탄을 피하면서 도망쳐야 한다.
 * 위아래 벽 사이 좁은 필드에서 survive 초를 버티면 통과.
 */
export default function Laser({ onClear, onDeath, vp, paused }) {
  // 위/아래 벽 + 발사자가 서 있는 자리
  const walls = useMemo(() => [...LASER.filter(isWall), EMITTER_BOX], [])

  const [frame, setFrame] = useState({ armY: 260, bolts: [], chaser: null, left: T.survive, cursor: null })
  const boltsRef = useRef([])
  const lastFireRef = useRef(0)
  const chaserRef = useRef(null)
  const cleared = useRef(false)

  const start = { x: 300, y: 260 }
  const margin = vp.margin(T.margin)
  const boltR = vp.mobile ? T.boltR * 0.85 : T.boltR
  const chaserR = vp.mobile ? TC.r * 0.85 : TC.r
  // 발사자 몸통(x<136) 과 위/아래 벽 안으로는 들어가지 못하게 가둔다
  const chaserBox = [150, FIELD_TOP + chaserR, CHASER_SPAWN.x, FIELD_BOTTOM - chaserR]

  const { pointer, armed, showHint } = useDodgeScene({
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
        boltsRef.current.push({ x: MUZZLE_X, y: armY, id: `${t}` })
        sfx('hit')
      }
      // 이동 + 화면 밖 제거
      boltsRef.current = boltsRef.current
        .map((b) => ({ ...b, x: b.x + T.boltSpeed * dt }))
        .filter((b) => b.x < 1010)

      // 추격 캐릭터 — 조금 늦게 들어와 필드 안에서만 따라붙는다
      if (!chaserRef.current && t >= TC.delay && c.x <= CHASER_SPAWN_MAX_X) {
        chaserRef.current = { ...CHASER_SPAWN, bornAt: t }
      }
      if (chaserRef.current) {
        chaserRef.current = stepToward(chaserRef.current, c.x, c.y, TC.speed * dt, chaserBox)
      }
      // 걸어 들어오는 동안은 아직 판정이 없다
      const chaserLive = chaserRef.current && t >= chaserRef.current.bornAt + TC.grace

      const left = Math.max(0, T.survive - t)
      setFrame({
        armY,
        bolts: boltsRef.current,
        chaser: chaserRef.current && { ...chaserRef.current, phase: t * 5, live: chaserLive },
        left,
        cursor: { x: c.x, y: c.y, touch: c.touch },
      })

      if (!cleared.current && left <= 0) {
        cleared.current = true
        sfx('clear')
        onClear()
        return false
      }

      for (const w of walls) if (insideWithMargin(c.x, c.y, w, margin)) return true
      for (const b of boltsRef.current) if (dist(c.x, c.y, b.x, b.y) <= boltR) return true
      if (chaserLive && dist(c.x, c.y, chaserRef.current.x, chaserRef.current.y) <= chaserR) return true
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

        {/* 발사자 캐릭터 — 몸은 고정, 쏘는 팔만 상하로 움직인다 */}
        <g pointerEvents="none">
          {/*
            팔을 몸보다 먼저 그린다 — 팔이 아래로 내려갈 때 다리를 덮어 캐릭터가
            뭉개지지 않게. 어두운 선 위에 파란 선을 겹쳐 캐릭터와 같은 외곽선을 낸다.
          */}
          <line
            x1={SHOULDER.x}
            y1={SHOULDER.y}
            x2={MUZZLE_X}
            y2={frame.armY}
            stroke="#1b1b1b"
            strokeWidth="27"
            strokeLinecap="round"
          />
          <line
            x1={SHOULDER.x}
            y1={SHOULDER.y}
            x2={MUZZLE_X}
            y2={frame.armY}
            stroke="#00b0f0"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <Shooter x={SHOOTER_AT.x} y={SHOOTER_AT.y} scale={SHOOTER_AT.scale} />
          {/* 총구는 맨 위 — 탄이 어디서 나오는지가 제일 중요하다 */}
          <circle cx={MUZZLE_X} cy={frame.armY} r="18" fill="#ff0000" stroke="#1b1b1b" strokeWidth="1.2" />
        </g>

        {frame.bolts.map((b) => (
          <g key={b.id} pointerEvents="none">
            <line x1={b.x - 34} y1={b.y} x2={b.x} y2={b.y} stroke="#ff6b6b" strokeWidth="6" opacity="0.6" />
            <circle cx={b.x} cy={b.y} r={boltR} fill="#ff0000" />
          </g>
        ))}

        {frame.chaser && (
          <Chaser
            x={frame.chaser.x}
            y={frame.chaser.y}
            r={chaserR}
            phase={frame.chaser.phase}
            opacity={frame.chaser.live ? 1 : 0.45}
          />
        )}

        <Label x={560} y={FIELD_TOP - 40} size={20} fill="#fff" stroke="#00b0f0">
          레이저를 발사합니다 조심하세요!!! (뒤에서도 쫓아옵니다)
        </Label>
        <Label x={560} y={FIELD_BOTTOM + 46} size={30} fill="#fff" stroke="#00b0f0">
          {frame.left.toFixed(1)} 초 버티기
        </Label>

        <StartPad x={start.x} y={start.y} armed={armed} r={vp.target(20)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && <TazolMan x={cursor.x} y={cursor.y} scale={0.8} />}
      </Stage>
      {showHint && <ArmHint mobile={vp.mobile} />}
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
