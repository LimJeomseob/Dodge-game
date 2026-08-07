/** 화면 우상단 고정 HUD — 사망 카운터 + 음소거·전체화면 토글 (모든 씬 공통) */
export default function Hud({ deaths, muted, onToggleMute, stageName, fullscreen }) {
  return (
    <div className="hud">
      {stageName && <span className="hud-stage">{stageName}</span>}
      <span className="hud-deaths">사망: {deaths}회</span>
      <button className="hud-btn" onClick={onToggleMute} aria-label={muted ? '소리 켜기' : '소리 끄기'}>
        {muted ? '🔇' : '🔊'}
      </button>
      {fullscreen?.supported && (
        <button
          className="hud-btn"
          onClick={fullscreen.toggle}
          aria-label={fullscreen.active ? '전체화면 끄기' : '전체화면'}
        >
          {fullscreen.active ? '⤢' : '⛶'}
        </button>
      )}
    </div>
  )
}

/** 원작 p32 「주거어요 / 다시 하기」 사망 오버레이 */
export function GameOverOverlay({ onRetry, deaths }) {
  return (
    <div className="overlay overlay-death">
      <div className="overlay-inner">
        <p className="overlay-title">주거어요</p>
        <p className="overlay-sub">사망 {deaths}회째</p>
        <button className="big-btn" onClick={onRetry}>
          다시 하기
        </button>
      </div>
    </div>
  )
}

/** 원작 p31 「다시 선택하기」 — 물약 오답 */
export function RetryChoiceOverlay({ onRetry }) {
  return (
    <div className="overlay overlay-wrong">
      <div className="overlay-inner">
        <p className="overlay-title small">틀렸어…</p>
        <button className="big-btn" onClick={onRetry}>
          다시 선택하기
        </button>
      </div>
    </div>
  )
}

/** 스테이지 시작 안내 — 시작 지점에 커서를 올리라는 지시 */
export function ArmHint({ mobile }) {
  return (
    <div className="arm-hint">
      {mobile ? '초록 점을 손가락으로 짚고 그대로 끌어라' : '초록 점에 커서를 올리면 시작'}
    </div>
  )
}
