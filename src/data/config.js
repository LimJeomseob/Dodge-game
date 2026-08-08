// 게임 밸런싱 상수 — v4 기획 확정값. 여기만 고치면 난이도가 바뀐다.

/** 물약 정답 위치 (0=왼쪽, 1=가운데, 2=오른쪽). v4 확정: 가운데 */
export const POTION_ANSWER = 1

/** 터치 입력 시 손가락 위로 커서를 띄우는 거리(화면 px) */
export const TOUCH_Y_OFFSET = 40

/** 모바일(좁은 화면)에서 판정을 얼마나 더 관대하게 할지 — 판정 여유에 곱한다 */
export const MOBILE_MARGIN_BONUS = 1.6
/** 모바일에서 목표(출구/버튼) 반경을 얼마나 키울지 */
export const MOBILE_TARGET_BONUS = 1.5
/** 이 폭 미만이면 모바일로 간주 (CSS px) */
export const MOBILE_BREAKPOINT = 820

export const TUNING = {
  maze: {
    margin: 6, // 판정 여유(px) — 도형 안으로 6px 파고들어야 사망
    exitRadius: 34, // 출구 버튼 반경 (원작 44.9 → 축소)
    moverSpeed: 120, // 왕복 이동 도형 속도 px/s
    moverRange: 90, // 왕복 폭 px
  },
  eyefield: {
    margin: 4,
    // 원작 p8 을 그대로 트레이싱하면 여백이 9% 뿐이라 지나갈 길이 없다.
    // 배치는 그대로 두고 도형만 축소해 흰 틈새를 확보한다.
    shrink: 0.68,
    // 회전하는 삼각 광선은 뺐다.
    // 출구 주변을 쉴 새 없이 쓸어버려 통과 자체를 막았고, 개수와 각도를 줄여도
    // 광선이 지나가길 기다리는 시간만 길어질 뿐 재미가 붙지 않았다.
    // 지금 이 스테이지의 난이도는 붉은 눈 밭의 좁은 틈새와 번개가 만든다.
    exitHintAfter: 12, // 이 시간(초)을 넘기면 출구를 눈에 띄게 알려 준다
    boltPeriod: 0.9, // 번개 주기(초)
    boltWarn: 0.3, // 예고 깜빡임 길이(초) — 이 뒤 점등 순간만 판정
    boltStrike: 0.18, // 점등(판정) 지속(초)
    exitRadius: 22, // 히든 출구 반경
    pupilFollow: 26, // 눈동자 시선 추적 최대 이동량
  },
  boss: {
    hp: 7,
    phases: 6, // 파손 단계
    buttonMove: 3, // 진짜 「공격」 버튼 이동 주기(초)
    fakeCount: 12, // 가짜 버튼 개수
    buttonR: 46,
    splitHold: 10, // 보스가 갈라진 뒤 다음 씬까지 머무는 시간(초)
  },
  corridor: {
    margin: 4,
    dotSpeed: 200, // 빨간 점 왕복 px/s
    exitRadius: 26,
  },
  laser: {
    margin: 4,
    armPeriod: 1.2, // 팔 상하 왕복 주기(초)
    fireInterval: 0.8, // 발사 간격(초)
    boltSpeed: 500, // 탄속 px/s
    boltR: 12,
    survive: 14, // 생존 시간(초)
  },
  ice: {
    margin: 6,
    chaseSpeed: 260, // 얼음 추격 속도 px/s
    iceR: 34,
    survive: 15, // 생존 시간(초)
    faceR: 96,
    // 얼음은 처음부터 다 나오지 않는다. 하나로 시작해 spawnInterval 마다 하나씩,
    // maxIce 까지 늘어난다. 초반이 헐거워진 만큼은 추격 캐릭터가 메운다.
    spawnInterval: 5, // 얼음이 하나 늘어나는 간격(초)
    maxIce: 3, // 최대 얼음 개수
  },
  // 3 스테이지(레이저·얼음 추격)에 등장하는 추격 캐릭터 — 닿으면 즉사
  chaser: {
    r: 40, // 판정 반경
    speed: 165, // 추격 속도 px/s — 얼음(260)보다 느려 계속 움직이면 따돌릴 수 있다
    delay: 2, // 시작 후 등장까지(초)
    // 등장 직후 grace 초 동안은 반투명하게 걸어 들어오기만 하고 판정이 없다.
    // 화면 밖에서 갑자기 나타나 그 자리에서 즉사시키면 피할 방법이 없다.
    grace: 1.2,
  },
  broken: {
    margin: 4,
    blinkPeriod: 1.1, // 글리치 블록 점멸 주기(초)
    exitRadius: 30,
  },
}

/** 화면 폭에 따라 판정 여유·목표 반경을 보정한다 (모바일 최적화) */
export function scaleForViewport(width) {
  const mobile = width > 0 && width < MOBILE_BREAKPOINT
  return {
    mobile,
    margin: (m) => (mobile ? m * MOBILE_MARGIN_BONUS : m),
    target: (r) => (mobile ? r * MOBILE_TARGET_BONUS : r),
  }
}
