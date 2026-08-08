// maps.js 에서 추출한 도형 데이터를 SVG 로 그린다.

export function Shape({ s, fill, opacity = 1, ...rest }) {
  const f = fill || s.fill
  // 도형 데이터가 외곽선을 들고 있으면 그대로 쓴다 (호출부 prop 이 우선)
  const line = s.stroke ? { stroke: s.stroke, strokeWidth: s.strokeWidth ?? 1.2 } : null
  const p = { fill: f, opacity, ...line, ...rest }
  if (s.t === 'circle') return <circle cx={s.cx} cy={s.cy} r={s.r} {...p} />
  if (s.t === 'ellipse') return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...p} />
  return <polygon points={s.pts.map((pt) => pt.join(',')).join(' ')} {...p} />
}

export function Shapes({ list, fill, opacity, ...rest }) {
  return (
    <g pointerEvents="none">
      {list.map((s, i) => (
        <Shape key={i} s={s} fill={fill} opacity={opacity} {...rest} />
      ))}
    </g>
  )
}

/** 원작의 손글씨 느낌 라벨 */
export function Label({ x, y, children, size = 26, fill = '#000', anchor = 'middle', stroke }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontWeight="700"
      stroke={stroke}
      strokeWidth={stroke ? 4 : 0}
      paintOrder="stroke"
      pointerEvents="none"
      style={{ userSelect: 'none' }}
    >
      {children}
    </text>
  )
}

/** 스테이지 시작 지점 — 커서를 여기 올리면 판정이 켜진다 */
export function StartPad({ x, y, armed, r = 22 }) {
  if (armed) return null
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={r} fill="#34c759" opacity="0.9">
        <animate attributeName="r" values={`${r};${r * 1.35};${r}`} dur="1.1s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={r * 0.45} fill="#fff" />
      <text
        x={x}
        y={y - r - 12}
        fontSize="16"
        fill="#34c759"
        textAnchor="middle"
        fontWeight="800"
        stroke="#fff"
        strokeWidth="3"
        paintOrder="stroke"
      >
        시작
      </text>
    </g>
  )
}

/** 클릭 가능한 원형 버튼 (터치 타깃을 넉넉히 잡는다) */
export function CircleButton({ x, y, r, fill = '#00b0f0', label, labelSize = 20, onClick, pulse = false }) {
  return (
    <g onPointerDown={onClick} style={{ cursor: 'pointer' }}>
      {/* 보이지 않는 터치 확장 영역 — 모바일에서 누르기 쉽게 */}
      <circle cx={x} cy={y} r={r + 14} fill="transparent" />
      <circle cx={x} cy={y} r={r} fill={fill} stroke="#fff" strokeWidth="3">
        {pulse && <animate attributeName="r" values={`${r};${r * 1.12};${r}`} dur="1.2s" repeatCount="indefinite" />}
      </circle>
      {label && (
        <text
          x={x}
          y={y}
          fontSize={labelSize}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight="700"
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  )
}
