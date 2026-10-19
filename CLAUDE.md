# PT 운동일지 (pt-log)

헬스 트레이너가 PT 수업 후 회원에게 카톡으로 보내는 운동 기록을 빠르게 만들기 위한 PWA.
claude.ai 채팅에서 기획·프로토타입까지 진행했고, 이 파일은 그 맥락을 이어받기 위한 요약이다.

## 배경
- 트레이너는 수업 중 종이에 운동별 중량/횟수/세트를 적고, 나중에 폰으로 직접 타이핑해 카톡으로 보낸다.
- 한글·숫자·영어 자판 전환이 번거로워 전송이 자주 밀린다. 회원도 트레이너도 불편.
- 사용자는 트레이너 단 한 명. 회원이 많아서 회원별 기능은 넣지 않는다.

## 확정된 결정
- 사용 환경: 트레이너의 휴대폰. 디자인 기준은 iPhone 15 Pro (393×852pt), safe-area 대응.
  - 다른 트레이너도 쓸 수 있으니 반응형: 타일은 `auto-fill, minmax(100px,1fr)` → 아이폰(375~430)은 3칸, 아주 좁은 폰은 2칸, 넓은 화면은 칸이 늘어남. 전체 폭은 `--app-w`(600px)로 제한하고 가운데 정렬.
- 입력 방식: 타이핑 없는 탭 UI. 자판이 열리는 건 운동 추가·백업 불러오기 때뿐.
  - 운동은 정사각형 타일로 선택, 트레이너가 직접 추가/삭제 가능.
  - 삭제는 오른쪽 위 '편집' → 타일 탭. 토스트의 '되돌리기'로 원래 자리(+작성 중 기록)까지 복구.
  - 카테고리: 하체 / 상체 / 코어 / 전신 / 기타. 상단 탭으로 이동, 스크롤 시 현재 탭 강조. 탭은 한 줄을 넘기지 않는다.
  - 타일 안 운동명은 가로·세로 가운데 정렬, `word-break:keep-all` + `text-wrap:balance`. 띄어쓰기 없는 이름은 `.one-word`(word-break:normal)로 글자 단위로 나눠야 balance가 먹는다 (keep-all이면 끝 글자만 넘어감).
  - 카테고리 안 운동은 가나다순 (`localeCompare('ko')`).
  - kg / ea / set은 러닝머신처럼 자주 쓰는 숫자 프리셋 칩 + `− +` 스테퍼.
  - "+ 줄 추가" 버튼은 현재 줄을 복사해 다음 줄로 (버튼 문구는 한 줄에 들어가게 짧게).
- LLM·OCR은 쓰지 않는다 (비용 문제).
- 출력 형식은 아래와 정확히 같아야 한다. 복사하기 + Web Share API(카톡 공유).
  ```
  데드리프트
  20kg 16ea 2set
  30kg 12ea 2set
  힙쓰러스트
  빈바 15ea 4set
  ```
- 저장: DB 없음. localStorage에 `pt-log:v1:` 접두사로 저장 (같은 github.io 출처의 다른 프로젝트와 충돌 방지).
  - 운동 리스트와 작성 중인 기록 모두 저장.
  - 트레이너는 하루에도 PT를 여러 번 한다 → "오늘" 개념을 쓰지 않는다. 화면 제목은 앱 이름 "PT일지".
  - 작성 중인 기록은 '새 기록 시작'을 두 번 누를 때만 지운다. 앱 종료 시 자동 삭제는 하지 않음
    (iOS가 백그라운드 앱을 임의로 종료해 보내기 전 기록이 날아갈 수 있음).
  - 편집 모드에서 백업 복사(JSON) / 불러오기 제공. 트레이너는 백업을 카톡 나와의 채팅에 보관.
  - `navigator.storage.persist()` 요청.
- 앱 형태: PWA, 홈 화면에 추가해서 사용 (홈 화면 PWA는 Safari 7일 삭제 정책 대상 아님).
- 서비스워커: "GitHub는 설치·업데이트만, 실제 실행은 폰에 저장된 버전". 캐시 우선으로 바로 열고 뒤에서 새 버전을 받아 다음 실행 때 적용(stale-while-revalidate). 200일 때만 캐시 갱신 → 사이트가 사라지거나 오프라인이어도 설치된 앱은 계속 열린다. 네트워크를 기다리지 않으므로 로딩바는 필요 없음. 배포할 때마다 `sw.js`의 `CACHE` 버전을 올릴 것.
- 배포: GitHub Pages, 개인 계정에 올린다 (Organization은 쓰지 않기로 함).
  - 주소: https://yezzero.github.io/pt-log/ (저장소 https://github.com/yezzero/pt-log, main 브랜치 루트에서 배포)
  - 재배포: `sw.js`의 `CACHE` 버전을 올리고 main에 push하면 1~2분 뒤 반영. 폰에는 그다음 실행 때가 아니라 그 다음다음 실행 때 보인다(뒤에서 받아 두었다가 적용).
  - 배포 후 URL(출처)이 바뀌면 localStorage 데이터에 접근할 수 없으므로 저장소 이름과 GitHub 사용자명은 바꾸지 않는다.
- 하단 여백: `--safe-b = max(safe-area-inset-bottom, 16px)`. PWA가 아닌 일반 브라우저에서도 하단 버튼이 화면 끝에 붙지 않게.

## 파일 구조 (저장소 루트 = 배포 루트)
- `index.html` — 앱 전체 (HTML/CSS/JS 한 파일). 맨 위 상수 `CATEGORIES`, `KG_PRESETS`, `EA_PRESETS`, `SET_PRESETS`, `STEP`, `DEFAULT_EXERCISES`로 설정.
- `manifest.webmanifest` — PWA 매니페스트 (이름 "PT 운동일지", 짧은 이름 "PT일지").
- `sw.js` — 서비스워커.
- `icons/` — apple-touch-icon(180), 192, 512, maskable 512.
- `.nojekyll` — GitHub Pages가 Jekyll 처리 없이 파일을 그대로 배포하게.
- `.claude/launch.json` — 로컬 미리보기 서버(python http.server 8765). git에는 올리지 않음.

## 디자인 토큰
- 라이트: bg #F1F2EE, surface #FFFFFF, surface-2 #E4E7E1, ink #17201B, muted #66706A, line #D3D8D0, accent #1F6F4A, hi(변환 버튼) #F3C13A
- 다크: prefers-color-scheme으로 대응 (index.html의 :root 변수 참고)
- 폰트: 시스템 폰트(-apple-system, Apple SD Gothic Neo), 숫자는 tabular-nums.

## 아직 확인할 것
- 트레이너 폰이 아이폰인지 (안드로이드라면 APK 등 다른 선택지도 가능).
- 프리셋 숫자·기본 운동 목록: 첫 배포 후 트레이너에게 사이트를 보여주고 리스트를 받아 재배포 예정.
