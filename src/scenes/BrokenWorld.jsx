import { useMemo, useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Label, StartPad } from '../ui/Shapes.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { insideWithMargin, dist } from '../engine/geometry.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.broken

const GLITCH_COLORS = ['#0070c0', '#70ad47', '#7f7f7f', '#002060', '#bdd7ee', '#c00000']

/**
 * 원작 p21 「고장난 세계」.
 *
 * 검은 배경 위로 색 블록이 점멸한다. 켜져 있는 블록에 닿으면 사망.
 * 블록은 두 그룹이 번갈아 켜지므로 안전한 길이 주기적으로 뒤바뀐다.
 */
export default function BrokenWorld({ onClear, onDeath, vp, paused }) {
  // 결정론적으로 배치해 매 시도마다 같은 맵을 학습할 수 있게 한다
  const blocks = useMemo(() => makeBlocks(), [])
  const [frame, setFrame] = useState({ t: 0, cursor: null })
  const cleared = useRef(false)

  const start = { x: 40, y: 500 }
  // HUD(우상단)에 가리지 않도록 한 칸 아래에 둔다
  const exit = { x: 908, y: 128 }
  const exitR = vp.target(T.exitRadius)
  const margin = vp.margin(T.margin)

  const { pointer, armed, showHint } = useDodgeScene({
    startPoint: start,
    onDeath,
    paused,
    armRadius: vp.target(26),
    check: (dt, t, c) => {
      setFrame({ t, cursor: { x: c.x, y: c.y, touch: c.touch } })

      if (!cleared.current && dist(c.x, c.y, exit.x, exit.y) <= exitR) {
        cleared.current = true
        sfx('clear')
        onClear()
        return false
      }
      for (const b of blocks) {
        if (!isOn(b, t)) continue
        if (insideWithMargin(c.x, c.y, toShape(b), margin)) return true
      }
      return false
    },
  })

  const cursor = frame.cursor

  return (
    <>
      <Stage pointerRef={pointer.ref} bind={pointer.bind} background="#050508">
        <rect x="0" y="0" width="960" height="540" fill="#050508" />

        {blocks.map((b, i) => {
          const on = isOn(b, frame.t)
          return (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill={b.fill}
              opacity={on ? 0.95 : 0.14}
              pointerEvents="none"
            />
          )
        })}

        {/* 주사선 — 세계가 고장났다는 신호 */}
        <g pointerEvents="none" opacity="0.12">
          {Array.from({ length: 27 }, (_, i) => (
            <rect key={i} x="0" y={i * 20 + ((frame.t * 40) % 20)} width="960" height="2" fill="#fff" />
          ))}
        </g>

        <Label x={480} y={26} size={22} fill="#7f7f7f">
          고장난 세계
        </Label>

        <g pointerEvents="none">
          <circle cx={exit.x} cy={exit.y} r={exitR} fill="#002060" stroke="#bdd7ee" strokeWidth="3" />
          <circle cx={exit.x} cy={exit.y} r={exitR * 0.45} fill="#bdd7ee">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.9s" repeatCount="indefinite" />
          </circle>
        </g>

        <StartPad x={start.x} y={start.y} armed={armed} r={vp.target(20)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && <TazolMan x={cursor.x} y={cursor.y} color="#fff" glitch={0.6} />}
      </Stage>
      {showHint && <ArmHint mobile={vp.mobile} />}
    </>
  )
}

/** 블록이 지금 켜져 있는지 — group 에 따라 반주기씩 어긋나게 점멸한다 */
function isOn(b, t) {
  const p = ((t + b.group * (T.blinkPeriod / 2)) % T.blinkPeriod) / T.blinkPeriod
  return p < 0.5
}

function toShape(b) {
  if (!b._shape) {
    b._shape = {
      t: 'poly',
      pts: [
        [b.x, b.y],
        [b.x + b.w, b.y],
        [b.x + b.w, b.y + b.h],
        [b.x, b.y + b.h],
      ],
      fill: b.fill,
    }
  }
  return b._shape
}

/**
 * 격자에 블록을 깔되 출발점·출구 주변은 비운다.
 * 두 그룹이 체크무늬로 번갈아 켜져 항상 지나갈 길이 하나는 남는다.
 */
function makeBlocks() {
  const cols = 10
  const rows = 6
  const cw = 960 / cols
  const ch = 540 / rows
  const out = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isStartCell = r >= rows - 1 && c <= 0
      const isExitCell = r <= 1 && c >= cols - 1
      if (isStartCell || isExitCell) continue
      // 체크무늬 그룹 + 약간의 변주로 단조로움을 깬다
      const group = (r + c + (r % 3 === 0 ? 1 : 0)) % 2
      const pad = 6 + ((r * 3 + c) % 5)
      out.push({
        x: c * cw + pad,
        y: r * ch + pad,
        w: cw - pad * 2,
        h: ch - pad * 2,
        fill: GLITCH_COLORS[(r * cols + c) % GLITCH_COLORS.length],
        group,
      })
    }
  }
  return out
}
