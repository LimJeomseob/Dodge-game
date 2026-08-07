import { useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Shapes, Label, StartPad, CircleButton } from '../ui/Shapes.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { hitsAny, dist } from '../engine/geometry.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

/** 원작 p3 — 연습용. 벽 3개만 있는 넓은 방. 원작 난이도 그대로 관대하게. */
const WALLS = [
  { t: 'poly', pts: [[0, 0], [960, 0], [960, 26], [0, 26]], fill: '#385723' },
  { t: 'poly', pts: [[0, 514], [960, 514], [960, 540], [0, 540]], fill: '#385723' },
  { t: 'poly', pts: [[300, 90], [352, 90], [352, 430], [300, 430]], fill: '#385723' },
  { t: 'poly', pts: [[560, 110], [612, 110], [612, 450], [560, 450]], fill: '#385723' },
]

const EXIT = { x: 878, y: 270 }

export default function Tutorial({ onClear, onDeath, vp, paused }) {
  const [cursor, setCursor] = useState(null)
  const cleared = useRef(false)

  const { pointer, armed, start, showHint } = useDodgeScene({
    shapes: WALLS,
    startRegion: [0.03, 0.15, 0.22, 0.85],
    onDeath,
    paused,
    armRadius: vp.target(30),
    check: (dt, t, c) => {
      setCursor({ x: c.x, y: c.y, touch: c.touch })
      if (!cleared.current && dist(c.x, c.y, EXIT.x, EXIT.y) <= vp.target(TUNING.maze.exitRadius)) {
        cleared.current = true
        sfx('clear')
        onClear()
        return false
      }
      return !!hitsAny(c.x, c.y, WALLS, vp.margin(TUNING.maze.margin + 4))
    },
  })

  return (
    <>
      <Stage pointerRef={pointer.ref} bind={pointer.bind} background="#ffffff">
        <Shapes list={WALLS} />
        <Label x={480} y={62} size={30} fill="#385723">
          튜토리얼 — 도형을 피하면 됌 ㅋㅋㅋㅋㅋㅋㅋㅋ
        </Label>
        <CircleButton x={EXIT.x} y={EXIT.y} r={vp.target(TUNING.maze.exitRadius)} label="출구" pulse />
        <StartPad x={start.x} y={start.y} armed={armed} r={vp.target(22)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && <TazolMan x={cursor.x} y={cursor.y} />}
      </Stage>
      {showHint && <ArmHint mobile={vp.mobile} />}
    </>
  )
}
