import { useRef, useState } from 'react'
import Stage from '../ui/Stage.jsx'
import Boss, { BOSS_CX, BOSS_CY } from '../ui/Boss.jsx'
import { Label } from '../ui/Shapes.jsx'
import useGameLoop from '../hooks/useGameLoop.js'
import { clamp } from '../engine/geometry.js'
import { TUNING } from '../data/config.js'
import { sfx } from '../audio/chiptune.js'

const T = TUNING.boss

// 연출 타임라인(초)
const SLASH_AT = 0.15 // 섬광이 지나가는 순간
const SPLIT_FROM = 0.4 // 갈라지기 시작
const SPLIT_TO = 2.5 // 다 갈라짐
const HOLD = T.splitHold // 이 시간이 지나면 자동으로 다음 씬

/** 베인 각도 — 위/아래 반쪽을 나누는 사선 */
const CUT_DEG = -20

/**
 * 보스 「붉은 눈」 격파 컷신.
 *
 * 보스전 마지막 프레임과 같은 그림에서 시작해 사선 하나로 반토막이 나고,
 * 두 조각이 어둠 속으로 멀어진다. 클릭으로 넘길 수 없고 HOLD 초 뒤 자동 진행한다.
 * 이 게임에서 시간으로 스스로 넘어가는 씬은 여기가 처음이다.
 */
export default function BossSplit({ onClear, paused }) {
  const [t, setT] = useState(0)
  const done = useRef(false)
  const slashed = useRef(false)
  const fell = useRef(false)

  useGameLoop((dt, elapsed) => {
    setT(elapsed)
    if (!slashed.current && elapsed >= SLASH_AT) {
      slashed.current = true
      sfx('hit')
    }
    if (!fell.current && elapsed >= SPLIT_TO) {
      fell.current = true
      sfx('glitch')
    }
    if (!done.current && elapsed >= HOLD) {
      done.current = true
      onClear()
    }
  }, !paused)

  // 갈라지는 진행도 — 처음엔 빠르게 벌어졌다가 서서히 멎는다
  const p = clamp((t - SPLIT_FROM) / (SPLIT_TO - SPLIT_FROM), 0, 1)
  const e = 1 - Math.pow(1 - p, 3)
  // 다 갈라진 뒤에도 아주 느리게 계속 벌어진다 (남은 시간이 정지 화면이 되지 않게)
  const drift = Math.max(0, t - SPLIT_TO) * 4
  const gap = e * 58 + drift
  const flash = clamp(1 - t / 0.45, 0, 1)
  // 조각은 어둠에 잠기되 완전히 사라지지는 않는다
  const fade = clamp((t - SPLIT_TO) / 4.5, 0, 1) * 0.55
  const left = Math.max(0, Math.ceil(HOLD - t))

  return (
    <Stage background="#ffffff">
      <rect x="0" y="0" width="960" height="540" fill="#1a0000" />

      <defs>
        {/* 사선을 경계로 위 반쪽 / 아래 반쪽 */}
        <clipPath id="bs-upper">
          <rect
            x="-700"
            y="-700"
            width="2400"
            height={700 + BOSS_CY}
            transform={`rotate(${CUT_DEG} ${BOSS_CX} ${BOSS_CY})`}
          />
        </clipPath>
        <clipPath id="bs-lower">
          <rect
            x="-700"
            y={BOSS_CY}
            width="2400"
            height="1200"
            transform={`rotate(${CUT_DEG} ${BOSS_CX} ${BOSS_CY})`}
          />
        </clipPath>
      </defs>

      {/* 같은 보스를 두 번 그리고, 각각 반쪽만 남겨 서로 반대로 밀어낸다 */}
      <g opacity={1 - fade} transform="translate(0 34)">
        {/* 벌어진 틈 사이로 보이는 단면 */}
        {p > 0 && (
          <line
            x1={BOSS_CX - 170}
            y1={BOSS_CY}
            x2={BOSS_CX + 170}
            y2={BOSS_CY}
            transform={`rotate(${CUT_DEG} ${BOSS_CX} ${BOSS_CY})`}
            stroke="#ff3b30"
            strokeWidth={2 + e * 5}
            opacity="0.85"
            pointerEvents="none"
          />
        )}
        <g
          clipPath="url(#bs-upper)"
          transform={`translate(${-gap * 0.45} ${-gap * 0.8}) rotate(${-e * 7} ${BOSS_CX} ${BOSS_CY})`}
        >
          <Boss damage={T.phases - 1} />
        </g>
        <g
          clipPath="url(#bs-lower)"
          transform={`translate(${gap * 0.45} ${gap * 0.8}) rotate(${e * 8} ${BOSS_CX} ${BOSS_CY})`}
        >
          <Boss damage={T.phases - 1} />
        </g>
      </g>

      {/* 베고 지나간 섬광 */}
      {flash > 0 && (
        <g pointerEvents="none" opacity={flash}>
          <rect x="0" y="0" width="960" height="540" fill="#fff" opacity={flash * 0.35} />
          <line
            x1="-40"
            y1={BOSS_CY}
            x2="1000"
            y2={BOSS_CY}
            transform={`rotate(${CUT_DEG} ${BOSS_CX} ${BOSS_CY})`}
            stroke="#fff"
            strokeWidth="8"
          />
        </g>
      )}

      <Label x={480} y={42} size={34} fill="#fff" stroke="#1a0000">
        보스를 쓰러뜨렸다
      </Label>
      <Label x={480} y={492} size={22} fill="#ff9c9c" stroke="#1a0000">
        …반으로 갈라졌다
      </Label>
      <Label x={480} y={522} size={19} fill="#fff" stroke="#1a0000">
        {left} 초 후 다음 스테이지로
      </Label>
    </Stage>
  )
}
