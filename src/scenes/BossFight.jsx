import { useCallback, useEffect, useRef, useState } from 'react'
import Stage from '../ui/Stage.jsx'
import { Label } from '../ui/Shapes.jsx'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.boss

/**
 * 원작 p9~17 보스전 「붉은 눈」.
 *
 * 화면 가득한 「공격」 버튼 중 진짜는 하나뿐이다. 가짜를 누르면 즉사.
 * 진짜 버튼은 buttonMove 초마다 자리를 옮기며, 맞을 때마다 보스가 한 단계씩 부서진다.
 * 원작처럼 HP 가 줄수록 가짜 버튼이 늘어난다.
 */
export default function BossFight({ onClear, onDeath, vp, paused }) {
  const [hp, setHp] = useState(T.hp)
  const [buttons, setButtons] = useState(() => makeButtons(T.hp, vp))
  const cleared = useRef(false)
  const hpRef = useRef(hp)
  hpRef.current = hp

  // 진짜 버튼을 주기적으로 재배치 — 가만히 클릭만 하면 안 되게
  useEffect(() => {
    if (paused || cleared.current) return
    const id = setInterval(() => setButtons(makeButtons(hpRef.current, vp)), T.buttonMove * 1000)
    return () => clearInterval(id)
  }, [paused, vp])

  const press = useCallback(
    (real) => {
      if (cleared.current || paused) return
      if (!real) {
        sfx('death')
        onDeath()
        return
      }
      sfx('hit')
      const next = hp - 1
      setHp(next)
      if (next <= 0) {
        cleared.current = true
        onClear()
        return
      }
      setButtons(makeButtons(next, vp))
    },
    [hp, onClear, onDeath, paused, vp]
  )

  // 파손 단계 0(멀쩡) ~ phases-1(만신창이)
  const damage = Math.min(T.phases - 1, Math.round(((T.hp - hp) / T.hp) * (T.phases - 1)))

  return (
    <Stage background="#ffffff">
      <rect x="0" y="0" width="960" height="540" fill="#1a0000" />
      <Boss damage={damage} />

      {buttons.map((b) => (
        <AttackButton key={b.id} b={b} onPress={() => press(b.real)} r={vp.target(T.buttonR) * b.scale} />
      ))}

      <Label x={480} y={28} size={22} fill="#fff">
        진짜 「공격」은 하나뿐 — 가짜를 누르면 죽는다
      </Label>
      <HpBar hp={hp} max={T.hp} />
    </Stage>
  )
}

function Boss({ damage }) {
  const cracks = Array.from({ length: damage * 3 }, (_, i) => {
    const a = (i / Math.max(1, damage * 3)) * Math.PI * 2
    return [480 + Math.cos(a) * 40, 250 + Math.sin(a) * 40, 480 + Math.cos(a) * 150, 250 + Math.sin(a) * 150]
  })
  return (
    <g pointerEvents="none">
      <circle cx="480" cy="250" r={165 - damage * 8} fill="#c00000" />
      <ellipse cx="480" cy="250" rx={26 - damage * 2} ry={130 - damage * 10} fill="#000" />
      {cracks.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a0000" strokeWidth="6" />
      ))}
      {damage >= 4 && (
        <text x="480" y="250" fontSize="40" fill="#fff" textAnchor="middle" opacity="0.5">
          ???
        </text>
      )}
    </g>
  )
}

function HpBar({ hp, max }) {
  return (
    <g pointerEvents="none">
      <rect x="280" y="486" width="400" height="20" rx="10" fill="#3a0000" stroke="#fff" strokeWidth="2" />
      <rect x="282" y="488" width={396 * (hp / max)} height="16" rx="8" fill="#ff3b30" />
      <text x="480" y="498" fontSize="14" fill="#fff" textAnchor="middle" dominantBaseline="middle">
        BOSS {hp} / {max}
      </text>
    </g>
  )
}

/**
 * 진짜 버튼에는 아주 옅은 단서를 준다 — 미세하게 맥동하고 테두리가 조금 더 밝다.
 * 순전한 찍기(1/13 즉사)가 되지 않도록, 관찰하면 찾을 수 있는 난이도로 맞춘 것.
 */
function AttackButton({ b, onPress, r }) {
  return (
    <g onPointerDown={onPress} style={{ cursor: 'pointer' }}>
      <circle cx={b.x} cy={b.y} r={r + 10} fill="transparent" />
      <circle
        cx={b.x}
        cy={b.y}
        r={r}
        fill={b.real ? '#cc0808' : '#c00000'}
        stroke={b.real ? '#ffd9d9' : '#fff'}
        strokeWidth="2"
        opacity="0.92"
      >
        {b.real && (
          <animate attributeName="r" values={`${r};${r * 1.06};${r}`} dur="1.9s" repeatCount="indefinite" />
        )}
      </circle>
      <text
        x={b.x}
        y={b.y}
        fontSize={r * 0.5}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="800"
        pointerEvents="none"
      >
        공격
      </text>
    </g>
  )
}

/**
 * HP 가 줄수록 가짜가 늘어난다. 진짜 하나를 무작위 자리에 섞어 넣는다.
 * 버튼끼리 겹치지 않도록 격자에서 자리를 뽑는다.
 */
function makeButtons(hp, vp) {
  const fakes = Math.min(T.fakeCount, T.fakeCount - hp + 2)
  const total = Math.max(3, fakes) + 1
  const cols = 6
  const rows = 4
  const slots = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({ x: 110 + c * 148, y: 96 + r * 108 })
    }
  }
  // Fisher-Yates 로 섞어 매번 다른 배치를 만든다
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }
  const picked = slots.slice(0, Math.min(total, slots.length))
  const realIdx = Math.floor(Math.random() * picked.length)
  return picked.map((s, i) => ({
    id: `${hp}-${i}-${s.x}-${s.y}`,
    x: s.x + (Math.random() - 0.5) * 24,
    y: s.y + (Math.random() - 0.5) * 24,
    real: i === realIdx,
    scale: 0.72 + Math.random() * 0.4,
  }))
}
