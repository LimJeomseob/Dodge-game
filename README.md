# 도형 피하기 (타졸맨) — Dodge Game

임재경이 그린 32장짜리 원작 슬라이드를 그대로 옮긴 마우스/터치 회피 게임.
제작자 : 임재경 · 캐릭터 : 타졸맨

**플레이 : https://limjeomseob.github.io/Dodge-game/**

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 로 정적 빌드
```

> Windows PowerShell 에서 `npm.ps1 파일을 로드할 수 없습니다` 오류가 나면
> 실행 정책 때문이다. `npm` 대신 `npm.cmd` 를 쓰거나,
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 후 창을 다시 열면 된다.

## 배포

`main` 에 푸시되면 `.github/workflows/deploy.yml` 이 빌드해 GitHub Pages 로 올린다.
서버가 필요 없는 정적 사이트라 별도 설정은 없다.

## 조작

- **PC** — 초록 「시작」 점에 커서를 올리면 판정이 켜진다. 도형에 닿으면 사망.
- **모바일** — 초록 점을 손가락으로 짚고 **떼지 않은 채** 끌면 된다.
  손가락에 가리지 않도록 실제 판정 지점은 손끝보다 40px 위에 표시되고,
  점선이 손가락과 판정 지점을 이어 준다.

## 씬 흐름

```
TITLE → TUTORIAL → 미로 ×3 → 탈출 → STAGE2 죽음의 길 → BOSS 붉은 눈
      → 통로 → 레이저 → 얼음 추격 → 고장난 세계 → 컷신 → 물약 선택
      → 컷신·빌런화 → 2편에 계속
```

사망하면 「주거어요」 후 **현재 스테이지**만 다시 시작하고, 사망 횟수는 세션 내내 누적된다.
물약을 틀리면 「다시 선택하기」로 돌아온다. 모든 회피를 성공해야 엔딩에 닿는다.

## 구조

```
tools/extract_maps.py   원작 PDF → src/data/maps.js 좌표 추출 (1회성)
src/
  DodgeGame.jsx         씬 상태 기계 (scene, bossHp, deaths)
  hooks/                useGameLoop(rAF) · usePointer(마우스+터치) · useViewport
  engine/geometry.js    점 대 원/타원/폴리곤/광선 충돌, 안전 지점 탐색
  audio/chiptune.js     Tone.js 8bit BGM/SFX
  data/                 maps(자동 생성) · config(밸런싱) · stages(맵 규칙) · cutscenes
  scenes/               씬 15종 + useDodgeScene(회피 씬 공통 뼈대)
  ui/                   Stage · Shapes · Hud
```

### 맵 데이터 다시 뽑기

```bash
pip install pymupdf
python3 tools/extract_maps.py Dodgegame.pdf src/data/maps.js
```

원작 슬라이드는 전부 960×540 벡터라, 도형의 좌표·색·종류를 그대로 읽어
`maps.js` 로 굽는다. 게임은 런타임에 PDF 를 읽지 않는다.

## 난이도 조정

전부 `src/data/config.js` 한 곳에 모여 있다.

| 항목 | 값 |
| --- | --- |
| 물약 정답 | `POTION_ANSWER = 1` (가운데) |
| 미로 | 판정 여유 6px, 왕복 도형 120px/s |
| STAGE2 | 태양 광선 8초/회전, 번개 0.9초 주기(예고 0.3초 뒤 점등 순간만 판정), 히든 출구 22px |
| 보스 | HP 7, 진짜 버튼 3초마다 이동, 파손 6단계 |
| 통로 / 레이저 / 얼음 | 점 200px/s · 팔 1.2초·탄속 500px/s · 추격 260px/s, 15초 생존 |
| 고장난 세계 | 블록 점멸 1.1초 |
| 모바일 보정 | 판정 여유 ×1.6, 목표 반경 ×1.5 |

## 원작과 달라진 점 (그리고 그 이유)

- **STAGE2 도형 축소 (`eyefield.shrink = 0.68`)** — 원작 p8 을 좌표 그대로 쓰면
  통과 가능한 여백이 화면의 9% 뿐이라 어떤 경로로도 지나갈 수 없었다.
  배치(구도)는 그대로 두고 각 도형만 자기 중심 기준으로 줄여 길을 냈다.
- **통로 상하 반전** — 원작 p18 에서 유일하게 열린 길은 화면 맨 위 48px 띠인데,
  거기엔 사망 카운터 HUD 가 겹친다. 기둥을 뒤집어 같은 구조를 아래쪽으로 옮겼다.
- **보스의 진짜 버튼 단서** — 진짜 「공격」이 미세하게 맥동하고 테두리가 조금 밝다.
  단서가 없으면 1/13 확률로 즉사하는 순수 찍기가 되어 버린다.
- **세로 화면 90도 회전** — 16:9 무대가 세로 화면에서 좁은 띠로 눌리지 않도록
  전체를 돌려 화면을 채운다. 기기를 가로로 눕히면 정방향이 된다.

## 모바일 최적화

- 세로에서 무대를 90도 회전해 화면 전체 사용, 「가로로 돌리세요」 안내
- 포인터 좌표는 SVG `getScreenCTM()` 역행렬로 계산 — 회전·레터박스와 무관하게 정확
- 터치 커서 40px 오프셋 + 손가락↔판정 지점 안내선
- 판정 여유·목표 반경 자동 확대, 버튼마다 투명 확장 히트 영역
- 스크롤·당겨서새로고침·확대·길게눌러 선택 전부 차단, 노치/홈바 `safe-area` 대응
- `100dvh` 로 주소창 높이 변화 대응
