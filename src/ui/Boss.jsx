/**
 * 보스 「붉은 눈」 — 보스전과 격파 컷신이 같은 그림을 쓴다.
 * damage 0(멀쩡) ~ phases-1(만신창이) 에 따라 눈이 쪼그라들고 균열이 늘어난다.
 */
export const BOSS_CX = 480
export const BOSS_CY = 250

export default function Boss({ damage }) {
  const cracks = Array.from({ length: damage * 3 }, (_, i) => {
    const a = (i / Math.max(1, damage * 3)) * Math.PI * 2
    return [
      BOSS_CX + Math.cos(a) * 40,
      BOSS_CY + Math.sin(a) * 40,
      BOSS_CX + Math.cos(a) * 150,
      BOSS_CY + Math.sin(a) * 150,
    ]
  })
  return (
    <g pointerEvents="none">
      <circle cx={BOSS_CX} cy={BOSS_CY} r={165 - damage * 8} fill="#c00000" />
      <ellipse cx={BOSS_CX} cy={BOSS_CY} rx={26 - damage * 2} ry={130 - damage * 10} fill="#000" />
      {cracks.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a0000" strokeWidth="6" />
      ))}
      {damage >= 4 && (
        <text x={BOSS_CX} y={BOSS_CY} fontSize="40" fill="#fff" textAnchor="middle" opacity="0.5">
          ???
        </text>
      )}
    </g>
  )
}
