import Stage from '../ui/Stage.jsx'
import { Label } from '../ui/Shapes.jsx'
import { sfx } from '../audio/chiptune.js'

/** 원작 p7 — 「탈출!!!!!!!!!!!」 미로 클리어 축하 화면 */
export default function Escape({ onClear }) {
  const go = () => {
    sfx('click')
    onClear()
  }
  return (
    <Stage background="#385723">
      <rect x="0" y="0" width="960" height="540" fill="#385723" />
      <Label x={480} y={210} size={72} fill="#fff" stroke="#1d2d12">
        탈출!!!!!!!!!!!
      </Label>
      <Label x={480} y={286} size={24} fill="#d6f0b8">
        1 스테이지 통과. 근데 진짜 나갈 수 있을까?
      </Label>
      <g onPointerDown={go} style={{ cursor: 'pointer' }}>
        <rect x="330" y="360" width="300" height="90" rx="16" fill="#fff" />
        <Label x={480} y={405} size={36} fill="#385723">
          나가기
        </Label>
      </g>
    </Stage>
  )
}
