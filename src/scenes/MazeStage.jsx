import { useMemo, useRef, useState } from 'react'
import Stage, { TazolMan, TouchLeash } from '../ui/Stage.jsx'
import { Shape, Label, StartPad, CircleButton } from '../ui/Shapes.jsx'
import { ArmHint } from '../ui/Hud.jsx'
import useDodgeScene from './useDodgeScene.js'
import { insideWithMargin, dist } from '../engine/geometry.js'
import { MAZES } from '../data/maps.js'
import { MAZE_CONFIG, PAD_BLUE } from '../data/stages.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

/** 원작 p4~6 「다음으로 가는 길」 — 초록 도형을 피해 파란 출구까지. */
export default function MazeStage({ mapIndex, onClear, onDeath, vp, paused }) {
  const cfg = MAZE_CONFIG[mapIndex]
  const raw = MAZES[mapIndex]

  // 초록 도형 = 벽(사망), 파란 원 = 이정표(안전)
  const { walls, pads } = useMemo(() => {
    const walls = []
    const pads = []
    raw.forEach((s) => (s.fill === PAD_BLUE ? pads : walls).push(s))
    return { walls, pads }
  }, [raw])

  const movers = cfg.movers.filter((m) => m.i < walls.length)
  const [offsets, setOffsets] = useState(() => movers.map(() => ({ dx: 0, dy: 0 })))
  const [cursor, setCursor] = useState(null)
  const cleared = useRef(false)

  const exitR = vp.target(TUNING.maze.exitRadius)
  const margin = vp.margin(TUNING.maze.margin)

  const { pointer, armed, start } = useDodgeScene({
    shapes: walls,
    startRegion: cfg.startRegion,
    startPoint: cfg.start,
    onDeath,
    paused,
    armRadius: vp.target(30),
    check: (dt, t, c) => {
      // 왕복 도형 위치 갱신 (sin 파라서 좌표가 부드럽게 왕복한다)
      const next = movers.map((m) => {
        const phase = Math.sin((t * TUNING.maze.moverSpeed) / m.range + m.i)
        const d = phase * m.range
        return m.axis === 'x' ? { dx: d, dy: 0 } : { dx: 0, dy: d }
      })
      setOffsets(next)
      setCursor({ x: c.x, y: c.y, touch: c.touch })

      if (!cleared.current && dist(c.x, c.y, cfg.exit.x, cfg.exit.y) <= exitR) {
        cleared.current = true
        sfx('clear')
        onClear()
        return false
      }

      for (let i = 0; i < walls.length; i++) {
        const mi = movers.findIndex((m) => m.i === i)
        const off = mi >= 0 ? next[mi] : { dx: 0, dy: 0 }
        // 도형을 움직이는 대신 커서를 반대로 옮겨 판정한다 (폴리곤 복사 불필요)
        if (insideWithMargin(c.x - off.dx, c.y - off.dy, walls[i], margin)) return true
      }
      return false
    },
  })

  const startPos = start

  return (
    <>
      <Stage pointerRef={pointer.ref} bind={pointer.bind} background="#ffffff">
        {walls.map((s, i) => {
          const mi = movers.findIndex((m) => m.i === i)
          const off = mi >= 0 ? offsets[mi] : { dx: 0, dy: 0 }
          return (
            <g key={i} transform={`translate(${off.dx} ${off.dy})`} pointerEvents="none">
              <Shape s={s} />
            </g>
          )
        })}

        {/* 출구가 아닌 파란 원은 길 안내용 발판 */}
        {pads.map((p, i) =>
          dist(p.cx, p.cy, cfg.exit.x, cfg.exit.y) < 2 ? null : (
            <circle key={i} cx={p.cx} cy={p.cy} r={p.r * 0.55} fill={PAD_BLUE} opacity="0.35" />
          )
        )}

        <Label x={480} y={26} size={22} fill="#fff" stroke="#385723">
          {mapIndex + 1} · 다음으로 가는 길
        </Label>

        <CircleButton x={cfg.exit.x} y={cfg.exit.y} r={exitR} label="다음" pulse />
        <StartPad x={startPos.x} y={startPos.y} armed={armed} r={vp.target(20)} />
        <TouchLeash p={pointer.pos} />
        {armed && cursor && <TazolMan x={cursor.x} y={cursor.y} />}
      </Stage>
      {!armed && <ArmHint mobile={vp.mobile} />}
    </>
  )
}
