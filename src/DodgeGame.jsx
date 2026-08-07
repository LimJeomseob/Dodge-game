import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useViewport from './hooks/useViewport.js'
import Hud, { GameOverOverlay } from './ui/Hud.jsx'
import * as audio from './audio/chiptune.js'

import Title from './scenes/Title.jsx'
import Tutorial from './scenes/Tutorial.jsx'
import MazeStage from './scenes/MazeStage.jsx'
import Escape from './scenes/Escape.jsx'
import EyeFieldStage from './scenes/EyeFieldStage.jsx'
import BossFight from './scenes/BossFight.jsx'
import Corridor from './scenes/Corridor.jsx'
import Laser from './scenes/Laser.jsx'
import IceChase from './scenes/IceChase.jsx'
import BrokenWorld from './scenes/BrokenWorld.jsx'
import Cutscene from './scenes/Cutscene.jsx'
import PotionChoice from './scenes/PotionChoice.jsx'
import Ending from './scenes/Ending.jsx'
import { CUTSCENE_GLITCH, CUTSCENE_VILLAIN } from './data/cutscenes.js'

/**
 * 씬 순서 (v4 확정).
 * bgm: 해당 씬에서 재생할 트랙, hud: HUD 표시 여부, name: HUD 라벨.
 */
const FLOW = [
  { key: 'TITLE', bgm: 'title', hud: false },
  { key: 'TUTORIAL', bgm: 'maze', hud: true, name: '튜토리얼' },
  { key: 'MAZE1', bgm: 'maze', hud: true, name: '1 스테이지' },
  { key: 'MAZE2', bgm: 'maze', hud: true, name: '1 스테이지' },
  { key: 'MAZE3', bgm: 'maze', hud: true, name: '1 스테이지' },
  { key: 'ESCAPE', bgm: 'maze', hud: true, name: '탈출' },
  { key: 'EYEFIELD', bgm: 'tense', hud: true, name: '2 스테이지 죽음의 길' },
  { key: 'BOSS', bgm: 'boss', hud: true, name: '보스 — 붉은 눈' },
  { key: 'CORRIDOR', bgm: 'tense', hud: true, name: '3 스테이지 통로' },
  { key: 'LASER', bgm: 'tense', hud: true, name: '레이저' },
  { key: 'ICECHASE', bgm: 'tense', hud: true, name: '얼음 추격' },
  { key: 'BROKENWORLD', bgm: 'glitch', hud: true, name: '고장난 세계' },
  { key: 'CUTSCENE_A', bgm: 'glitch', hud: false },
  { key: 'POTION', bgm: 'glitch', hud: true, name: '물약 선택' },
  { key: 'CUTSCENE_B', bgm: 'glitch', hud: false },
  { key: 'ENDING', bgm: 'ending', hud: false },
]

/** 개발 중 특정 씬을 바로 열기 위한 ?scene=EYEFIELD 지원 (프로덕션 빌드에선 무시) */
function initialIndex() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 0
  const want = new URLSearchParams(window.location.search).get('scene')
  if (!want) return 0
  const i = FLOW.findIndex((s) => s.key === want.toUpperCase())
  return i >= 0 ? i : 0
}

export default function DodgeGame() {
  const vp = useViewport()
  const [index, setIndex] = useState(initialIndex)
  const [deaths, setDeaths] = useState(0)
  const [dead, setDead] = useState(false)
  const [muted, setMuted] = useState(false)
  // 재시작할 때마다 값이 바뀌어 씬 컴포넌트를 통째로 초기화한다.
  const [attempt, setAttempt] = useState(0)

  const scene = FLOW[index]
  const deadRef = useRef(false)
  deadRef.current = dead

  useEffect(() => {
    audio.playBgm(scene.bgm)
  }, [scene.bgm])

  const advance = useCallback(() => {
    audio.sfx('clear')
    setDead(false)
    setIndex((i) => Math.min(i + 1, FLOW.length - 1))
    setAttempt((a) => a + 1)
  }, [])

  const die = useCallback(() => {
    if (deadRef.current) return
    deadRef.current = true
    audio.sfx('death')
    setDeaths((d) => d + 1)
    setDead(true)
  }, [])

  const retry = useCallback(() => {
    setDead(false)
    setAttempt((a) => a + 1)
  }, [])

  const restartGame = useCallback(() => {
    setDead(false)
    setDeaths(0)
    setIndex(0)
    setAttempt((a) => a + 1)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      audio.setMuted(!m)
      return !m
    })
  }, [])

  const props = useMemo(
    () => ({ onClear: advance, onDeath: die, vp, deaths, paused: dead }),
    [advance, die, vp, deaths, dead]
  )

  let body
  switch (scene.key) {
    case 'TITLE':
      body = <Title {...props} onStart={advance} />
      break
    case 'TUTORIAL':
      body = <Tutorial {...props} />
      break
    case 'MAZE1':
      body = <MazeStage {...props} mapIndex={0} />
      break
    case 'MAZE2':
      body = <MazeStage {...props} mapIndex={1} />
      break
    case 'MAZE3':
      body = <MazeStage {...props} mapIndex={2} />
      break
    case 'ESCAPE':
      body = <Escape {...props} />
      break
    case 'EYEFIELD':
      body = <EyeFieldStage {...props} />
      break
    case 'BOSS':
      body = <BossFight {...props} />
      break
    case 'CORRIDOR':
      body = <Corridor {...props} />
      break
    case 'LASER':
      body = <Laser {...props} />
      break
    case 'ICECHASE':
      body = <IceChase {...props} />
      break
    case 'BROKENWORLD':
      body = <BrokenWorld {...props} />
      break
    case 'CUTSCENE_A':
      body = <Cutscene {...props} seq={CUTSCENE_GLITCH} />
      break
    case 'POTION':
      body = <PotionChoice {...props} />
      break
    case 'CUTSCENE_B':
      body = <Cutscene {...props} seq={CUTSCENE_VILLAIN} />
      break
    case 'ENDING':
      body = <Ending {...props} onRestart={restartGame} />
      break
    default:
      body = null
  }

  return (
    <div className="game-root">
      {/*
        무대는 16:9 고정이라 세로 화면에서는 화면의 1/4만 쓰게 된다.
        그래서 세로일 때 전체를 90도 돌려 화면을 꽉 채운다 (기기를 가로로 눕히면 정방향).
        포인터 좌표는 usePointer 가 SVG 역행렬로 계산하므로 회전해도 그대로 정확하다.
      */}
      <div className={`rotator ${vp.portrait ? 'rotated' : ''}`}>
        {/* attempt 를 key 로 걸어 사망·진행 시 씬 내부 상태를 완전히 초기화한다 */}
        <div className="scene-holder" key={`${scene.key}-${attempt}`}>
          {body}
        </div>
        {scene.hud && (
          <Hud deaths={deaths} muted={muted} onToggleMute={toggleMute} stageName={scene.name} />
        )}
        {dead && <GameOverOverlay onRetry={retry} deaths={deaths} />}
        {vp.portrait && <RotateHint />}
      </div>
    </div>
  )
}

/** 세로로 들고 있을 때 한 번 보여주는 안내 */
function RotateHint() {
  return <div className="rotate-hint">📱 기기를 가로로 돌려서 플레이하세요</div>
}
