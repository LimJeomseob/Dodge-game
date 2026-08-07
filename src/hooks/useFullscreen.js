import { useCallback, useEffect, useState } from 'react'

/**
 * 전체화면 제어.
 *
 * 브라우저는 사용자 제스처 안에서만 전체화면을 허용하므로,
 * 타이틀의 「시작」 탭에서 request() 를 부른다.
 *
 * iOS Safari 는 iframe 이 아닌 문서에 Fullscreen API 를 주지 않는다.
 * 그쪽은 홈 화면에 추가(standalone)해야 주소창이 사라지므로,
 * 지원 여부를 supported 로 알려 UI 가 헛된 버튼을 띄우지 않게 한다.
 */
export default function useFullscreen() {
  const [active, setActive] = useState(() => !!document.fullscreenElement)

  const supported =
    typeof document !== 'undefined' &&
    !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)

  useEffect(() => {
    const onChange = () => setActive(!!(document.fullscreenElement || document.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const request = useCallback(async () => {
    const el = document.documentElement
    const fn = el.requestFullscreen || el.webkitRequestFullscreen
    if (!fn) return false
    try {
      // navigationUI: 'hide' 를 이해하는 브라우저에서는 주소창까지 확실히 감춘다
      await fn.call(el, { navigationUI: 'hide' })
      return true
    } catch {
      try {
        await fn.call(el)
        return true
      } catch {
        return false // 사용자가 거부했거나 지원하지 않는다 — 게임은 그대로 진행
      }
    }
  }, [])

  const exit = useCallback(async () => {
    const fn = document.exitFullscreen || document.webkitExitFullscreen
    if (!fn || !(document.fullscreenElement || document.webkitFullscreenElement)) return
    try {
      await fn.call(document)
    } catch {
      /* 무시 */
    }
  }, [])

  const toggle = useCallback(() => (active ? exit() : request()), [active, exit, request])

  return { active, supported, request, exit, toggle }
}

/**
 * 화면 방향을 가로로 고정한다. 전체화면일 때만 허용되며,
 * 데스크톱과 iOS 에서는 조용히 실패한다.
 */
export async function lockLandscape() {
  try {
    await screen.orientation?.lock?.('landscape')
    return true
  } catch {
    return false
  }
}
