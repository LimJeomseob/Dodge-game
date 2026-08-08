import { Shapes } from './Shapes.jsx'

/**
 * 3 스테이지에 등장하는 캐릭터들.
 *
 * 원작 그림처럼 파란 면 + 얇은 검은 외곽선의 도형 덩어리로 짰다.
 * 원형 머리 하나, 몸통 막대, 각도가 제각각인 팔·다리 사각형.
 *
 * 두 자세가 있다.
 *  - Chaser  : 가로로 뻗어 뒤뚱거리며 다가오는 추격자 (판정 원)
 *  - Shooter : 레이저 씬 왼쪽에서 팔을 휘두르며 쏘는 발사자 (판정 사각형)
 * 둘 다 같은 그림체지만 자세가 달라 화면에서 헷갈리지 않는다.
 */
const SKIN = { fill: '#00b0f0', stroke: '#1b1b1b', strokeWidth: 1.2 }

/**
 * 좌표는 (0,0) 을 판정 중심으로 삼는 로컬 좌표계이고, 반지름 CORE 를
 * 실제 판정 반경 r 에 맞춰 통째로 확대·축소한다. 원작 그림은 가로로 훨씬
 * 길게 뻗어 있지만, 판정이 원이라 그대로 옮기면 "닿지도 않았는데 죽었다" 는
 * 느낌이 난다. 그래서 구도만 살리고 가로세로 비를 줄여 원형 판정과 맞췄다.
 */
const CORE = 40

const CHASER_PARTS = [
  // 머리
  { t: 'circle', cx: -32, cy: -24, r: 15 },
  // 위로 치켜든 팔
  { t: 'poly', pts: [[-18, -32], [6, -24], [0, -8], [-24, -16]] },
  // 왼쪽 어깨 덩어리
  { t: 'poly', pts: [[-48, -12], [-26, -6], [-32, 12], [-50, 6]] },
  // 몸통 — 오른쪽으로 길게 뻗은 막대
  { t: 'poly', pts: [[-34, -8], [46, -3], [46, 13], [-34, 8]] },
  // 오른쪽 아래로 뻗은 큰 다리
  { t: 'poly', pts: [[2, 10], [34, -4], [44, 10], [14, 28]] },
  // 왼쪽 다리 둘
  { t: 'poly', pts: [[-42, 10], [-24, 14], [-32, 34], [-48, 29]] },
  { t: 'poly', pts: [[-22, 12], [-6, 15], [-14, 34], [-30, 31]] },
]

export function Chaser({ x, y, r = CORE, phase = 0, opacity = 1 }) {
  if (x == null) return null
  const k = r / CORE
  // 뒤뚱거리며 다가오는 느낌 — 좌우로 조금씩 기운다
  const tilt = Math.sin(phase) * 6
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${tilt}) scale(${k})`}
      opacity={opacity}
      pointerEvents="none"
    >
      <Shapes list={CHASER_PARTS} {...SKIN} />
      {/* 타졸맨과 같은 규약 — 어디가 닿는지 보이게 판정 중심을 찍어 둔다 */}
      <circle cx="0" cy="0" r={3 / k} fill="#ff2d55" />
    </g>
  )
}

/**
 * 발사자의 서 있는 몸통. 로컬 좌표 x -28..24 / y -53..50, (0,0) 이 몸통 중심.
 *
 * 쏘는 팔은 여기 없다 — 팔은 매 프레임 각도가 바뀌고 탄 생성 위치와 묶여 있어
 * Laser 씬에서 직접 그린다(SHOULDER 참고).
 */
const SHOOTER_PARTS = [
  // 머리
  { t: 'circle', cx: -1, cy: -38, r: 15 },
  // 몸통 — 살짝 기운 막대
  { t: 'poly', pts: [[-16, -22], [17, -25], [20, 20], [-13, 22]] },
  // 노는 왼팔
  { t: 'poly', pts: [[-17, -19], [-27, -15], [-19, 14], [-9, 10]] },
  // 다리 둘 — 각도를 달리해 버티고 선 느낌
  { t: 'poly', pts: [[-12, 19], [2, 22], [-3, 50], [-17, 46]] },
  { t: 'poly', pts: [[6, 21], [19, 18], [23, 46], [10, 50]] },
]

/** 쏘는 팔이 붙는 오른쪽 어깨 — 로컬 좌표 */
export const SHOOTER_SHOULDER = { x: 14, y: -18 }

export function Shooter({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} pointerEvents="none">
      <Shapes list={SHOOTER_PARTS} {...SKIN} />
    </g>
  )
}
