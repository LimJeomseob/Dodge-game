import { STAGE_W, STAGE_H } from '../data/maps.js'

/**
 * 모든 씬의 공통 무대. 960x540 좌표계를 화면 크기에 맞춰 letterbox 로 채운다.
 * viewBox + preserveAspectRatio 덕분에 데스크톱·모바일·가로/세로 어디서든
 * 원작 슬라이드 비율이 깨지지 않는다.
 */
export default function Stage({ pointerRef, bind, background = '#ffffff', children, className = '' }) {
  return (
    <svg
      ref={pointerRef}
      className={`stage ${className}`}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ background }}
      {...bind}
    >
      {children}
    </svg>
  )
}

/** 플레이어 캐릭터 「타졸맨」 — 커서 위치에 그려지는 졸라맨 형태 */
export function TazolMan({ x, y, scale = 1, color = '#000', glitch = 0 }) {
  if (x == null) return null
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} pointerEvents="none">
      <circle cx="0" cy="-16" r="8" fill="none" stroke={color} strokeWidth="3" />
      <line x1="0" y1="-8" x2="0" y2="8" stroke={color} strokeWidth="3" />
      <line x1="-9" y1="-2" x2="9" y2="-2" stroke={color} strokeWidth="3" />
      <line x1="0" y1="8" x2="-8" y2="20" stroke={color} strokeWidth="3" />
      <line x1="0" y1="8" x2="8" y2="20" stroke={color} strokeWidth="3" />
      {glitch > 0 && (
        <g opacity="0.9">
          {Array.from({ length: Math.round(glitch * 6) }, (_, i) => (
            <rect
              key={i}
              x={-10 + ((i * 7) % 20)}
              y={-22 + ((i * 11) % 40)}
              width={6 + (i % 3) * 3}
              height={4}
              fill={['#0070c0', '#70ad47', '#7f7f7f', '#002060'][i % 4]}
            />
          ))}
        </g>
      )}
      {/* 정확한 판정 지점 표시 — 어디가 닿는지 알아야 공정하다 */}
      <circle cx="0" cy="0" r="2.5" fill="#ff2d55" />
    </g>
  )
}

/**
 * 터치용: 손가락 위치(fx,fy)와 실제 판정 지점(x,y)을 잇는 안내선.
 * 좌표는 usePointer 가 화면 회전까지 반영해 계산하므로 세로 화면에서도 방향이 맞는다.
 */
export function TouchLeash({ p }) {
  if (!p || !p.touch || !p.active) return null
  return (
    <g pointerEvents="none" opacity="0.4">
      <line x1={p.x} y1={p.y} x2={p.fx} y2={p.fy} stroke="#ff2d55" strokeWidth="2" strokeDasharray="5 5" />
      <circle cx={p.fx} cy={p.fy} r="16" fill="none" stroke="#ff2d55" strokeWidth="2" />
    </g>
  )
}

export { STAGE_W, STAGE_H }
