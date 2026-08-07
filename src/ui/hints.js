// 안내 메시지는 처음 한 번만 보여준다.
// 매 스테이지·매 재시작마다 다시 뜨면 시야만 가리고 성가시다.
// 세션 단위(새로고침하면 초기화)로만 기억한다.

let armHintSeen = false
let rotateHintSeen = false

export const shouldShowArmHint = () => !armHintSeen
export const markArmHintSeen = () => {
  armHintSeen = true
}

export const shouldShowRotateHint = () => !rotateHintSeen
export const markRotateHintSeen = () => {
  rotateHintSeen = true
}

/** 처음부터 다시 시작할 때 안내도 되살린다 */
export function resetHints() {
  armHintSeen = false
  rotateHintSeen = false
}
