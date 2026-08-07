import { useState } from 'react'
import Stage, { TazolMan } from '../ui/Stage.jsx'
import { Label } from '../ui/Shapes.jsx'
import { sfx } from '../audio/chiptune.js'

/**
 * 원작 p21 / p23~29 공용 컷신 엔진.
 * data/cutscenes.js 의 스텝 배열을 「넘기기」로 한 장씩 넘긴다.
 */
export default function Cutscene({ seq, onClear }) {
  const [i, setI] = useState(0)
  const step = seq[i]

  const next = () => {
    sfx(step.villain ? 'glitch' : 'click')
    if (i + 1 >= seq.length) onClear()
    else setI(i + 1)
  }

  const shake = step.shake || 0
  const shadow = step.shadow || 0

  return (
    <Stage background={step.bg || '#0b0b12'}>
      <rect x="0" y="0" width="960" height="540" fill={step.bg || '#0b0b12'} />

      {/* 화면 흔들림 — transform 으로 전체를 살짝 어긋나게 */}
      <g transform={`translate(${(Math.random() - 0.5) * shake * 12} ${(Math.random() - 0.5) * shake * 12})`}>
        {/* 다가오는 그림자 */}
        {shadow > 0 && (
          <g pointerEvents="none">
            <ellipse
              cx={960 - shadow * 480}
              cy="300"
              rx={120 + shadow * 260}
              ry={180 + shadow * 200}
              fill="#000"
              opacity={0.5 + shadow * 0.5}
            />
            {shadow > 0.5 && (
              <>
                <circle cx={960 - shadow * 480 - 40} cy="250" r="16" fill="#ff2d55" />
                <circle cx={960 - shadow * 480 + 40} cy="250" r="16" fill="#ff2d55" />
              </>
            )}
          </g>
        )}

        {/* 치료 이펙트 */}
        {step.heal > 0 && (
          <circle cx="440" cy="300" r={60 + step.heal * 80} fill="#a06bff" opacity={0.25 * step.heal} />
        )}

        <TazolMan
          x={440}
          y={300}
          scale={3.4}
          color={step.villain ? '#ff2d55' : '#fff'}
          glitch={step.glitch || 0}
        />
      </g>

      {step.text && (
        <>
          <rect x="90" y="404" width="780" height="96" rx="14" fill="#000" opacity="0.72" />
          <Label
            x={480}
            y={452}
            size={step.big ? 44 : 30}
            fill={step.villain ? '#ff2d55' : '#fff'}
          >
            {step.text}
          </Label>
        </>
      )}

      {/* 원작의 「넘기기」 버튼 */}
      <g onPointerDown={next} style={{ cursor: 'pointer' }}>
        <rect x="756" y="24" width="176" height="60" rx="12" fill="#fff" opacity="0.9" />
        <Label x={844} y={54} size={26} fill="#111">
          넘기기
        </Label>
      </g>

      <Label x={64} y={54} size={16} fill="#888" anchor="start">
        {i + 1} / {seq.length}
      </Label>
    </Stage>
  )
}
