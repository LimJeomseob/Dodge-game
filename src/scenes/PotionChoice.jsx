import { useState } from 'react'
import Stage from '../ui/Stage.jsx'
import { Label } from '../ui/Shapes.jsx'
import { RetryChoiceOverlay } from '../ui/Hud.jsx'
import { POTION_ANSWER } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

/**
 * 원작 p22 — 보라 물약 3택.
 * 정답은 config.js 의 POTION_ANSWER 한 줄로 정한다 (v4 확정: 가운데=1).
 * 오답이면 원작 p31 「다시 선택하기」 로 돌아온다.
 */
const SLOTS = [
  { x: 240, label: '왼쪽' },
  { x: 480, label: '가운데' },
  { x: 720, label: '오른쪽' },
]

export default function PotionChoice({ onClear, vp }) {
  const [wrong, setWrong] = useState(false)

  const pick = (i) => {
    if (wrong) return
    if (i === POTION_ANSWER) {
      sfx('clear')
      onClear()
    } else {
      sfx('death')
      setWrong(true)
    }
  }

  return (
    <>
      <Stage background="#0b0b12">
        <rect x="0" y="0" width="960" height="540" fill="#0b0b12" />
        <Label x={480} y={72} size={34} fill="#fff">
          살아남을 물약을 골라라
        </Label>
        <Label x={480} y={118} size={19} fill="#9a9ab0">
          하나만 진짜다
        </Label>

        {SLOTS.map((s, i) => (
          <Potion key={i} x={s.x} label={s.label} onPick={() => pick(i)} scale={vp.mobile ? 1.15 : 1} />
        ))}
      </Stage>
      {wrong && <RetryChoiceOverlay onRetry={() => setWrong(false)} />}
    </>
  )
}

function Potion({ x, label, onPick, scale }) {
  const y = 320
  return (
    <g onPointerDown={onPick} style={{ cursor: 'pointer' }} transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* 넉넉한 터치 영역 */}
      <rect x="-90" y="-150" width="180" height="280" fill="transparent" />
      <path d="M -22 -104 L -22 -60 L -52 20 A 54 54 0 0 0 52 20 L 22 -60 L 22 -104 Z" fill="#a06bff" />
      <rect x="-26" y="-118" width="52" height="20" rx="5" fill="#6b4bbf" />
      <ellipse cx="0" cy="16" rx="46" ry="24" fill="#c9a4ff" opacity="0.5" />
      <text
        x="0"
        y="112"
        fontSize="22"
        fill="#fff"
        textAnchor="middle"
        fontWeight="700"
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
}
