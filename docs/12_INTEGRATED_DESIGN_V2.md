# Slice 0~2 통합 2차 설계

**상태:** `2차 통합 설계 / QA 사전검토 PASS / S0~S2 READY FOR PM IMPLEMENTATION AUTHORIZATION / 코드 구현 미승인`

**작성일:** 2026-09-28

**범위:** Slice 0 앱 골격, Slice 1 하루 상태기계·순수 스냅샷, Slice 2 과학 정본·학습 도구

**변경 제한:** 이 문서는 코드·패키지·이미지 생성 또는 구현 착수를 승인하지 않는다.

## 1. 목적과 문서 지위

다섯 역할의 `agents/*/DESIGN_V2.md`, `docs/00`~`11`, `agents/qa/REPORT.md`를 하나의 Slice 0~2 구현 계약으로 통합한다. `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md` 전체를 다시 쓰지 않고, 해당 문서의 장기 제품 계약을 유지한 채 이번 범위의 구체 구현 기준은 이 문서가 보충·구체화한다.

우선순위는 다음과 같다.

1. `docs/00_PM_MASTER_SPEC.md`와 `docs/01_LOCKED_GAME_RULES.md`의 잠금 규칙
2. 사용자 승인 결정 015, 020, 021
3. `docs/10_DECISION_LOG.md`의 승인된 후속 PM 구현 결정(022~046 포함)
4. 본 문서의 Slice 0~2 계약
5. 역할별 `DESIGN_V2.md`의 채택되지 않은 제안

본 문서의 계약 확정은 Ready to Code 판정이 아니다. 구현 전 체크리스트와 QA 사전 검토를 통과하고 별도 구현 승인을 받아야 한다.

결정 043~046은 QA-V2-001~004의 문서상 차단 원인을 조정했고 QA 재검토에서 네 finding이 `CLOSED`됐다. Slice 0~2는 `READY FOR PM IMPLEMENTATION AUTHORIZATION`이지만 이는 자동 구현 승인이나 Ready to Code 선언이 아니다.

## 2. 공통 불변 조건

- V1은 React, TypeScript, Vite, CSS Modules, Vitest·React Testing Library, Playwright, axe를 사용하고 URL 라우터 없이 앱 상태로 화면을 전환한다.
- `HomeShell`과 `GameShell`은 동시에 렌더링하지 않는다. CG 갤러리는 `HomeShell`에만 존재한다.
- UI는 selector와 command 결과만 소비한다. Day, phase, 슬롯, 시험 의무, 숙련도, 해금, 엔딩을 재계산하지 않는다.
- 일반 도구는 단일 `OverlayHost`에서 한 번에 하나만 연다. 확인 alert dialog만 그 위에 일시적으로 둘 수 있다.
- Slice 0~2는 바이너리 이미지 없이 CSS·텍스트 가상 placeholder로 동작한다.
- `GameState`는 Slice 1부터 생성한다. Slice 0의 이름 검증 성공은 회차 생성이나 Day 진입을 뜻하지 않는다.
- 실제 `localStorage` 저장·불러오기·MetaState는 Slice 3 범위다. Slice 0~2를 저장 완료 상태로 표시하지 않는다.
- 저장 접근 불가 상태에서 세션 전용 플레이를 허용하지 않는다. Slice 3에서 영속 저장을 사용할 수 없으면 새 게임과 불러오기를 차단한다.
- Slice 1~2의 in-memory 실행은 개발·통합 검증 수단이며 저장 없는 출시 플레이 모드가 아니다.
- Slice 0~2 Narrative는 중립 시스템 카피와 의미 placeholder만 사용한다. 최종 캐릭터 대사, 루트 상세, 실제 `SceneId`·`ChoiceId`를 만들지 않는다.
- 호감도, 루트, 미션, 관계 장면, Character End 구현은 Slice 2 이후까지 금지한다. 즉시 Character End evaluator는 no-op 확장점만 둔다.

## 3. Slice 범위와 완료 게이트

### 3.1 Slice 0: 앱 골격과 홈

**포함 범위**

- 정적 앱 시작과 앱 metadata 검증
- CSS·텍스트 가상 항목만 가진 virtual asset manifest 검증
- 무라우터 최상위 화면 상태
- `HomeShell`, 타이틀, 새 게임 이름 입력·검증 화면
- 비활성 불러오기 안내
- 홈 전용 갤러리의 카탈로그 없음 정상 빈 상태
- 시스템 환경 기반 reduced motion 존중과 설명
- Vite `base: './'`, 상대 자산 URL resolver 계약
- 키보드·포커스·200% 확대·모바일 골격

**명시적 비범위**

- Science catalog, 원소 stub, fake 원소, 과학 데이터 loader
- `GameState` 생성, Day 1 진입, 하루 진행
- 실제 저장 검사·저장 요약·복구·초기화·불러오기
- `optionalSettings` UI 값이나 MetaState 영속 키
- 바이너리 placeholder와 실제 이미지
- 가짜 갤러리 잠금 슬롯, Ne 또는 루트 존재 누설

**부트 계약**

```text
정적 앱 시작
→ app metadata 검증
→ virtual asset manifest 검증
→ HomeShell 표시
```

Slice 0 부트는 위 두 항목만 필수로 검증한다. Science catalog는 읽지도 요구하지도 않으며 과학 오류 화면을 만들지 않는다. metadata 또는 virtual manifest가 유효하지 않으면 fail-closed 오류를 표시하고 홈의 실행 동작을 열지 않는다.

**완료 게이트 S0**

문서 계약상 QA-V2-003·004 대응 oracle은 결정 045·046과 5.2절·8절에 확정됐고 QA 재검토에서 `CLOSED`됐다. 현재 게이트 상태는 **READY FOR PM IMPLEMENTATION AUTHORIZATION / 구현 미승인 / 브라우저·Pages 실행 NOT TESTED**다.

- [ ] 앱 metadata와 virtual asset manifest만 부트 필수 항목이다.
- [ ] 원소 stub·fake·부분 데이터가 production 및 fixture 번들에 없다.
- [ ] 이름 입력은 승인 정책대로 검증되지만 시작 요청이 `GameState`나 Day를 만들지 않는다.
- [ ] 불러오기는 `아직 저장 기능이 구현되지 않음`으로 명확히 비활성이고 저장 없음·저장 성공으로 위장하지 않는다.
- [ ] 갤러리는 홈에서만 열리고 카탈로그 없음은 가짜 슬롯 없는 정상 빈 상태다.
- [ ] `HomeShell` 렌더 중 `GameShell`이 존재하지 않는다.
- [ ] 시스템 `prefers-reduced-motion`을 CSS로 존중하며 임의 영속 설정 키가 없다.
- [ ] Pages 동등 하위 경로에서 절대 `/assets` 요청이 0건이다.
- [ ] 키보드, 포커스, 200% 확대, 모바일 대표 뷰포트 검증을 통과한다.

### 3.2 Slice 1: 핵심 Day 루프와 순수 스냅샷

**포함 범위**

- 검증된 이름과 `gender = male`로 최소 `GameState` 생성
- Day 1~30, phase, 점심·방과 후 각 1슬롯
- 과학 비의존 당일 수업 상태 `morningCompleted`, `afternoonCompleted`
- 오전 조회, 오전 수업 완료, 점심, 오후 수업 완료, 방과 후, Day 종료의 분리 명령
- topic 입력·선택 없이 동작하는 generic 오전·오후 수업 완료 명령과 숙련도 무변경
- `passFreeTime`의 무보상 슬롯 소비
- Day 10·20·30 `exam` phase 강제 진입과 production fail-closed 정지
- 테스트 전용 시험 결과 포트의 `49`, `50`, `100` 경계 검증
- `dayStart`, `examResolved`, `terminal` 순수 snapshot 생성·검증·정본 JSON round-trip
- in-memory snapshot adapter
- command receipt와 effect ledger의 분리
- 모든 성공 효과 뒤 no-op 즉시 Character End evaluator 호출 위치

**명시적 비범위**

- `StudyTopicId`, `selectedTopicId`, topic registry·fixture, 무료 수업 숙련도 변화
- production 시험 UI, 문항, 답안, 채점, 시험 통과 버튼
- 실제 `localStorage`, A/B bank, manifest, checksum, migration, 콘텐츠 호환성, MetaState
- 관계·호감도·루트·미션·인벤토리·CG 해금
- character ending phase와 route/story 콘텐츠

**production 시험 동작**

Day 10·20·30의 오후 수업을 완료하면 반드시 `exam`으로 전이한다. 실제 시험 UI와 채점기가 없으므로 production에서는 그 상태에서 진행을 중단한다. 방과 후, Day 종료, 임의 점수 입력, 시험 통과, 다음 Day 이동 명령을 노출하지 않는다.

테스트 전용 port만 `49 | 50 | 100`을 주입할 수 있다. 이 포트는 `tests/helpers/resolveExamForTest.ts`에만 존재하고 marker `slice-test-exam-outcome-v1`을 포함한다. production façade·public export·command registry에는 raw score command·port·type이 없고 production `src`는 `tests`를 import하지 않는다. `49`는 퇴학 `terminal`, `50`과 `100`은 같은 Day의 `examResolved/afterSchoolFreeTime` 경계를 만들며 결과 재주입은 거부한다. 실제 시험 Slice가 들어오기 전 제품 화면과 production entry graph로 시험을 통과할 수 없다.

향후 실제 시험 subsystem이 채점·검증한 결과를 적용하는 내부 함수의 논리 위치는 `src/state/internal/applyVerifiedExamOutcome.ts`다. 실제 시험 Slice 전에는 이 모듈을 production entry graph에서 import하지 않는다. Vite production build input은 `src/main.tsx` 단일 graph이고, Vitest graph만 tests helper를 import할 수 있다.

**완료 게이트 S1**

문서 계약상 QA-V2-001·002의 Slice 경계와 시험 import/build 경계는 결정 043·044 및 본 절에 정렬됐고 QA 재검토에서 `CLOSED`됐다. 현재 게이트 상태는 **READY FOR PM IMPLEMENTATION AUTHORIZATION / 구현 미승인 / 상태기계·snapshot·source boundary·production build·E2E NOT TESTED**다.

- [ ] 일반일 phase 순서와 슬롯이 command만으로 결정적으로 전이한다.
- [ ] Slice 1 수업은 topic·ScienceCatalog 없이 generic 완료되고 숙련도와 snapshot에 topic 흔적을 만들지 않는다.
- [ ] 잘못된 phase, 중복 명령, 사용된 슬롯, terminal 명령은 원본 불변으로 거부한다.
- [ ] `passFreeTime`은 현재 슬롯만 소비하고 보상·숙련도·플래그를 만들지 않는다.
- [ ] Day 10·20·30 production 흐름이 `exam`에서 fail-closed로 멈춘다.
- [ ] 시험 테스트 port가 제품 UI·public export·production command registry에서 호출 불가능하고 production source graph가 tests helper를 import하지 않는다.
- [ ] production build artifact에 `slice-test-exam-outcome-v1` marker가 없고 Day 10 production E2E가 `exam`에서 fail-closed다.
- [ ] 테스트 port에서 `49=퇴학`, `50·100=생존`이고 재결과 주입이 불가능하다.
- [ ] Day 30 뒤 Day 31이 생성되지 않는다.
- [ ] 세 snapshot 종류가 순수 생성·전체 검증·JSON round-trip에서 동일 의미를 보존한다.
- [ ] in-memory adapter를 UI가 실제 저장·불러오기·저장 성공으로 표현하지 않는다.
- [ ] 현재 Day command receipt가 다음 `dayStart`에서 정리되고 `examResolved`·`terminal`에는 보존된다.
- [ ] command receipt와 effect ledger가 서로 다른 필드·책임을 가진다.
- [ ] no-op ending evaluator가 효과 적용·전체 검증 뒤 호출되며 route·mission·affection을 만들지 않는다.

### 3.3 Slice 2: 과학 정본과 학습 도구

**포함 범위**

- TypeScript readonly 원소 데이터 모듈 하나
- `unknown` 입력을 검사하는 별도 순수 validator
- 원소 1~20 정확한 값과 불변식
- 일곱 study topic 정의와 concept/query 책임
- Science catalog를 부트 필수 bundle로 활성화
- `DailyClassState.selectedTopicId`와 topic을 받는 오전 수업 명령을 Science catalog와 함께 활성화
- 숙련도 `0~3`, 무료 수업 `0→1`, 자유시간 `selfStudy`의 `1→2`, `2→3`
- 일반 검색 항상 허용
- 주기율표 18족 공간 grid, 원소 상세, 숙련도 capability
- 시험 문맥의 제한된 기본 주기율표 capability 계약
- `studyTogether` 타입과 확장점 예약

**명시적 비범위**

- 캐릭터·장면을 사용하는 `studyTogether` UI와 실행 command
- 실제 시험 문항·화면·채점
- 미션·대화 힌트의 최종 콘텐츠 문구
- route, affection, story, 최종 과학 설명 문장

**Slice 2 부트 계약**

```text
app metadata + virtual asset manifest 검증
→ Science 필수 bundle 전체 검증
→ 성공 시에만 ScienceCatalog 공개
→ GameState 생성·로드 가능
```

Science bundle은 원소 정본, 일곱 topic 정의, 과학 콘텐츠 버전과 topic이 소유한 concept/query 정의를 포함한다. 하나라도 실패하면 부분 catalog, 추정값, 내장 대체값 없이 새 게임과 게임 진행을 차단한다.

**완료 게이트 S2**

문서 계약상 topic 소유는 결정 043에 따라 Slice 2로 정렬됐고 QA 재검토를 통과했다. 현재 게이트 상태는 **READY FOR PM IMPLEMENTATION AUTHORIZATION / 구현 미승인 / Science·학습·UI 실행 NOT TESTED**다.

- [ ] 원소 정본은 TypeScript readonly 데이터 모듈 하나이고 validator는 별도 순수 함수다.
- [ ] 정확히 20개 값과 모든 불변식이 Science V2 수용표와 일치한다.
- [ ] `teachingTags`가 원소 레코드의 필수 중복 필드로 존재하지 않는다.
- [ ] 정확한 7개 topic ID가 존재하고 concept/query 정의를 topic 정본이 소유한다.
- [ ] `selectedTopicId`와 topic 입력 수업 명령은 ScienceCatalog 검증 성공 뒤에만 존재하며 Slice 1 fake topic을 재사용하지 않는다.
- [ ] 일반 검색은 숙련도와 무관하게 항상 가능하고 시험 문맥에서는 금지된다.
- [ ] 무료 수업 상승은 오후 완료 때만 `0→1`이고 `1+`는 복습·진단만 반환한다.
- [ ] Slice 2에서 숙련도 `2·3`은 `selfStudy`만 만들고 level 3 공부는 실행 전 거부되어 슬롯을 소비하지 않는다.
- [ ] `studyTogether`는 타입·extension point만 있고 제품 UI·명령으로 실행할 수 없다.
- [ ] 시험 capability에는 검색·필터·비교·힌트·진단·점수 보정이 없다.
- [ ] 원소 사실이 `GameState`, UI, 서사 placeholder, 시험 fixture에 독립 정본으로 복제되지 않는다.
- [ ] Science bundle 실패가 기존 상태를 변경·삭제하지 않는다.

### 3.4 QA 문서 조정 게이트

| Slice | QA-V2 문서 차단 조정 | 현재 판정 |
|---|---|---|
| Slice 0 | QA-V2-003은 결정 045의 grapheme oracle, QA-V2-004는 결정 046의 URL oracle로 계약 보완 | `PASS / READY FOR PM IMPLEMENTATION AUTHORIZATION / NOT TESTED` |
| Slice 1 | QA-V2-001은 topic 제거·generic 수업, QA-V2-002는 test-only import/build 경계로 계약 보완 | `PASS / READY FOR PM IMPLEMENTATION AUTHORIZATION / NOT TESTED` |
| Slice 2 | topic 상태·명령·무료 `0→1`을 ScienceCatalog 활성화와 함께 도입하도록 정렬 | `PASS / READY FOR PM IMPLEMENTATION AUTHORIZATION / NOT TESTED` |

이 표의 `PASS`는 문서 계약 판정이다. 사용자 또는 PM의 별도 구현 승인 전 Ready to Code인 Slice는 없다.

## 4. 채택 파일 구조

Frontend V2의 셸·도메인 경계를 유지하되 화면 하나만 쓰는 adapter와 컴포넌트를 미리 공통 폴더로 분리하지 않는다.

```text
src/
├─ main.tsx
├─ app/
│  ├─ AppRoot.tsx
│  ├─ boot.ts
│  ├─ appView.ts
│  └─ app.module.css
├─ shells/
│  ├─ HomeShell.tsx
│  └─ GameShell.tsx
├─ screens/
│  ├─ home/
│  │  ├─ HomeScreens.tsx
│  │  └─ home.module.css
│  ├─ day/
│  │  ├─ DayScreens.tsx
│  │  └─ day.module.css
│  └─ learning/
│     ├─ LearningScreens.tsx
│     └─ learning.module.css
├─ components/
│  ├─ OverlayHost.tsx
│  └─ (두 화면 이상에서 실제 재사용될 때만 추가)
├─ systems/
│  ├─ day/
│  └─ learning/
├─ state/
│  ├─ gameState.ts
│  ├─ commands.ts
│  ├─ internal/                     # 실제 시험 Slice 전 production graph에서 import 금지
│  │  └─ applyVerifiedExamOutcome.ts # 향후 논리 위치; Slice 0~2에서 파일 생성 요구 아님
│  ├─ selectors.ts
│  └─ snapshots.ts
├─ data/
│  ├─ elements.ts
│  ├─ studyTopics.ts
│  ├─ validateScienceCatalog.ts
│  └─ assetManifest.ts
├─ assets/
│  └─ resolveAsset.ts
└─ styles/
   ├─ reset.css
   ├─ tokens.css
   └─ globals.css

tests/
├─ helpers/
│  └─ resolveExamForTest.ts
├─ unit/
├─ integration/
├─ components/
├─ e2e/
├─ accessibility/
└─ fixtures/
```

구조 규칙:

- `HomeShell`, `GameShell`, 도메인 `systems/state/data`, 단일 `OverlayHost` 경계는 유지한다.
- 한 화면 전용 작은 컴포넌트, view 변환, 오류 표현은 해당 화면 모듈 안에 둔다.
- 두 화면 이상에서 실제 재사용되거나 독립 테스트 경계가 필요한 시점에만 `components` 또는 별도 adapter로 분리한다.
- selector·command·validator처럼 도메인 계약인 함수는 화면 모듈에 두지 않는다.
- `screens`는 selector 결과를 조합해 표시하고 command 의도만 전달한다.
- `data/elements.ts` 외에 과학 사실을 담은 두 번째 모듈을 만들지 않는다.
- Slice 0~2에는 persistence 폴더나 `localStorage` adapter를 만들지 않는다.
- `src/state/commands.ts` 또는 동등 production façade·registry는 raw score command·port·type을 export하지 않는다.
- production `src`에서 `tests` import를 금지한다. `tests/helpers/resolveExamForTest.ts`만 `49 | 50 | 100`을 허용하고 `slice-test-exam-outcome-v1` marker를 가진다.
- Vite production build input은 `src/main.tsx` 단일 graph다. Vitest 설정만 tests helper 접근을 허용하며 production build 설정에 helper alias나 test entry를 넣지 않는다.

## 5. 데이터 구조

아래 TypeScript 유사 표기는 계약이며 코드가 아니다.

### 5.1 앱·부트 상태

```ts
type AppMetadata = {
  readonly appVersion: string
  readonly buildId: string
}

type AppViewState = {
  readonly boot: 'loading' | 'ready' | 'blocked'
  readonly shell: 'home' | 'game'
  readonly surface: string
  readonly overlay: null | OverlayDescriptor
}
```

`AppViewState`는 비영속 UI 상태다. Slice 0의 `ready`는 app metadata와 virtual manifest의 검증만 의미한다. Slice 2부터 과학 화면·학습 명령을 열 때는 Science catalog ready가 추가로 필요하다.

### 5.2 이름과 플레이어

```ts
type PlayerState = {
  readonly name: string
  readonly gender: 'male'
}
```

이름 정책:

- ECMAScript `trim`과 동등한 앞뒤 공백 제거 후 검증한다.
- 결과는 `1~12 grapheme`이어야 한다.
- Unicode 제어문자 `Cc`는 금지한다.
- 일반 Unicode 문자, 숫자, emoji, 결합 문자와 내부 공백은 허용한다.
- 구현 승인 시 direct dependency `graphemer` 정확히 `1.4.0`을 사용하고 그 결과만 authoritative grapheme count로 사용한다. 이번 문서 조정에서는 패키지를 설치하지 않는다.
- `Intl.Segmenter`는 진단 비교에만 사용할 수 있고 acceptance 결과를 바꾸지 않는다.
- 지원 환경에서 `graphemer@1.4.0`을 사용할 수 없으면 build failure다. 코드포인트 또는 다른 fallback으로 조용히 전환하지 않는다.
- fixture oracle은 `''=0`, `김철수=3`, `가나다라마바사아자차카타=12`, `가나다라마바사아자차카타파=13`, decomposed `가=1`, `e\u0301=1`, family ZWJ emoji `=1`, skin-tone emoji `=1`, Korean flag `=1`, `김 철수=4`다. `Cc` 포함 입력은 count와 무관하게 거부한다.
- Slice 0은 검증 결과만 보여 주며 유효 이름도 상태에 커밋하지 않는다. Slice 1의 새 게임 command가 동일 validator의 정규화 결과로 `PlayerState`를 만든다.

### 5.3 Slice 1 GameState

```ts
type Phase =
  | 'morningHomeroom'
  | 'morningClass'
  | 'lunchFreeTime'
  | 'afternoonClass'
  | 'exam'
  | 'afterSchoolFreeTime'
  | 'dayEnd'
  | 'terminal'

type DailyClassStateSlice1 = {
  readonly morningCompleted: boolean
  readonly afternoonCompleted: boolean
}

type DailyClassStateSlice2 = DailyClassStateSlice1 & {
  readonly selectedTopicId: StudyTopicId | null
}

type CalendarState = {
  readonly day: number
  readonly phase: Phase
  readonly freeActions: {
    readonly lunchUsed: boolean
    readonly afterSchoolUsed: boolean
  }
  readonly dailyClass: DailyClassStateSlice1
}

type ExamGate = {
  readonly resultsByDay: Readonly<Partial<Record<10 | 20 | 30, {
    readonly score: number
    readonly passed: boolean
  }>>>
}

type GameStateSlice1 = {
  readonly schemaVersion: number
  readonly contentVersion: string
  readonly runId: string
  readonly stateRevision: number
  readonly snapshotRevision: number
  readonly player: PlayerState
  readonly calendar: CalendarState
  readonly examGate: ExamGate
  readonly commandReceipts: Readonly<Record<string, CommandReceipt>>
  readonly effectLedger: {
    readonly appliedEffectIds: readonly string[]
  }
  readonly runStatus:
    | { readonly kind: 'active' }
    | { readonly kind: 'normalEnding'; readonly endingId: 'normal-ending' }
    | { readonly kind: 'expelled'; readonly examDay: 10 | 20 | 30; readonly score: number }
}

type GameStateSlice2 = GameStateSlice1 & {
  readonly calendar: Omit<CalendarState, 'dailyClass'> & {
    readonly dailyClass: DailyClassStateSlice2
  }
  readonly academics: AcademicState
}
```

`examGate`는 단순 비영속 개발 값이 아니라 Slice 1 상태기계가 시험 우회 방지를 검증하는 최소 상태 필드다. 실제 시험 Slice에서 `AcademicState.exams` 계약으로 흡수한다. 아직 배포 저장이 없으므로 이 변경을 위한 호환·migration 코드를 만들지 않는다.

Slice 1은 `StudyTopicId`를 참조하지 않고 `DailyClassStateSlice1`의 두 완료 불리언만 저장한다. Slice 2에서 검증된 ScienceCatalog와 함께 `selectedTopicId`를 추가한다. 아직 배포 persistence가 없으므로 이 shape 추가에도 migration·compatibility code를 만들지 않는다. Slice 1 enum·문자열·fixture로 일곱 topic을 복제하거나 fake topic을 넣는 것은 금지한다.

`commandReceipts`는 전송 재시도의 멱등성을, `effectLedger`는 보상·비용·플래그 적용의 멱등성을 보장한다. 하나를 다른 용도로 대신 쓰지 않는다. receipt는 현재 Day 범위로 유지하고 다음 `dayStart` 생성 때 정리한다. 현재 Day의 `examResolved`와 `terminal` snapshot에는 그대로 보존한다. effect ledger의 수명은 회차 상태가 소유하며 receipt 정리와 함께 지우지 않는다.

### 5.4 Snapshot

```ts
type SnapshotKind = 'dayStart' | 'examResolved' | 'terminal'

type GameSnapshot = {
  readonly kind: SnapshotKind
  readonly labelDay: number
  readonly game: GameStateSlice1 | GameStateSlice2
}
```

- Slice 1 `dayStart`: `morningHomeroom`, 당일 수업 `false/false`, 두 슬롯 미사용, topic 필드 없음
- Slice 2 `dayStart`: 위 조건에 `selectedTopicId = null` 추가
- `examResolved`: Day 10·20·30, 합격 결과 존재, 오전·오후 수업 완료, 점심 사용, 방과 후 미사용, phase `afterSchoolFreeTime`
- `terminal`: phase `terminal`, runStatus 비활성
- 생성, 전체 검증, 정본 JSON stringify/parse, 동일 의미 확인은 순수 함수다.
- in-memory adapter는 테스트와 실행 중 전달만 담당하며 새로고침·탭 종료 복원을 약속하지 않는다.

### 5.5 Science 정본

```ts
type ElementRecord = {
  readonly id: ElementId
  readonly atomicNumber: number
  readonly symbol: string
  readonly nameKo: string
  readonly nameEn: string
  readonly group: number
  readonly period: number
  readonly shellElectrons: readonly number[]
  readonly valenceElectrons: number
  readonly cautionTags: readonly string[]
}

type StudyTopicDefinition = {
  readonly id: StudyTopicId
  readonly titleKo: string
  readonly conceptKeys: readonly string[]
  readonly queryDefinitions: readonly ScienceQueryDefinition[]
}

type ScienceCatalog = {
  readonly contentVersion: string
  readonly elements: readonly ElementRecord[]
  readonly studyTopics: readonly StudyTopicDefinition[]
}
```

정본은 `elements.ts`의 readonly 모듈 하나다. 컴파일된 내부 상수를 런타임마다 `unknown`으로 취급할 필요는 없지만, 테스트 fixture·향후 외부 경계 등 `unknown` 입력은 별도 `validateScienceCatalog(value: unknown)` 순수 함수가 검증한다. validator가 대체값을 채우거나 입력을 수정하지 않는다.

`teachingTags`는 원소마다 중복 저장하지 않는다. 어떤 개념과 질의를 어떤 원소에 적용하는지는 `StudyTopicDefinition`의 `conceptKeys`와 `queryDefinitions`가 소유하고 정본 원소 필드를 질의한다. 설명상 주의가 필요한 H, He, Ne, Ar 등의 `cautionTags`는 필수 필드로 유지한다.

### 5.6 원소 20개 수용값과 불변식

다음 값은 Science V2 표를 그대로 채택한다. 한국어·영어 이름은 `docs/02_SCIENCE_BIBLE.md`의 표기를 사용한다.

| ID | 번호 | 기호 | 한국어/영어 | 족 | 주기 | 전자껍질 | 원자가전자 | cautionTags |
|---|---:|---|---|---:|---:|---|---:|---|
| `element-01` | 1 | H | 수소 / Hydrogen | 1 | 1 | `1` | 1 | `hydrogen-not-alkali-equivalent` |
| `element-02` | 2 | He | 헬륨 / Helium | 18 | 1 | `2` | 2 | `filled-first-shell` |
| `element-03` | 3 | Li | 리튬 / Lithium | 1 | 2 | `2, 1` | 1 | - |
| `element-04` | 4 | Be | 베릴륨 / Beryllium | 2 | 2 | `2, 2` | 2 | - |
| `element-05` | 5 | B | 붕소 / Boron | 13 | 2 | `2, 3` | 3 | - |
| `element-06` | 6 | C | 탄소 / Carbon | 14 | 2 | `2, 4` | 4 | - |
| `element-07` | 7 | N | 질소 / Nitrogen | 15 | 2 | `2, 5` | 5 | - |
| `element-08` | 8 | O | 산소 / Oxygen | 16 | 2 | `2, 6` | 6 | - |
| `element-09` | 9 | F | 플루오린 / Fluorine | 17 | 2 | `2, 7` | 7 | - |
| `element-10` | 10 | Ne | 네온 / Neon | 18 | 2 | `2, 8` | 8 | `filled-outer-shell` |
| `element-11` | 11 | Na | 나트륨 / Sodium | 1 | 3 | `2, 8, 1` | 1 | - |
| `element-12` | 12 | Mg | 마그네슘 / Magnesium | 2 | 3 | `2, 8, 2` | 2 | - |
| `element-13` | 13 | Al | 알루미늄 / Aluminium | 13 | 3 | `2, 8, 3` | 3 | - |
| `element-14` | 14 | Si | 규소 / Silicon | 14 | 3 | `2, 8, 4` | 4 | - |
| `element-15` | 15 | P | 인 / Phosphorus | 15 | 3 | `2, 8, 5` | 5 | - |
| `element-16` | 16 | S | 황 / Sulfur | 16 | 3 | `2, 8, 6` | 6 | - |
| `element-17` | 17 | Cl | 염소 / Chlorine | 17 | 3 | `2, 8, 7` | 7 | - |
| `element-18` | 18 | Ar | 아르곤 / Argon | 18 | 3 | `2, 8, 8` | 8 | `filled-outer-shell` |
| `element-19` | 19 | K | 칼륨 / Potassium | 1 | 4 | `2, 8, 8, 1` | 1 | - |
| `element-20` | 20 | Ca | 칼슘 / Calcium | 2 | 4 | `2, 8, 8, 2` | 2 | - |

필수 불변식:

1. 레코드는 정확히 20개이고 번호 집합은 정확히 `1..20`이다.
2. ID는 번호의 2자리 0 채움 형식과 일치한다.
3. ID, 번호, 기호, 한국어명, 영어명은 각각 유일하다.
4. 전자껍질 합은 원자번호와 같고 배열 길이는 주기와 같다.
5. `valenceElectrons`는 마지막 껍질 값과 같다. He는 2다.
6. 1주기 최외각은 최대 2, 나머지 범위는 최대 8이다.
7. 위 수용표의 모든 값과 필수 caution tag가 정확히 일치한다.
8. 소비 데이터는 원소 ID 또는 topic query만 저장하고 사실값을 복제하지 않는다.

### 5.7 Topic과 학업 상태

이 절의 `StudyTopicId`, topic 선택과 학업 상태는 모두 Slice 2 계약이다. Slice 1 타입·command·snapshot·fixture에는 topic ID가 존재하지 않는다.

필수 topic ID:

| ID | 의미 |
|---|---|
| `topic-identity` | 원자번호·이름·기호 |
| `topic-group-period` | 족·주기와 위치 |
| `topic-shells` | 전자껍질 분포와 주기 |
| `topic-valence` | 승인 범위 원자가전자 추론 |
| `topic-similarity` | 같은 족의 유사성과 차이 |
| `topic-stability` | 채워진 최외각 전자껍질 |
| `topic-comparison` | 1~20 복합 비교·자료 해석 |

```ts
type Mastery = 0 | 1 | 2 | 3

type AcademicState = {
  readonly topicProgressById: Readonly<Record<StudyTopicId, Mastery>>
  readonly topicLastProgressSourceById: Readonly<
    Partial<Record<StudyTopicId, 'classIntro' | 'selfStudy' | 'studyTogether'>>
  >
}
```

`studiedTopics`는 저장하지 않고 `mastery > 0`인 topic ID에서 파생한다. capability도 숙련도와 문맥에서 파생하며 중복 저장하지 않는다.

숙련도 계약:

- 무료 수업: 오전에 topic 선택, 오후 완료 때 `0→1`; `1+`는 변화 없는 복습·진단
- `selfStudy`: 자유시간 슬롯 1개를 사용해 `0→1`, `1→2`, `2→3` 중 한 단계만 상승
- level 3 `selfStudy`: 실행 전 `mastery-maxed`로 거부, 슬롯 미소비
- `studyTogether`: 동일 전이 타입과 확장점만 예약; Slice 2에는 캐릭터·장면이 없어 UI와 command 실행 금지
- 미션 보상: 숙련도 변화 없음
- 시험 점수·정답·선택지 제거·자동 답변 보정 없음

일반 검색은 숙련도 0부터 항상 허용한다. 족·주기 필터는 관련 숙련도 1, 두 원소 비교는 비교 topic 2, 복합 비교는 비교 topic 3에서 허용한다. 시험 문맥은 숙련도와 관계없이 결정 021의 기본 조회 allow-list만 사용한다.

## 6. Public Selectors와 Commands

함수명은 역할 간 공개 계약이다. UI는 내부 상태 필드를 조합해 같은 판정을 다시 만들지 않는다.

### 6.1 Selectors

| Selector | 출력 책임 |
|---|---|
| `selectBootStatus` | 현재 Slice에 필요한 필수 bundle 준비·차단 상태 |
| `selectShellView` | `home` 또는 `game`, 동시 렌더 불가 |
| `selectHomeView` | 이름 정책, 저장 미구현, 갤러리 빈 상태, 시스템 환경 설명 |
| `selectDayLabel` | `DAY NN / 30` |
| `selectCurrentPhase` | 현재 phase와 표시명 |
| `selectPhaseSteps` | 완료·현재·예정·차단 단계; UI가 시험 단계를 삽입하지 않음 |
| `selectFreeActionStatus` | 점심·방과 후의 `available`, `used`, `future`, `blocked`와 이유 |
| `selectAllowedCommands` | 현재 호출 가능한 production command ID와 공개 가능 거부 사유 |
| `selectDailyClass` | Slice 1은 오전·오후 완료 상태만, Slice 2는 검증된 선택 topic을 함께 투영 |
| `selectStudyTopicSummaries` | 정확한 7개 topic의 숙련도, 출처, 다음 가능 행동 |
| `selectStudyOutcomePreview` | 예상 단계, 슬롯 비용, 실행 가능 여부; 관계 결과 제외 |
| `selectPeriodicTableCapabilities` | 일반 또는 시험 문맥의 완성된 allow-list |
| `selectPeriodicTableCells` | 정본 20개와 족·주기 좌표 |
| `selectElementDetail` | 정본 상세 또는 명시적 not-found |
| `selectSearchResults` | 일반 문맥의 이름·기호·번호 검색, 시험은 capability-disabled |
| `selectComparison` | 허용 capability 안의 정본 비교 또는 거부 사유 |
| `selectSnapshotSummary` | in-memory snapshot의 경계 설명; 저장 성공 표현 없음 |

### 6.2 Production Commands

Slice 1 production commands:

| Command | 입력 | 성공 효과 | 핵심 거부 |
|---|---|---|---|
| `createNewGame` | 정규화된 이름, run ID 주입 | Day 1 최소 상태 생성 | 이름 무효, 필수 bundle 미준비 |
| `completeMorningHomeroom` | command ID | 오전 수업 전이 | 잘못된 phase, 중복·충돌 |
| `completeMorningClass` | command ID | generic 오전 완료, 점심 전이; 숙련도 변화 없음 | 잘못된 phase, 중복·충돌 |
| `resolveFreeAction` | 검증된 action ID, command ID | 현재 슬롯과 승인 효과 원자 적용 | 잘못된 phase, 슬롯 사용, unknown action |
| `passFreeTime` | command ID | 현재 자유시간 슬롯만 소비하고 다음 phase 전이 | 잘못된 phase, 슬롯 사용 |
| `completeAfternoonClass` | command ID | generic 오후 완료; 숙련도 변화 없이 일반일 방과 후·시험일 exam 전이 | 오전 미완료, 잘못된 phase |
| `commitDayEnd` | command ID | Day 1~29 다음 dayStart, Day 30 승인 terminal 경계 | 필수 phase·슬롯·시험 미완료 |

Slice 2에서 ScienceCatalog와 함께 대체·추가되는 commands:

| Command | 입력 | 성공 효과 | 핵심 거부 |
|---|---|---|---|
| `completeMorningClass` | topic ID, command ID | 검증된 topic 선택, 오전 완료, 점심 전이 | 미등록 topic, 중복 선택, catalog 미준비 |
| `completeAfternoonClass` | command ID | 선택 topic의 무료 `0→1` 또는 복습 결과 후 일반일 방과 후·시험일 exam 전이 | 오전 미완료, topic 없음, catalog 미준비 |
| `performSelfStudy` | topic ID, command ID | 슬롯 1개와 숙련도 한 단계 원자 적용 | level 3, 슬롯 사용, 미등록 topic |

Slice 2의 topic 입력 형태는 Slice 1 command의 overload를 병존시키는 것이 아니라 Science 계약이 활성화될 때 대체한다. 배포 persistence가 아직 없으므로 이 API·상태 추가를 위한 호환층은 없다.

`studyTogether`는 타입과 evaluator/handler extension point 이름만 예약하고 production command union과 UI 허용 목록에는 넣지 않는다.

### 6.3 테스트 전용 Port

| Port | 범위 | 금지 |
|---|---|---|
| `resolveExamForTest` | `tests/helpers/resolveExamForTest.ts`에서만 현재 시험 Day에 `49 | 50 | 100`을 주입해 phase·terminal·snapshot 경계 검증. marker `slice-test-exam-outcome-v1` 필수 | production UI·사용자 이벤트·public export·production command registry·production entry graph에서 호출 또는 노출 |

실제 시험 Slice는 답안과 정본 문항을 채점한 검증 결과를 논리 위치 `src/state/internal/applyVerifiedExamOutcome.ts`의 내부 함수에 전달한다. 이 모듈은 실제 시험 Slice 전 production entry graph에서 import하지 않으며 UI가 점수를 직접 제출하는 계약은 채택하지 않는다. production façade와 registry에는 raw score command·port·type이 없다.

### 6.4 Command 결과

모든 command는 `applied`, `duplicate`, `rejected`를 구분한다. 같은 command ID와 같은 fingerprint는 상태를 다시 바꾸지 않는 `duplicate`, 같은 ID와 다른 payload는 충돌 거부다. revision 검사보다 receipt의 동일 ID·fingerprint 검사를 먼저 수행한다. 거부 결과는 입력 상태와 revision을 그대로 반환한다.

## 7. UI와 셸 계약

- 최상위 메모리 상태는 boot, shell, surface, overlay만 소유하며 저장 정본이 아니다.
- `HomeShell`은 타이틀, 이름 검증, 저장 미구현 안내, 빈 갤러리, 시스템 환경 설명만 제공한다.
- `GameShell`은 Day HUD, phase surface, 허용 도구, 상태 알림, 단일 `OverlayHost`를 제공한다.
- `GameShell`의 도구 후보에 갤러리가 존재하지 않는다.
- phase track은 State selector 결과를 표시하며 Day 번호로 시험 여부를 계산하지 않는다.
- 주기율표는 데스크톱과 모바일 모두 18족 공간 관계를 유지한다. 모바일은 가로 스크롤 표와 아래 상세를 사용하고 카드 목록만으로 대체하지 않는다.
- 시험 reference mode는 기본 표·상세만 제공하고 일반 toolbar를 렌더하지 않는다. 금지 기능은 CSS로만 숨기지 않고 props와 command 양쪽에서 제거한다.
- overlay를 닫으면 호출 요소로 포커스를 복귀하고 Day, phase, 슬롯, 시험 문맥을 바꾸지 않는다.
- CSS는 최종 색·서체를 확정하지 않는 의미 토큰, 유연 레이아웃, `100dvh` 성격, 문서 스크롤을 사용한다.

## 8. 자산·경로 계약

CR-AI-01~05를 모두 채택하며 세부 정본은 갱신된 `docs/09_ASSET_MANIFEST.md`를 따른다.

- Slice 0~2는 CSS/text virtual placeholder만 사용한다.
- 바이너리 URL은 `status = integrated`인 항목만 반환한다.
- 연관은 `associations[{type,id,role?}]` 구조를 사용한다.
- Vite `base`는 `./` 단일값이며 공개 path는 `assets/...` 상대 경로다.
- manifest path 검증 성공 뒤 `appBaseUrl = new URL(import.meta.env.BASE_URL, document.baseURI)`, 이어서 `assetUrl = new URL(validatedPath, appBaseUrl)`을 계산한다. 두 단계는 각각 정확히 한 번만 수행한다.
- 현재 surface·route 문자열, 저장소명 하드코딩, 문자열 접두어 결합을 URL 기준으로 사용하지 않는다.
- `BASE_URL='./'`에서 document `https://example.test/LoveChemistry/`와 `https://example.test/LoveChemistry/index.html?x=1#top`은 모두 `assets/ui/a.webp`를 `https://example.test/LoveChemistry/assets/ui/a.webp`로 해석한다. document `https://example.test/`에서는 `https://example.test/assets/ui/a.webp`다.
- 선행 `/`, `public/`, `.`·`..` segment, 역슬래시, protocol·host, query·hash, 빈 path, duplicate slash, trailing slash를 URL 생성 전에 거부한다.
- 대소문자를 변환하지 않는다. manifest path와 production build artifact를 문자 단위 exact case로 비교하며 mismatch는 통합 실패다.
- preload는 실제 파일·용량·스포일러 정책 승인 후로 유예한다.

## 9. Narrative 계약

- Slice 0~2 시스템 카피는 중립적이고 기능·상태를 설명할 수 있다.
- placeholder는 의미 키 또는 명백한 준비 상태로 관리하며 최종 캐릭터 대사처럼 쓰지 않는다.
- 실제 캐릭터 대사, 독백, 루트 장면 상세, 선택지 문장, 엔딩 문장, 실제 `SceneId`·`ChoiceId`는 금지한다.
- 과학 설명은 `topicRef`, `elementRefs`, `factRefs`, `cautionRefs`, 설명 목적 같은 의미 템플릿만 정의한다.
- 사실값은 Science 정본에서 주입하고 Narrative 데이터에 복제하지 않는다.
- 남성 고정은 외형·성격·연애 역할의 근거로 확대하지 않는다.
- 기존 `docs/04`의 사건명·루트 골격은 제안 배경이며 Slice 0~2 fixture 또는 stable ID로 승격하지 않는다.

## 10. 역할 소유권

| 영역 | 주 소유자 | 교차 책임 |
|---|---|---|
| Slice 범위·게이트·충돌 결정 | PM / Architect | QA 사전 검토 |
| 원소 정본·validator·topic query·학습 규칙 | Science / Game Systems | State 불변식, UI 소비, QA 정확성 |
| Day 상태·command·receipt·ledger·snapshot | State / Save | Systems 전이 규칙, QA 결정성 |
| 셸·화면·overlay·접근성·반응형 | Frontend UI/UX | selector/command만 소비 |
| 시스템 카피 의미·과학 설명 템플릿 | Narrative | UI 의미, Science 사실 검수 |
| manifest·resolver·fallback·실제 자산 통합 | Asset Integration | Frontend 표시, QA 경로·스포일러 |
| 차단 기준·테스트 증거·브라우저 행렬 | QA | 각 소유자가 fixture와 기대값 제공 |

공유 파일을 수정할 때는 소유 역할의 계약 변경 제안, PM 결정, 관련 문서 갱신, QA 재검토 순서를 따른다. UI가 상태 규칙을, State가 과학 사실을, Asset이 해금 규칙을, Narrative가 판정을 소유하지 않는다.

## 11. 충돌 해결표

| 충돌·긴장 | 제안 차이 | 통합 결정 | 잠금 영향 |
|---|---|---|---|
| Slice 0 과학 부트 | Frontend는 원소 정본까지 부트 검증, PM 결정은 metadata+manifest만 요구 | Slice 0은 app metadata+virtual manifest만 검증, Science는 Slice 2부터 필수 | 없음 |
| Slice 0 저장 UX | Frontend·State V2는 저장 검사·세션 진행 후보 포함 | 실제 저장은 Slice 3, Slice 0~2는 저장 미구현 표시, 세션 전용 플레이 금지 | 없음 |
| 새 게임 시점 | Frontend 흐름은 Slice 0에서 State 생성·Day 진입까지 제안 | Slice 0은 이름 검증 UI만, 생성·Day 진입은 Slice 1 | 없음 |
| placeholder 실파일 | 기존 `docs/09`는 예정 WebP 경로, Asset V2는 가상 placeholder | CR-AI-01 채택, Slice 0~2 CSS/text만 | 없음 |
| asset association | `associationIds` 평면 배열과 V2 구조 충돌 | `associations{type,id,role?}` 채택, 기존 실데이터 없어 호환층 없음 | 없음 |
| Science 파일 형식 | JSON/TS 미정 | readonly TypeScript 모듈 하나와 별도 pure unknown validator | 없음 |
| `teachingTags` | Science V2는 원소 필수 필드, PM 결정은 중복 금지 | 원소 필드에서 제거, topic concept/query가 책임 소유 | 없음 |
| 일반 검색 | 기존 `docs/05` 승인 상태가 제안, V2 권고 | 숙련도와 무관하게 항상 허용으로 승인 | 없음 |
| 함께 공부 Slice 2 | Science V2 command는 실행 가능 형태, 캐릭터·장면 없음 | 타입·확장점만 예약, UI·명령 실행 불가 | 없음 |
| level 3 공부 | State V2는 소비 가능성 유보, Systems V2는 차단 권고 | 실행 전 차단, 슬롯 미소비 | 없음 |
| 당일 수업 상태 | 기존 `docs/06`에 명시 필드 없음 | `dailyClass` 세 필드 추가 | 없음 |
| 시험 stub | State V2 테스트 stub이 오용될 위험 | production fail-closed, 테스트 port만 49/50/100 | 없음 |
| snapshot 구현 시점 | 저장 전체는 Slice 3이나 경계 검증은 Slice 1에 필요 | 순수 snapshot·in-memory를 Slice 1, 브라우저 영속화는 Slice 3 | 없음 |
| `studiedTopics` | 기존 `docs/06`은 progress와 중복 저장 | mastery>0에서 파생, 저장 제거 | 없음 |
| command/effect 멱등성 | V2 최소 상태가 command receipt 중심 | receipt와 effect ledger 분리, Day receipt 정리 정책 승인 | 없음 |
| `examGate` | 임시 비배포 필드 또는 Academic exams 조기 도입 | Slice 1 최소 상태 필드, 실제 시험 Slice에서 흡수, 배포 저장 없어 호환 코드 없음 | 없음 |
| Slice 1 topic 선행 | 결정 033의 topic 상태가 ScienceCatalog보다 먼저 필요 | 결정 043에 따라 Slice 1은 완료 불리언과 generic 수업만, topic·무료 `0→1`은 Slice 2에서 동시 활성화; fake topic 금지 | 없음 |
| 시험 test port 격리 | UI 비노출만으로 production export·bundle 유입을 증명하지 못함 | 결정 044의 tests-only 파일, production export/import graph, marker·build·E2E oracle 채택 | 없음 |
| 이름 grapheme 정본 | `Intl.Segmenter`와 fallback 결과 우선순위·버전 미정 | 결정 045의 `graphemer@1.4.0` 결과만 acceptance 정본; Segmenter는 진단 전용 | 없음 |
| 상대 asset URL oracle | `base: './'`의 document URL별 해석이 미완결 | 결정 046의 2단계 URL 해석, 허용 URL·거부·exact-case oracle 채택 | 없음 |
| 즉시 Character End | 결정 020과 Slice 1 데이터 부재 | 효과 후 no-op evaluator 위치만 구현, route/mission/affection 금지 | 없음 |
| 갤러리 목록 | 홈 필수 기능과 카탈로그 미정 | 카탈로그 없는 정상 빈 상태, 가짜 슬롯·Ne 누설 금지 | 없음 |
| 접근성·지원 환경 | 최소 버전 미정 | WCAG 2.2 AA와 승인 브라우저 행렬 채택 | 없음 |

검토 결과 잠금 규칙 자체와 충돌하는 항목은 없다.

## 12. 채택한 타협

1. **과학 부트 지연:** Slice 0은 더 작고 독립적이지만 과학 fail-closed 통합 검증은 Slice 2까지 기다린다.
2. **저장 UX 축소:** Slice 0~2에서 새로고침 복원을 제공하지 않지만 메모리 상태를 저장으로 오인시키지 않는다.
3. **production 시험 정지:** Day 10 이후 전체 30일 제품 흐름은 아직 통과할 수 없지만 가짜 시험 성공을 제품 기능으로 넣지 않는다.
4. **순수 snapshot 선행:** 실제 저장 없이 경계·직렬화 오류를 조기에 찾되 in-memory를 영속 저장으로 포장하지 않는다.
5. **과도한 추상화 축소:** 공통화 시점이 늦어질 수 있지만 한 화면 전용 계층과 파일 폭증을 피한다.
6. **단일 overlay:** 도구 중첩은 제한되지만 문맥·포커스 복귀와 시험 제한을 단순하게 보장한다.
7. **기본 과학 사실·검색 공개:** 사실 해금의 성장감은 줄지만 교육 정보 소프트락을 막고 성장은 활용 capability에 둔다.
8. **level 3 재공부 차단:** 자유 복습 표현은 줄지만 무보상 슬롯 소비 오해를 막는다.
9. **가상 placeholder:** 실제 크롭·디코드·성능은 검증하지 못하지만 비주얼 유예와 이미지 생성 금지를 지킨다.
10. **중립 카피:** 완성도는 낮아 보일 수 있지만 임시 대사와 루트 상세가 정식 콘텐츠로 굳는 것을 막는다.

## 13. 유예와 미정

다음은 구현을 막지 않는 의도적 유예다.

- 최종 시각색, 서체, 아이콘, 장식 밀도
- 실제 자산 픽셀 크기·종횡비·안전 영역·`contain/cover`
- final copy, 최종 캐릭터 대사, 실제 SceneId·ChoiceId
- 실제 시험 콘텐츠, 문항 은행, 답안·채점 UI
- route/story, 미션, 아이템, 매점, 인벤토리 상세
- 호감도와 루트 구현. Slice 2 완료 뒤 별도 승인 전 금지
- 실제 CG 카탈로그, 잠금 슬롯 공개 정책, 대체 설명
- 실제 preload·캐시·다중 해상도 전략
- optionalSettings UI와 MetaState 영속 키
- 실제 `localStorage` 키, A/B, checksum, migration, 다중 탭 정책
- `runId` 생성 방식과 command fingerprint 정본 직렬화 세부
- 최종 과학 설명 문장과 topic별 세부 카피
- 성능 예산과 실제 기기 세부 모델

지원 브라우저 범위 자체는 미정이 아니다. QA 기준은 최신 안정 Chrome, Firefox, Safari와 각 직전 주요 버전, iOS Safari 및 Android Chrome 대표 최신 버전이다.

## 14. 잠금 영향과 Change Request

### 14.1 결정별 잠금 영향

2026-09-28 결정 022~046은 모두 **잠금 변경 없음**이다. 30일 구조, 시험 날짜·퇴학 기준, Day 기반 저장, 과학 범위, 남성 고정, 홈 전용 갤러리, 무음, 무백엔드, 비주얼 유예를 보존하면서 구현 시점·책임·API·실패 정책을 구체화한다.

결정 020의 조기 Character End와 결정 021의 시험 중 제한 조회는 기존 사용자 승인 예외를 그대로 소비하며 이번 문서가 새 예외를 추가하지 않는다.

### 14.2 BLOCKED CHANGE REQUEST

**없음.** 문서 검토에서 사용자 재승인이 필요한 실제 잠금 충돌을 발견하지 않았다.

다음 요구가 추후 제기되면 일반 구현 결정으로 흡수하지 않고 별도 BLOCKED CHANGE REQUEST로 올린다.

- Slice 0 과학 fake/stub 데이터로 진행
- 저장 불가 세션 전용 플레이 허용
- Day 기반이 아닌 장면별 자유 저장
- 시험 중 검색·필터·비교·힌트·진단 허용 또는 시험 점수 보정
- 무료 수업·미션으로 숙련도 2·3 지급
- 원소 20 밖·고급 화학의 필수화
- Slice 2 이전 호감도·루트·최종 캐릭터 대사 구현
- 홈 밖 CG 갤러리 접근
- 캐릭터 외형·CG 구도·음향 도입

## 15. QA 사전 검토 항목

### 15.1 부트·셸·저장 표현

- Slice 0 부트가 app metadata와 virtual manifest 외 리소스를 요구하지 않는가.
- Science catalog가 Slice 2 전 부트 경로에 묶이지 않았는가.
- `HomeShell`과 `GameShell`이 상호 배타적이고 게임 문맥에서 gallery 요청이 차단되는가.
- 저장 미구현과 저장 없음, in-memory snapshot과 실제 저장 성공을 혼동하지 않는가.
- localStorage 불가 시 새 게임·불러오기 우회 경로가 없는가.

### 15.2 이름·접근성·브라우저

- trim 후 `graphemer@1.4.0` 결과로 0, 1, 12, 13 grapheme 경계를 검사하는가.
- `''=0`, `김철수=3`, `가나다라마바사아자차카타=12`, `가나다라마바사아자차카타파=13`, decomposed `가=1`, `e\u0301=1`, family ZWJ emoji `=1`, skin-tone emoji `=1`, Korean flag `=1`, `김 철수=4` oracle와 count 무관 `Cc` 거부를 검사하는가.
- `Intl.Segmenter` 진단 결과가 다르더라도 acceptance가 바뀌지 않고 package unavailable이 build failure가 되는가.
- WCAG 2.2 AA, 키보드 전용, 포커스 이동·복귀, 200% 확대, reduced motion, 모바일 세로·가로를 수동·자동으로 검사하는가.
- 최신 및 직전 Chrome/Firefox/Safari와 최신 대표 iOS Safari/Android Chrome을 검사하는가.

### 15.3 Day·명령·시험

- Slice 1 오전·오후 수업 명령이 topic 없이 분리되고 숙련도 변화가 전혀 없는가.
- Slice 2에서만 검증된 topic 선택과 무료 상승이 추가되고 오후 완료 전에는 상승하지 않는가.
- `passFreeTime`이 정확히 한 슬롯만 소비하고 보상이 없는가.
- 실패 command가 슬롯·숙련도·revision·receipt·ledger에 부분 효과를 남기지 않는가.
- receipt duplicate·payload conflict·stale revision 검사 순서가 계약과 맞는가.
- 시험일 오후 수업 뒤 production이 `exam`에서 멈추고 공개 점수 주입 경로가 없는가.
- production public exports·command registry에 raw score API가 없고 production `src`에서 `tests` import가 없는가.
- production build artifact에 `slice-test-exam-outcome-v1`이 없고 Day 10 production E2E의 UI·일반 명령·registry 요청이 모두 `exam`을 통과하지 못하는가.
- test graph의 `tests/helpers/resolveExamForTest.ts`만 49·50·100을 주입하며 49 퇴학, 50·100 생존과 결과 재주입 거부를 검증하는가.
- Day 30 뒤 Day 31이 없고 terminal 뒤 모든 진행 명령이 거부되는가.

### 15.4 Snapshot·멱등성

- 세 snapshot의 phase, Day, 슬롯, 수업, 시험 결과, runStatus 불변식이 정확한가.
- Slice 1 snapshot에 topic 필드·ID·fake fixture가 없고 Slice 2 snapshot에서만 검증된 `selectedTopicId`가 추가되는가.
- stringify/parse round-trip이 키·값·의미를 보존하고 현재 시각·DOM·난수에 의존하지 않는가.
- next dayStart에서 이전 Day receipt만 정리되고 effect ledger는 지워지지 않는가.
- examResolved·terminal에 현재 Day receipt가 남아 중복 재전이를 막는가.
- in-memory adapter API가 persistence 또는 load 성공 용어를 사용하지 않는가.

### 15.5 Science·학습·주기율표

- 20개 정확한 값, He=2, H 주의, 전자 합, 주기, ID 유일성을 정적 검사하는가.
- 원소 record에 `teachingTags`가 다시 추가되거나 UI·fixture에 사실값이 복제되지 않는가.
- topic ID가 정확히 7개이고 concept/query가 원소별 태그 복제 없이 같은 결과를 내는가.
- 일반 검색이 mastery 0에서도 가능하고 시험에서는 어떤 숙련도에서도 불가능한가.
- 무료 수업은 `0→1`, selfStudy는 한 단계만, level 3은 슬롯 소비 전 거부되는가.
- `studyTogether`가 제품 UI·명령에 노출되지 않는가.
- 모바일 주기율표가 18족 공간 관계를 보존하고 보조 기술에 족·주기 정보를 전달하는가.

### 15.6 자산·배포·Narrative

- 바이너리 0개에서도 Slice 0~2가 동작하고 placeholder가 외형·성별·사건을 암시하지 않는가.
- `integrated` 외 status에서 네트워크 요청이 없는가.
- `base: './'`와 `assets/...` 결합 결과가 하위 경로에서 맞고 절대 `/assets`가 0건인가.
- directory document, `index.html?x=1#top`, root document가 8절의 정확한 URL oracle과 일치하는가.
- 선행 `/`, `public/`, `.`·`..`, 역슬래시, protocol·host, query·hash, 빈 path, duplicate slash, trailing slash와 exact-case mismatch를 모두 거부하는가.
- association이 해금·과학·엔딩 판정에 영향을 주지 않는가.
- 갤러리 빈 상태와 접근 가능한 이름에서 Ne 존재가 누설되지 않는가.
- final 캐릭터 대사·루트 상세·실제 SceneId·ChoiceId가 Slice 0~2 산출물에 없는가.
- 과학 설명이 값 복제 없이 정본 참조와 의미 템플릿만 사용하는가.

## 16. 구현 전 체크리스트

- [x] PM이 결정 043~046을 본 문서의 Slice 0~2 단일 구체 계약에 반영했다.
- [x] 결정 022~046이 `docs/10_DECISION_LOG.md`에 기록됐다.
- [x] `docs/09_ASSET_MANIFEST.md`에 CR-AI-01~05와 결정 046 URL oracle이 반영됐다.
- [x] QA가 기존 실행 `NOT TESTED` 상태를 유지한 채 본 설계를 사전 검토하고 QA-V2-001~004를 문서 계약 기준 종료했다.
- [x] Slice별 production 범위와 시험 test-only fixture·port의 파일·import·export·build 경계가 결정 044로 정의됐다. 실행 증거는 아직 없다.
- [ ] Slice 0에는 Science·GameState·persistence 구현이 들어가지 않는다.
- [ ] Slice 1에는 localStorage·Meta·route·affection·mission 구현이 들어가지 않는다.
- [ ] Slice 2에는 studyTogether 실행, 실제 시험, route/story 구현이 들어가지 않는다.
- [ ] selector·command 입력·결과·오류와 전체 불변식 테스트 목록이 준비됐다.
- [x] 이름의 authoritative `graphemer@1.4.0`과 fixture oracle이 결정 045로 정의됐다. 패키지는 설치하지 않았고 실행은 아직 없다.
- [x] production 시험 raw score 비노출, marker 검사와 Day 10 fail-closed E2E 방법이 결정 044로 정의됐다. 실행은 아직 없다.
- [ ] snapshot을 저장 성공으로 표시하지 않는 UI 문구가 검토됐다.
- [ ] 과학 정본 20개와 topic 7개의 정적 수용 검사가 준비됐다.
- [x] Pages directory/index/root URL oracle, 금지 path와 exact-case 검증 방법이 결정 046으로 정의됐다. production build 실행은 아직 없다.
- [ ] 키보드·포커스·200%·reduced motion·지원 브라우저 수동 검증 담당이 배정됐다.
- [ ] 최종 색·서체·자산 비율·final copy·시험 콘텐츠·route/story가 유예 상태로 남아 있다.
- [ ] 별도 구현 승인 전 코드·패키지·이미지 작업을 시작하지 않는다.

## 17. 최종 판정

결정 043~046과 역할별 최신 계약으로 QA-V2-001~004를 문서 계약 기준 종료했다. 잠금 변경이나 BLOCKED CHANGE REQUEST는 없고 코드·패키지·런타임·production build 증거도 없다. Slice 0~2는 **QA 사전검토 PASS / READY FOR PM IMPLEMENTATION AUTHORIZATION**지만 현재 구현은 미승인이고 실행은 `NOT TESTED`다. 별도 승인 전 어떤 Slice도 Ready to Code로 선언하지 않는다.
