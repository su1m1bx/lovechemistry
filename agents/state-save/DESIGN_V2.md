# State / Save 2차 설계

## 현행 작업 계약 / 2026-10-26

- 유일한 Slice별 적용 기준은 `docs/12_INTEGRATED_DESIGN_V2.md`와 후속 `docs/15_IMPLEMENTATION_CONTRACT.md`, 결정 047~053이다. 아래 보존 원안의 타입·fixture·미정 목록을 구현 기준으로 복사하지 않는다.
- Slice 0에는 GameState·저장 검사·복구 fixture가 없다. Slice 1은 topic 없는 Day 전이·순수 snapshot, Slice 2부터 검증된 topic과 학업 상태를 추가한다.
- State는 공통 envelope·오류·receipt·snapshot과 공개 commands/selectors facade를 소유한다. Systems의 순수 규칙을 같은 원자 전이에 적용하며 두 번째 학습 상태를 만들지 않는다.
- 공개 결과는 `status = applied/duplicate/rejected` 하나다. command ID·effect ID·revision은 `docs/15` 2절을 따른다. 학업 상태는 `topicProgressById`, `topicLastProgressSourceById`이며 `academics.topics` 원안은 비채택이다.
- 성공 receipt와 effect ledger는 **회차 전체 보존**한다. Day 경계 정리는 폐기한다. terminal 동일 재전송은 duplicate, 새 요청은 거부한다. checkpoint 전이만 snapshotRevision을 증가시키고 snapshot 투영은 순수하다.
- Slice 2 함께 공부 실행·level 3 슬롯 소비 복습·source studyTogether fixture는 금지한다. 무료 복습은 상승 출처를 덮어쓰지 않는다.
- 실제 localStorage·Meta는 Slice 3, 실제 시험은 후속 범위다. test-only 점수 경계는 production graph에서 격리한다.
- 상태: **PM 계약 수정 반영 / QA 재검토 필요 / 구현 미승인·NOT TESTED**. 아래 036의 옛 receipt·2.2 저장·2.8 타입·7절 fixture는 후속 계약에 의해 대체된 이력이다.

## 보존 원안 / 2026-09-28 / 구현 근거 아님

- **상태:** `DESIGN PROPOSAL / 구현 승인 아님`
- **범위:** Slice 0~2 상태 계약과 Slice 3 저장 연결점
- **작성일:** 2026-09-28
- **근거:** `docs/00`, `01`, `05`~`08`, `10`, `11`, `agents/state-save/BRIEF.md`, `agents/state-save/PROPOSAL.md`
- **금지:** 이 문서는 코드, 패키지, 저장 데이터 또는 다른 계약 문서를 생성·수정하지 않는다.

## 1. 목표와 범위 경계

이번 설계는 완성형 `docs/06_STATE_SAVE_SCHEMA.md`를 한 번에 구현하지 않고, 각 슬라이스가 실제로 필요한 상태만 추가하는 계약을 정한다.

- **Slice 0:** 앱 부트, 홈/게임 셸 선택, 저장 유무·복구 가능성 요약만 다룬다.
- **Slice 1:** 남성 주인공, Day/phase, 점심·방과 후 슬롯, 회차 상태를 가진 최소 `GameState`와 결정적 명령 처리기를 다룬다.
- **Slice 2:** 일곱 학습 주제의 숙련도와 마지막 실제 상승 출처를 추가한다.
- **Slice 3 이후:** 관계, 미션, 인벤토리, 효과 원장, 실제 `localStorage` 이중 버퍼, 마이그레이션, 메타 진행을 연결한다.

이번 범위에서 확정하지 않는 것:

- 관계·미션·인벤토리의 실제 상태 타입
- 실제 시험 문항·답안·채점기
- Character End 후보 계산 규칙의 구현
- `localStorage` 키와 이중 버퍼 구현
- 콘텐츠 ID 최종 목록과 콘텐츠 마이그레이션
- UI 컴포넌트와 화면 디자인

### 1.1 최신 PM 계약 정렬(결정 043~045)

이 절은 아래 원안 중 충돌하는 제안보다 우선한다. 문서 정렬일 현재 코드·패키지·build 증거는 없고 QA 재검토 전 구현 승인 또는 Ready to Code를 뜻하지 않는다.

- **Slice 1 topic 경계:** Slice 1 `DailyClassState`는 `morningCompleted`, `afternoonCompleted`만 가진다. `StudyTopicId`, `selectedTopicId`, topic enum·fixture는 없고 snapshot에도 topic이 없다. `completeMorningClass(commandId)`와 `completeAfternoonClass(commandId)`는 generic 완료이며 숙련도를 변경하지 않는다. 아래 2.4~2.6절의 topic 없는 `COMPLETE_CLASS` 전이만 이 의미로 유지된다.
- **Slice 2 topic 도입:** 검증된 ScienceCatalog 활성화와 함께 `selectedTopicId`를 추가하고 `completeMorningClass(topicId, commandId)`로 대체한다. `completeAfternoonClass(commandId)`가 선택 topic의 무료 `0→1` 또는 복습 결과를 적용한다. 아직 배포 persistence가 없어 migration·compatibility code를 만들지 않으며 Slice 1 fake topic을 금지한다.
- **시험 production 경계:** 아래 `ExamStubCommand`, `COMMIT_EXAM_STUB_RESULT`, `source: 'slice1-safe-stub'` 선언을 production 상태 command union과 공개 논리 영역에 둘 수 있다는 제안은 **SUPERSEDED**다. production façade·`src/state/commands.ts` 또는 동등 registry에는 raw score command·port·type export가 없다.
- **시험 internal/test 경계:** 향후 실제 시험용 검증 결과 적용 함수의 논리 위치는 `src/state/internal/applyVerifiedExamOutcome.ts`지만 실제 시험 Slice 전 production entry graph에서 import하지 않는다. test adapter는 `tests/helpers/resolveExamForTest.ts`에만 있고 marker `slice-test-exam-outcome-v1`과 점수 `49 | 50 | 100`만 허용한다. production `src`에서 `tests` import를 금지하고 Vite production input은 `src/main.tsx` 단일 graph다.
- **시험 검증:** production public exports·registry raw score API 부재, source import boundary, production artifact marker 부재, Day 10 production E2E fail-closed, test graph의 49/50/100과 재주입 거부를 모두 확인한다.
- **이름 count:** 이름 validator는 구현 승인 시 direct dependency `graphemer@1.4.0` 결과만 authoritative count로 사용한다. `Intl.Segmenter`는 진단 전용이고 package unavailable은 build failure이며 코드포인트 fallback은 금지한다. fixture와 `Cc` 거부의 정본은 결정 045 및 `docs/12` 5.2절이다. 지금 패키지를 설치하지 않는다.

결정 043~045는 모두 잠금 변경 없음이다.

## 2. 구체 설계

### 2.1 공통 원칙

1. `GameState`만 회차 규칙의 정본이다. UI 화면과 브라우저 기록은 정본이 아니다.
2. 명령 처리기는 입력 상태를 직접 변경하지 않고, 성공한 새 상태 또는 구조화된 거부 결과를 반환한다.
3. phase, 시험 의무, 합격 여부, 슬롯 소비 여부는 UI가 계산하지 않는다.
4. 모든 성공 명령은 상태 전체 불변식을 통과한 뒤 한 번만 커밋된다.
5. 원소의 원자번호·기호·이름·족·주기·전자배치·원자가전자 값은 `GameState`와 저장 스냅샷에 넣지 않는다.
6. Slice 1의 시험은 진행 우회 방지용 안전 stub이다. 실제 문제·채점이 없는 상태에서 시험일을 일반 phase처럼 통과시키지 않는다.
7. 즉시 Character End는 Slice 1에서 계산하지 않는다. 다만 효과가 완전히 적용된 후보 상태 직후 호출되는 단일 확장점은 미리 둔다.

### 2.2 Slice 0: boot와 AppShellState

`AppShellState`는 UI 수명 동안만 존재하는 비영속 상태다. `GameState`나 저장 봉투에 넣지 않는다.

```ts
type AppShellState =
  | { status: 'booting' }
  | {
      status: 'ready'
      shell: 'home' | 'game' | 'forcedFlow'
      save: SaveInspection
      notice: AppNotice | null
    }
  | {
      status: 'blocked'
      reason: 'storage-unavailable' | 'unexpected-boot-error'
      canContinueInMemory: boolean
    }

type SaveInspection =
  | { kind: 'none' }
  | { kind: 'available'; summary: SaveSummary }
  | { kind: 'recovered'; summary: SaveSummary; from: 'backup' }
  | { kind: 'corrupt'; canReset: true }
  | { kind: 'incompatible'; foundVersion: string; canReset: true }
  | { kind: 'unavailable' }

type SaveSummary = {
  checkpoint: 'dayStart' | 'examResolved' | 'terminal'
  day: number
  context: 'morningHomeroom' | 'afterSchoolFreeTime' | 'terminal'
  runStatus: 'active' | 'characterEnding' | 'normalEnding' | 'expelled'
  writtenAt: string // 표시·진단 전용
}

type AppNotice = {
  code: string
  messageKey: string
}
```

Slice 0의 `SaveInspection`은 저장 계층의 읽기 결과를 표현하는 포트다. Slice 0에서 임시 저장 형식을 새로 만들거나, 유효성 검사를 통과하지 않은 JSON에서 Day만 추출해 `available`로 표시하지 않는다. 실제 저장 구현 전 fixture adapter는 `none`, `unavailable`, 고정된 유효 요약만 반환한다.

저장 요약 표시 규칙:

- `dayStart`: `Day N 시작`, 보조 문구 `Day N-1 완료`를 표시할 수 있다.
- `examResolved`: `Day N 시험 합격 후 방과 후`로 표시하며 수동 저장 슬롯처럼 표현하지 않는다.
- `terminal`: 종료 종류와 종료 Day만 표시하며 `계속하기`를 제공하지 않는다.
- 내부 bank A/B, revision, checksum은 사용자 요약에 노출하지 않는다.

### 2.3 Slice 1: 최소 GameState

```ts
type ExamDay = 10 | 20 | 30

type Phase =
  | 'morningHomeroom'
  | 'morningClass'
  | 'lunchFreeTime'
  | 'afternoonClass'
  | 'exam'
  | 'afterSchoolFreeTime'
  | 'dayEnd'
  | 'terminal'

type RunStatus =
  | { kind: 'active' }
  | { kind: 'normalEnding'; endingId: 'normal-ending' }
  | {
      kind: 'expelled'
      endingId: 'expelled'
      examDay: ExamDay
      score: number
    }
  | {
      kind: 'characterEnding'
      endingId: string
      characterId: string
    }

type GameStateV1 = {
  schemaVersion: 1
  contentVersion: string
  runId: string
  stateRevision: number
  snapshotRevision: number
  player: {
    name: string
    gender: 'male'
  }
  calendar: {
    day: number
    phase: Phase
    freeActions: {
      lunchUsed: boolean
      afterSchoolUsed: boolean
    }
  }
  examGate: {
    resultsByDay: Partial<Record<ExamDay, ExamStubResult>>
  }
  commandReceipts: Record<string, CommandReceipt>
  runStatus: RunStatus
}

type ExamStubResult = {
  score: number
  passed: boolean
  source: 'slice1-safe-stub'
}

type CommandReceipt = {
  fingerprint: string
  resultingStateRevision: number
}
```

`stateRevision`은 모든 성공 상태 변경에서 증가하는 낙관적 동시성 번호다. `snapshotRevision`은 승인된 스냅샷 후보를 만들 때만 증가한다. 둘을 합치지 않는다.

새 게임 기본값:

- `day = 1`, `phase = morningHomeroom`
- 점심·방과 후 슬롯 모두 미소비
- `gender = male`
- `runStatus = active`
- 시험 결과와 명령 영수증은 비어 있음
- 이름은 앞뒤 공백 제거 후 비어 있지 않아야 함

### 2.4 Slice 1 명령과 결과

```ts
type CommandMeta = {
  commandId: string
  expectedStateRevision: number
}

type GameCommandV1 =
  | (CommandMeta & { type: 'COMPLETE_HOMEROOM' })
  | (CommandMeta & { type: 'COMPLETE_CLASS' })
  | (CommandMeta & {
      type: 'RESOLVE_FREE_ACTION'
      slot: 'lunch' | 'afterSchool'
      resolution: 'performed' | 'passed'
    })
  | (CommandMeta & { type: 'COMMIT_DAY_END' })

// 역사적 원안: 결정 044로 SUPERSEDED. production command/type/export에 둘 수 없다.
type ExamStubCommand = CommandMeta & {
  type: 'COMMIT_EXAM_STUB_RESULT'
  examDay: ExamDay
  score: 49 | 50 | 100
  source: 'slice1-safe-stub'
}

type CommandResult<S> =
  | {
      ok: true
      status: 'applied'
      state: S
      events: DomainEvent[]
    }
  | {
      ok: true
      status: 'duplicate'
      state: S
      events: []
    }
  | {
      ok: false
      status: 'rejected'
      state: S
      error: StateError
    }

type StateError = {
  code:
    | 'INVALID_COMMAND'
    | 'STALE_STATE'
    | 'COMMAND_ID_CONFLICT'
    | 'INVALID_PHASE'
    | 'INVALID_DAY'
    | 'SLOT_ALREADY_USED'
    | 'SLOT_PHASE_MISMATCH'
    | 'EXAM_REQUIRED'
    | 'EXAM_ALREADY_RESOLVED'
    | 'INVALID_EXAM_RESULT'
    | 'TERMINAL_STATE'
    | 'INVARIANT_VIOLATION'
  messageKey: string
  details?: Record<string, string | number | boolean>
}

type DomainEvent =
  | { type: 'PHASE_CHANGED'; from: Phase; to: Phase }
  | { type: 'FREE_ACTION_RESOLVED'; slot: 'lunch' | 'afterSchool' }
  | { type: 'EXAM_RESOLVED'; day: ExamDay; score: number; passed: boolean }
  | { type: 'DAY_STARTED'; day: number }
  | { type: 'RUN_TERMINATED'; reason: 'normalEnding' | 'expelled' }
```

명령 처리 순서:

1. `commandId`와 정본 직렬화한 payload로 fingerprint를 만든다.
2. 같은 ID 영수증이 있으면 fingerprint가 같은 경우 `duplicate`, 다르면 `COMMAND_ID_CONFLICT`를 반환한다.
3. `expectedStateRevision` 불일치 시 `STALE_STATE`를 반환한다.
4. terminal, phase, Day, 슬롯, 시험 선행 조건을 검사한다.
5. 원본을 바꾸지 않고 후보 상태를 만든다.
6. 명령 효과와 영수증을 같은 후보에 넣고 `stateRevision`을 1 증가시킨다.
7. 후보 전체 불변식을 검사한다.
8. 성공한 후보에 대해 즉시 엔딩 확장점을 호출한다.
9. 최종 후보만 `applied`로 반환한다.

`duplicate`는 이미 적용된 결과를 다시 적용하지 않는 성공이다. 같은 `commandId`를 다른 payload에 재사용하는 것은 성공으로 취급하지 않는다.

### 2.5 일반일 상태기계

Day 1~30의 비시험일 전이:

```text
morningHomeroom
  -- COMPLETE_HOMEROOM --> morningClass
morningClass
  -- COMPLETE_CLASS --> lunchFreeTime
lunchFreeTime
  -- RESOLVE_FREE_ACTION(lunch) --> afternoonClass
afternoonClass
  -- COMPLETE_CLASS --> afterSchoolFreeTime
afterSchoolFreeTime
  -- RESOLVE_FREE_ACTION(afterSchool) --> dayEnd
dayEnd
  -- COMMIT_DAY_END --> next Day morningHomeroom
```

- `resolution = passed`도 슬롯을 소비한다. 행동을 하지 않는 선택이 무한 대기를 만들지 않되 추가 행동 기회를 주지 않는다.
- Day 1~29의 `COMMIT_DAY_END`는 Day를 1 올리고 두 슬롯을 초기화한다.
- Day 30의 `COMMIT_DAY_END`는 Day 31을 만들지 않고 `normalEnding/terminal`로 간다.
- 방과 후 `RESOLVE_FREE_ACTION` 성공이 `dayEnd` 진입까지 원자적으로 수행하고, 이후 `COMMIT_DAY_END`가 다음 Day 또는 노멀 엔드를 확정한다.

### 2.6 시험일 상태기계와 안전 stub

Day 10·20·30 전이:

```text
morningHomeroom
  -> morningClass
  -> lunchFreeTime
  -> afternoonClass
  -> exam
     -- score < 50  --> terminal(expelled)
     -- score >= 50 --> afterSchoolFreeTime
  -> dayEnd
```

시험 안전 규칙:

- `afternoonClass` 완료 시 날짜가 `10 | 20 | 30`이면 반드시 `exam`으로 간다.
- 일반 `COMPLETE_CLASS`, 자유 행동, Day 종료 명령으로 `exam`을 빠져나갈 수 없다.
- `COMMIT_EXAM_STUB_RESULT`는 현재 Day와 `examDay`가 같고 phase가 `exam`일 때 한 번만 허용한다.
- `passed`는 입력받지 않고 `score >= 50`으로 계산한다.
- Slice 1 fixture 점수는 경계 검증용 `49 | 50 | 100`만 허용한다.
- 49는 같은 명령에서 시험 결과와 `expelled/terminal`을 함께 만든다.
- 50과 100은 같은 명령에서 결과를 기록하고 `afterSchoolFreeTime`으로 간다.
- 시험 결과가 이미 있으면 재제출을 거부한다.
- 실제 시험 구현이 들어오면 UI가 점수를 보내지 않고 시험 정본과 답안으로 채점한 내부 결과만 이 커밋 경계를 사용한다.

이 stub 표기와 production 논리 영역의 raw score command 제안은 결정 044로 **SUPERSEDED**다. 최신 계약은 1.1절의 tests-only adapter와 import/build 경계를 따른다.

### 2.7 즉시 Character End 확장점

Slice 1에서는 관계·미션·필수 이벤트가 없으므로 항상 `none`을 반환하는 기본 evaluator를 사용한다. 호출 위치와 출력 계약만 고정한다.

```ts
type ImmediateEndingDecision =
  | { kind: 'none' }
  | { kind: 'deferredForExam'; candidateIds: string[]; effectId: string }
  | { kind: 'singleCandidate'; characterId: string; effectId: string }
  | { kind: 'multipleCandidates'; characterIds: string[]; effectId: string }

type ImmediateEndingEvaluator = (
  previous: GameStateV1,
  candidate: GameStateV1,
  cause: { commandId: string; effectId?: string },
) => ImmediateEndingDecision
```

확장점 불변 조건:

- 명령 효과와 후보 상태 검증이 모두 끝난 뒤 정확히 한 번 호출한다.
- 현재 phase가 `exam`이거나 도달한 필수 시험이 미완료면 evaluator 결과를 확정하지 않고 `deferredForExam`으로만 보존할 수 있다.
- 퇴학 terminal이 만들어진 명령에서는 Character End보다 퇴학이 우선한다.
- Slice 1은 `endingSelection`, `characterEndingScene`, 메타 해금, terminal Character End 커밋을 구현하지 않는다.
- Slice 3에서 후보 보존 필드와 두 ending phase를 추가할 때 이 출력 계약을 소비한다.

### 2.8 Slice 2: AcademicState

```ts
type StudyTopicId =
  | 'topic-identity'
  | 'topic-group-period'
  | 'topic-shells'
  | 'topic-valence'
  | 'topic-similarity'
  | 'topic-stability'
  | 'topic-comparison'

type GainSource = 'classIntro' | 'selfStudy' | 'studyTogether'

type TopicProgress = {
  level: 0 | 1 | 2 | 3
  lastGainSource: GainSource | null
}

type AcademicState = {
  topics: Record<StudyTopicId, TopicProgress>
}

type GameStateV2 = Omit<GameStateV1, 'schemaVersion'> & {
  schemaVersion: 2
  academics: AcademicState
}
```

Slice 2 명령 확장:

```ts
type AcademicCommand =
  | (CommandMeta & {
      type: 'COMPLETE_CLASS'
      topicId: StudyTopicId
    })
  | (CommandMeta & {
      type: 'RESOLVE_STUDY_ACTION'
      slot: 'lunch' | 'afterSchool'
      topicId: StudyTopicId
      mode: 'selfStudy' | 'studyTogether'
    })
```

학습 전이:

- 수업은 `0 -> 1`만 허용하고 `lastGainSource = classIntro`로 둔다.
- level 1 이상에서 수업은 복습·진단 이벤트만 반환하며 level과 `lastGainSource`를 바꾸지 않는다.
- 혼자·함께 공부는 현재 level이 0, 1, 2이면 정확히 1만 올리고 각각 `selfStudy`, `studyTogether`를 기록한다.
- level 3에서 공부하면 슬롯은 콘텐츠 확인 뒤 소비할 수 있지만 숙련도와 `lastGainSource`는 바꾸지 않는다. Slice 2 fixture에서는 혼동을 피하기 위해 level 3 학습 명령을 `INVALID_COMMAND`로 거부하는 안을 권고한다.
- level 2 또는 3의 `lastGainSource`는 반드시 `selfStudy | studyTogether`다.
- `studiedTopics`는 `level > 0`인 키에서 파생하므로 중복 저장하지 않는다.
- 숙련도에 따른 필터·비교·힌트 사용 가능성도 level에서 파생하며 별도 불리언으로 저장하지 않는다.

### 2.9 원소 사실 비저장

다음 값은 상태 또는 Day 스냅샷에 저장하지 않는다.

- 원자번호, 기호, 한국어·영어 이름
- 족, 주기
- 전자껍질별 전자배치, 원자가전자
- 표시용 전자배치 문자열
- 학습 도구가 계산할 수 있는 필터·비교 결과

원소 1~20의 핵심 사실은 항상 과학 정본에서 읽는다. 상태가 보존하는 것은 플레이어의 학습 진행뿐이다. 향후 특정 서사 단서의 발견 여부가 필요하면 안정된 `KnowledgeId` 또는 이벤트 ID만 저장할 수 있지만, 그 ID가 과학 사실값을 재정의해서는 안 된다.

## 3. TypeScript 유사 구조

슬라이스별 합성 관계는 다음과 같다.

```ts
type Slice0Runtime = {
  appShell: AppShellState // 비영속
}

type Slice1Runtime = {
  appShell: AppShellState // 비영속
  game: GameStateV1      // 회차 정본
}

type Slice2Runtime = {
  appShell: AppShellState // 비영속
  game: GameStateV2      // GameStateV1 + AcademicState
}

type StateEngine<S, C> = {
  dispatch(state: S, command: C): CommandResult<S>
  validate(state: S): StateError[]
  summarize(state: S, writtenAt: string): SaveSummary
}
```

- `AppShellState`는 저장 상태와 분리한다.
- `GameStateV1`은 Slice 1의 최소 정본이고 `GameStateV2`가 학업 영역만 추가한다.
- Slice 2의 `COMPLETE_CLASS`는 V1 명령에 별도 overload를 더하는 것이 아니라 `topicId` 필수 형태로 대체한다.
- `dispatch`는 순수 상태 전이, `validate`는 전체 불변식, `summarize`는 검증된 스냅샷의 읽기 전용 투영이다.
- 실제 저장 adapter는 이 인터페이스에 포함하지 않고 Slice 3에서 별도 포트로 추가한다.

## 4. Day 스냅샷 대안과 권고

### 대안 A: Slice 1에서 전체 영속화까지 구현

- 장점: 새로고침 복원과 시험 우회를 초기에 통합 검증할 수 있다.
- 단점: 관계·학업·메타·마이그레이션이 없는 임시 저장 형식을 먼저 고정하게 되고 Slice 3에서 큰 재작업이 발생한다.
- 위험: Slice 1 구현이 `docs/06`의 이중 버퍼·콘텐츠 호환성까지 끌어안아 핵심 Day 상태기계 검증이 늦어진다.

### 대안 B: 모든 스냅샷 작업을 Slice 3까지 유예

- 장점: 완성형 스키마로 한 번만 구현한다.
- 단점: Day 증가, 시험 합격 체크포인트, terminal 경계를 메모리 전이만으로 검증해 저장 계약 오류를 늦게 발견한다.
- 위험: Slice 1의 phase 모델이 실제 직렬화 가능한지 보장되지 않는다.

### 권고: Slice 1 계약·순수 스냅샷, Slice 3 브라우저 영속화

Slice 1에서 다음을 구현 대상으로 승인하는 안을 권고한다.

- `dayStart`, `examResolved`, `terminal` 스냅샷 후보 생성 규칙
- 스냅샷 전체 검증과 정본 JSON 직렬화
- in-memory adapter와 고정 fixture를 통한 round-trip
- `SaveSummary` 투영 함수

Slice 3까지 미룰 항목:

- 실제 `localStorage` 접근
- bank A/B와 manifest
- checksum, 장애 복구, 다중 탭 revision 충돌
- 스키마 마이그레이션과 콘텐츠 호환성 표
- `MetaState`와 terminal 해금의 원자 커밋

이 분리는 Day 기반 저장의 핵심 경계를 Slice 1에서 검증하면서도, 임시 브라우저 저장 형식을 제품 계약처럼 굳히지 않는다. PM 승인 전에는 어느 쪽도 구현하지 않는다.

## 5. 불변식

### Slice 0

- `AppShellState`는 저장 payload에 포함되지 않는다.
- 유효성 검증 전 저장은 `available`로 표시하지 않는다.
- `terminal` 요약은 활성 진행으로 복원하지 않는다.

### Slice 1

- Day는 안전 정수 `1..30`이다.
- `gender`는 항상 `male`이다.
- `runStatus.active`일 때 phase는 `terminal`이 아니다.
- 비활성 runStatus일 때 phase는 반드시 `terminal`이다.
- 점심 슬롯은 `lunchFreeTime` 해결 전까지 false이고 해결 뒤 true다.
- 방과 후 슬롯은 `afterSchoolFreeTime` 해결 전까지 false이고 해결 뒤 true다.
- 시험일 `afternoonClass` 다음 phase는 반드시 `exam`이다.
- 시험일의 `afterSchoolFreeTime` 또는 `dayEnd`에는 해당 Day의 합격 결과가 존재한다.
- 49는 `expelled`, 50과 100은 활성 방과 후 상태다.
- Day 30 종료 뒤 Day 31은 존재하지 않는다.
- terminal 상태에서는 어떤 게임 명령도 상태를 바꾸지 않는다.
- 동일 명령은 상태 revision, 슬롯, 시험 결과를 두 번 바꾸지 않는다.

### Slice 2

- 일곱 주제 키가 정확히 한 번씩 존재한다.
- level은 정수 `0..3`이다.
- level 0이면 `lastGainSource = null`이다.
- level 1 이상이면 `lastGainSource != null`이다.
- level 2·3의 마지막 상승 출처는 `selfStudy | studyTogether`다.
- 무료 수업과 미션 보상은 level 2·3을 만들지 않는다.
- 학업 상태는 시험 답안이나 점수를 자동 변경하지 않는다.
- 상태와 스냅샷에 원소 사실값이 없다.

## 6. 오류 정책

- 거부된 명령은 원본 상태와 revision을 그대로 반환한다.
- 예측 가능한 규칙 위반은 예외를 던지지 않고 `StateError`로 반환한다.
- 프로그래밍 결함이나 손상 상태로 불변식 생성 자체가 불가능한 경우에만 상위 경계가 치명 오류로 기록한다.
- 오류 메시지 문자열을 상태 로직에 넣지 않고 `messageKey`를 UI에 제공한다.
- UI는 오류 코드를 보고 phase를 임의 보정하거나 명령을 다른 명령으로 대체하지 않는다.
- 저장 실패가 추가되는 Slice 3에서는 메모리 후보와 마지막 영속 스냅샷을 구분하고, 저장되지 않은 상태를 저장 성공으로 표시하지 않는다.

## 7. Fixture와 검증 목록

### Slice 0 fixture

| ID | 준비 | 기대 결과 |
|---|---|---|
| `BOOT-NONE` | 저장 없음 | 홈, 새 게임 가능, 불러오기 비활성 |
| `BOOT-DAY` | 유효한 Day 7 `dayStart` | `Day 7 시작` 요약 |
| `BOOT-EXAM` | 유효한 Day 10 `examResolved` | 시험 합격 후 방과 후 요약 |
| `BOOT-RECOVERED` | 활성본 손상, fixture 백업 정상 | recovered 안내와 백업 요약 |
| `BOOT-CORRUPT` | 모든 fixture 저장 손상 | 임의 Day 추출 없이 초기화 선택 |

### Slice 1 fixture

| ID | 준비·명령 | 기대 결과 |
|---|---|---|
| `DAY-NORMAL-01` | Day 1 전체 정상 명령 | Day 2 조회, 슬롯 초기화 |
| `DAY-WRONG-PHASE` | 오전 조회에서 자유 행동 | `INVALID_PHASE`, 무변경 |
| `ACT-DUPLICATE` | 같은 행동 명령을 같은 ID로 2회 | 두 번째 `duplicate`, 슬롯 1회 소비 |
| `CMD-ID-CONFLICT` | 같은 ID에 다른 payload | `COMMAND_ID_CONFLICT`, 무변경 |
| `CMD-STALE` | 오래된 revision 명령 | `STALE_STATE`, 무변경 |
| `EXAM-REQUIRED` | Day 10 오후 수업 완료 | 반드시 `exam` |
| `EXAM-49` | stub 49 | 즉시 `expelled/terminal` |
| `EXAM-50` | stub 50 | 같은 Day 방과 후, 재응시 불가 |
| `EXAM-100` | stub 100 | 같은 Day 방과 후, 재응시 불가 |
| `EXAM-BYPASS` | exam에서 Day 종료 요청 | `EXAM_REQUIRED`, 무변경 |
| `DAY-30-NORMAL` | 합격 후 방과 후·Day 종료 | Day 30 유지, normal terminal |
| `TERMINAL-GUARD` | terminal에서 임의 명령 | `TERMINAL_STATE`, 무변경 |
| `ROUNDTRIP-DAY` | Day 시작 후보 직렬화·복원 | 구조와 값 동일 |
| `ROUNDTRIP-EXAM` | examResolved 후보 직렬화·복원 | 점수·phase 동일, 재응시 불가 |

### Slice 2 fixture

| ID | 준비·명령 | 기대 결과 |
|---|---|---|
| `LRN-CLASS-01` | level 0, 수업 | level 1, `classIntro` |
| `LRN-CLASS-REVIEW` | level 1, 수업 | level·lastGainSource 불변 |
| `LRN-SELF-01` | level 1, 점심 혼자 공부 | level 2, `selfStudy`, 점심 소비 |
| `LRN-TOGETHER-01` | level 2, 방과 후 함께 공부 | level 3, `studyTogether`, 방과 후 소비 |
| `LRN-FREE-NO-2` | 무료 수업 반복 | level 1 유지 |
| `LRN-DUPLICATE` | 같은 공부 명령 2회 | 한 단계·한 슬롯만 반영 |
| `LRN-NO-FACTS` | GameState 직렬화 검사 | 원소 사실 필드 없음 |
| `LRN-ROUNDTRIP` | 학업 상태 직렬화·복원 | 일곱 level·출처 동일 |

fixture는 현재 시각, `Math.random`, DOM, 현지화 문자열에 의존하지 않는다. 각 fixture는 시작 상태, 명령 목록, 기대 결과 상태, 기대 이벤트, 기대 오류를 함께 가진다.

## 8. 충돌

1. **마스터의 성별 pending과 최신 계약:** `docs/00`은 pending을 요구하지만 결정 015와 `docs/01`, `10`, `11`이 `male`로 명시적으로 대체했다. 본 설계는 `male`을 따른다.
2. **마스터의 Slice 3 save/load와 조기 검증 필요:** `docs/00` 권고 순서는 저장을 Slice 3에 두지만 Day/시험 상태기계는 저장 경계 없이 충분히 검증하기 어렵다. 순수 스냅샷 계약만 Slice 1에 앞당기는 권고가 필요하다.
3. **완성형 `docs/06`과 최소 Slice 1:** `docs/06`의 관계·미션·인벤토리·난수·메타까지 Slice 1에 넣으면 수직 슬라이스 범위를 초과한다. 이번 타입은 완성형 스키마의 부분집합이지 두 번째 최종 스키마가 아니다.
4. **`studiedTopics` 중복:** `docs/06`은 `studiedTopics`와 `topicProgressById`를 함께 저장한다. 2차 설계는 `level > 0`으로 완전히 파생 가능하므로 `studiedTopics`를 저장하지 않는다. 계약 문서 갱신 승인이 필요하다.
5. **시험 상태의 임시 위치:** 완성형 계약은 시험을 `AcademicState.exams`에 둔다. Slice 1에는 AcademicState가 없으므로 최소 `examGate`를 사용하고 Slice 2 또는 실제 시험 슬라이스에서 흡수해야 한다.
6. **즉시 엔딩과 Slice 1 최소 상태:** 결정 020은 모든 효과 뒤 즉시 판정을 요구하지만 Slice 1에는 자격 데이터가 없다. no-op evaluator 확장점으로 호출 위치만 보장하고 실제 판정은 관계 상태가 들어오는 Slice 3 이후에 연결한다.

## 9. 타협

- Slice 1 시험 stub은 49·50·100 경계와 phase 가드를 검증하지만 실제 10문항 채점·답안 보존을 증명하지 않는다.
- 일반 Day 중간 상태는 브라우저에 저장하지 않으므로 새로고침 복원은 Slice 3 전까지 검증할 수 없다.
- `commandReceipts`는 중복 UI 제출을 막지만 향후 `EffectLedger`와 책임을 분리해야 한다. 명령 영수증은 전송 멱등성, 효과 원장은 게임 보상 멱등성이다.
- Slice 1의 최소 terminal은 노멀 엔드와 퇴학만 만든다. Character End 장면·선택·메타 해금은 확장점 뒤로 미룬다.
- Slice 2에서는 학습 진행만 보존하고 주기율표 UI 능력은 숙련도에서 파생한다. 별도 `KnowledgeState`가 필요한 서사 단서가 생길 때만 추가한다.

## 10. 미정

- level 3에서 추가 공부를 슬롯 소비 복습으로 허용할지 명령 자체를 거부할지
- Slice 1 `examGate`를 Slice 2 `AcademicState`에 바로 흡수할지 실제 시험 슬라이스까지 유지할지
- `commandReceipts`의 체크포인트별 정리 정책과 최대 크기
- 명령 fingerprint의 정확한 정본 직렬화 규약
- 새 게임 `runId` 생성 방식과 테스트 주입 포트
- 지원 브라우저 최소 버전
- Slice 3의 실제 `localStorage` 키, checksum, bank A/B 세부 승인

미정 항목은 임의 구현 기본값으로 확정하지 않는다.

## 11. QA 리스크

- exam stub이 production 경로에 노출되어 점수를 직접 주입하는 우회가 생길 수 있다.
- phase 전이와 UI 화면 전이가 중복 구현되어 화면만 시험을 건너뛸 수 있다.
- `passed` 입력값을 신뢰해 49가 생존하거나 50이 실패할 수 있다.
- 중복 명령 검사보다 revision 검사를 먼저 해 재시도를 `STALE_STATE`로 오판하거나 보상을 재적용할 수 있다.
- `commandId`만 비교하고 payload 충돌을 검사하지 않으면 서로 다른 행동이 조용히 유실될 수 있다.
- Day 30 일반 종료가 Day 31을 만들거나 시험 전에 노멀 엔드로 갈 수 있다.
- 수업 복습이 `lastGainSource`를 `classIntro`로 덮어 level 2·3의 획득 근거를 잃을 수 있다.
- 원소 사실이나 계산 결과를 상태에 복제해 과학 정본과 불일치할 수 있다.
- Slice 0 저장 요약이 부분 파싱된 손상 저장을 정상으로 표시할 수 있다.
- 즉시 엔딩 evaluator가 효과 적용 전 호출되거나 시험 실패보다 먼저 확정될 수 있다.
- Slice 1의 임시 `examGate`를 제거하는 마이그레이션 없이 배포 저장 형식으로 굳힐 수 있다.
- 순수 스냅샷과 실제 영속화를 분리한 사실을 UI가 숨겨 Slice 1에서 저장이 된다고 오해시킬 수 있다.

## 12. Change Request 후보

아래 항목은 후보이며 이 문서만으로 승인되지 않는다.

| ID | 후보 | 분류 | 권고 |
|---|---|---|---|
| `CR-STATE-V2-01` | Slice 1에 순수 Day 스냅샷·검증·in-memory round-trip을 포함하고 실제 브라우저 영속화는 Slice 3으로 유예 | 구현 순서 결정 | 승인 권고 |
| `CR-STATE-V2-02` | `docs/06`의 저장형 `studiedTopics`를 제거하고 숙련도에서 파생 | 상태 계약 변경 | 승인 권고 |
| `CR-STATE-V2-03` | Slice 1의 `examGate`를 비배포 임시 구조로 명시하고 실제 시험 도입 전 `AcademicState.exams`로 통합 | 상태 계약·마이그레이션 결정 | 조건부 승인 권고 |
| `CR-STATE-V2-04` | 명령 영수증과 효과 원장을 별도 책임으로 확정 | 구현 계약 결정 | 승인 권고 |
| `CR-STATE-V2-05` | level 3 반복 공부의 슬롯 소비/거부 정책 확정 | Game Systems 결정 필요 | 보류 |

현재 잠금 제품 규칙 자체를 바꾸는 Change Request는 없다. Day 기반 저장, 시험일·퇴학 경계, `gender = male`, 원소 정본, 즉시 Character End의 시험 우선순위는 그대로 유지한다.

## 13. 다음 게이트

1. PM이 Slice 1 스냅샷 분할 권고와 `studiedTopics` 파생화를 검토한다.
2. Game Systems가 `passed` 자유 행동과 level 3 복습 정책을 결정한다.
3. Frontend가 Slice 0 저장 요약 및 저장 미구현 상태의 표시 계약을 확인한다.
4. QA가 fixture, 시험 stub 비노출, 중복 명령 순서, Day 30 불변식을 사전 검토한다.
5. 승인 결과를 `docs/10_DECISION_LOG.md`와 필요 시 `docs/06_STATE_SAVE_SCHEMA.md`에 반영한 뒤에만 구현 설계로 전환한다.
