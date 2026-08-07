import { useState } from 'react'
import Stage from '../ui/Stage.jsx'
import { Label } from '../ui/Shapes.jsx'
import { initAudio, playBgm } from '../audio/chiptune.js'

/** 원작 p1~3 — 타이틀 / 하는 법 / 제작자 소개 */
export default function Title({ onStart, vp }) {
  const [howto, setHowto] = useState(false)

  const begin = async () => {
    // 브라우저 정책상 오디오는 사용자 제스처 안에서만 시작할 수 있다
    await initAudio()
    playBgm('title')
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

function MenuButton({ x, y, label, onClick, primary, small }) {
  const w = small ? 300 : 340
  const h = small ? 62 : 84
  return (
    <g onPointerDown={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="16" fill={primary ? '#ffffff' : '#003a52'} />
      <Label x={x} y={y} size={small ? 26 : 34} fill={primary ? '#00b0f0' : '#ffffff'}>
        {label}
      </Label>
    </g>
  )
}
