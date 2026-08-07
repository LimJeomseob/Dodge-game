/**
 * STAGE2 「죽음의 길」이 실제로 통과 가능한지 푼다.
 *
 * 회전 광선을 얹고 나니 눈으로는 통과 가능한지 판단할 수 없어서 만들었다.
 * 게임 코드(맵·충돌·설정)를 그대로 불러와, 시간축을 따라 "지금 살아서 있을 수 있는
 * 칸"의 집합을 넓혀 나간다. 커서는 순간이동할 수 없으므로 한 스텝에 최대
 * 이동거리만큼만 퍼지고, 매번 그 시각에 죽는 칸을 걷어낸다.
 * 출구 칸에 닿으면 통과 가능, 끝까지 못 닿으면 불가능이다.
 *
 * 솔버는 미래를 전부 알고 움직이므로, 여기서 "가능"이 나와도 겨우 가능한 정도라면
 * 사람에게는 불가능하다. 그래서 커서 속도를 사람이 낼 만한 값까지 낮춰 확인한다.
 *
 *   node tools/solve_eyefield.mjs                       # config.js 값 그대로
 *   node tools/solve_eyefield.mjs 0.68 120              # 커서 120px/s 로
 *   node tools/solve_eyefield.mjs 0.68 200 5 460 6 12   # 광선 후보값 실험
 *     인자: shrink 속도 광선수 길이 반각 회전주기
 */

import { EYEFIELD } from '../src/data/maps.js'
import { insideWithMargin, findSafeSpot, scaleShape, dist } from '../src/engine/geometry.js'
import { TUNING } from '../src/data/config.js'

const T = TUNING.eyefield
const SHRINK = Number(process.argv[2] ?? T.shrink)
const SPEED = Number(process.argv[3] ?? 600) // 커서 최대 속도 px/s (넉넉하게)
const RAYS = Number(process.argv[4] ?? T.rayCount)
const RAY_LEN = Number(process.argv[5] ?? T.rayLength)
const RAY_HALF = Number(process.argv[6] ?? T.rayHalfAngle)
const RAY_PERIOD = Number(process.argv[7] ?? T.rayPeriod)

const CELL = 6
const COLS = Math.floor(960 / CELL)
const ROWS = Math.floor(540 / CELL)
const DT = 1 / 30
const HORIZON = 40 // 초
const margin = T.margin

// --- 씬과 똑같이 도형을 준비한다 ---
const scaled = EYEFIELD.map((s) => scaleShape(s, SHRINK))
const eyes = []
const bolts = []
for (const s of scaled) {
  if (s.fill === '#000000') continue // 눈동자는 판정 없음
  if (s.t === 'poly' && polyArea(s.pts) < 4000) bolts.push(s)
  else eyes.push(s)
}
const sun = eyes.reduce((a, b) => (radiusOf(b) > radiusOf(a) ? b : a), eyes[0])
const exit = findSafeSpot(eyes, [0.34, 0.28, 0.66, 0.72])
const start = findSafeSpot(eyes, [0.36, 0.02, 0.64, 0.16])

function polyArea(pts) {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++)
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  return Math.abs(a / 2)
}
function radiusOf(s) {
  return s.t === 'circle' ? s.r : s.t === 'ellipse' ? Math.max(s.rx, s.ry) : 0
}

// --- 정적 장애물(눈) 미리 계산 ---
const staticBlocked = new Uint8Array(COLS * ROWS)
const polarR = new Float32Array(COLS * ROWS)
const polarA = new Float32Array(COLS * ROWS)
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x = c * CELL + CELL / 2
    const y = r * CELL + CELL / 2
    const i = r * COLS + c
    for (const s of eyes) {
      if (insideWithMargin(x, y, s, margin)) {
        staticBlocked[i] = 1
        break
      }
    }
    polarR[i] = dist(x, y, sun.cx, sun.cy)
    polarA[i] = (Math.atan2(y - sun.cy, x - sun.cx) * 180) / Math.PI
  }
}

// 번개 낙뢰 기둥 (씬과 같은 모양)
const strikes = bolts.map((b) => {
  const xs = b.pts.map((p) => p[0])
  const ys = b.pts.map((p) => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const top = Math.min(...ys)
  const w = 13
  const pts = []
  const seg = 6
  for (let i = 0; i <= seg; i++) pts.push([cx + (i % 2 ? w : -w) * 1.6, top + ((540 - top) / seg) * i])
  for (let i = seg; i >= 0; i--) pts.push([cx + (i % 2 ? w : -w) * 1.6 + w, top + ((540 - top) / seg) * i])
  return { t: 'poly', pts, fill: '#fff200' }
})
const strikeBlocked = new Uint8Array(COLS * ROWS)
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x = c * CELL + CELL / 2
    const y = r * CELL + CELL / 2
    const i = r * COLS + c
    for (const s of strikes) {
      if (insideWithMargin(x, y, s, margin)) {
        strikeBlocked[i] = 1
        break
      }
    }
  }
}

const raySpacing = 360 / RAYS
function blockedAt(i, t) {
  if (staticBlocked[i]) return true
  // 회전 광선
  if (polarR[i] <= RAY_LEN && polarR[i] >= 1) {
    const angle = ((t / RAY_PERIOD) * 360) % 360
    let d = (((polarA[i] - angle) % raySpacing) + raySpacing) % raySpacing
    if (d > raySpacing / 2) d -= raySpacing
    if (Math.abs(d) <= RAY_HALF) return true
  }
  // 번개 점등 순간
  const phase = t % T.boltPeriod
  if (phase >= T.boltWarn && phase < T.boltWarn + T.boltStrike && strikeBlocked[i]) return true
  return false
}

// --- 시간축 BFS ---
const subSteps = Math.max(1, Math.round((SPEED * DT) / CELL))
let reach = new Uint8Array(COLS * ROWS)
const sc = Math.floor(start.x / CELL)
const sr = Math.floor(start.y / CELL)
reach[sr * COLS + sc] = 1
if (blockedAt(sr * COLS + sc, 0)) console.log('  ! 출발점이 시작부터 막혀 있다')

const exitCells = []
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (dist(c * CELL + CELL / 2, r * CELL + CELL / 2, exit.x, exit.y) <= T.exitRadius) {
      exitCells.push(r * COLS + c)
    }
  }
}

let reached = false
let aliveCells = 1
let t = 0
let maxAlive = 1
let goalCell = -1
const history = [] // 시간 스텝별 도달 가능 집합 (경로 역추적용)
for (let step = 0; step < HORIZON / DT && !reached; step++) {
  t = step * DT
  history.push(reach.slice())
  for (let s = 0; s < subSteps; s++) {
    const next = new Uint8Array(COLS * ROWS)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c
        if (!reach[i]) continue
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr
            const nc = c + dc
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
            const j = nr * COLS + nc
            if (!blockedAt(j, t)) next[j] = 1
          }
        }
      }
    }
    reach = next
  }
  aliveCells = reach.reduce((a, b) => a + b, 0)
  maxAlive = Math.max(maxAlive, aliveCells)
  if (aliveCells === 0) break
  const hit = exitCells.find((i) => reach[i])
  if (hit !== undefined) {
    reached = true
    goalCell = hit
    history.push(reach.slice())
  }
}

/** 도달 집합을 거꾸로 훑어 실제로 지나갈 수 있는 좌표열을 뽑는다 */
function reconstruct() {
  const reachPerStep = subSteps * CELL * 1.45 // 대각선 포함 한 스텝 이동 한계
  const path = []
  let cur = goalCell
  for (let k = history.length - 1; k >= 0; k--) {
    const cr = Math.floor(cur / COLS)
    const cc = cur % COLS
    path.push({ t: k * DT, x: cc * CELL + CELL / 2, y: cr * CELL + CELL / 2 })
    if (k === 0) break
    const prev = history[k - 1]
    let best = -1
    let bestD = Infinity
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c
        if (!prev[i]) continue
        const d = Math.hypot((c - cc) * CELL, (r - cr) * CELL)
        if (d <= reachPerStep && d < bestD) {
          bestD = d
          best = i
        }
      }
    }
    if (best < 0) break
    cur = best
  }
  return path.reverse()
}

console.log(
  `shrink=${SHRINK} speed=${SPEED} rays=${RAYS} len=${RAY_LEN} half=${RAY_HALF}° period=${RAY_PERIOD}s`
)
console.log(`  태양 중심 (${sun.cx?.toFixed(0)}, ${sun.cy?.toFixed(0)})  출구 (${exit.x}, ${exit.y})  출발 (${start.x}, ${start.y})`)
console.log(`  출구까지 거리 ${dist(start.x, start.y, exit.x, exit.y).toFixed(0)}px, 출구는 태양에서 ${dist(exit.x, exit.y, sun.cx, sun.cy).toFixed(0)}px`)
console.log(`  → ${reached ? `클리어 가능 (${t.toFixed(1)}초)` : `클리어 불가 (${t.toFixed(1)}초 시점 생존칸 ${aliveCells}, 최대 ${maxAlive})`}`)

// --path 를 주면 실제 경로를 JSON 으로 뱉는다 (브라우저 재생 검증용)
if (reached && process.argv.includes('--path')) {
  const path = reconstruct()
  console.log('PATH_JSON ' + JSON.stringify(path))
}
