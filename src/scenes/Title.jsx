import { useEffect, useRef, useState } from 'react'
import Stage from '../ui/Stage.jsx'
import { Label } from '../ui/Shapes.jsx'
import { initAudio, playBgm, preloadAudio } from '../audio/chiptune.js'
import { lockLandscape } from '../hooks/useFullscreen.js'

/** 원작 p1~3 — 타이틀 / 하는 법 / 제작자 소개 */
export default function Title({ onStart, vp, fullscreen }) {
  const [howto, setHowto] = useState(false)
  const started = useRef(false)

  // 탭하기 전에 Tone.js 를 미리 받아 둔다. 탭한 뒤에 받으면 화면이 멈춘 것처럼 보인다.
  useEffect(() => {
    preloadAudio()
  }, [])

  const begin = () => {
    if (started.current) return // 터치에서 pointerdown+click 이 겹쳐 두 번 불리는 것 방지
    started.current = true
    // 오디오는 사용자 제스처 안에서 시작해야 하지만, 기다리지는 않는다.
    // 네트워크가 느려도 화면은 즉시 넘어가야 한다.
    initAudio().then((ok) => ok && playBgm('title'))
    // 전체화면·가로 고정도 이 제스처 안에서 요청해야 브라우저가 허용한다.
    // 거부되거나 지원하지 않아도 게임 진행에는 영향이 없다.
    // 데스크톱에서 갑자기 전체화면이 되면 당황스러우니 터치 기기에서만 자동 진입하고,
    // 그 외에는 HUD 의 ⛶ 버튼으로 직접 켜게 둔다.
    const touchDevice =
      vp.mobile || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)
    if (touchDevice) fullscreen?.request().then((ok) => ok && lockLandscape())
    onStart()
  }

  return (
    <Stage background="#ffffff">
      <rect x="0" y="0" width="960" height="540" fill="#00b0f0" />
      <Label x={480} y={110} size={68} fill="#fff" stroke="#003a52">
        도형 피하기
      </Label>
      <Label x={480} y={172} size={26} fill="#ffe9a8">
        캐릭터 : 타졸맨 · 제작자 : 임재경
      </Label>

      {!howto ? (
        <>
          <MenuButton x={480} y={286} label="시작" onClick={begin} primary />
          <MenuButton x={480} y={392} label="하는 법" onClick={() => setHowto(true)} />
          <Label x={480} y={490} size={20} fill="#e8f7ff">
            도형을 피하면 됌 ㅋㅋㅋㅋㅋㅋㅋㅋ
          </Label>
        </>
      ) : (
        <>
          <rect x="130" y="210" width="700" height="240" rx="18" fill="#ffffff" opacity="0.95" />
          <Label x={480} y={252} size={26} fill="#00b0f0">
            하는 법
          </Label>
          <Label x={480} y={300} size={21}>
            {vp.mobile ? '① 초록 「시작」 점을 손가락으로 짚는다' : '① 초록 「시작」 점에 커서를 올린다'}
          </Label>
          <Label x={480} y={340} size={21}>
            {vp.mobile ? '② 손을 떼지 말고 그대로 끌어서 피한다' : '② 도형에 닿지 않게 커서를 움직인다'}
          </Label>
          <Label x={480} y={380} size={21}>
            ③ 파란 출구에 닿으면 다음 스테이지
          </Label>
          <MenuButton x={480} y={480} label="튜토리얼 시작" onClick={begin} primary small />
          <g onPointerDown={() => setHowto(false)} style={{ cursor: 'pointer' }}>
            <rect x="30" y="30" width="120" height="52" rx="12" fill="#003a52" />
            <Label x={90} y={57} size={20} fill="#fff">
              뒤로
            </Label>
          </g>
        </>
      )}
    </Stage>
  )
}

/**
 * 메뉴 버튼.
 * 폰에서 확실히 눌리도록 보이는 크기보다 넓은 투명 영역을 깔고,
 * pointerdown 과 click 을 모두 받는다 (한쪽만 오는 브라우저가 있다).
 */
function MenuButton({ x, y, label, onClick, primary, small }) {
  const w = small ? 300 : 340
  const h = small ? 62 : 84
  const pad = 18
  return (
    <g onPointerDown={onClick} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect
        x={x - w / 2 - pad}
        y={y - h / 2 - pad}
        width={w + pad * 2}
        height={h + pad * 2}
        fill="transparent"
      />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="16" fill={primary ? '#ffffff' : '#003a52'} />
      <Label x={x} y={y} size={small ? 26 : 34} fill={primary ? '#00b0f0' : '#ffffff'}>
        {label}
      </Label>
    </g>
  )
}
