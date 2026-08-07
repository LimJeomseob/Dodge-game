import { useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Label, StartPad } from '../ui/Shapes.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { dist, clamp } from '../engine/geometry.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.ice

/**
 * 원작 p20 「얼음」 추격.
 *
 * 얼음 3개가 커서를 쫓아온다. survive 초를 버티면 추격이 멈추고,
 * 화면에 나타난 얼굴을 클릭해야 진짜로 끝난다.
 */
export default function IceChase({ onClear, onDeath, vp, paused }) {
  const [frame, setFrame] = useState({ ice: [], left: T.survive, cursor: null })
  const [phase, setPhase] = useState('run') // run → face
  const iceRef = useRef([
    { x: 900, y: 80 },
    { x: 900, y: 460 },
    { x: 60, y: 60 },
  ])
  const phaseRef = useRef('run')
  const cleared = useRef(false)

  const start = { x: 480, y: 270 }
  const iceR = vp.mobile ? T.iceR * 0.85 : T.iceR
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

      // 각 얼음이 커서를 향해 등속으로 다가온다 (속도차를 둬 뭉치지 않게)
      const speeds = [1, 0.88, 1.12]
      iceRef.current = iceRef.current.map((p, i) => {
        const d = dist(p.x, p.y, c.x, c.y)
        if (d < 1) return p
        const v = T.chaseSpeed * speeds[i % speeds.length] * dt
        return {
          x: clamp(p.x + ((c.x - p.x) / d) * v, 0, 960),
          y: clamp(p.y + ((c.y - p.y) / d) * v, 0, 540),
        }
      })

      const left = Math.max(0, T.survive - t)
      setFrame({ ice: iceRef.current, left, cursor: { x: c.x, y: c.y, touch: c.touch } })

      if (left <= 0) {
        phaseRef.current = 'face'
        setPhase('face')
        sfx('clear')
        return false
      }

      for (const p of iceRef.current) if (dist(c.x, c.y, p.x, p.y) <= iceR) return true
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
            <Label x={480} y={40} size={30} fill="#0070c0">
              얼음! {frame.left.toFixed(1)} 초 버티기
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

function Ice({ x, y, r }) {
  return (
    <g pointerEvents="none" transform={`translate(${x} ${y})`}>
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
