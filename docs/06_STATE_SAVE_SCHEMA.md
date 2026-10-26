# 상태 및 저장 스키마

> **Slice 0~2 현행 계약:** 결정 022~053, `docs/12_INTEGRATED_DESIGN_V2.md`와 `docs/15_IMPLEMENTATION_CONTRACT.md`를 먼저 적용한다. 아래 완성형 schema·저장 생명주기를 Slice 1에 전부 구현하지 않는다. 현재 receipt는 회차 전체 보존, snapshot 투영은 순수, 학업은 topicProgressById와 topicLastProgressSourceById를 사용하며 studiedTopics는 파생값이다. 실제 localStorage·Meta는 Slice 3까지 유예한다. 수정 계약 QA 재검토·구현 승인은 별도다.

- **상태:** `결정 020·021 APPROVED IMPLEMENTATION DECISION 반영 / 콘텐츠 상세는 PROPOSAL`
- **버전:** 1.2
- **작성일:** 2026-09-03
- **소유 역할:** Game State / Save
- **구현 여부:** 승인 계약 문서화 단계. 코드 구현 승인을 뜻하지 않음.

## 1. 목적과 우선순위

이 문서는 《러브 앤 케미스트리》의 단일 `GameState`·`MetaState`, phase 전이, Day 스냅샷, `localStorage` 영속화, 검증·복구·마이그레이션을 다룬다. PM 승인 구현 결정은 계약으로 정의하고 이중 버퍼·마이그레이션 등 미승인 세부는 `PROPOSAL`로 제안한다.

문서 우선순위는 다음과 같다.

1. `docs/00_PM_MASTER_SPEC.md`
2. `docs/01_LOCKED_GAME_RULES.md`
3. PM이 승인해 `docs/10_DECISION_LOG.md`에 기록한 결정
4. 이 문서

이 문서의 Day/phase, 시험 체크포인트, 미션 상태, 호감도 검증, 시작 재화와 숙련도 관련 내용은 승인된 구현 결정이다. 콘텐츠 ID, 최종 데이터와 세부 화면 규칙은 상태 계층이 독자적으로 확정하지 않는다.

## 2. 핵심 원칙

- 회차 진행의 정본은 하나의 `GameState`뿐이다.
- 회차 간 해금의 정본은 하나의 `MetaState`뿐이다.
- 사용자 관점의 기본 저장은 Day 시작 스냅샷이다. 영속화되는 게임 진행은 Day 시작, 실제 도달한 Day 10·20·30 시험 합격 직후의 시스템 강제 `examResolved`, 회차 종료 `terminal`로 제한한다.
- 화면, 컴포넌트, URL, 현재 시각, DOM 상태는 게임 규칙의 정본이 아니다.
- 저장된 원시 상태에서 파생 가능한 관계 단계, 시험 의무 여부, 결말 가능 여부는 중복 저장하지 않고 규칙으로 계산한다.
- 모든 상태 변경은 검증 가능한 전이를 통해 수행하며 이벤트 보상은 멱등성을 가진다.
- 로드 중 누락값을 임의 기본값으로 채우거나 범위를 강제로 보정하지 않는다. 허용된 변경은 명시적 마이그레이션만 수행한다.
- 결정적 복원에 시스템 시각이나 `Math.random` 같은 비저장 외부값을 사용하지 않는다.

## 3. 식별자와 직렬화 규약

### 안정된 ID

다음 ID는 콘텐츠 정본에서 제공하며 한 번 배포한 ID를 다른 의미로 재사용하지 않는다.

- `CharacterId`
- `RouteFlagId`
- `EventId`와 `EventFlagId`
- `MissionId`와 `MissionStepId`
- `ItemId`
- `StudyTopicId`
- `KnowledgeId`
- `QuestionId`
- `EndingId`
- `CgId`
- `EffectId`

공략 캐릭터 ID의 필수 집합은 `H`, `C`, `O`, `F`, `Na`, `Cl`, `Ne`다. 정확한 대소문자는 캐릭터 정본과 일치해야 한다.

### JSON 표현

- 집합은 중복 없는 문자열 배열로 저장하고 정본 직렬화 시 사전순 정렬한다.
- ID별 맵은 JSON 객체로 저장하고 키를 사전순 정렬한다.
- 수치는 유한한 안전 정수만 허용한다. `NaN`, `Infinity`, 소수 호감도·수량은 허용하지 않는다.
- 날짜·시각은 진단용 ISO 8601 UTC 문자열만 허용하며 규칙 판정에 사용하지 않는다.
- 체크섬 계산에는 키 정렬, 집합 정렬, 공백 없는 UTF-8 JSON인 정본 직렬화를 사용한다.
- `undefined`, 함수, 클래스 인스턴스, 브라우저 객체는 상태에 넣지 않는다.

## 4. GameState 타입 계약

### 최상위

| 필드 | 타입·허용값 | 기본값 | 소유자 | 설명 |
|---|---|---|---|---|
| `schemaVersion` | 양의 정수 | 현재 `1` | State | GameState 구조 버전 |
| `contentVersion` | 비어 있지 않은 버전 문자열 | 빌드 콘텐츠 버전 | PM/Data | 참조 ID와 규칙 데이터 호환성 |
| `runId` | 회차마다 새로 만든 고유 문자열 | 새 게임에서 생성 | State | 서로 다른 회차 구분 |
| `snapshotRevision` | 0 이상의 안전 정수 | `0` | State | 이 회차 Day 커밋 횟수 |
| `checkpoint` | `Checkpoint` | Day 1 시작 | State | 저장 경계와 진단 정보 |
| `player` | `PlayerState` | 설정 결과 | Product/State | 플레이어 정체성 |
| `calendar` | `CalendarState` | Day 1 아침 조회 | Systems/State | Day와 phase |
| `relationships` | `RelationshipState` | 전원 10 | Systems | 캐릭터별 호감도 |
| `routes` | `RouteState` | 빈 진행 | Narrative/Systems | 루트 플래그와 필수 이벤트 |
| `missions` | `MissionState` | 콘텐츠 초기 상태 | Systems/Narrative | 미션 진행 |
| `inventory` | `InventoryState` | 빈 맵 | Systems | 아이템 수량 |
| `academics` | `AcademicState` | 미학습·미응시 | Science/Systems | 공부 및 시험 |
| `knowledge` | `KnowledgeState` | 승인된 초기 공개값 | Science/Systems | 학습·주기율표 공개 상태 |
| `eventFlags` | `EventFlagState` | 빈 집합 | Narrative/Systems | 완료·분기 사실 |
| `ledger` | `EffectLedger` | 빈 집합 | State/Systems | 효과 중복 적용 방지 |
| `random` | `RandomState` | 새 회차 시드 | State/Systems | 결정적 생성 상태 |
| `runStatus` | `RunStatus` | `active` | Systems/State | 진행·종료 상태 |

`snapshotRevision`은 저장소 전체의 `revision`과 역할이 다르다. 메타 설정만 바뀌면 저장소 revision은 증가하지만 GameState의 `snapshotRevision`은 증가하지 않는다.

### Checkpoint

| 필드 | 타입·허용값 | 규칙 |
|---|---|---|
| `kind` | `dayStart`, `examResolved`, `terminal` | 기본 진행은 `dayStart`, 필수 시험 합격 직후는 `examResolved`, 확정 종료는 `terminal` |
| `labelDay` | 1~30 정수 | 사용자에게 표시할 스냅샷 Day |
| `committedAt` | ISO 8601 UTC 문자열 | 표시·진단 전용, 게임 계산 금지 |
| `sourceCompletedDay` | `null` 또는 1~30 | Day 1 최초 저장은 `null`, 다음 Day 저장은 직전에 완료한 Day |
| `sourceExamDay` | `null`, `10`, `20`, `30` | `examResolved`·시험 종료 checkpoint만 해당 시험 Day 기록 |

불변 조건:

- `dayStart`이면 `labelDay = calendar.day`, `calendar.phase = morningHomeroom`, `runStatus.kind = active`다.
- `examResolved`이면 Day는 10·20·30 중 하나이고 해당 시험은 합격 완료다. 세 Day 모두 `calendar.phase = afterSchoolFreeTime`, 점심 행동과 오전·오후 수업은 완료 상태이며 `runStatus.kind = active`다.
- `terminal`이면 `calendar.phase = terminal`, `runStatus.kind`는 `active`가 아니다.
- Day 시작 체크포인트에는 해당 Day 아침 조회의 이벤트·보상이 아직 적용되지 않았다.

### PlayerState와 gender

| 필드 | 타입·허용값 | 기본값 | 설명 |
|---|---|---|---|
| `name` | 앞뒤 공백 제거 후 비어 있지 않은 문자열, UI 승인 최대 길이 이내 | 사용자 입력 | 플레이어 표시 이름 |
| `gender` | 리터럴 `male` | `male` | 사용자 승인으로 고정된 남성 주인공 |

마스터가 `pending/configurable`을 요구한 이유는 “사용자 선택”과 “남학생”이라는 기존 진술을 임의로 해소하지 않기 위해서였다. 2026-09-03 사용자 결정으로 OQ-001이 해소됐으므로 선택 모드·nullable 값·성별 ID 목록을 만들지 않고 `male`로 단순화한다. 이름은 계속 사용자 입력이다. 이 값은 외형 데이터가 아니며 주인공 비주얼은 계속 유예한다. 아직 구현·배포된 저장이 없으므로 이전 `pending/null` 호환 코드를 추가하지 않는다.

### CalendarState와 Phase

| 필드 | 타입·허용값 | 설명 |
|---|---|---|
| `day` | 1~30 정수 | 현재 진행 Day |
| `phase` | `Phase` | 현재 런타임 phase |
| `phaseStep` | 0 이상의 정수 | 같은 phase 안에서 승인된 세부 전이 순서. 콘텐츠 커서가 아니라 전이 충돌 검사용 |
| `freeActions.lunchUsed` | 불리언 | Day 1~30 점심 행동 슬롯 소비 여부 |
| `freeActions.afterSchoolUsed` | 불리언 | Day 1~30 방과 후 행동 슬롯 소비 여부 |

`Phase` 허용값:

| 순서 | 값 | 의미 | Day 스냅샷 저장 가능 |
|---:|---|---|---|
| 1 | `morningHomeroom` | 아침 조회 시작 전·진행 | 시작 전만 가능 |
| 2 | `morningClass` | 일반일 오전 수업 | 불가 |
| 3 | `lunchFreeTime` | 점심 자유 시간 | 불가 |
| 4 | `afternoonClass` | 오후 수업 | 불가 |
| 5 | `exam` | Day 10·20·30 오후 수업 직후 필수 시험 | 불가 |
| 6 | `afterSchoolFreeTime` | 방과 후 자유 활동 | 세 시험일 합격 직후 `examResolved`만 가능 |
| 7 | `dayEnd` | 당일 정산 트랜잭션 | 불가 |
| 8 | `endingSelection` | 하나의 다인 효과로 둘 이상이 동시에 새 자격을 얻었을 때 그 후보 중 하나를 선택 | 불가 |
| 9 | `characterEndingScene` | 단일 후보 또는 선택 후보의 실패 없는 최종 장면 | 불가 |
| 10 | `terminal` | 퇴학·캐릭터 엔드·노멀 엔드 확정 | 종료 저장만 가능 |

`phaseStep`의 세부 의미는 Game Systems 계약에서 확정한다. 장면 대사 위치나 UI 탭 위치를 저장하는 용도로 확장하지 않는다. Day 30도 점심 1회와 시험 합격 후 방과 후 1회를 제공한다.

### RelationshipState

| 필드 | 타입·허용값 | 기본값 | 설명 |
|---|---|---|---|
| `affectionByCharacter` | 일곱 필수 CharacterId 각각을 키로 하는 JavaScript 안전 정수 맵 | 각 `10` | 독립 호감도. 게임플레이 cap·clamp 없음 |

호감도 단계는 저장하지 않고 값에서 계산한다.

- 0 미만: 어색함·관계 악화
- 10: 기본 지인
- 20 이상: 친한 친구
- 40 이상: 연애 긴장·썸
- 80 이상: 성공 가능 기준

80 이상이어도 필수 미션, `completedRequiredEvents`, 결말 조건을 모두 충족하지 않으면 캐릭터 엔드가 아니다. 모든 델타 적용 전후 값은 `Number.isSafeInteger`에 해당해야 하며 범위를 넘는 연산은 상태 변경 없이 거부한다. 값을 잘라내거나 100 또는 다른 임의 상·하한으로 clamp하지 않는다.

### RouteState

| 필드 | 타입·허용값 | 기본값 | 설명 |
|---|---|---|---|
| `routeFlags` | 중복 없는 `RouteFlagId` 배열 | 빈 배열 | 루트별 분기 사실 |
| `completedRequiredEvents` | CharacterId별 중복 없는 `EventId` 배열 | 각 빈 배열 | 캐릭터 엔드 필수 이벤트 완료 |
| `pendingEndingCandidateIds` | 중복 없는 CharacterId 배열 | 빈 배열 | 도달 시험 미완료로 판정을 보류한 단일 효과의 자격 후보 |
| `pendingEndingEffectId` | `null` 또는 EffectId | `null` | 보류 후보를 만든 효과 트랜잭션 식별자 |

필수 이벤트·미션의 요구 목록 자체는 저장하지 않고 버전이 고정된 서사·결말 정본에서 읽는다. 저장에는 완료 사실과 시험 때문에 보류된 후보만 둔다. 요구 목록 변경은 `contentVersion` 호환성 검토 대상이다. 보류 필드는 현재 시험 또는 이미 도달한 필수 시험이 미완료일 때만 비어 있지 않을 수 있고, 해당 시험 합격 뒤 후보 흐름으로 소비하거나 시험 실패 terminal에서 폐기한다.

### MissionState

| 필드 | 타입·허용값 | 기본값 | 설명 |
|---|---|---|---|
| `byId` | `MissionId → MissionProgress` 맵 | 콘텐츠 초기 상태 | 생성되거나 진행된 미션 |

`MissionProgress`:

| 필드 | 타입·허용값 | 설명 |
|---|---|---|
| `status` | `locked`, `available`, `active`, `readyToTurnIn`, `completed`, `failed`, `expired` | 승인된 미션 상태 집합 |
| `completedStepIds` | 중복 없는 `MissionStepId` 배열 | 이미 확정한 단계 |
| `objectiveProgressById` | 목표 ID별 0 이상의 안전 정수 맵 | 부분 목표 진행량 |
| `acceptedDay` | `null` 또는 1~30 | 수락 Day |
| `resolvedDay` | `null` 또는 1~30 | 완료·실패 Day |

일곱 상태 집합은 승인됐다. 미션별 실패·만료 조건과 재시도 콘텐츠는 `docs/05_GAME_SYSTEMS_SPEC.md`의 상세 제안에 맞추며, 저장 스키마가 미션 보상량이나 조건을 독자 정의하지 않는다.

### InventoryState

| 필드 | 타입·허용값 | 기본값 | 설명 |
|---|---|---|---|
| `quantityByItem` | `ItemId → 0 이상의 안전 정수` 맵 | 빈 맵 | 0 수량 키는 정본 저장에서 제거 |
| `uniqueItemIds` | 중복 없는 ItemId 배열 | 빈 배열 | 고유 미션 물건 보유 |
| `reservedByMission` | MissionId별 ItemId·수량 예약 맵 | 빈 맵 | 다른 소비를 막는 미션 예약 |
| `funds` | 0 이상의 안전 정수 | `3000` | 매점 소지금 |
| `purchasedOfferIds` | 중복 없는 상품 제안 ID 배열 | 빈 배열 | `oncePerRun` 구매 중복 방지 |

아이템 정의, 가격, 사용 가능 phase, 선물 효과는 저장하지 않고 아이템·시스템 정본을 참조한다. 새 회차의 `funds = 3000`은 승인된 구현 결정이다.

### AcademicState

| 필드 | 타입·허용값 | 기본값 | 설명 |
|---|---|---|---|
| `studiedTopics` | 중복 없는 `StudyTopicId` 배열 | 빈 배열 | 한 번 이상 학습한 주제 |
| `topicProgressById` | 일곱 필수 StudyTopicId 각각을 키로 하는 `0~3` 정수 맵 | 각 `0` | 승인된 숙련도 범위 |
| `topicLastProgressSourceById` | 주제별 `classIntro`, `selfStudy`, `studyTogether` 또는 미진행 | 미진행 | 마지막 실제 숙련도 상승 출처 검증·표시 |
| `exams` | `10`, `20`, `30` 키를 반드시 가진 맵 | 모두 `unplanned` | 필수 시험 상태 |

숙련도 전이 계약:

- 무료 일과 수업은 `0→1`만 허용한다. `1` 이상에서는 복습·진단 결과만 만들고 `topicProgressById`를 바꾸지 않는다.
- `1→2`, `2→3`은 점심·방과 후 자유 행동 슬롯을 소비한 `selfStudy` 또는 `studyTogether`만 허용한다. `0`에서 해당 행동을 하면 `1`이 되며 한 행동에 한 단계만 오른다.
- 미션 완료·보상은 숙련도를 올리지 않는다. 무료 수업과 미션 보상은 루트 예산의 시험 공부 행동을 대체하지 않는다.
- 숙련도는 시험 답안·점수와 분리되며 자동 보정·자동 정답 효과를 상태에 저장하지 않는다.

각 `ExamState`:

| 필드 | 타입·허용값 | 설명 |
|---|---|---|
| `day` | `10`, `20`, `30` | 맵 키와 같아야 함 |
| `status` | `unplanned`, `pending`, `inProgress`, `completed` | 시험 생명주기 |
| `questionIds` | 중복 없는 `QuestionId` 배열 | `pending` 전환 시 확정 |
| `optionOrderByQuestion` | 문항별 선택지 ID 순서 맵 | 객관식 문항이면 계획 시 확정 |
| `answersByQuestion` | QuestionId별 선택지 ID 또는 무응답 맵 | 런타임 답안과 제출 결과 |
| `currentQuestionIndex` | `null` 또는 `0~9` 정수 | `inProgress`에서 현재 문항 위치. 완료 뒤 `null` 가능 |
| `submitted` | 불리언 | 완료 상태와 함께 참 |
| `score` | `null` 또는 0~100 정수 | `completed`일 때만 정수 |
| `passed` | `null` 또는 불리언 | 완료 시 `score >= 50`과 같아야 함 |

저장 가능한 Day 시작 상태에는 `inProgress` 시험이 존재할 수 없다. 해당 시험 Day 시작 스냅샷에는 콘텐츠 정본의 고정 10문항·문항 순서·선택지 순서를 `pending` 계획으로 기록하고 일치 여부를 검증한다. 시험 중 제한 주기율표 오버레이를 여는 동안 `answersByQuestion`, `questionIds`, `optionOrderByQuestion`, `currentQuestionIndex`를 런타임에서 변경 없이 보존하고 닫으면 같은 문항으로 복귀한다. 이 왕복은 체크포인트를 만들지 않는다. 실제 도달한 시험의 `examResolved`와 terminal에는 제출 답안과 점수를 보존한다.

`examScores`를 별도 중복 필드로 만들지 않는다. 잠금 문서에서 요구하는 시험 점수는 각 `ExamState.score`가 충족한다.

### KnowledgeState

| 필드 | 타입·허용값 | 기본값 | 설명 |
|---|---|---|---|
| `unlockedElementIds` | 원소 1~20 전체 ID 배열 | 원소 1~20 전체 | 핵심 원소 사실의 기본 조회 대상 |
| `unlockedKnowledgeIds` | 중복 없는 `KnowledgeId` 배열 | 승인된 초기 공개값 | 개념·주기율표 정보 공개 상태 |

원자번호·기호·이름·족·주기·전자배치와 승인된 원자가전자 같은 핵심 사실값은 숙련도로 잠그지 않고 과학 정본에서 기본 조회한다. 상태에는 사실을 복제하지 않으며 숙련도에 따른 필터·비교·단서·설명 도구의 이용 단계만 파생한다.

### EventFlagState와 EffectLedger

| 영역 | 필드 | 타입 | 설명 |
|---|---|---|---|
| EventFlagState | `completed` | 중복 없는 `EventFlagId` 배열 | 일어난 사실·분기 완료 |
| EffectLedger | `appliedEffectIds` | 중복 없는 `EffectId` 배열 | 보상·비용·호감도 등 효과 적용 영수증 |

플래그의 `false`는 저장하지 않는다. 존재하면 참, 없으면 미발생이다. 하나의 효과 트랜잭션은 상태 변경을 모두 검증한 뒤 한 번에 적용하고 마지막에 같은 트랜잭션 안에서 `effectId`를 기록한다. 이미 기록된 ID는 무효 성공으로 처리해 보상을 중복 적용하지 않는다.

`EffectId`는 예를 들어 `runId + day + eventId + effectName`처럼 재현 가능한 구성 규칙을 사용하되, 최종 문자열 규약은 Narrative·Systems ID 계약 후 확정한다.

### RandomState

| 필드 | 타입·허용값 | 설명 |
|---|---|---|
| `algorithm` | 승인된 고정 PRNG 알고리즘 ID | 알고리즘 변경 감지 |
| `runSeed` | 직렬화 가능한 불투명 시드 문자열 | 회차 생성 시 한 번 확정 |
| `cursorByStream` | 스트림 이름별 0 이상의 안전 정수 | 각 결정적 난수 스트림 소비 위치 |

필수 교육 이벤트, 필수 루트 조건, 결말 도달 가능성은 난수에 의존하지 않는다. 연출 다양성이나 승인된 문항 선택에만 이름 있는 스트림을 사용한다. 같은 저장, 콘텐츠 버전, 알고리즘 ID는 같은 결과를 내야 한다.

### RunStatus

| `kind` | 추가 필드 | 조건 |
|---|---|---|
| `active` | 없음 | Day 1~30 진행 중 |
| `characterEnding` | `endingId`, `characterId` | 호감도 80 이상, 필수 미션·이벤트, route-ending condition 모두 충족한 효과 직후 확정 |
| `normalEnding` | `endingId` | Day 30 완료 후 성공 루트 없음 |
| `expelled` | `endingId`, `examDay`, `score` | Day 10·20·30 시험 점수 50 미만 |

종료 상태는 `checkpoint.kind = terminal`, `calendar.phase = terminal`이어야 한다. 효과 트랜잭션을 완전히 적용한 직후 자격을 계산하되 현재 시험 또는 이미 도달한 필수 시험이 미완료면 합격 완료까지 보류한다. 단일 후보는 실패 없는 최종 장면으로, 하나의 다인 효과가 만든 복수 후보는 그 후보만의 선택을 거쳐 정확히 하나의 Character End와 관련 MetaState를 원자 커밋한다. Character End terminal의 미래 시험 미응시는 유효하며 이후 실행하지 않는다.

## 5. MetaState 타입 계약

| 필드 | 타입·허용값 | 기본값 | 소유자 | 설명 |
|---|---|---|---|---|
| `schemaVersion` | 양의 정수 | 현재 `1` | State | MetaState 구조 버전 |
| `unlockedCGs` | 중복 없는 `CgId` 배열 | 빈 배열 | Narrative/Meta | 회차 간 유지되는 CG 해금 |
| `seenEndings` | 중복 없는 `EndingId` 배열 | 빈 배열 | Narrative/Meta | 확인한 결말 |
| `optionalSettings` | 승인된 비음향 설정 맵 | 빈 객체 | Frontend/Product | 접근성·표시 설정 |

MetaState 원칙:

- 활성 회차를 지우거나 새 게임을 시작해도 유지한다.
- CG와 결말 해금은 합집합 방식의 멱등 변경만 허용한다.
- CG 갤러리는 홈·타이틀에서만 접근한다. MetaState 존재가 게임 중 갤러리 진입 권한을 뜻하지 않는다.
- BGM, 효과음, 음성, 음량 등 음향 설정을 넣지 않는다.
- 설정 키는 Frontend·PM 승인 목록만 허용하며 임의 키는 검증 실패다.

## 6. 영속 저장 루트와 localStorage 키

### PersistenceRoot

GameState와 MetaState는 논리적으로 분리하지만 원자적 저장을 위해 하나의 루트로 직렬화한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `activeGame` | `GameState` 또는 `null` | 활성·종료 회차의 마지막 커밋 스냅샷 |
| `meta` | `MetaState` | 회차 간 진행 |

메타만 갱신할 때 `activeGame`에는 현재 메모리 상태가 아니라 마지막으로 성공한 Day·종료 스냅샷을 넣는다. 이 규칙이 중간 phase 저장 우회를 막는다.

### SaveEnvelope

| 필드 | 타입·허용값 | 설명 |
|---|---|---|
| `storageFormatVersion` | 양의 정수, 현재 `1` | 봉투 구조 버전 |
| `revision` | 0 이상의 안전 정수 | 성공한 저장 루트 커밋마다 증가 |
| `writtenAt` | ISO 8601 UTC 문자열 | 진단용 |
| `payload` | `PersistenceRoot` | 전체 원자적 저장 단위 |
| `checksumAlgorithm` | `SHA-256` | 손상 감지 알고리즘 |
| `checksum` | 소문자 16진수 문자열 | `payload` 정본 직렬화의 체크섬 |

체크섬은 우발적 잘림·변형 감지용이며 악의적 조작을 막는 전자서명이 아니다.

### 키

| 키 | 값 | 역할 |
|---|---|---|
| `love-chemistry:persistence:manifest:v1` | 활성 버퍼, revision, 저장 형식 버전 | 마지막 커밋 포인터 |
| `love-chemistry:persistence:bank:a:v1` | `SaveEnvelope` JSON | 저장 버퍼 A |
| `love-chemistry:persistence:bank:b:v1` | `SaveEnvelope` JSON | 저장 버퍼 B |

키 접두사는 제품 전체에서 고정하고 배포 경로에 의존하지 않는다. 버퍼 A/B는 사용자 선택 슬롯이 아니다. 손상 원본 보존과 데이터 최소화를 위해 별도 격리 키는 기본 생성하지 않는다.

## 7. phase 전이 계약

### 기본 전이표

| 현재 phase | 조건 | 다음 phase | 필수 검사·효과 |
|---|---|---|---|
| `morningHomeroom` | 일반일 조회 완료 | `morningClass` | 조회 이벤트 효과를 고유 EffectId로 1회 적용 |
| `morningHomeroom` | 모든 Day 조회 완료 | `morningClass` | 조회 이벤트 효과를 고유 EffectId로 1회 적용 |
| `morningClass` | 수업 완료 | `lunchFreeTime` | 학습·수업 결과 확정 |
| `lunchFreeTime` | 승인된 행동 비용 지불·완료 | `afternoonClass` | 행동 결과와 보상 원자 적용 |
| `afternoonClass` | 일반일 수업·복습 완료 | `afterSchoolFreeTime` | 수업 결과 확정 |
| `afternoonClass` | Day 10·20·30 수업·복습 완료 | `exam` | 해당 Day 고정 시험이 `pending`인지 확인 |
| `exam` | Day 10·20·30, 점수 50 이상·보류 후보 없음 | `afterSchoolFreeTime` | 시험 완료 후 시스템 강제 `examResolved`를 원자 커밋 |
| `exam` | Day 10·20·30, 점수 50 이상·보류 후보 있음 | `endingSelection` 또는 `characterEndingScene` | 시험 완료와 보류 후보를 `examResolved`에 원자 커밋한 뒤 후보 수에 따라 즉시 재개 |
| `exam` | 점수 50 미만 | `terminal` | 즉시 퇴학 상태·종료 스냅샷 커밋 |
| `afterSchoolFreeTime` | 승인된 행동 비용 지불·완료 | `dayEnd` | 행동 결과 확정 |
| `dayEnd` | Day 1~29 | 다음 Day `morningHomeroom` | 당일 완료 검증, Day 증가, 다음 Day 초기화·저장 |
| `dayEnd` | Day 30, 캐릭터 엔드 미발생·후보 없음 | `terminal` | 노멀 엔드를 Day 증가 없이 확정 |
| 효과 트랜잭션 완료 | 새 자격 1명, 시험 보류 없음 | `characterEndingScene` | 효과 완료 뒤 자격 계산, 실패 없는 최종 장면 시작 |
| 효과 트랜잭션 완료 | 하나의 다인 효과로 새 자격 2명 이상, 시험 보류 없음 | `endingSelection` | 새 자격 후보만 보존해 정확히 한 명 선택 |
| `endingSelection` | 후보 1명 선택 | `characterEndingScene` | 선택하지 않은 후보는 확정하지 않음 |
| `characterEndingScene` | 최종 장면 완료 | `terminal` | 선택 결말 하나·종료 GameState·관련 MetaState 원자 커밋 |
| `terminal` | 항상 | 없음 | 회차 상태 변경 금지, 홈 이동만 UI에서 처리 |

시험 phase 위치와 시험일 순서는 승인된 구현 결정이다. 다음 불변 조건을 적용한다.

- 활성 회차가 실제 도달한 Day 10·20·30 시험은 각각 정확히 한 번 완료해야 한다. Character End 뒤 미래 시험은 미응시 상태로 남기고 실행하지 않는다.
- 도달한 시험의 미완료 상태로 해당 시험일의 방과 후, `dayEnd`, Character End에 진입할 수 없다.
- 50점 미만이면 즉시 퇴학한다.
- 로드·새로고침으로 시험 의무나 확정 문항 계획을 건너뛸 수 없다.
- 시험 중 제한 주기율표 조회는 허용한다. 원소 1~20의 기본 정본 사실만 읽고 시험 답안·고정 문항·선택지 순서·현재 문항 위치를 보존한다. 검색·숙련도 필터·비교·힌트·오답 진단은 상태 명령으로 제공하지 않으며 조회는 점수나 답안을 바꾸지 않는다.

### 전이 원자성

하나의 상태 전이는 다음 순서로 처리한다.

1. 현재 상태와 요청의 사전 조건을 검증한다.
2. 사용할 콘텐츠 ID가 `contentVersion` 정본에 존재하는지 확인한다.
3. 같은 `effectId`가 적용됐는지 확인한다.
4. 원본을 변경하지 않고 후보 상태 전체를 만든다.
5. 비용, 보상, 호감도, 미션, 플래그, 학습 결과와 `effectId`를 후보에 함께 반영한다.
6. 후보 상태의 전체 불변 조건을 검증한다.
7. 성공한 후보만 메모리의 현재 상태로 교체한다.
8. 효과 트랜잭션 완료 직후 Character End 자격을 계산하고 시험 보류·단일 후보·동시 복수 후보 중 하나로 분기한다.

시험 때문에 보류할 때는 그 효과로 자격을 얻은 후보와 `effectId`를 함께 기록한다. 합격 `examResolved`가 저장된 뒤에도 같은 후보 집합을 결정적으로 재개할 수 있어야 하며, 그 사이 다른 행동·후보 추가는 허용하지 않는다.

중간 단계 실패 시 원본 상태는 바뀌지 않는다. UI 렌더 완료 여부는 전이 성공 조건이 아니다.

## 8. Day 스냅샷 생명주기

### 최초 스냅샷

1. 플레이어 이름을 검증한다.
2. `gender`를 사용자 승인 고정값 `male`로 둔다.
3. 회차 ID와 시드를 생성한다.
4. 일곱 캐릭터 호감도를 각각 10으로 초기화한다.
5. 시스템·콘텐츠 정본에서 미션, 지식, 학업의 승인된 초기값을 만든다.
6. Day 1, `morningHomeroom`, `dayStart` 후보를 전체 검증한다.
7. 기존 활성 회차가 있으면 UI의 명시적 덮어쓰기 확인 뒤 원자 커밋한다.

### Day 1~29 종료

1. 현재 Day의 모든 필수 phase와 필수 효과 완료를 검사한다.
2. 시험 Day면 해당 시험이 완료됐고 50점 이상인지 검사한다.
3. 당일 임시 UI·장면 커서를 버리고 규칙 상태만 정산한다.
4. `day`를 1 증가시키고 `phase`를 `morningHomeroom`, `phaseStep`을 0으로 둔다.
5. 다음 Day의 일정·필수 이벤트를 콘텐츠 정본에서 결정한다.
6. 다음 Day가 10·20·30이면 해당 시험 계획을 결정적으로 만들고 `pending`으로 둔다.
7. `checkpoint`를 다음 Day의 `dayStart`로 갱신하고 `snapshotRevision`을 1 증가시킨다.
8. 전체 검증 후 PersistenceRoot를 원자 커밋한다.
9. 커밋 실패 시 런타임에서 다음 Day를 시작하지 않고 재시도 또는 홈 복귀 안내를 제공한다.

Day N을 끝낸 뒤 저장 화면에 표시되는 로드 지점은 `Day N+1 시작`이다. “Day N 완료”라는 보조 설명을 함께 표시해 날짜 오해를 막는다.

### 필수 시험 합격

1. 제출 답안을 승인된 고정 문항 정본으로 채점한다.
2. 점수, 합격 여부, 제출 답안, 시험 완료 상태를 한 전이에 반영한다.
3. Day 10·20·30 모두 체크포인트 phase를 `afterSchoolFreeTime`으로 두고 점심 슬롯은 소비됨, 방과 후 슬롯은 미소비, 오전·오후 수업은 완료된 상태인지 확인한다. 보류 후보가 있으면 이 체크포인트를 UI에 방과 후 선택으로 노출하지 않고 즉시 후보 흐름으로 재개한다.
4. checkpoint를 같은 Day의 `examResolved`로 바꾸고 `snapshotRevision`을 1 증가시킨다.
5. 전체 GameState와 MetaState를 검증해 즉시 원자 커밋한다.
6. 커밋 성공 뒤 보류 후보가 없을 때만 방과 후 자유 시간으로 이동한다. 보류 후보가 있으면 같은 저장된 후보 집합으로 `endingSelection` 또는 `characterEndingScene`을 즉시 재개한다.

`examResolved`는 Day 10·20·30의 합격 제출에만 존재하며, 수업·대화·미션·구매 등 다른 중간 결과에는 재사용하지 않는다.

### Day 30 종료

1. 오후 수업 직후 Day 30 시험을 제출하고 50점 이상이면 `examResolved/afterSchoolFreeTime`을 먼저 원자 커밋한다.
2. 방과 후 자유 행동과 `dayEnd` 정산을 완료하고 Day를 30으로 유지한다.
3. 캐릭터 엔드가 아직 확정되지 않은 회차의 노멀 엔드는 30일 종료에 terminal로 커밋하며 Day 31을 만들지 않는다.
4. Day 30 방과 후 효과 트랜잭션도 동일한 즉시 자격 판정을 수행한다. 후보가 생기면 Character End 흐름으로, 끝까지 후보가 없으면 `dayEnd` 뒤 노멀 엔드로 간다.
5. Day 30 시험 전에 후보 판정이 보류됐다면 50점 미만 퇴학을 우선하고, 합격 커밋 뒤에만 자격 판정을 재개한다.

### 퇴학 종료

1. 시험 제출과 점수 계산을 하나의 전이로 수행한다.
2. 점수가 50 미만이면 시험 완료, 실패 점수, `runStatus.expelled`, `calendar.phase = terminal`을 함께 후보에 반영한다.
3. 방과 후·Day 증가 효과는 적용하지 않는다.
4. 해당되는 MetaState 결말 기록과 종료 GameState를 한 PersistenceRoot로 커밋한다.

퇴학 스냅샷은 Day 중간 자유 저장이 아니라 회차가 즉시 끝나는 필수 종료 경계다.

## 9. 원자적 저장 프로토콜

### 커밋

1. manifest와 두 버퍼에서 현재 가장 높은 유효 revision을 찾는다.
2. 새 revision은 그 값보다 1 크게 한다.
3. 후보 PersistenceRoot를 전체 검증한다.
4. 정본 직렬화한 payload의 SHA-256 체크섬을 계산해 SaveEnvelope를 만든다.
5. 현재 활성 버퍼가 아닌 버퍼에 Envelope 전체를 `setItem` 한 번으로 기록한다.
6. 같은 버퍼를 즉시 `getItem`으로 다시 읽어 파싱, 체크섬, revision, 전체 payload 검증을 반복한다.
7. 성공한 경우 manifest를 `setItem` 한 번으로 교체한다.
8. manifest를 다시 읽어 활성 버퍼와 revision을 확인한 뒤에만 UI에 저장 성공을 알린다.
9. 이전 활성 버퍼는 다음 성공 커밋까지 보존한다.

개별 `setItem`은 값 단위로만 원자적이라고 가정한다. 이 프로토콜은 다중 키 트랜잭션을 흉내 내되, 포인터 교체 전 장애에는 이전 저장을, 포인터 교체 후 장애에는 새 저장을 선택할 수 있게 한다.

### 실패 처리

| 실패 | 결과 |
|---|---|
| 직렬화·체크섬 실패 | 쓰기 전 중단, 기존 저장 유지 |
| 버퍼 `setItem` 예외·용량 초과 | 포인터 유지, 저장 실패 안내 |
| 재읽기 불일치 | 포인터 유지, 해당 버퍼 무효 처리 |
| manifest 쓰기 실패 | 이전 포인터 유지, 다음 로드 때 버퍼 스캔 가능 |
| manifest 재읽기 불일치 | 성공으로 표시하지 않고 두 버퍼 재검사 |
| 탭 revision 충돌 | 늦은 쓰기로 덮지 않고 사용자에게 다른 탭 충돌 안내 |

동시 탭은 저장 시작 revision과 포인터 교체 직전 revision을 비교하는 낙관적 잠금을 사용한다. 다르면 커밋을 중단한다. `storage` 이벤트는 경고와 화면 갱신 보조 수단이며 정확성의 유일한 근거로 쓰지 않는다.

## 10. 불러오기·검증·손상 복구

### 로드 순서

1. manifest를 파싱·검증한다.
2. manifest 대상 버퍼를 검증한다.
3. 유효하면 필요한 마이그레이션을 복사본에 수행한다.
4. 현재 스키마·콘텐츠와 전체 검증 후 메모리에 복원한다.
5. 대상 버퍼가 무효면 반대 버퍼를 같은 방식으로 검사한다.
6. manifest가 무효면 두 버퍼를 모두 검사해 가장 높은 유효 revision을 선택한다.
7. 복구본을 사용한 경우 사용자에게 복구 Day와 사유 범주를 알린다.

### 검증 계층

| 계층 | 검사 예시 |
|---|---|
| 봉투 | JSON 파싱, 필수 키, 저장 형식 버전, revision, 체크섬 |
| 구조 | 필드 존재, 타입, 허용 열거값, 알 수 없는 필드 정책 |
| 범위 | Day 1~30, 점수 0~100, 수량 0 이상, 안전 정수 |
| 참조 | 캐릭터·미션·아이템·주제·문항·이벤트·결말·CG ID가 해당 콘텐츠 버전에 존재 |
| 의미 | checkpoint·phase·runStatus 일치, 시험 status와 score 일치 |
| 잠금 불변 | 필수 시험 완료 전 Day 진행 금지, 퇴학 기준, 일곱 호감도 존재, 루트 성공 요건 |
| 정본 | 저장에 과학 사실 복제 없음, 공개 ID만 저장 |

알 수 없는 필드는 기본적으로 거부한다. 개발 중 필드 삭제·추가를 조용히 무시하면 버전 누락을 숨길 수 있기 때문이다. 명시적으로 전후 호환 가능한 봉투 메타만 예외 허용할 수 있다.

### 복구 정책

- **활성본 손상, 백업 정상:** 백업으로 로드하고 복구 사실을 표시한다.
- **manifest 손상, 버퍼 정상:** 가장 높은 유효 revision 버퍼를 선택하고 다음 성공 저장 때 manifest를 복구한다.
- **모든 게임 저장 손상:** 활성 회차 없음으로 홈에 진입하고 새 게임·저장 초기화 선택을 제공한다.
- **모든 루트 손상이나 MetaState 손상:** 임의 부분 복구하지 않고 전체 유효 백업을 사용한다.
- **저장 없음:** 기본 MetaState와 활성 회차 없음으로 정상 시작한다. 이는 손상이 아니다.
- **저장 공간 접근 불가:** 메모리 플레이 시작 전 영속화 불가를 알린다. 저장된 것처럼 표시하지 않는다.

손상값을 0으로 바꾸기, 누락된 시험을 통과 처리하기, 알 수 없는 필수 이벤트를 완료 처리하기, `NaN`을 기본 호감도 10으로 바꾸기는 금지한다. 기본값 생성은 새 게임에만 사용한다.

## 11. schemaVersion과 마이그레이션

### 버전 구분

| 버전 | 책임 | 증가 조건 |
|---|---|---|
| `storageFormatVersion` | Envelope·manifest 형식 | 체크섬·봉투·버퍼 규약 변경 |
| `GameState.schemaVersion` | 회차 상태 구조와 의미 | GameState 필드·불변 조건 변경 |
| `MetaState.schemaVersion` | 메타 상태 구조와 의미 | MetaState 필드·설정 계약 변경 |
| `contentVersion` | 참조 콘텐츠 ID와 규칙 | 저장 참조에 영향을 주는 콘텐츠 변경 |

### 마이그레이션 규칙

1. 원본 문자열과 Envelope를 변경하지 않는다.
2. 현재 버전보다 낮으면 등록된 `vN → vN+1` 변환을 하나씩 적용한다.
3. 각 단계는 같은 입력에 같은 출력을 내는 순수·결정적 변환이어야 한다.
4. 각 단계 직후 목표 버전 구조와 불변 조건을 검증한다.
5. 콘텐츠 ID 변경은 명시적 이전 표를 사용하며 추측이나 표시 이름 매칭을 금지한다.
6. 현재 버전 도달 후 전체 참조·의미 검증을 수행한다.
7. 성공하면 새 revision으로 반대 버퍼에 커밋하고 이전 버퍼를 보존한다.
8. 실패하면 원본을 유지하고 비호환 상태를 사용자에게 알린다.

미래 버전은 로드하지 않는다. 현재 코드가 모르는 필드 의미를 삭제해 다운그레이드하지 않는다. 개발 편의를 위한 전체 저장 초기화가 필요해도 사용자 선택 없이 자동 실행하지 않는다.

### 콘텐츠 호환성

- 빌드는 읽을 수 있는 `contentVersion` 범위 또는 명시적 호환성 표를 가진다.
- 표시 문구만 바뀌고 ID·규칙이 같은 버전은 호환으로 선언할 수 있다.
- 필수 이벤트, 미션 단계, 시험 문항, 아이템, 결말 ID가 삭제·분할·병합되면 콘텐츠 마이그레이션이 필요하다.
- 호환성을 증명하지 못한 저장은 로드 차단한다. 알 수 없는 ID를 버리고 계속하지 않는다.

## 12. 시험 우회 방지 계약

- 시험 의무는 `calendar.day ∈ {10, 20, 30}`과 시험 상태를 함께 검사한다.
- 해당 Day 시작 스냅샷에 문항·문항 순서·선택지 순서를 확정한다.
- 문항 계획은 저장된 학습 상태, 콘텐츠 버전, 회차 시드로만 만든다.
- 시험 진입 시 `pending → inProgress`, 제출 시에만 `inProgress → completed`가 가능하다.
- 채점은 승인된 문항 정본에서 다시 계산하며 UI가 보낸 총점 값을 신뢰하지 않는다.
- `score < 50`이면 같은 제출 전이에서 즉시 `expelled`가 된다.
- 도달한 시험의 미완료·실패 상태에서 `dayEnd`, Day 증가, Character End 판정은 거부한다.
- 제출 전에는 중간 저장이 없으므로 종료·새로고침 시 같은 Day 시작과 같은 고정 문항·문항 순서·선택지 순서로 돌아간다.
- 합격 제출은 세 시험일 모두 같은 Day `afterSchoolFreeTime`의 `examResolved`로, 실패 제출은 `terminal`로 즉시 원자 커밋한다. `examResolved`는 사용자 임의 장면 저장 슬롯이 아니다.
- 과거 시험은 완료 점수와 합격 여부를 유지하며 재채점하거나 다시 추첨하지 않는다.
- Day 10·20·30 외에 필수 시험 완료 상태를 만들 수 없다. Character End terminal 뒤 미래 시험을 완료 상태로 만들지 않는다.
- 제한 주기율표 왕복은 답안·문항 순서·선택지 순서·`currentQuestionIndex`를 보존하며 점수·답안을 변경하지 않는다.

정상 UI와 상태 전이에 대한 우회 방지는 보장하지만, 사용자가 개발자 도구에서 애플리케이션 코드와 저장소를 조작하는 행위는 백엔드 없는 정적 앱에서 신뢰성 있게 방지할 수 없다. 체크섬·난독화·클라이언트 비밀값을 부정행위 방지 보안으로 표현하지 않는다.

## 13. 결정적 복원 계약

동일한 유효 저장과 동일한 호환 콘텐츠 빌드는 다음을 동일하게 복원해야 한다.

- Day, phase, Day 시작 경계
- 플레이어 이름과 고정 `gender = male`
- 일곱 캐릭터 호감도
- 루트 플래그와 완료 필수 이벤트
- 미션 상태와 완료 단계
- 아이템 수량
- 공부 주제 진행과 지식 공개
- 시험 문항 계획, 완료 점수, 합격 여부
- 이벤트 플래그와 적용 효과 영수증
- 회차 상태와 결말
- CG·결말 메타 해금

결정성을 위해 금지하는 입력:

- 복원 시점의 현재 날짜·시각
- 저장되지 않은 전역 난수 상태
- 객체 키 순서나 브라우저별 열거 순서
- DOM 존재 여부, 애니메이션 완료 여부, 라우터 히스토리
- 현지화 표시 문자열을 ID 대신 비교하는 로직
- 서버 응답이나 계정 데이터

새 빌드에서 콘텐츠가 바뀌면 `contentVersion` 호환성 검사를 먼저 통과해야 한다. 동일 스냅샷 재생 시 이미 `appliedEffectIds`에 있는 효과는 다시 적용하지 않는다.

## 14. 저장·상태 불변 조건

### 전체

- GameState와 MetaState의 현재 정본이 각각 하나뿐이다.
- 저장 가능한 정상 진행 상태는 사용자 관점의 Day 시작과 실제 도달한 시험일 합격 후 `examResolved/afterSchoolFreeTime`, 저장 가능한 종료 상태는 terminal뿐이다.
- `calendar.day`는 항상 1~30이다.
- `undefined`, `NaN`, 무한대, 음수 아이템 수량이 없다.
- 참조 ID는 `contentVersion`에 대응하는 정본에 존재한다.
- `gender`는 항상 `male`이며 선택·nullable 상태가 없다.
- 숙련도 `2·3`의 마지막 상승 출처는 자유 행동 슬롯을 소비한 혼자·함께 공부뿐이다.

### 시험

- 활성 회차가 실제 도달한 Day 10·20·30 시험은 각각 정확히 한 번 완료 상태가 된다. Character End 이후 미래 시험의 미완료는 정상이다.
- 49점은 퇴학, 50점과 100점은 생존이다.
- 0 미만 또는 100 초과 점수는 상태 전체를 무효화한다.
- 도달한 시험 미완료로 다음 Day·결말에 도달할 수 없다.

### 관계·루트

- 일곱 공략 캐릭터 호감도 키가 모두 존재한다.
- 새 회차의 각 호감도는 10이다.
- 호감도는 JavaScript 안전 정수 범위 안의 큰 양수·음수를 clamp 없이 보존하고, 범위 밖 연산이나 저장값은 거부한다.
- 캐릭터 엔드는 호감도 80 이상, 필수 루트 미션·이벤트 완료, 결말 조건을 모두 요구한다.
- Ne를 포함한 어떤 루트도 호감도 반복만으로 필수 이벤트를 대체하지 못한다.
- 자격은 효과 트랜잭션 완료 직후 계산하고, 하나의 다인 효과로 생긴 후보 중 정확히 하나만 Character End로 확정한다. 자격 후 게임플레이 숨은 실패는 없다.

### 중복 방지

- 한 `EffectId`는 한 회차에서 최대 한 번만 적용된다.
- 완료 이벤트·미션·시험·결말 효과의 재호출은 상태를 다시 증가시키지 않는다.
- 저장 실패 후 재시도는 같은 효과를 중복 적용하지 않는다.

### 메타

- CG·결말 해금은 제거하지 않고 합집합으로 갱신한다.
- 활성 회차 초기화가 MetaState를 초기화하지 않는다.
- 갤러리 접근 위치는 홈으로 제한한다.
- 음향 설정이 존재하지 않는다.

## 15. 공개 상태 작업 계약 제안

구현 시 필요한 개념적 작업은 다음과 같다. 정확한 함수명과 파일 경로는 기술 스택 승인 뒤 확정한다.

| 작업 | 입력 | 성공 결과 | 실패 결과 |
|---|---|---|---|
| 새 회차 생성 | 검증된 플레이어 설정, 콘텐츠 버전 | Day 1 유효 GameState | 기존 저장 불변 |
| 상태 전이 | 현재 GameState, 전이 명령, EffectId | 전체 검증된 새 GameState | 원본 불변 |
| Day 커밋 | 런타임 GameState | 다음 Day 시작 스냅샷 | 다음 Day 시작 금지 |
| 종료 커밋 | 종료 후보 GameState·MetaState | terminal 저장 루트 | 종료 성공 표시 금지 |
| 메타 갱신 | 마지막 커밋 GameState, 현재 MetaState, 해금·설정 명령 | 게임 진행을 앞당기지 않은 새 저장 루트 | 기존 저장 불변 |
| 불러오기 | localStorage 원문 | 가장 최신의 유효·호환 상태 | 복구본 또는 활성 회차 없음 |
| 마이그레이션 | 구버전 Envelope | 새 revision의 현재 버전 Envelope | 원본 보존·로드 차단 |
| 활성 회차 삭제 | 사용자 확인 | `activeGame = null`, MetaState 유지 | 기존 저장 불변 |
| 전체 초기화 | 별도 사용자 확인 | 모든 영속 상태 제거 | 취소 시 불변 |

## 16. QA 필수 매트릭스

### Day·phase

- [ ] Day 1 최초 저장은 아침 조회 효과 전이다.
- [ ] 모든 일반 Day가 잠금 순서를 지킨다.
- [ ] Day 종료 효과가 다음 Day 로드에서 중복되지 않는다.
- [ ] Day 30 뒤 Day 31이 생성되지 않는다.
- [ ] 일반 중간 phase에서 새로고침하면 마지막 Day 체크포인트로 돌아간다.
- [ ] 도달한 Day 10·20·30 합격 뒤 새로고침하면 보류 후보가 없을 때 같은 Day 방과 후에서, 보류 후보가 있을 때 동일 후보 엔딩 흐름에서 복원되고 시험을 재응시하지 않는다.

### 시험

- [ ] 활성 회차가 도달한 Day 10·20·30에 시험이 강제되고 Character End 뒤 미래 시험은 실행되지 않는다.
- [ ] 49점은 즉시 퇴학한다.
- [ ] 50점과 100점은 같은 Day 방과 후 진행이 가능하다.
- [ ] 시험 전·중 새로고침으로 시험을 건너뛸 수 없고 합격 제출 뒤 점수를 되돌릴 수 없다.
- [ ] 같은 Day 시작 저장은 같은 문항·문항 순서·선택지 순서를 복원한다.
- [ ] 실패 시험 뒤 Day 증가나 다른 결말로 전이할 수 없다.
- [ ] 시험 중 기본 주기율표를 열고 닫아도 답안·순서·현재 문항이 보존되며 검색·필터·비교·힌트·진단은 비활성이다.

### 원자적 저장

- [ ] 비활성 버퍼 쓰기 전·중·후 강제 실패에서 이전 저장이 남는다.
- [ ] 버퍼 성공·manifest 실패 시 로드 스캔이 유효 revision을 찾는다.
- [ ] manifest 성공 직후 종료해도 새 버퍼를 읽는다.
- [ ] 용량 초과를 저장 성공으로 표시하지 않는다.
- [ ] 두 탭의 revision 충돌이 조용한 덮어쓰기를 만들지 않는다.

### 검증·복구

- [ ] 빈 저장은 정상적인 새 사용자 상태다.
- [ ] 잘린 JSON, 잘못된 체크섬, 누락 필드, 잘못된 타입을 거부한다.
- [ ] `NaN`에 해당하는 비정상 수치, 음수 수량, Day 0·31, 점수 -1·101을 거부한다.
- [ ] 알 수 없는 필수 콘텐츠 ID를 버리지 않고 호환 불가로 처리한다.
- [ ] 활성본 손상 시 백업으로 복구하고 사용자에게 알린다.
- [ ] 두 버퍼 손상 시 원본을 자동 덮어쓰지 않는다.

### 마이그레이션

- [ ] 지원하는 각 과거 버전에서 현재 버전까지 순차 이관된다.
- [ ] 중간 단계 실패 시 원본이 보존된다.
- [ ] 미래 버전을 추측해 읽지 않는다.
- [ ] 콘텐츠 ID 이전 표가 누락되면 로드를 차단한다.
- [ ] 마이그레이션을 반복해도 결과가 달라지지 않는다.

### 상태 복원

- [ ] 호감도, 루트·이벤트, 미션, 인벤토리, 학업, 지식, 시험 점수가 동일하다.
- [ ] 이미 받은 보상과 호감도가 다시 적용되지 않는다.
- [ ] 호감도 80만으로 캐릭터 엔드가 열리지 않는다.
- [ ] 캐릭터 엔드, 노멀 엔드, 퇴학 상태가 각각 결정적으로 복원된다.
- [ ] Character End terminal은 선택한 결말 하나만 보존하고 미래 시험을 실행하지 않는다.
- [ ] 현재 또는 도달 시험 미완료 시 자격이 보류되고 50점 미만 퇴학이 우선한다.
- [ ] `gender`는 새 게임·저장·복원에서 항상 `male`이고 성별 선택 상태가 없다.
- [ ] 무료 수업은 `0→1`만 만들고 `1+`에서는 복습·진단만 남긴다.
- [ ] 숙련도 `2·3`은 자유 행동 슬롯을 소비한 혼자·함께 공부 출처로만 복원된다.

### MetaState

- [ ] 새 게임과 활성 회차 삭제 후에도 CG·결말 해금이 유지된다.
- [ ] 중간 Day의 CG 해금 저장이 런타임 GameState를 함께 저장하지 않는다.
- [ ] 갤러리는 홈에서만 접근한다.
- [ ] 음향 설정 키를 거부한다.

## 17. 의존성·가정·미정

### 의존성

- `docs/05_GAME_SYSTEMS_SPEC.md`: 행동 비용, 미션 전이, 학습 진행, 시험 배치·채점, 결말 우선순위
- `docs/04_NARRATIVE_PLAN.md`: 이벤트·필수 이벤트·결말 ID와 루트 조건
- `docs/07_UI_UX_SPEC.md`: 저장 표시, 복구·오류·덮어쓰기 UX, 홈 전용 갤러리 라우팅
- 과학·데이터 정본: 공부 주제, 지식, 시험 문항 ID와 콘텐츠 버전
- `docs/08_QA_PLAN.md`: 장애 주입, 브라우저 저장 한계, 회귀 범위

### 가정

- V1 활성 회차는 하나다.
- 콘텐츠 ID는 안정적이고 의미를 바꿔 재사용하지 않는다.
- 필수 진행은 결정적이며 연출용 난수만 저장 시드를 사용한다.
- `localStorage` 접근이 불가능한 환경에서는 영속 저장을 보장하지 않고 명확히 알린다.

### 미정

- 선택 설정의 승인 키 목록
- 최종 콘텐츠 ID, 미션별 실패·만료 조건과 재시도 콘텐츠

미정 항목은 타입을 무제한 확장하는 근거가 아니다. 담당 제안과 PM 승인 뒤 이 문서를 갱신하고 필요한 schemaVersion을 판단한다.

## 18. 절충·잠금 영향·QA 위험

### 절충

- 일반 Day 중간 새로고침은 사용자 관점의 해당 Day 시작 체크포인트로 돌아가므로 진행 손실이 있다. 대신 장면별 자유 저장으로 확대하지 않는다.
- 세 필수 시험의 합격 제출만 제한적으로 즉시 저장한다. 결과 불가역성은 얻지만 Day 시작 단일 경계보다 계약이 복잡해진다.
- 이중 버퍼는 저장 용량을 약 두 배 사용하지만 직전 유효본을 제공한다.
- 체크섬은 손상을 감지하지만 개발자 도구 조작을 보안적으로 막지 못한다.

### 잠금 영향

- 30일, 일과 순서, 시험 날짜·퇴학 경계, Day 기반 저장, 무백엔드, `localStorage`, 홈 전용 갤러리, 루트 성공 조건을 보존한다.
- 주인공 성별을 사용자 승인 고정값 `male`로 유지하고 외형은 유예한다.
- 결정 020의 조기 Character End는 30일·미래 시험 규칙에 대한 사용자 승인 예외이고, 결정 021의 시험 기본 조회는 기존 비허용 결정을 대체한다.
- 두 결정의 제품 차단은 해제됐지만 상세 콘텐츠·코드의 자동 승인은 아니다.

### QA 위험

- 저장 공간 부족과 브라우저별 `localStorage` 예외
- manifest·버퍼 사이 장애 시점별 복구
- 콘텐츠 변경 후 참조 ID 불일치
- 다중 탭 충돌
- MetaState 갱신을 통한 실수성 중간 GameState 저장
- `examResolved` 허용 범위를 다른 장면으로 확대해 Day 기반 저장을 훼손하는 구현
- 효과 ID 충돌 또는 누락에 따른 중복 보상
- 긴 회차에서 효과 영수증 크기 증가
- 제출 전 시험 롤백과 제출 후 `examResolved` 복원의 차이를 UI가 불명확하게 설명할 위험

## 19. 승인 게이트

이 문서에 명시된 Day/phase 중 잠긴 일과·시험 순서, 시험 체크포인트, 미션 7상태, 호감도 안전 정수 검증, 시작 재화, GS-REV-01 숙련도 전이, `gender = male`, 결정 020의 Character End 경계, 결정 021의 시험 제한 조회는 승인 계약이다. 문서 전체와 `PROPOSAL` 세부안은 다음 조건을 모두 충족하기 전 Ready to Code가 아니다.

- PM 승인된 Day 경계와 phase 순서를 유지하고 단일 슬롯, 저장 키·이중 버퍼 세부안을 검토한다.
- Game Systems와 Narrative가 상태 ID·전이 의존성을 검토한다.
- Frontend가 오류·복구·덮어쓰기 UX를 수용한다.
- QA가 시험 우회, 원자 저장, 손상 복구, 마이그레이션 계획을 사전 검토해 차단 이슈가 없다고 판정한다.
- 승인 결과를 PM이 `docs/10_DECISION_LOG.md`에 기록한다.
