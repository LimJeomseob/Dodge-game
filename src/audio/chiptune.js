// Tone.js 8bit 칩튠 BGM/SFX.
// Tone 은 첫 사용자 입력 이후에만 소리를 낼 수 있으므로 start() 를 타이틀 클릭에서 부른다.
// 로딩 실패나 오디오 미지원 환경에서도 게임은 그대로 돌아가야 하므로 모든 호출을 방어한다.

let Tone = null
let loading = null
let ready = false
let muted = false
let bgmPart = null
let currentTrack = null
let lead = null
let bass = null
let noise = null

const NOTE = { C4: 'C4', D4: 'D4', E4: 'E4', F4: 'F4', G4: 'G4', A4: 'A4', B4: 'B4' }

/** 스테이지별 BGM — [시간, 음, 길이] 시퀀스를 루프한다 */
const TRACKS = {
  title: { bpm: 128, loop: '2m', notes: seq(['E4', 'G4', 'B4', 'G4', 'A4', 'C5', 'E5', 'C5']) },
  maze: { bpm: 140, loop: '2m', notes: seq(['C4', 'E4', 'G4', 'E4', 'F4', 'A4', 'C5', 'A4']) },
  tense: { bpm: 152, loop: '1m', notes: seq(['C3', 'C3', 'Eb3', 'C3', 'F3', 'C3', 'Gb3', 'C3']) },
  boss: { bpm: 164, loop: '1m', notes: seq(['A2', 'A2', 'C3', 'A2', 'D3', 'C3', 'A2', 'G2']) },
  glitch: { bpm: 96, loop: '2m', notes: seq(['C2', 'Db2', 'C2', 'B1', 'C2', 'Gb2', 'C2', 'F1']) },
  ending: { bpm: 120, loop: '2m', notes: seq(['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'G4', 'C5']) },
}

function seq(pitches) {
  return pitches.map((p, i) => ({ time: `0:${i * 0.5}`, note: p, dur: '8n' }))
}

/**
 * Tone.js 모듈만 미리 받아 둔다 (소리는 아직 안 남).
 * 이걸 안 하면 첫 탭에서 340KB 를 내려받느라 화면이 멈춘 것처럼 보인다.
 */
export function preloadAudio() {
  if (Tone || loading) return loading || Promise.resolve()
  loading = import('tone')
    .then((m) => {
      Tone = m
    })
    .catch(() => {
      /* 오디오 없이도 게임은 그대로 돌아간다 */
    })
  return loading
}

/** 첫 사용자 입력에서 호출. 실패해도 조용히 무음으로 진행한다. */
export async function initAudio() {
  if (ready) return true
  try {
    if (!Tone) await preloadAudio()
    if (!Tone) return false
    await Tone.start()
    lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.25, release: 0.1 },
    }).toDestination()
    lead.volume.value = -18
    bass = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.2 },
    }).toDestination()
    bass.volume.value = -14
    noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    }).toDestination()
    noise.volume.value = -20
    ready = true
    return true
  } catch {
    ready = false
    return false
  }
}

export function isReady() {
  return ready
}

export function setMuted(v) {
  muted = v
  if (!ready || !Tone) return
  try {
    Tone.getDestination().mute = v
  } catch {
    /* 무시 */
  }
}

export function isMuted() {
  return muted
}

/** 스테이지 BGM 전환. 같은 트랙이면 아무것도 하지 않는다. */
export function playBgm(track) {
  if (!ready || !Tone || track === currentTrack) return
  stopBgm()
  const t = TRACKS[track]
  if (!t) return
  currentTrack = track
  try {
    Tone.getTransport().bpm.value = t.bpm
    bgmPart = new Tone.Part((time, ev) => {
      lead.triggerAttackRelease(ev.note, ev.dur, time)
      bass.triggerAttackRelease(shiftDown(ev.note), '8n', time)
    }, t.notes)
    bgmPart.loop = true
    bgmPart.loopEnd = t.loop
    bgmPart.start(0)
    Tone.getTransport().start()
  } catch {
    /* 무시 */
  }
}

function shiftDown(note) {
  const m = /^([A-G]b?)(\d)$/.exec(note)
  if (!m) return note
  return `${m[1]}${Math.max(0, Number(m[2]) - 2)}`
}

export function stopBgm() {
  currentTrack = null
  if (!bgmPart) return
  try {
    bgmPart.stop()
    bgmPart.dispose()
  } catch {
    /* 무시 */
  }
  bgmPart = null
}

/** 효과음 */
export function sfx(kind) {
  if (!ready || !Tone || muted) return
  try {
    const now = Tone.now()
    switch (kind) {
      case 'death':
        lead.triggerAttackRelease(['C3', 'B2'], '8n', now)
        lead.triggerAttackRelease(['G2', 'Gb2'], '4n', now + 0.12)
        break
      case 'clear':
        lead.triggerAttackRelease('C5', '16n', now)
        lead.triggerAttackRelease('E5', '16n', now + 0.08)
        lead.triggerAttackRelease('G5', '8n', now + 0.16)
        break
      case 'hit':
        noise.triggerAttackRelease('16n', now)
        lead.triggerAttackRelease('A4', '32n', now)
        break
      case 'thunder':
        noise.triggerAttackRelease('4n', now)
        bass.triggerAttackRelease('C1', '4n', now)
        break
      case 'click':
        lead.triggerAttackRelease('E5', '32n', now)
        break
      case 'glitch':
        noise.triggerAttackRelease('32n', now)
        lead.triggerAttackRelease(['Db3', 'G3'], '32n', now)
        break
      default:
        break
    }
  } catch {
    /* 무시 */
  }
}
