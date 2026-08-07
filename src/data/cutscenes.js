// 컷신 대사 시퀀스 — 원작 p21, p23~29.
// 각 스텝: text(대사) · glitch(타졸맨 침식 0~1) · shadow(그림자 접근 0~1)
// · bg(배경색) · shake(화면 흔들림) · big(대사 크게)

/** p21 — 고장난 세계 직후, 타졸맨이 침식되기 시작한다 */
export const CUTSCENE_GLITCH = [
  { text: '으… 뭐야 이거…', glitch: 0.25, bg: '#0b0b12' },
  { text: '몸이… 이상해…', glitch: 0.55, bg: '#0b0b12', shake: 0.4 },
  { text: '세계가 고장났어…', glitch: 0.8, bg: '#08080f', shake: 0.7 },
  { text: '저기… 물약이 있다', glitch: 0.8, bg: '#0b0b12' },
]

/** p23~29 — 치료 → 감사 → 그림자 → 재침식 → 빌런화 */
export const CUTSCENE_VILLAIN = [
  { text: '', glitch: 0.4, bg: '#0b0b12', heal: 0.5 },
  { text: '고마워! 너 덕분에 살았어', glitch: 0, bg: '#12121c', heal: 1 },
  { text: '잠깐만… 근데 저거 뭐지', glitch: 0, bg: '#12121c', shadow: 0.2 },
  { text: '', glitch: 0, bg: '#0a0a10', shadow: 0.55, shake: 0.3 },
  { text: '으아아악', glitch: 0.5, bg: '#080810', shadow: 0.85, shake: 0.8 },
  { text: '', glitch: 1, bg: '#050508', shadow: 1, shake: 1 },
  { text: '이.제. 이.몸. 내.꺼.다ㅋㅋ', glitch: 1, bg: '#050508', shadow: 1, villain: true, big: true },
  {
    text: 'ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ',
    glitch: 1,
    bg: '#050508',
    shadow: 1,
    villain: true,
    shake: 0.6,
  },
]
