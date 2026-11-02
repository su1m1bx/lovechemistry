# 프런트엔드 UI/UX 2차 설계

## 현행 작업 계약 / 2026-10-26

- 적용 기준은 `docs/12_INTEGRATED_DESIGN_V2.md`, `docs/15_IMPLEMENTATION_CONTRACT.md`와 결정 047~053이다. 아래 보존 원안의 저장·복원 화면, API·fixture·설정 제안을 그대로 구현하지 않는다.
- Slice 0은 metadata·virtual manifest 부트, 홈·이름 검증·빈 갤러리뿐이다. GameState·Science·저장 검사·복원·임시 catalog가 없다. Slice 1 Day, Slice 2 Science로 순차 연결한다.
- State facade의 공개 envelope·selector 결과만 소비한다. UI에서 phase·시험·슬롯·숙련도·capability를 재계산하지 않고 effectId·점수를 전달하지 않는다. 재전송은 원래 envelope 전체를 유지한다.
- HomeShell/GameShell 상호 배타·단일 overlay·포커스 복귀·홈 전용 갤러리를 유지한다. 정본 실패는 막고 개별 이미지 실패는 국소 대체하며 상태를 바꾸지 않는다.
- npm·package-lock·TS/Vite·scripts 통합을 Frontend가 맡고 QA가 테스트 설정·수동 검증을 맡는다. Asset resolver를 UI adapter에 다시 구현하지 않는다. 파일은 승인된 Slice에서 필요한 만큼만 만든다.
- 이름 grapheme은 결정 045, path 입력 allow-list·최종 URL 보존은 결정 051을 따른다. 실제 소문자 lovechemistry 경로도 검증한다.
- 저장 미구현·메모리 진행 중립 문구는 `docs/15` 6절을 사용한다. final copy·캐릭터 대사·비주얼은 유예한다.
- 상태: **PM 계약 수정 반영 / QA 재검토 필요 / 구현 미승인·NOT TESTED**.

## 보존 원안 / 2026-09-28 / 구현 근거 아님

**상태:** `DESIGN PROPOSAL / 코드 구현 승인 아님`
**범위:** Slice 0~2의 프런트엔드 구조와 UI 계약
**작성일:** 2026-09-28
**코드·패키지·자산 변경:** 없음

## 1. 문서 목적과 기준

이 문서는 1차 정보 구조를 실제 구현 단위로 좁힌 2차 설계다. 화면 책임, 컴포넌트 경계, 데이터·props, 런타임 화면 상태, 반응형·접근성·테스트 계약을 정의하지만 코드, 패키지, 자산 또는 게임 규칙을 만들지 않는다.

검토 기준은 다음과 같다.

- `docs/00_PM_MASTER_SPEC.md`
- `docs/01_LOCKED_GAME_RULES.md`
- `docs/05_GAME_SYSTEMS_SPEC.md`~`docs/11_OPEN_QUESTIONS.md`
- `agents/frontend-uiux/BRIEF.md`, `agents/frontend-uiux/PROPOSAL.md`
- Science/Game Systems, State/Save, Narrative, Asset Integration의 관련 `BRIEF.md`와 `PROPOSAL.md`
- `agents/qa/BRIEF.md`

문서 우선순위는 잠금 규칙, 사용자 승인 결정 015·020·021, 승인된 역할 간 계약, 본 설계 순이다. 본 문서에서 `권고` 또는 `후보`라고 표시한 사항은 PM 승인 전 정본이 아니다.

### 1.1 최신 PM 계약 정렬(결정 043~046)

이 절은 아래 원안 중 충돌하거나 미정으로 남은 제안보다 우선한다. 문서 정렬일 현재 코드·패키지·production build 증거는 없으며 QA 재검토 전 구현 승인 또는 Ready to Code를 뜻하지 않는다.

- **Topic slice:** Slice 1 UI는 topic 목록·ID·선택을 요구하지 않고 generic 오전·오후 완료 의도만 보낸다. selector에는 완료 불리언만 있으며 숙련도 변화와 snapshot topic이 없다. Slice 2 ScienceCatalog ready 뒤에만 `selectedTopicId`, topic 선택 UI, `completeMorningClass(topicId, commandId)`, 오후 무료 `0→1`을 노출한다. Slice 1 fake topic fixture는 금지한다.
- **시험 graph:** production UI·public export·command registry에는 raw score API가 없다. test adapter는 `tests/helpers/resolveExamForTest.ts`에만 있고 marker `slice-test-exam-outcome-v1`과 `49 | 50 | 100`만 허용한다. production `src`는 tests를 import하지 않고 Vite production input은 `src/main.tsx` 단일 graph다. 향후 internal 논리 위치 `src/state/internal/applyVerifiedExamOutcome.ts`도 실제 시험 Slice 전 production entry graph에서 import하지 않는다.
- **이름 oracle:** trim 후 `graphemer@1.4.0` 결과만 authoritative count이며 `1~12`를 허용한다. `Intl.Segmenter`는 진단 전용이고 package unavailable은 build failure다. `''=0`, `김철수=3`, `가나다라마바사아자차카타=12`, 뒤에 `파` 추가 `=13`, decomposed `가=1`, `e\u0301=1`, family ZWJ emoji `=1`, skin-tone emoji `=1`, Korean flag `=1`, `김 철수=4`를 고정 fixture로 쓰며 `Cc`는 count와 무관하게 거부한다. 패키지는 구현 승인 전 설치하지 않는다.
- **Asset URL oracle:** manifest path 검증 뒤 `appBaseUrl = new URL(import.meta.env.BASE_URL, document.baseURI)`, `assetUrl = new URL(validatedPath, appBaseUrl)`를 각각 한 번 실행한다. Vite `base`는 `./` 단일값이고 surface·route 문자열은 사용하지 않는다. `/LoveChemistry/`와 `/LoveChemistry/index.html?x=1#top`에서 `assets/ui/a.webp`는 모두 `https://example.test/LoveChemistry/assets/ui/a.webp`, root document에서는 `https://example.test/assets/ui/a.webp`다.
- **Asset 거부:** 선행 `/`, `public/`, `.`·`..` segment, 역슬래시, protocol·host, query·hash, 빈 path, duplicate slash, trailing slash를 거부한다. 대소문자를 바꾸지 않고 build artifact와 exact case mismatch를 거부한다.

결정 043~046은 모두 잠금 변경 없음이다.

## 2. 범위와 비범위

### 2.1 Slice 0~2 범위

| Slice | 설계 범위 | 완료 기준 |
|---|---|---|
| Slice 0 | 앱 부트, 무라우터 최상위 상태, `HomeShell`, 타이틀, 이름 입력, 불러오기, 홈 갤러리, 표시·접근성 설정, 부트 오류, 플레이스홀더·상대 경로 | 저장 유무·손상·접근 불가와 홈 하위 화면이 규칙을 위반하지 않고 전환됨 |
| Slice 1 | `GameShell`, Day HUD, phase UI, Day 전환, 수업·자유시간의 화면 골격, 게임 도구 오버레이 계약 | `DAY NN / 30`, 현재 phase, 슬롯 상태와 강제 흐름을 상태 정본 그대로 표시함 |
| Slice 2 | 원소 1~20 주기율표, 원소 상세, capability 기반 도구, 학습 주제 UI, 일반/시험 제한 재사용 계약 | 공간 관계, 기본 사실, 숙련도별 도구 차이와 문맥 복귀를 데스크톱·모바일에서 보존함 |

### 2.2 비범위

- 시험 문항·제출·채점·결과 화면 구현 상세
- 실제 VN 대본, 루트, 미션, 인벤토리, 매점의 완성 UI
- 호감도 공개 방식의 최종 결정
- 최종 색상, 서체, 아이콘, 캐릭터 외형, 표정, CG 구도
- 실제 저장 어댑터, 상태 전이기, 과학 정본 데이터 구현
- 패키지 설치와 빌드·배포 파일 생성

시험과 관련해서는 Slice 2 주기율표를 시험에서도 안전하게 재사용하기 위한 입력 계약만 정의한다. 시험 화면 자체를 Slice 0~2에 끌어오지 않는다.

## 3. 구체 설계

### 3.1 설계 원칙

1. UI는 게임 규칙을 계산하지 않고 State·Systems가 제공한 view model과 command 결과를 표현한다.
2. URL, DOM, 열려 있는 탭과 오버레이는 `GameState`의 정본이 아니다.
3. `HomeShell`과 `GameShell`은 동시에 렌더링하지 않는다. 갤러리는 `HomeShell` 내부에만 존재한다.
4. 일반 도구는 한 번에 하나만 여는 단일 오버레이 계층을 사용한다. 확인 대화상자만 해당 오버레이 위의 일시적 alert dialog가 될 수 있다.
5. 로딩, 빈 상태, 잠김, 오류, 처리 중, 완료를 모든 데이터 화면에서 분리한다.
6. 원소 사실, Day·phase, 슬롯 소비, 숙련도, 저장 유효성은 UI가 추론하지 않는다.
7. 외형 미정 자산은 기하 도형과 기능적 텍스트만 사용하며 인물의 신체·복장·색을 암시하지 않는다.

### 3.2 제안 파일·컴포넌트 구조

아래는 향후 구현 시의 **논리 구조 제안**이다. 이 문서 작업에서는 파일을 생성하지 않는다.

```text
src/
├─ main.tsx
├─ app/
│  ├─ AppRoot.tsx
│  ├─ AppRoot.module.css
│  ├─ appView.ts
│  ├─ boot.ts
│  └─ guards.ts
├─ shells/
│  ├─ HomeShell.tsx
│  ├─ HomeShell.module.css
│  ├─ GameShell.tsx
│  └─ GameShell.module.css
├─ screens/
│  ├─ home/
│  │  ├─ TitleScreen.tsx
│  │  ├─ NewGameScreen.tsx
│  │  ├─ LoadScreen.tsx
│  │  ├─ GalleryScreen.tsx
│  │  ├─ GalleryDetail.tsx
│  │  ├─ SettingsScreen.tsx
│  │  └─ home.module.css
│  ├─ day/
│  │  ├─ DayTransitionScreen.tsx
│  │  ├─ ClassPhaseScreen.tsx
│  │  ├─ FreeTimeScreen.tsx
│  │  └─ day.module.css
│  └─ learning/
│     ├─ PeriodicTableScreen.tsx
│     ├─ ElementDetail.tsx
│     ├─ ElementCompare.tsx
│     ├─ StudyTopicsScreen.tsx
│     ├─ StudyTopicDetail.tsx
│     └─ learning.module.css
├─ components/
│  ├─ context/
│  │  ├─ DayHud.tsx
│  │  ├─ PhaseTrack.tsx
│  │  └─ ActionSlotStatus.tsx
│  ├─ navigation/
│  │  ├─ HomeActions.tsx
│  │  ├─ GameToolMenu.tsx
│  │  └─ ContextReturn.tsx
│  ├─ overlays/
│  │  ├─ OverlayHost.tsx
│  │  ├─ ToolDialog.tsx
│  │  └─ ConfirmDialog.tsx
│  ├─ periodic-table/
│  │  ├─ PeriodicTableGrid.tsx
│  │  ├─ ElementCell.tsx
│  │  ├─ PeriodicTableToolbar.tsx
│  │  └─ CapabilityNotice.tsx
│  └─ feedback/
│     ├─ BootStatus.tsx
│     ├─ EmptyState.tsx
│     ├─ ErrorState.tsx
│     ├─ InlineNotice.tsx
│     └─ BusyGuard.tsx
├─ adapters/
│  ├─ uiStateAdapter.ts
│  ├─ persistenceViewAdapter.ts
│  ├─ gameViewAdapter.ts
│  ├─ learningViewAdapter.ts
│  └─ assetUrl.ts
├─ styles/
│  ├─ reset.css
│  ├─ tokens.css
│  ├─ globals.css
│  └─ utilities.css
└─ data/
   └─ (타 역할 소유 정본; Frontend가 과학값을 만들지 않음)

tests/
├─ unit/
│  ├─ app-guards.test.ts
│  ├─ persistence-view.test.ts
│  ├─ learning-capabilities.test.ts
│  └─ asset-url.test.ts
├─ components/
│  ├─ home/
│  ├─ context/
│  └─ periodic-table/
├─ integration/
│  ├─ app-shell-flow.test.tsx
│  ├─ game-phase-flow.test.tsx
│  └─ periodic-table-context.test.tsx
├─ e2e/
│  ├─ slice0-home.spec.ts
│  ├─ slice1-day-shell.spec.ts
│  ├─ slice2-learning.spec.ts
│  ├─ gallery-guard.spec.ts
│  └─ pages-subpath.spec.ts
├─ accessibility/
│  ├─ keyboard.spec.ts
│  ├─ focus.spec.ts
│  └─ axe.spec.ts
└─ fixtures/
   ├─ persistence.ts
   ├─ game-view.ts
   ├─ elements.ts
   └─ learning.ts
```

구조 원칙:

- `screens`는 화면 조합과 사용자 의도 전달만 담당한다.
- `components`는 도메인 값을 변경하지 않는 표현·상호작용 단위다.
- `adapters`는 State·Systems·Science의 정본을 UI 전용 view model로 바꾸며 사실을 새로 만들지 않는다.
- `guards`는 셸·화면 전이 권한만 확인한다. 시험 의무나 엔딩 자격 같은 도메인 판정은 하지 않는다.
- 기능 하나를 지나치게 많은 추상 계층으로 나누지 않는다. 두 화면 이상에서 실제 재사용되는 경우에만 공통 컴포넌트로 올린다.

### 3.3 최상위 무라우터 상태

V1에는 URL 라우터를 두지 않는다. 최상위 메모리 상태는 다음 세 축만 가진다.

| 축 | 허용값 | 의미 |
|---|---|---|
| `boot` | `loading`, `ready`, `recoverableError`, `fatalError` | 정본·저장소·초기 설정 준비 상태 |
| `shell` | `home`, `game` | 현재 정보 영역. 동시에 둘일 수 없음 |
| `surface` | 셸별 허용 화면 ID | UI 화면 위치. 저장 정본이 아님 |

권고 화면 상태:

```text
HomeSurface = title | newGame | load | gallery | galleryDetail | settings
GameSurface = phase | dayTransition | terminalResult
GameOverlay = none | periodicTable | missions | inventory | store | help
```

`GameSurface`는 `calendar.phase`를 임의로 바꾸지 않는다. State가 반환한 phase view에 맞는 화면을 선택할 뿐이다. 시험·`endingSelection`·`characterEndingScene`·`terminal`은 추후 같은 `GameShell`의 강제 모드로 렌더링하고 일반 도구 노출 여부를 State의 허용 명령 목록으로 결정한다.

전이 가드:

| 요청 | 허용 조건 | 거부 시 동작 |
|---|---|---|
| 홈 하위 화면 이동 | `shell = home`이고 `boot = ready` | 현재 화면 유지, 개발 진단만 기록 |
| 갤러리 열기 | `shell = home`이고 갤러리 카탈로그 로드 성공 | 활성 게임이면 렌더링하지 않음 |
| 새 게임 시작 | 이름 검증 성공, 덮어쓰기 필요 시 확인 완료, State 생성 성공 | 입력 보존, 오류 표시 |
| 불러오기 | 로드 결과가 `loadable`이고 State 복원 성공 | 홈 유지, 손상·비호환 사유 표시 |
| 게임 도구 열기 | `shell = game`이고 현재 phase의 capability가 허용 | 트리거 유지, 불가 이유 표시 |
| 홈 복귀 | terminal 또는 계약상 허용된 명시적 이탈 | 게임 정본을 UI가 삭제하지 않음 |

브라우저 뒤로 가기는 게임 상태 되감기에 사용하지 않는다. V1에서는 앱 화면 이력을 `history.pushState`로 흉내 내지 않으며, 새로고침은 저장 계약에 따라 마지막 커밋 지점에서 다시 부트한다.

### 3.4 `HomeShell`

`HomeShell`은 제목 영역, 현재 홈 화면의 `<main>`, 보조 설정 진입만 가진다. 활성 게임 HUD, 게임 도구, 시험·미션 링크를 포함하지 않는다.

#### 타이틀 화면

레이아웃:

- 제품명과 영문 부제를 텍스트로 표시한다.
- 주요 동작 순서는 `이어하기/불러오기`, `새 게임`, `CG 갤러리`다. 유효 저장이 없으면 `새 게임`을 첫 동작으로 둔다.
- 설정은 주요 플레이 동작과 시각적으로 분리한 보조 동작이다.
- 저장·복구 경고는 버튼과 떨어진 전역 토스트가 아니라 제목 아래의 지속 가능한 상태 영역에 둔다.

동작:

- 유효 활성 회차가 있으면 `이어하기`의 보조 문구에 `DAY NN / 30`, 체크포인트 종류의 사용자용 설명을 표시한다.
- terminal 저장은 재개 대상으로 표시하지 않는다. 완료한 결말 요약과 `새 게임`만 제공한다.
- 저장 없음과 불러오기 실패를 같은 비활성 상태로 합치지 않는다.
- 갤러리는 활성 회차 유무와 관계없이 홈에서 접근할 수 있다.

#### 이름 입력과 새 게임

한 화면 안에서 다음 순서를 유지한다.

1. 이름 필드
2. 남성 주인공 고정 안내
3. 30일·Day 시작 저장의 짧은 안내
4. 시작 버튼과 취소

이름 UX:

- 라벨을 placeholder로 대체하지 않는다.
- 입력 중 값, 앞뒤 공백 제거 후 값, 오류를 구분한다.
- 공백만 입력, 정본 정책의 최대 길이 초과, 지원하지 않는 제어 문자를 오류로 처리한다.
- 글자 수는 UTF-16 길이가 아니라 사용자 인식 문자 단위 정책이 확정되면 그 정책을 따른다.
- 오류 요약과 필드별 설명을 연결하고, 제출 실패 시 이름 필드로 포커스를 이동한다.
- 성별 선택 컨트롤은 만들지 않는다. 안내 문구는 외형을 묘사하지 않는다.
- 기존 활성 회차가 있으면 시작 버튼 직후 별도 확인에서 덮어쓰기 결과와 MetaState 유지 사실을 설명한다.

이름 길이와 허용 문자 계산이 미정이라는 원안은 결정 045로 **SUPERSEDED**다. 최신 정책과 fixture는 1.1절을 따른다.

#### 불러오기

V1 단일 활성 회차를 여러 저장 슬롯처럼 표현하지 않는다. 화면은 저장 요약 한 건과 복구 상태를 보여 준다.

표시 항목:

- `DAY NN / 30`
- `Day N 시작`, `Day 10 시험 통과 후 방과 후`, `종료된 회차` 중 사용자용 체크포인트 설명
- 진단용 저장 시각이 유효할 때의 보조 표시
- 정상, 백업 복구, 이관 필요, 비호환, 손상, 저장 없음 상태
- 실행 가능한 다음 동작과 데이터 영향

상태별 동작:

| 상태 | 기본 동작 | 보조 동작 |
|---|---|---|
| `none` | 새 게임으로 이동 | 타이틀로 돌아가기 |
| `validDayStart` | 이어하기 | 활성 회차 삭제 요청 |
| `validExamResolved` | 같은 Day 방과 후 또는 보류 엔딩 흐름 이어하기 | 체크포인트 설명 보기 |
| `recoveredBackup` | 복구본으로 이어하기 | 복구 사유 보기 |
| `migrationRequired` | State가 지원한다고 판정한 이관 실행 | 취소 |
| `incompatible` | 새 버전/호환 안내 | 원본 유지, 타이틀 복귀 |
| `corruptNoBackup` | 명시적 초기화 검토 | 취소, 원본 자동 덮어쓰기 금지 |
| `storageUnavailable` | 저장 없이 시작 허용 여부 안내 | 재시도 |
| `terminal` | 완료 요약 | 새 게임, 타이틀 복귀 |

UI는 내부 A/B 버퍼, revision, 체크섬을 사용자 슬롯으로 보여 주지 않는다. 기술 세부는 오류 진단 펼침 영역에서만 제한적으로 제공한다.

#### 홈 CG 갤러리

갤러리는 `MetaState.unlockedCGs`와 Narrative/Asset이 제공할 스포일러 안전 카탈로그를 결합한 읽기 전용 화면이다.

- 목록 항목 자체를 UI가 추론하거나 원소·캐릭터 목록으로 자동 생성하지 않는다.
- 해금 항목은 승인된 썸네일, 스포일러 등급에 맞는 제목, 상세 열기 동작을 제공한다.
- 미해금 항목은 `미해금`과 비식별 플레이스홀더만 표시한다. 캐릭터명, 루트명, 사건명, 조건을 노출하지 않는다.
- Ne 관련 항목은 카탈로그가 명시적으로 공개 가능하다고 제공하기 전 존재 개수도 누설하지 않는다.
- 상세는 해금된 항목만 열며 이전·다음은 해금된 항목 안에서만 이동한다.
- 갤러리 탐색은 `GameState` 명령을 발생시키지 않는다.
- 자산 실패 시 다른 CG로 대체하지 않고 승인된 `placeholder.cg`와 오류 설명을 사용한다.

정확한 CG 목록이 없으므로 Slice 0 구현 후보에서는 카탈로그 없음 상태를 정상 빈 상태로 처리하되 가짜 슬롯을 만들지 않는다.

#### 설정

설정은 홈의 독립 화면으로 두며 음향 섹션은 존재하지 않는다.

- `MetaState.optionalSettings`의 승인 키만 렌더링한다.
- 승인 키가 아직 없으면 운영체제의 모션 감소·고대비·브라우저 확대를 존중한다는 설명만 제공하고 임의의 영속 키를 만들지 않는다.
- 설정 변경은 마지막 커밋 GameState를 앞당겨 저장하지 않고 MetaState만 갱신하는 State 명령을 사용한다.
- 적용 실패 시 컨트롤을 성공 상태로 두지 않고 이전 값과 오류를 함께 보여 준다.

후보 설정 키는 9절 Change Request에서 제안한다.

#### 부트와 부트 오류

부트 순서의 UI 관점은 다음과 같다.

```text
정적 앱 시작
→ 필수 구성·원소 정본·자산 매니페스트 검증
→ 저장소 접근 및 최신 유효 저장 판정
→ MetaState와 홈 요약 생성
→ HomeShell 표시
```

부트 상태:

| 상태 | 화면 | 허용 동작 |
|---|---|---|
| 초기 로딩 | 제품명, `게임 데이터를 확인하는 중` | 중복 시작 금지 |
| 저장 없음 | 정상 타이틀 | 새 게임, 갤러리, 설정 |
| 백업 복구 | 타이틀 상단 지속 알림 | 복구본 확인, 이어하기 |
| 저장 접근 불가 | 저장 불가 경고 | 재시도, 승인된 경우 세션 전용 진행 |
| 저장 비호환·손상 | 복구 전용 화면 또는 타이틀 경고 | 원본 보존, 이관·초기화 검토 |
| 필수 과학 데이터 오류 | 치명적 부트 오류 | 재시도, 진단 정보 보기 |
| 필수 자산 매니페스트 오류 | 치명적 또는 명시적 플레이스홀더 전환 | 계약된 대체가 가능할 때만 홈 진입 |

치명적 오류 화면에는 `새 게임`을 제공하지 않는다. 과학 정본 누락 상태에서 거짓 기본값으로 게임을 시작할 수 없기 때문이다. 오류 상세는 사용자 문구와 복사 가능한 진단 코드로 분리하고 원시 저장 데이터는 기본 노출하지 않는다.

### 3.5 `GameShell`

`GameShell`은 활성 회차 및 강제·terminal 흐름의 공통 프레임이다. 홈 메뉴와 갤러리를 포함하지 않는다.

구성:

```text
GameShell
├─ SkipLink
├─ DayHud
│  ├─ DayLabel
│  ├─ PhaseTrack
│  └─ ActionSlotStatus
├─ GameMain
│  └─ PhaseSurface
├─ GameToolMenu
├─ StatusAnnouncer
└─ OverlayHost
```

모드:

| 모드 | HUD | 도구 | 이탈 |
|---|---|---|---|
| `normal` | 전체 Day·phase·슬롯 | State가 허용한 일반 도구 | 계약된 홈 복귀만 |
| `forced` | Day·현재 강제 phase | 최소화, 허용 도구만 | 일반 화면 이동 금지 |
| `terminal` | 종료 Day·결과 문맥 | 없음 | 타이틀 복귀만 |

도구 메뉴는 주기율표, 미션, 인벤토리, 매점의 capability를 입력받아 렌더링한다. 갤러리는 타입과 데이터 양쪽에서 메뉴 후보가 아니다. 매점은 향후 버튼 도구로 추가하며 장소 목록에는 넣지 않는다.

### 3.6 Day HUD와 phase UI

#### Day HUD

항상 보이는 핵심 정보:

- `DAY NN / 30`
- 현재 phase의 한국어 이름
- 점심·방과 후 행동 슬롯 상태
- 현재 장소가 존재하는 화면에서는 장소명
- 필수 시험 또는 저장 실패처럼 진행을 제한하는 상태

표시 규칙:

- Day는 2자리 장식을 사용할 수 있지만 화면 낭독명은 `30일 중 7일`처럼 자연어로 제공한다.
- 슬롯은 `남음/사용함/아직 아님/시험 합격 후`를 텍스트로 구분한다.
- 일반 Day에서 시험 단계가 없는 것을 오류나 빈 칸으로 보이지 않는다.
- Character End terminal 뒤 다음 Day·시험 예고를 표시하지 않는다.
- 저장 성공 아이콘만으로 상태를 전달하지 않는다. `Day 8 시작 지점 저장됨`처럼 경계를 명시한다.

#### Phase Track

일반 phase 순서:

`아침 조회 → 오전 수업 → 점심 → 오후 수업 → 방과 후 → 귀가`

시험일에는 State가 제공한 단계에 `시험`을 오후 수업과 방과 후 사이에 삽입한다. UI가 Day 번호만 보고 시험 단계를 자체 추가하지 않는다.

- 데스크톱: 가로 단계 목록으로 완료, 현재, 예정, 잠김을 텍스트와 형태로 표시한다.
- 모바일: 현재 단계와 `3 / 6` 진행을 우선 표시하고 전체 단계는 펼침 목록으로 제공한다.
- 완료 단계는 탐색 링크가 아니며 과거 상태로 돌아갈 수 있는 것처럼 보이지 않는다.
- 현재 단계에는 `aria-current="step"`에 해당하는 의미를 제공한다.
- phase 변경 알림은 화면 제목 이동으로 전달하며 라이브 영역에서 모든 HUD를 반복 낭독하지 않는다.

#### Slice 1 화면 골격

- `DayTransitionScreen`: Day, 오늘의 필수 일정, 시험 예정, 마지막 저장 경계를 보여 준다.
- `ClassPhaseScreen`: Systems가 제공한 학습 주제 선택 또는 복습·진단 상태를 보여 준다. 학습 결과를 계산하지 않는다.
- `FreeTimeScreen`: 점심/방과 후 한 슬롯의 행동 후보, 비용 `1`, 잠금 이유, 실행 전 확인을 보여 준다.
- `dayEnd` 확인: 현재 Day가 끝나고 중간 진행이 다음 Day 시작 스냅샷으로 커밋된다는 점을 설명한다. 저장 성공 전 다음 Day 화면을 열지 않는다.

Slice 1에서는 실제 VN·미션 콘텐츠 없이도 `availableActions` fixture로 셸과 phase 동작을 검증할 수 있어야 한다. fixture는 제품 데이터가 아니며 production 번들에 포함하지 않는다.

### 3.7 오버레이 계약

오버레이는 화면 전환을 가장한 중복 상태가 아니라 현재 문맥에서 잠시 사용하는 도구다.

`OverlayRequest`가 가져야 할 논리 정보:

| 필드 | 목적 |
|---|---|
| `kind` | `periodicTable`, `missions`, `inventory`, `store`, `help` |
| `context` | 호출 화면·시험 여부를 포함한 정본 문맥 ID |
| `capabilities` | 허용 기능. UI가 phase로 재계산하지 않음 |
| `returnFocusId` | 닫은 뒤 복귀할 호출 요소 |
| `returnLabel` | `문항으로 돌아가기`, `미션으로 돌아가기` 같은 문맥 문구 |

동작 규칙:

- 일반 오버레이를 둘 이상 중첩하지 않는다.
- 데스크톱에서는 중앙 dialog 또는 우측 도구 패널, 모바일에서는 전체 화면 dialog가 될 수 있지만 의미와 닫기 계약은 동일하다.
- 열 때 제목으로 포커스를 이동하고, 닫을 때 호출 요소로 돌린다.
- Escape 닫기는 현재 흐름이 허용할 때만 제공한다. 시험 주기율표는 닫을 수 있지만 시험 자체는 닫지 못한다.
- 오버레이에서 발생한 도메인 명령은 성공 응답 전 중복 제출을 막는다.
- 오버레이를 닫아도 Day, phase, 슬롯, 시험 답안이 변하지 않는다.

### 3.8 주기율표 데스크톱·모바일 grid

#### 공간 구조

원소 1~20을 실제 족 1~18과 주기 1~4 위치에 둔다.

| 주기 | 대화식 위치 |
|---|---|
| 1 | H: 1족, He: 18족 |
| 2 | Li: 1족, Be: 2족, B~Ne: 13~18족 |
| 3 | Na: 1족, Mg: 2족, Al~Ar: 13~18족 |
| 4 | K: 1족, Ca: 2족 |

범위 밖 위치는 빈 구조 셀이다. 원소가 누락된 것처럼 `?`를 표시하거나 대화식 잠금 셀로 만들지 않는다. 표 위 설명에 `이 도구는 원자번호 1~20만 다룹니다`를 둔다.

의미 구조는 족 머리글과 주기 머리글이 있는 표 관계를 우선한다. 시각 배치는 18열 grid로 보이되, 보조 기술에는 각 원소의 족·주기 관계가 전달되어야 한다.

#### 데스크톱

- 18열 전체 표와 우측 원소 상세를 같은 화면에 배치한다.
- 원소 셀에는 원자번호, 기호, 짧은 한국어명을 표시한다.
- 최소 셀 크기보다 화면이 좁아지면 억지로 축소하지 않고 표 영역만 가로 스크롤한다.
- 선택 셀과 키보드 포커스 셀을 색상 외 테두리·상태 텍스트로 구분한다.
- 상세가 길어져도 전체 viewport를 고정 높이로 가두지 않는다.

#### 모바일

- 카드 목록으로 대체하지 않고 18열 공간 관계를 유지한 가로 스크롤 표를 제공한다.
- 표 앞에 `좌우로 이동해 1족부터 18족까지 확인할 수 있습니다` 안내와 현재 선택의 `2주기 17족` 문맥을 제공한다.
- 선택한 상세는 표 아래의 문서 흐름에 표시한다. 상세를 고정 하단 시트로 덮어 표와 이중 스크롤을 만들지 않는다.
- 원소 선택 후 상세 제목으로 자동 스크롤하지 않는다. 사용자가 `상세 보기`를 실행했을 때만 포커스를 상세로 이동한다.
- 가로 모바일의 낮은 높이에서도 닫기와 문맥 복귀 버튼이 가려지지 않는다.

#### 키보드

- Tab은 도구 모음, 표의 대화식 원소, 상세 동작 순으로 예측 가능하게 이동한다.
- 방향키 지원 시 실제 족·주기 좌표에서 가장 가까운 대화식 원소로 이동한다. 빈 구조 셀에 포커스를 두지 않는다.
- Home/End는 현재 주기의 첫/마지막 대화식 원소, Ctrl+Home은 H로 이동하는 권고 동작이다.
- 키보드 단축 동작을 구현하지 못해도 20개 원소 모두 Tab과 활성화 키로 접근 가능해야 한다.

### 3.9 원소 상세

상세는 다음 정본 필드만 표시한다.

- 원자번호
- 기호
- 한국어명, 영문명
- 족, 주기
- 전자껍질별 전자 수
- 승인된 원자가전자 정보

전자배치는 `2, 8, 1`의 텍스트를 기본으로 제공하고, 시각적 껍질 표현을 추가하더라도 텍스트를 대체하지 않는다. 캐릭터 성격·관계 모티프는 과학 상세 카드에 넣지 않는다.

오류 처리:

- 필수 과학 필드 하나라도 누락되면 해당 값을 추정하지 않는다.
- 셀과 상세가 서로 다른 객체를 참조하지 않도록 동일 `ElementView`를 소비한다.
- 잘못된 원소 ID 요청은 전체 표를 유지하고 상세 영역에 오류와 전체 표 복귀를 제공한다.

### 3.10 capability 기반 주기율표

한 컴포넌트를 일반 플레이와 시험에서 재사용하되 `isExam` 하나에 조건을 흩뿌리지 않는다. 호출자가 완성된 capability 집합을 제공한다.

| capability | 일반 플레이 | 시험 제한 모드 |
|---|---|---|
| 1~20 공간 표 | 허용 | 허용 |
| 핵심 원소 상세 | 허용 | 허용 |
| 이름·기호·번호 검색 | 허용 | 금지 |
| 족·주기 필터 | Systems가 허용할 때 | 금지 |
| 두 원소 비교 | Systems가 허용할 때 | 금지 |
| 복합 비교 | Systems가 허용할 때 | 금지 |
| 미션·대화 힌트 | 문맥과 숙련도가 허용할 때 | 금지 |
| 오답 진단 | 학습 문맥이 허용할 때 | 금지 |
| 답안 변경·점수 보정 | 항상 금지 | 항상 금지 |

필수 입력 계약:

- `mode`: `standard` 또는 `examReference`
- `capabilities`: 검색, 필터, 비교 최대 개수, 힌트, 진단 허용 여부
- `elements`: Science 정본에서 만든 20개 `ElementView`
- `selectedElementId`: 현재 선택
- `origin`: 호출 문맥 식별자와 복귀 문구
- `onSelectElement`, `onClose`: UI 의도 콜백

시험 제한 모드 재사용 계약:

- 시험은 현재 답안, 고정 문항·선택지 순서, 현재 문항 인덱스를 자체 소유한다.
- 주기율표에는 시험 답안 변경 콜백을 전달하지 않는다.
- 열고 닫는 동안 시험 상태 객체를 재생성하거나 초기화하지 않는다.
- 닫으면 호출 버튼으로 포커스를 돌리고 같은 문항을 표시한다.
- 제한된 기능을 단순 CSS 숨김에만 의존하지 않는다. 금지 기능은 props·명령 양쪽에서 제공하지 않는다.
- 시험 제한 모드에서 일반 toolbar가 잠깐 나타나는 로딩 깜박임도 허용하지 않는다.

본 문서는 시험 문항 화면, 제출 검토, 채점 결과를 설계하지 않는다.

### 3.11 학습 UI

`StudyTopicsScreen`은 일곱 학습 주제를 목록과 상세로 제공한다. 정확한 명칭과 설명은 Science 정본을 사용한다.

주제 카드 정보:

- 주제명과 학습 목표
- 현재 숙련도 `0`, `1`, `2`, `3`
- 마지막 실제 상승 출처
- 지금 선택한 경로가 `무료 수업`, `혼자 공부`, `함께 공부` 중 무엇인지
- 예상 슬롯 비용과 다음 단계
- 현재 해금된 활용 도구
- 잠김 또는 실행 불가 이유

표현 규칙:

- 숙련도는 4단계 이산 척도로 표시하고 `75%` 같은 시험 성취 백분율로 오해시키지 않는다.
- 무료 수업에서 현재 단계가 1 이상이면 `숙련도 상승 없음, 복습·진단`을 확정 전에 표시한다.
- 숙련도 2·3은 자유 행동 슬롯을 쓰는 경로에서만 다음 단계 후보로 보여 준다.
- 미션 보상으로 숙련도 상승을 예고하지 않는다.
- 숙련도가 시험 점수 보너스나 자동 정답처럼 보이는 문구를 쓰지 않는다.
- 기본 원소 사실은 숙련도 0에서도 조회 가능하다는 점을 빈 상태에 명시한다.

데스크톱은 주제 목록과 상세를 병렬로, 모바일은 목록에서 상세로 이어지는 단일 흐름으로 배치한다. 함께 공부는 캐릭터 선택 후 즉시 수치만 적용하지 않고 향후 VN 장면 명령으로 넘긴다. Slice 2에서는 해당 명령의 시작 가능 여부와 비용 확인까지만 설계한다.

## 4. 데이터 / props / 화면 상태

아래 이름은 역할 간 의미를 고정하기 위한 설계 명칭이며 실제 TypeScript 선언이 아니다.

### 4.1 `AppRoot` 데이터

| 데이터 | 필수 내용 | 소유자 |
|---|---|---|
| `BootView` | 단계, 사용자 메시지, 오류 코드, 재시도 가능 여부 | App adapter |
| `HomeView` | 활성 저장 요약, 갤러리 요약, 승인 설정 목록 | State·Meta adapter |
| `GameView` | Day, phase, 장소, 슬롯, 허용 명령, 강제 모드 | State·Systems adapter |
| `AppViewState` | 현재 shell, surface, overlay | Frontend 임시 상태 |

`AppRoot`는 `BootView`가 ready가 되기 전 셸을 렌더링하지 않는다. `AppViewState`는 새로고침 복원 대상이 아니며 저장된 `GameState`에서 다시 결정한다.

### 4.2 셸 props

| 컴포넌트 | 입력 | 출력 의도 |
|---|---|---|
| `HomeShell` | 현재 `HomeSurface`, 홈 요약, 오류 알림 | 홈 화면 이동, 새 게임·로드·설정 명령 요청 |
| `GameShell` | `GameView`, 현재 화면, overlay 요청 가능 목록 | phase 명령 요청, 도구 열기, 허용된 홈 복귀 요청 |
| `OverlayHost` | 단일 overlay descriptor, origin, busy 상태 | 닫기, 도구별 의도 |

셸 props에 저장 원문, 정답, 과학 정본의 가변 참조를 직접 전달하지 않는다.

### 4.3 홈 화면 상태

| 화면 | 로컬 상태 | 외부 상태 |
|---|---|---|
| 타이틀 | 마지막 포커스 대상 | 저장 요약, 갤러리 가능 여부, 부트 경고 |
| 새 게임 | 이름 draft, touched, 제출 중, 덮어쓰기 dialog | 이름 정책, 활성 회차 존재, 생성 결과 |
| 불러오기 | 확인 dialog, 진단 펼침 | `LoadView` 판정 결과 |
| 갤러리 | 선택 CG ID, 상세 열림 | 카탈로그와 해금 ID |
| 설정 | 변경 draft, 저장 중 | 승인 키와 현재 Meta 값 |

이름 draft와 설정 draft를 `GameState`에 쓰지 않는다. 성공한 명령 이후에만 정본을 갱신한다.

### 4.4 `DayHud` props

| 필드 | 제약 |
|---|---|
| `day` | State가 검증한 1~30 |
| `totalDays` | 표시값 30, UI가 규칙 판정에 사용하지 않음 |
| `phaseLabel` | 승인된 표시 문자열 |
| `steps` | 완료·현재·예정·잠김 상태가 포함된 순서 목록 |
| `lunchSlot`, `afterSchoolSlot` | `available`, `used`, `future`, `blocked`와 사유 |
| `locationLabel` | 장소 문맥이 없으면 없음 |
| `checkpointMessage` | 저장 성공·실패 또는 없음 |

`DayHud`는 Day로 시험 여부를 계산하거나 슬롯을 차감하지 않는다.

### 4.5 주기율표 props

`ElementView`는 정본 값을 표시하기 위한 읽기 전용 구조다.

| 필드 | 표시 용도 |
|---|---|
| `id` | 안정 참조와 선택 |
| `atomicNumber` | 셀·상세 |
| `symbol` | 셀·상세 |
| `nameKo`, `nameEn` | 셀·상세·접근 가능한 이름 |
| `group`, `period` | grid 위치와 상세 |
| `shellElectrons` | 승인 전자배치 표시 |
| `valenceElectrons` | 승인 정보 |

`PeriodicTableCapabilities`는 다음 값을 명시한다.

- `search`: 허용 여부
- `groupPeriodFilter`: 허용 여부
- `compareLimit`: `0`, `2`, `many`
- `contextHints`: 허용 여부
- `diagnostics`: 허용 여부
- `coreDetail`: 항상 허용되는지 여부

화면 상태:

- `loading`: 정본 검증 중
- `readyNoneSelected`: 표만 표시
- `readySelected`: 표와 상세 표시
- `noSearchResults`: 필터 해제·전체 복귀 제공
- `invalidSelection`: 표 유지, 상세 오류
- `fatalDataError`: 사실 추정 없이 도구 사용 중단

### 4.6 학습 props

| 필드 | 의미 |
|---|---|
| `topicId`, `title`, `goal` | Science 정본 참조 결과 |
| `mastery` | 0~3 |
| `lastProgressSource` | 없음, 무료 수업, 혼자 공부, 함께 공부 |
| `availableModes` | 현재 phase에서 실제 가능한 학습 경로 |
| `costByMode` | Systems가 제공한 슬롯 비용 |
| `capabilityChanges` | 완료 시 State가 승인한 도구 변화 설명 |
| `blockedReason` | 공개 가능한 실행 불가 이유 |

UI는 `mastery + 1`을 결과로 약속하지 않는다. 명령 전에는 예상 결과, 성공 후에는 State가 반환한 실제 결과를 표시한다.

## 5. 충돌

### 5.1 해소된 문서 충돌

- `docs/00`의 성별 pending 요구는 결정 015와 최신 `docs/01`, `06`, `07`, `11`에 의해 `male` 고정으로 대체됐다. 본 설계는 이름만 입력받는다.
- `docs/00`의 모든 Day 10·20·30 시험 시행 문구는 결정 020의 조기 Character End·미래 시험 미실행 예외를 따른다.
- 과거 시험 중 주기율표 금지는 결정 021의 제한 기본 조회 허용으로 대체됐다.

### 5.2 현재 계약 충돌·긴장

| 항목 | 긴장 | 본 설계 처리 |
|---|---|---|
| 설정 화면 vs 승인 설정 키 없음 | 홈 설정은 요구되지만 `optionalSettings` 허용 키가 미정 | 승인 키 주입형 화면으로 두고, 승인 전에는 시스템 환경 존중 안내만 표시 |
| 이름 검증 vs 최대 길이 미정 | 비어 있음 검증 외 정확한 상한이 없음 | 정책 props 없이는 상한을 하드코딩하지 않고 CR 후보로 등록 |
| 홈 갤러리 vs 정확한 CG 목록 미정 | 가짜 잠금 슬롯은 스포일러가 될 수 있음 | 카탈로그 기반으로만 렌더링하고 목록 없음은 정상 빈 상태 처리 |
| 불러오기 UX vs 이중 버퍼 세부가 PROPOSAL | UI가 내부 구현에 결합할 위험 | `LoadView` 결과만 소비하고 A/B 버퍼를 사용자 슬롯으로 노출하지 않음 |
| 자산 비율 미정 vs VN 셸 검증 | 고정 프레임은 향후 실제 자산과 충돌 가능 | intrinsic size에 의존하지 않는 유연 영역과 중립 플레이스홀더 사용 |
| 시험 10점 단위 vs 49 경계 | 실제 시험 결과로 49가 생성되지 않음 | UI 흐름은 40/50/100을, 판정 계약은 별도 49 fixture로 검증 |
| 상대 자산 경로 vs 중첩 화면 표현 | 문자열 결합이 현재 URL에 상대적이면 잘못된 경로 가능 | 모든 자산 URL을 앱 문서 base 기준으로 한 번 해석 |

잠금 규칙을 바꿔야 하는 미해결 충돌은 발견하지 않았다.

## 6. 타협

### 6.1 무라우터

- 채택안: 앱 상태 전환. Pages 새로고침과 직접 URL 우회를 줄인다.
- 비용: 화면 URL 공유, 브라우저 뒤로 가기, 딥 링크를 제공하지 않는다.
- 보완: 화면 내 명시적 뒤로 가기와 `ContextReturn`을 제공하고 상태 되감기로 오해할 브라우저 이력을 만들지 않는다.

### 6.2 단일 오버레이

- 채택안: 도구 오버레이 하나와 확인 dialog 하나만 허용한다.
- 비용: 미션 상세 위에 주기율표를 연 뒤 또 인벤토리를 쌓는 식의 빠른 교차 탐색은 제한된다.
- 보완: origin과 복귀 문구를 보존하고 닫은 뒤 이전 문맥으로 정확히 돌아간다.

### 6.3 모바일 주기율표

- 채택안: 가로 스크롤 공간 표와 아래 상세.
- 비용: 한 화면에서 전체 18족을 읽기 어렵다.
- 보완: 족·주기 머리글, 현재 좌표 문구, 스크롤 안내를 제공한다. 카드 목록 단독 대체는 하지 않는다.

### 6.4 설정 미확정

- 채택안: 승인 키 기반 동적 목록과 시스템 환경 기본 존중.
- 비용: Slice 0에서 설정 화면이 최소 기능으로 보일 수 있다.
- 보완: 키가 승인되면 셸 변경 없이 행만 추가할 수 있게 한다. 임의 영속 키보다 계약 안정성을 우선한다.

### 6.5 부트 실패

- 채택안: 과학 정본 오류는 fail-closed, 개별 이미지 오류는 승인 플레이스홀더로 fail-soft 처리한다.
- 비용: 필수 데이터 일부 오류로 게임 전체 시작이 막힐 수 있다.
- 보완: 재시도와 진단 코드를 제공하되 거짓 과학값으로 진행시키지 않는다.

## 7. 미정

- 이름 최대 길이, 허용 문자, 사용자 인식 문자 계산 정책
- `MetaState.optionalSettings`의 승인 키와 기본값
- 저장 접근 불가 시 세션 전용 진행을 제품에서 공식 지원할지 여부
- 갤러리 카탈로그 ID, 비스포일러 제목, 잠금 항목 수 공개 정책
- 호감도 정확한 수치 공개 여부
- 대화 기록과 텍스트 표시 설정의 저장 범위
- 브라우저 최소 버전과 저사양 성능 예산
- 실제 자산 크기·종횡비·안전 영역
- 최종 색상, 서체, 아이콘, 장식 밀도
- 학습 주제별 최종 설명과 capability 공개 문구
- 일반 게임에서 주기율표 도구를 열 수 없는 세부 phase 목록

이 항목은 UI 상수나 임시 production 값으로 확정하지 않는다. fixture 값은 테스트 전용임을 명시한다.

## 8. 접근성

### 8.1 목표와 의미 구조

- WCAG 2.2 AA를 목표로 한다.
- 화면마다 하나의 식별 가능한 주 제목을 둔다.
- 랜드마크는 header, main, 보조 navigation, dialog를 명확히 나눈다.
- 새 화면 진입 시 제목, 검증 실패 시 첫 오류, dialog 진입 시 dialog 제목으로 포커스를 이동한다.
- 대사·상태 변경을 무분별한 라이브 영역으로 읽지 않는다.

### 8.2 키보드·포커스

- 모든 홈 동작, 이름 입력, 로드 확인, 갤러리, 설정, Day 진행, 주기율표, 학습 선택은 키보드만으로 완료 가능해야 한다.
- 포커스 표시를 제거하지 않고 배경과 AA 수준으로 구분한다.
- dialog는 포커스를 내부에 유지하고 닫은 뒤 실제 호출 요소로 복귀한다.
- 비활성 버튼만 두지 말고 공개 가능한 불가 이유를 연결한다.
- `display: none`으로 사라진 요소에 포커스가 남지 않게 한다.

### 8.3 시각·확대·모션

- 상태, 잠금, 정답, 오류를 색상만으로 구분하지 않는다.
- 본문과 핵심 조작은 200% 확대에서도 잘리거나 겹치지 않는다.
- 모바일 주요 터치 대상은 44×44 CSS px 수준을 목표로 한다.
- `prefers-reduced-motion: reduce`에서는 화면·상세 전환을 즉시 완료한다.
- `100vh` 고정 레이아웃 대신 동적 viewport와 문서 스크롤을 사용한다.
- safe-area inset을 고려해 하단 동작이 가려지지 않게 한다.

### 8.4 이미지·스포일러

- 장식 플레이스홀더는 빈 대체 텍스트를 사용한다.
- 기능적 자산 실패는 `이미지를 불러오지 못했습니다`처럼 상태를 설명한다.
- CG 대체 설명은 Narrative·Asset의 스포일러 등급을 소비하며 UI가 내용을 발명하지 않는다.
- 미해금 CG의 접근 가능한 이름도 캐릭터와 사건을 누설하지 않는다.

### 8.5 수동 검증

axe 통과만으로 완료하지 않는다. 키보드 전용, VoiceOver 또는 동등한 화면 낭독기, 200% 확대, 모션 감소, 모바일 터치, 가로 스크롤 주기율표를 수동 확인한다.

## 9. CSS 방향

최종 비주얼은 미정이므로 아래는 구조적 CSS 방향이다.

### 9.1 시각 언어 후보

권고 방향은 **학교 기록지와 실험 노트의 구조감**이다. 선, 칸, 라벨, 주기 번호로 정보 계층을 만들되 캐릭터 외형이나 특정 원소의 성격을 색으로 고정하지 않는다. 유리 효과, 과도한 네온, 범용 게임 대시보드형 카드 남발은 피한다.

이 방향은 최종 색·서체 승인이 아니며 다음 구조만 고정한다.

- 홈은 넓은 여백과 명확한 제목·행동 축
- 게임은 얇은 문맥 HUD와 넓은 장면 영역
- 학습 도구는 표·라벨·비교선 중심
- 오류와 잠김은 장식보다 문장과 테두리 패턴 중심

### 9.2 토큰

`tokens.css`에는 의미 토큰만 둔다.

- 배경, 표면, 본문, 보조 본문, 경계, 포커스, 위험, 성공
- 본문·제목·작은 라벨 크기
- 공간, 모서리, 선 두께, 레이어 높이
- 읽기 폭, 앱 최대 폭, 터치 최소 크기

컴포넌트에서 원시 색상과 임의 z-index를 반복하지 않는다. 캐릭터별 색상은 비주얼 승인 전 토큰에 추가하지 않는다.

### 9.3 레이아웃

- mobile-first를 사용하되 768/1024px은 전역 강제 분기보다 초기 기준으로만 사용한다.
- 화면 폭뿐 아니라 컨테이너 폭과 콘텐츠 길이에 반응한다.
- `GameShell`은 `min-height: 100dvh` 성격을 사용하고 긴 본문은 문서가 늘어나게 한다.
- VN·상세 패널에 고정 픽셀 높이를 두지 않는다.
- 주기율표만 의도적인 수평 overflow 영역을 가진다. 페이지 전체 가로 스크롤은 허용하지 않는다.
- 긴 한국어 이름, 영문 원소명, 큰 안전 정수 표시에서 줄바꿈·overflow를 검증한다.

### 9.4 CSS Modules 경계

- 전역에는 reset, 의미 토큰, 기본 typography, 접근성 utility만 둔다.
- 화면·컴포넌트 배치는 각 CSS Module이 소유한다.
- 상태 class 이름은 도메인 규칙이 아니라 표현 상태를 나타낸다.
- JS로 viewport 폭을 읽어 레이아웃을 분기하지 않고 CSS media/container query를 우선한다.

## 10. GitHub Pages base와 상대 경로

### 10.1 빌드 기준

결정 046에 따라 Vite `base`는 권고가 아니라 `./` 단일값이다. 고정 `/<repository-name>/` 대안은 **SUPERSEDED**며 두 방식을 혼합하지 않는다.

### 10.2 자산 URL

- 매니페스트 path는 `assets/...`처럼 선행 `/` 없이 유지한다.
- 런타임에서는 1.1절의 검증과 2단계 `new URL` oracle을 사용하고 현재 화면·route 문자열을 기준으로 삼지 않는다.
- `window.location.origin + path`, `/assets/...`, 개발 서버 전용 경로를 사용하지 않는다.
- CSS·TS import 자산은 Vite가 생성한 URL을 사용하고, `public` 정적 자산은 매니페스트 상대 경로 계약을 사용한다.
- 외부 API와 서버 route를 가정하지 않는다.

### 10.3 Pages 검증

production 산출물을 루트가 아닌 `/LoveChemistry/`와 동등한 경로에서 제공해 다음을 확인한다.

- 첫 진입과 새로고침
- 정적 JS·CSS 로드
- 매니페스트와 플레이스홀더 로드
- 갤러리·주기율표 자산 URL
- 오프라인 전환 뒤 이미 로드한 정적 화면의 오류 처리
- 절대 `/assets` 요청 0건

## 11. 테스트 구조

### 11.1 단위 테스트

- shell 가드: 게임 문맥의 gallery 요청 거부
- 이름 정책 adapter: 결정 045의 고정 grapheme fixture, trim 1~12, count 무관 `Cc` 거부, package unavailable build failure
- load view adapter: 정상, 복구, 비호환, 손상, terminal
- phase view adapter: 일반일·시험일 순서와 슬롯 상태
- capability adapter: 숙련도별 일반 도구와 시험 제한 모드
- asset URL: 결정 046의 directory/index+query+hash/root URL과 전체 금지 path·exact-case oracle

### 11.2 컴포넌트 테스트

- 타이틀 버튼 순서와 저장 유무별 상태
- 새 게임 오류 연결, 덮어쓰기 확인, 중복 제출 방지
- 불러오기 상태별 문구와 금지 동작
- 갤러리의 해금·미해금·자산 실패와 스포일러 차단
- `DayHud`의 Day, phase, 슬롯, 저장 메시지
- 주기율표 20개 셀, 실제 좌표, 상세 정본 일치
- 검색 없음 복구, compare limit, 시험 toolbar 부재
- 학습 0→1 무료 수업과 1+ 복습 표시, 2·3 행동 비용 표시

### 11.3 통합 테스트

- 부트 → 저장 없음 → 이름 입력 → State 생성 성공 → Day 1 `GameShell`
- 부트 → 백업 복구 → 불러오기 → 복구 체크포인트
- 일반 게임 → 주기율표 열기 → 원소 선택 → 닫기 → 호출 포커스 복귀
- 시험 fixture → 제한 주기율표 → 동일 문항·답안·포커스 복귀
- phase 변경 실패 시 화면 선반영 없음
- 설정 Meta 갱신 시 런타임 중간 GameState가 저장되지 않음

### 11.4 E2E

- 320×568, 390×844, 1280×720 대표 viewport
- 홈에서 갤러리 접근 가능, GameShell·terminal 결과에서 직접 접근 불가
- 브라우저 뒤로 가기로 phase·시험·저장 되감기 불가
- Day 10 phase fixture에서 시험 전 방과 후 차단, 합격 체크포인트 뒤 방과 후 표시
- production UI·명령·registry로 Day 10 `exam` 통과 불가, public raw score export 부재, artifact marker `slice-test-exam-outcome-v1` 부재
- 모바일 주기율표 공간 관계와 가로 스크롤
- Pages 하위 경로 production build와 모든 상대 자산
- JavaScript 오류, `undefined`, `NaN`, 전체 페이지 가로 overflow 없음

### 11.5 접근성·수동

- 각 주요 화면 axe 검사
- 키보드로 Slice 0~2 전체 흐름 완료
- dialog 포커스 trap과 복귀
- 화면 낭독기에서 Day HUD, phase, 주기율표 족·주기 관계 확인
- 200% 확대와 큰 글자
- `prefers-reduced-motion`
- 터치 실제 기기에서 표 스크롤과 상세 조작

fixture는 승인 계약의 경계값을 포함하되 production 콘텐츠로 재사용하지 않는다. 시험 제한 재사용 fixture는 문항 본문 대신 현재 문항 ID·답안 보존 여부만 검증한다.

## 12. QA 리스크

| 위험 | 심각도 | 차단 조건 | 검증 초점 |
|---|---|---|---|
| GameShell에서 갤러리 렌더링 | Critical | 메뉴·내부 요청 어느 경로로든 접근 가능 | shell 가드 단위·E2E |
| UI가 Day·시험·슬롯을 자체 계산 | Critical | State와 다른 phase 또는 행동 가능 표시 | adapter 계약 테스트 |
| 시험 제한 모드에 검색·비교 노출 | Critical | 기능이 보이거나 명령 가능 | props 부재, toolbar 부재, E2E |
| 시험 주기율표 왕복 중 답안·포커스 유실 | High | 같은 문항으로 복귀 불가 | 통합·키보드 테스트 |
| 과학값 하드코딩·상세 불일치 | High | 셀과 상세의 사실이 다름 | 정본 참조 변경 회귀 |
| 모바일 표를 카드만으로 대체 | High | 족·주기 공간 관계 상실 | 실제 기기·낭독기 검사 |
| 저장 손상을 정상 빈 저장으로 오표시 | High | 사용자 원본을 인지 없이 초기화 | load 상태 행렬 |
| 설정 저장이 중간 GameState를 영속화 | High | Day 저장 규칙 우회 | State 통합 장애 주입 |
| 부트 오류에서 거짓 데이터로 진행 | High | 누락 과학값을 기본값 처리 | fail-closed 테스트 |
| 이름·긴 수치·영문명 overflow | Medium | 주요 버튼 또는 값 가림 | 극단 길이 fixture |
| 미해금 CG·Ne 존재 누설 | High | 캐릭터·사건·개수 추론 가능 | 스포일러 수동 검토 |
| 오버레이 포커스 유실 | High | 키보드로 진행 불가 | focus 테스트 |
| Pages 절대 경로 | Critical | 저장소 하위 경로에서 자산 실패 | production 경로 E2E |
| 최종 비주얼 조기 확정 | Medium | 외형·색 모티프가 정본처럼 굳음 | 디자인·자산 수동 검토 |
| CSS 고정 높이와 이중 스크롤 | High | 모바일·200% 확대에서 동작 가림 | viewport 행렬 |
| 저장 불가 세션 모드의 기대 불일치 | High | 저장된 것으로 오인 | 제품 결정과 문구 검증 |

## 13. Change Request 후보

아래 후보는 잠금 규칙 변경 요청이 아니라 미정 구현 계약을 PM이 승인·기록해 달라는 요청이다. 승인 전에는 production 값으로 사용하지 않는다.

### CR-FE-01 이름 정책

- **요청:** 앞뒤 공백 제거, 공백만 금지, 제어 문자 금지, 최대 사용자 인식 문자 수를 확정한다.
- **권고:** 최대 12 grapheme, 한글·라틴 문자·숫자·일반 공백 허용.
- **대안:** 8 grapheme은 대사 레이아웃이 안정적이나 사용자 자유가 작고, 20 grapheme은 자유가 크지만 대사·HUD fixture 부담이 증가한다.
- **영향:** NewGame props, State 검증, Narrative 이름 삽입, 극단 길이 QA.

### CR-FE-02 접근성 설정 키

- **요청:** `optionalSettings`의 V1 허용 키를 확정한다.
- **권고 후보:** `textScale`의 제한 단계, `reducedMotion`의 `system/on`, `highContrast`의 `system/on`.
- **주의:** 브라우저 확대를 막거나 임의 글꼴을 강제하지 않으며 음향 키는 금지한다.
- **영향:** MetaState 검증, SettingsScreen, CSS 토큰, 접근성 회귀.

### CR-FE-03 저장 불가 시 세션 전용 진행

- **요청:** `localStorage` 접근 불가일 때 경고 후 메모리 회차를 허용할지 확정한다.
- **권고:** 명시적 확인을 받은 세션 전용 진행 허용. 탭을 닫으면 진행이 사라짐을 시작 전·HUD에 지속 표시한다.
- **대안:** 새 게임 완전 차단은 데이터 오해가 적지만 브라우저 정책 때문에 플레이 자체가 불가능할 수 있다.
- **영향:** boot 상태, HomeShell, HUD, State 명령, E2E.

### CR-FE-04 갤러리 스포일러 카탈로그

- **요청:** 각 CG에 `공개 가능 제목`, `잠금 슬롯 노출 여부`, `대체 설명 등급`을 제공하는 카탈로그 계약을 승인한다.
- **권고:** 미해금 항목은 기본적으로 개별 슬롯을 노출하지 않고, 공개 승인을 받은 항목만 비식별 슬롯으로 표시한다.
- **영향:** Ne 스포일러, GalleryScreen, Asset/Narrative 책임.

### CR-FE-05 지원 환경

- **요청:** 최소 브라우저 버전과 실제 기기 기준을 QA 계약으로 확정한다.
- **권고:** 최신 안정판 Chromium·Firefox·Safari의 현재 및 직전 주요 버전, iOS Safari와 Android Chrome 대표 기기.
- **영향:** CSS container query, `100dvh`, grapheme 처리, Playwright·수동 행렬.

### CR-FE-06 Pages base 방식

- **요청:** 저장소명 비종속 `base: './'`를 V1 배포 기준으로 승인한다.
- **대안:** 고정 `/<repository-name>/`는 경로 의도가 명확하지만 저장소명에 결합된다.
- **영향:** Vite 설정, 자산 URL adapter, Pages E2E, 배포 문서.

## 14. 승인 요청 요약

PM·QA 검토 대상은 다음과 같다.

- Slice 0~2 파일·컴포넌트 경계와 단일 오버레이 원칙
- `HomeShell`/`GameShell` 분리 및 갤러리 가드
- 무라우터 화면 상태와 브라우저 이력 비사용
- Day HUD·phase 입력 계약
- 주기율표의 18족 공간 grid, 모바일 가로 탐색, 원소 상세
- capability 기반 일반/시험 제한 재사용 계약
- 학습 0~3 표현과 무료 수업·행동 슬롯 구분
- 구조적 CSS 방향과 Pages `base: './'` 권고
- 테스트 구조와 CR-FE-01~06

승인 전까지 본 문서는 설계 제안이며, 코드·패키지·자산 생성 또는 Ready to Code 판정을 의미하지 않는다.
