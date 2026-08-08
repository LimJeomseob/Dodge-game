import { useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Label, StartPad } from '../ui/Shapes.jsx'
import Chaser from '../ui/Chaser.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { dist, stepToward } from '../engine/geometry.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.ice
const TC = TUNING.chaser

/**
 * 얼음이 튀어나올 자리 — 화면 네 귀퉁이.
 * 매번 커서에서 가장 먼 귀퉁이를 고르므로(직전에 쓴 곳은 제외) 어디에 서 있든
 * 최소 400px 쯤 떨어진 곳에서 나타난다. 그 자리에 서 있다가 몸 위에 튀어나와
 * 즉사하는 일이 없어야 하기 때문이다.
 */
const ICE_SPAWNS = [
  { x: 60, y: 60 },
  { x: 900, y: 60 },
  { x: 60, y: 480 },
  { x: 900, y: 480 },
]

/** 추격 캐릭터는 화면 밖 네 방향 중 커서에서 가장 먼 쪽에서 걸어 들어온다 */
const CHASER_SPAWNS = [
  { x: 480, y: -70 },
  { x: 480, y: 610 },
  { x: -70, y: 270 },
  { x: 1030, y: 270 },
]
const CHASER_BOX = [-70, -70, 1030, 610]

/**
 * 원작 p20 「얼음」 추격.
 *
 * 얼음은 하나로 시작해 spawnInterval 초마다 하나씩, 최대 maxIce 개까지 늘어난다.
 * 여기에 추격 캐릭터가 화면 밖에서 걸어 들어와 따라붙는다. survive 초를 버티면 추격이 멈추고,
 * 화면에 나타난 얼굴을 클릭해야 진짜로 끝난다.
 */
export default function IceChase({ onClear, onDeath, vp, paused }) {
  const [frame, setFrame] = useState({ ice: [], chaser: null, left: T.survive, cursor: null })
  const [phase, setPhase] = useState('run') // run → face
  const iceRef = useRef([])
  const lastSpawn = useRef(-1)
  const chaserRef = useRef(null)
  const phaseRef = useRef('run')
  const cleared = useRef(false)

  const start = { x: 480, y: 270 }
  const iceR = vp.mobile ? T.iceR * 0.85 : T.iceR
  const chaserR = vp.mobile ? TC.r * 0.85 : TC.r
  const faceR = vp.target(T.faceR)

  const { pointer, armed, showHint } = useDodgeScene({
    startPoint: start,
    onDeath,
    paused,
    armRadius: vp.target(30),
    check: (dt, t, c) => {
      if (phaseRef.current === 'face') {
        setFrame((f) => ({ ...f, cursor: { x: c.x, y: c.y, touch: c.touch } }))
        return false
      }

      // 시간이 지날수록 얼음이 하나씩 늘어난다 (t=0 에 1개, 5초마다 +1, 최대 3개)
      const want = Math.min(T.maxIce, 1 + Math.floor(t / T.spawnInterval))
      while (iceRef.current.length < want) {
        iceRef.current = [...iceRef.current, pickSpawn(lastSpawn, c)]
      }

      // 각 얼음이 커서를 향해 등속으로 다가온다 (속도차를 둬 뭉치지 않게)
      const speeds = [1, 0.88, 1.12]
      iceRef.current = iceRef.current.map((p, i) =>
        stepToward(p, c.x, c.y, T.chaseSpeed * speeds[i % speeds.length] * dt)
      )

      // 추격 캐릭터는 조금 늦게 등장해 얼음이 하나뿐인 초반을 메운다
      if (!chaserRef.current && t >= TC.delay) chaserRef.current = { ...farthest(CHASER_SPAWNS, c) }
      if (chaserRef.current) {
        chaserRef.current = stepToward(chaserRef.current, c.x, c.y, TC.speed * dt, CHASER_BOX)
      }
      // 걸어 들어오는 동안은 아직 판정이 없다
      const chaserLive = chaserRef.current && t >= TC.delay + TC.grace

      const left = Math.max(0, T.survive - t)
      setFrame({
        ice: iceRef.current,
        chaser: chaserRef.current && { ...chaserRef.current, phase: t * 5, live: chaserLive },
        left,
        cursor: { x: c.x, y: c.y, touch: c.touch },
      })

      if (left <= 0) {
        phaseRef.current = 'face'
        setPhase('face')
        sfx('clear')
        return false
      }

      for (const p of iceRef.current) if (dist(c.x, c.y, p.x, p.y) <= iceR) return true
      if (chaserLive && dist(c.x, c.y, chaserRef.current.x, chaserRef.current.y) <= chaserR) return true
      return false
    },
  })

  const clickFace = () => {
    if (cleared.current) return
    cleared.current = true
    sfx('clear')
    onClear()
  }

  const cursor = frame.cursor

  return (
    <>
      <Stage pointerRef={pointer.ref} bind={pointer.bind} background="#ffffff">
        <rect x="0" y="0" width="960" height="540" fill="#eaf4fb" />

        {phase === 'run' ? (
          <>
            {frame.ice.map((p, i) => (
              <Ice key={i} x={p.x} y={p.y} r={iceR} />
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
            <Label x={480} y={40} size={30} fill="#0070c0">
              얼음 {frame.ice.length}/{T.maxIce}! {frame.left.toFixed(1)} 초 버티기
            </Label>
          </>
        ) : (
          <>
            <Label x={480} y={60} size={26} fill="#0070c0">
              멈췄다… 얼굴을 클릭해!
            </Label>
            <g onPointerDown={clickFace} style={{ cursor: 'pointer' }}>
              <circle cx="480" cy="290" r={faceR + 16} fill="transparent" />
              <circle cx="480" cy="290" r={faceR} fill="#00b0f0" stroke="#fff" strokeWidth="4">
                <animate
                  attributeName="r"
                  values={`${faceR};${faceR * 1.06};${faceR}`}
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={480 - faceR * 0.35} cy={290 - faceR * 0.2} r={faceR * 0.12} fill="#000" />
              <circle cx={480 + faceR * 0.35} cy={290 - faceR * 0.2} r={faceR * 0.12} fill="#000" />
              <path
                d={`M ${480 - faceR * 0.4} ${290 + faceR * 0.35} Q 480 ${290 + faceR * 0.65} ${
                  480 + faceR * 0.4
                } ${290 + faceR * 0.35}`}
                stroke="#000"
                strokeWidth="6"
                fill="none"
              />
            </g>
          </>
        )}

        <StartPad x={start.x} y={start.y} armed={armed} r={vp.target(22)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && phase === 'run' && <TazolMan x={cursor.x} y={cursor.y} />}
      </Stage>
      {showHint && <ArmHint mobile={vp.mobile} />}
    </>
  )
}

/** 후보 중 커서에서 가장 먼 지점 — 몸 위에 튀어나와 죽는 일이 없게 */
function farthest(list, c) {
  let best = list[0]
  let bestD = -1
  for (const s of list) {
    const d = dist(s.x, s.y, c.x, c.y)
    if (d > bestD) {
      bestD = d
      best = s
    }
  }
  return best
}

/** 직전에 쓴 귀퉁이를 빼고, 커서에서 가장 먼 귀퉁이를 고른다 */
function pickSpawn(lastIdx, c) {
  const free = ICE_SPAWNS.map((s, i) => ({ ...s, i })).filter((s) => s.i !== lastIdx.current)
  const spot = farthest(free, c)
  lastIdx.current = spot.i
  return { x: spot.x, y: spot.y }
}

function Ice({ x, y, r }) {
  return (
    <g pointerEvents="none" transform={`translate(${x} ${y})`}>
      {/* 새로 나타난 얼음은 잠깐 반짝이며 들어온다 — 갑자기 튀어나오지 않게 */}
      <animate attributeName="opacity" from="0" to="1" dur="0.35s" fill="freeze" />
      <polygon
        points={`0,${-r} ${r * 0.86},${-r * 0.5} ${r * 0.86},${r * 0.5} 0,${r} ${-r * 0.86},${r * 0.5} ${
          -r * 0.86
        },${-r * 0.5}`}
        fill="#bdd7ee"
        stroke="#0070c0"
        strokeWidth="3"
      />
      <text x="0" y="2" fontSize={r * 0.5} fill="#0070c0" textAnchor="middle" dominantBaseline="middle">
        얼음
      </text>
    </g>
  )
}
