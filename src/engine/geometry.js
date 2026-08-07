// 커서(점) 대 도형 충돌 판정 및 안전 지점 탐색.
// 모든 좌표는 960x540 스테이지 좌표계.

import { STAGE_W, STAGE_H } from '../data/maps.js'

export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by)

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

/** 점이 폴리곤 내부인지 (ray casting) */
export function pointInPoly(px, py, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/** 점에서 선분까지의 거리 */
export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1)
  return dist(px, py, x1 + t * dx, y1 + t * dy)
}

/** 점에서 폴리곤 외곽선까지의 최단 거리 (내부면 0) */
export function distToPoly(px, py, pts) {
  if (pointInPoly(px, py, pts)) return 0
  let best = Infinity
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const d = distToSegment(px, py, pts[j][0], pts[j][1], pts[i][0], pts[i][1])
    if (d < best) best = d
  }
  return best
}

/** 점에서 도형까지의 거리 (내부면 0). shape 은 maps.js 의 원/타원/폴리곤. */
export function distToShape(px, py, s) {
  if (s.t === 'circle') return Math.max(0, dist(px, py, s.cx, s.cy) - s.r)
  if (s.t === 'ellipse') {
    // 타원은 축 기준 정규화 거리 → 근사 거리로 환산
    const nx = (px - s.cx) / s.rx
    const ny = (py - s.cy) / s.ry
    const n = Math.hypot(nx, ny)
    if (n <= 1) return 0
    return (n - 1) * Math.min(s.rx, s.ry)
  }
  return distToPoly(px, py, s.pts)
}

/** margin(판정 여유)만큼 안쪽으로 파고들었을 때만 충돌로 본다. */
export function hitsAny(px, py, shapes, margin = 0) {
  for (const s of shapes) {
    if (insideWithMargin(px, py, s, margin)) return s
  }
  return null
}

/** margin 만큼 도형을 축소한 영역 안에 있으면 충돌. margin 이 클수록 관대. */
export function insideWithMargin(px, py, s, margin) {
  if (margin <= 0) return distToShape(px, py, s) === 0
  if (s.t === 'circle') return dist(px, py, s.cx, s.cy) <= Math.max(1, s.r - margin)
  if (s.t === 'ellipse') {
    const nx = (px - s.cx) / Math.max(1, s.rx - margin)
    const ny = (py - s.cy) / Math.max(1, s.ry - margin)
    return Math.hypot(nx, ny) <= 1
  }
  // 폴리곤: 내부이면서 외곽선에서 margin 이상 떨어져 있을 때만 충돌
  return pointInPoly(px, py, s.pts) && distToPolyEdge(px, py, s.pts) > margin
}

function distToPolyEdge(px, py, pts) {
  let best = Infinity
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const d = distToSegment(px, py, pts[j][0], pts[j][1], pts[i][0], pts[i][1])
    if (d < best) best = d
  }
  return best
}

/** 회전하는 광선(부채꼴) 충돌: 중심에서 뻗은 반각 halfDeg, 길이 len 의 빔 */
export function inBeam(px, py, cx, cy, angleDeg, halfDeg, len) {
  const d = dist(px, py, cx, cy)
  if (d > len || d < 1) return false
  let a = (Math.atan2(py - cy, px - cx) * 180) / Math.PI
  let diff = ((a - angleDeg + 540) % 360) - 180
  return Math.abs(diff) <= halfDeg
}

/**
 * 장애물에서 가장 멀리 떨어진 안전 지점을 격자 탐색으로 찾는다.
 * region: [x0,y0,x1,y1] 비율(0~1) 로 탐색 영역 제한. 없으면 전체.
 */
export function findSafeSpot(shapes, region) {
  const [rx0, ry0, rx1, ry1] = region || [0.02, 0.02, 0.98, 0.98]
  const x0 = rx0 * STAGE_W
  const x1 = rx1 * STAGE_W
  const y0 = ry0 * STAGE_H
  const y1 = ry1 * STAGE_H
  let best = null
  let bestClear = -1
  const step = 12
  for (let x = x0; x <= x1; x += step) {
    for (let y = y0; y <= y1; y += step) {
      let clear = Infinity
      for (const s of shapes) {
        const d = distToShape(x, y, s)
        if (d < clear) clear = d
        if (clear <= 0) break
      }
      if (clear > bestClear) {
        bestClear = clear
        best = { x, y, clearance: clear }
      }
    }
  }
  return best || { x: STAGE_W / 2, y: STAGE_H / 2, clearance: 0 }
}

/**
 * 도형을 자기 중심 기준으로 k 배 축소/확대한다.
 * 원작을 그대로 트레이싱하면 틈새가 너무 좁아 지나갈 수 없는 맵이 있어,
 * 배치(구도)는 그대로 두고 크기만 줄여 통과 가능한 여백을 만든다.
 */
export function scaleShape(s, k) {
  if (s.t === 'circle') return { ...s, r: s.r * k }
  if (s.t === 'ellipse') return { ...s, rx: s.rx * k, ry: s.ry * k }
  const n = s.pts.length
  let cx = 0
  let cy = 0
  for (const [x, y] of s.pts) {
    cx += x
    cy += y
  }
  cx /= n
  cy /= n
  return { ...s, pts: s.pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]) }
}

export { STAGE_W, STAGE_H }
