import Stage from '../ui/Stage.jsx'
import { Label } from '../ui/Shapes.jsx'
import { sfx } from '../audio/chiptune.js'

/** 원작 p30 — 「2편에 계속………」 */
export default function Ending({ onRestart, deaths }) {
  return (
    <Stage background="#000000">
      <rect x="0" y="0" width="960" height="540" fill="#000" />
      <Label x={480} y={220} size={56} fill="#fff">
        2편에 계속………
      </Label>
      <Label x={480} y={296} size={22} fill="#8a8aa0">
        총 {deaths}번 죽고 여기까지 왔다
      </Label>
      <Label x={480} y={340} size={18} fill="#5a5a70">
        제작자 : 임재경 · 캐릭터 : 타졸맨
      </Label>

      <g
        onPointerDown={() => {
          sfx('click')
          onRestart()
        }}
        style={{ cursor: 'pointer' }}
      >
        <rect x="360" y="404" width="240" height="72" rx="14" fill="#00b0f0" />
        <Label x={480} y={440} size={26} fill="#fff">
          처음부터
        </Label>
      </g>
    </Stage>
  )
}
