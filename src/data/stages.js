// 추출 데이터에 게임 규칙을 입히는 손수 작성 설정.
// (maps.js 는 자동 생성이므로 규칙은 여기 따로 둔다.)

export const WALL_GREEN = '#385723'
export const PAD_BLUE = '#00b0f0'

/**
 * 미로 3맵 설정.
 *   start   — 출발 지점(고정). null 이면 startRegion 안에서 가장 안전한 곳을 자동 탐색.
 *   exit    — 도착 지점.
 *   movers  — 왕복 이동시킬 도형 인덱스와 축.
 */
export const MAZE_CONFIG = [
  {
    // p4 — 출구는 화면 왼쪽 가운데 파란 원
    exit: { x: 243.1, y: 331.3 },
    start: null,
    startRegion: [0.62, 0.62, 0.94, 0.9],
    movers: [
      { i: 4, axis: 'y', range: 90 },
      { i: 5, axis: 'y', range: 70 },
    ],
  },
  {
    // p5 — 출구는 왼쪽 아래 모서리
    exit: { x: 36.8, y: 498.7 },
    start: null,
    startRegion: [0.55, 0.1, 0.95, 0.45],
    movers: [
      { i: 4, axis: 'x', range: 80 },
      { i: 9, axis: 'x', range: 70 },
    ],
  },
  {
    // p6 — 왼쪽 파란 원 사다리를 타고 위로. 아래 원에서 출발해 맨 위 원이 출구.
    exit: { x: 65.2, y: 51.0 },
    // 파란 원들은 왼쪽 벽(x<58) 위에 겹쳐 그려져 있다. 실제로 지나갈 수 있는 길은
    // 벽 바로 오른쪽 x≈80~130 의 세로 통로이므로 출발점을 그쪽으로 잡는다.
    start: { x: 96, y: 500 },
    startRegion: [0.08, 0.85, 0.16, 0.98],
    movers: [
      { i: 6, axis: 'x', range: 70 },
      { i: 11, axis: 'x', range: 60 },
    ],
  },
]
