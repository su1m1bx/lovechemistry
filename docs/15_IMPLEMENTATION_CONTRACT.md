# 충돌 수정 및 구현 공통 계약

**작성일:** 2026-10-26

**상태:** `PM CONTRACT RESOLVED / QA RE-REVIEW REQUIRED / IMPLEMENTATION NOT AUTHORIZED / RUNTIME NOT TESTED`

**근거:** 사용자 충돌 수정 요청, 결정 047~053, `docs/00`·`01`·`09`·`12`·`14`

**범위:** Slice 0~2 공통 계약과 후속 콘텐츠 인수 원칙. 애플리케이션 코드·패키지·이미지는 만들지 않는다.

## 1. 원래 만들려는 경험과 단일 적용 기준

목표는 **배운 화학을 사용해 누구를 만나고 어떻게 도울지 판단하며, 제한된 학교생활 속에서 관계를 쌓는 게임**이다. 퀴즈 정답 수집이나 호감도 반복 파밍이 목표를 대체하지 않는다.

- 학습은 기본 사실을 감추는 장벽이 아니라 해석·비교·단서 활용 능력의 성장이다.
- 관계는 인물의 동기·필수 사건·미션과 함께 진행한다. 화학적 성질이 연애의 정답을 결정하지 않는다.
- 선택의 시간 비용과 공개 가능한 거부 이유는 명료하게 보여 준다. 숨은 루트의 존재·정답·관계 결과를 미리 누설하지 않는다.
- 실패한 입력·중복 클릭·이미지 누락은 플레이어의 슬롯·보상·관계를 훼손하지 않는다.
- 최종 콘텐츠 승인 시 `학교 상황 → 필요한 사실 관찰·비교 → 플레이어 행동 → 서사·관계 결과`의 추적 근거를 요구한다. 모든 요청을 화학 문제로 만들 필요는 없다.
- 후속 대표 루트의 완성도는 함께 공부·학교 행동/미션·관계 변화·도달 시험·Day 저장·결말을 연결한 실제 플레이로 판정한다. Slice 0~2의 기술 골격만으로 연애 게임이 완성됐다고 판정하지 않는다. 상세 루트·대본은 Slice 2 이후 별도 승인 대상으로 유지한다.

적용 우선순위는 사용자 승인 잠금 변경을 포함한 `docs/01`의 변경 통제 → 후속 승인 결정 → 이 문서의 변경 범위 → `docs/12`의 나머지 계약 → 장기 명세 → 미채택 역할 제안 순이다. 마스터 사본의 이미 대체된 성별·엔딩 문구를 되살리지 않는다.

역할별 `DESIGN_V2.md`는 상단의 **현행 작업 계약**만 착수 근거로 사용한다. 아래 **보존 원안**의 미정·대안·타입·fixture는 배경 이력이며 복사해 구현하지 않는다. `PROPOSAL.md`의 장기 콘텐츠 제안도 자동 승인되지 않는다.

## 2. 명령, 오류, selector 경계

### 2.1 생성과 명령의 공통 입력

아래 표기들은 구현해야 할 계약이지 생성된 애플리케이션 코드가 아니다.

```ts
type CommandEnvelope<T extends string, P> = {
  readonly runId: string
  readonly commandId: string
  readonly expectedStateRevision: number
  readonly type: T
  readonly payload: P
}
type CommandReceipt = {
  readonly fingerprint: string
  readonly resultingStateRevision: number
}
type StateErrorCode =
  | 'INVALID_COMMAND' | 'WRONG_RUN' | 'STALE_STATE' | 'COMMAND_ID_CONFLICT'
  | 'INVALID_PHASE' | 'INVALID_DAY' | 'SLOT_ALREADY_USED'
  | 'UNKNOWN_ID' | 'PREREQUISITE_NOT_MET' | 'MASTERY_MAXED'
  | 'EXAM_REQUIRED' | 'EXAM_ALREADY_RESOLVED' | 'TERMINAL_STATE'
  | 'CONTENT_NOT_READY' | 'INVARIANT_VIOLATION'
type CommandResult<S> =
  | { readonly status: 'applied'; readonly state: S; readonly events: readonly DomainEvent[] }
  | { readonly status: 'duplicate'; readonly state: S; readonly events: readonly [] }
  | { readonly status: 'rejected'; readonly state: S;
      readonly error: { readonly code: StateErrorCode; readonly messageKey: string } }
```

- State 소유 공개 facade `src/state/commands.ts`가 envelope와 결과의 유일한 공개 진입점이다. Systems는 순수 사전 조건·효과 계산을 제공하고 두 번째 dispatch를 만들지 않는다.
- `runId`·`commandId`는 비어 있지 않은 80자 이하 ASCII 영문·숫자·`_`·`-` 문자열이다. 앱 조정 계층이 새 회차 확정 시 `crypto.randomUUID()`로 run ID를 한 번 만들고, 새로운 변경 의도마다 command ID를 한 번 만든다. 테스트는 고정 ID를 주입한다. 생성 불가 시 명시적 오류이며 시각·`Math.random`으로 대체하지 않는다.
- 재전송은 **같은 envelope 전체**를 재사용한다. payload나 기대 revision을 바꾸면 새 command ID를 발급한다. UI 재렌더·오버레이 열기에는 ID를 만들거나 상태 변경 명령을 보내지 않는다.
- `createNewGame({name, runId}, bootContext)`는 회차 밖 순수 factory다. 이름 validator를 다시 적용하고 `stateRevision = snapshotRevision = 0`, 빈 receipt·ledger와 Day 1을 만든다. Slice 0에서는 호출할 수 없다. 앱은 활성 회차를 이 factory의 재호출만으로 교체하지 않고 새 게임 의도의 확인·중복 실행 방지를 담당한다. 실제 저장 덮어쓰기 확인은 Slice 3 계약이다.
- 모든 envelope와 payload는 해당 Slice의 정확한 schema로 검사한다. 미등록 필드·타입·명령은 거부하고 입력값을 보정하지 않는다. `expectedStateRevision`은 0 이상의 안전 정수다.

S1 DomainEvent는 `PHASE_CHANGED(from, to)`, `FREE_ACTION_RESOLVED(slot)`, `DAY_STARTED(day)`, `RUN_TERMINATED(reason: normalEnding | expelled)`의 닫힌 집합이다. S2에서만 `MASTERY_CHANGED(topicId, from, to, source: classIntro | selfStudy)`를 추가한다. S1 이벤트 타입은 topic을 참조하지 않는다. 이벤트 순서는 실제 효과 순서를 따르며 성공 후보 확정 전에는 외부로 전달하지 않는다. 실제 시험·관계 이벤트는 후속 Slice 계약으로 추가한다.

| 공개 명령 type / 함수 | Slice 1 payload | Slice 2 변경 |
|---|---|---|
| `completeMorningHomeroom` | `{}` | 유지 |
| `completeMorningClass` | `{}` | `{topicId}`로 대체, 옛 overload 없음 |
| `passFreeTime` | `{}` | 유지 |
| `resolveFreeAction` | `{actionId}` | 승인 action 정본만 허용 |
| `completeAfternoonClass` | `{}` | 선택 주제의 오후 무료 `0→1` 또는 무변경 복습 |
| `commitDayEnd` | `{}` | 유지 |
| `performSelfStudy` | 없음 | `{topicId}`, 슬롯·숙련도 한 단계 원자 적용 |

Slice 1에는 실행 가능한 콘텐츠 action 정본이 없으므로 `resolveFreeAction`은 유효한 자유시간 phase에서도 모든 action ID를 `UNKNOWN_ID`로 거부한다. 임시 행동을 발명하지 않으며 진행은 `passFreeTime`으로 가능하다. Slice 2 학습은 `performSelfStudy`의 단일 경로를 사용한다. 임의 `effectId`, 슬롯, 점수, 결과 상태를 payload로 받지 않는다. 시험 test port는 결정 044의 tests-only graph에만 있고 이 production 명령 집합에 포함되지 않는다.

### 2.2 fingerprint와 처리 순서

- fingerprint는 hash가 아니라 버전이 붙은 **정본 JSON 문자열 자체**다. 대상은 `[1, runId, expectedStateRevision, type, payload]`이며 command ID는 receipt의 key이므로 제외한다.
- payload의 객체 key는 재귀적으로 UTF-16 코드 단위 오름차순 정렬하고 배열 순서는 보존한다. JSON 문자열 escaping은 `JSON.stringify`와 동일하다. 숫자는 유한 안전 정수만, `-0`은 거부한다. undefined·비JSON 객체·희소 배열·누락 필드·추가 필드는 거부한다. 이름의 trim 같은 도메인 정규화는 명령 생성 전에 완료한다.
- 정렬된 key-value 쌍을 정본 순서로 직렬화한다. 객체를 재생성한 뒤 JSON.stringify만 호출해 숫자 모양 key가 다시 수치순으로 바뀌게 하지 않는다. 진단 기대값 `{"2":2,"10":10}`의 정본 문자열은 `{"10":10,"2":2}`다.
- 예: run `r1`, revision `7`, `passFreeTime`, `{}`의 fingerprint는 정확히 `[1,"r1",7,"passFreeTime",{}]`다.
- 순서는 envelope schema → run 일치 → fingerprint·기존 receipt 비교 → 기대 revision → terminal·phase·슬롯·콘텐츠 조건 → 효과·revision·ledger·receipt를 포함한 후보 생성 → 전체 불변식 → no-op ending evaluator → 최종 후보·필요 snapshot 검증 → 원자 반환이다.
- 기존 receipt가 같으면 **현재 입력 상태 그대로** `duplicate`, 이벤트 없음이다. 예전 상태로 되감지 않는다. 다른 fingerprint면 `COMMAND_ID_CONFLICT`다. terminal이어도 기존 동일 명령은 `duplicate`이며 정상 schema·현재 run·현재 revision의 새 명령은 `TERMINAL_STATE`다.
- 실패 시 state·revision·receipt·ledger·슬롯·숙련도가 모두 불변이다. 성공 시 state revision은 정확히 1 증가한다. 도메인 효과 ID는 State가 `[runId, commandId, 효과 의미 키]`의 정본 조합으로 내부 생성하고 UI가 제공하지 않는다. ledger는 비용·보상 효과 중복을, receipt는 요청 재전송을 담당한다.
- 오류 판정의 소유자는 State/Systems다. UI는 `messageKey`를 중립 카피로 표시하고 다른 명령으로 자동 대체하지 않는다. `already-applied`를 실패로 쓰거나 기존 `ok`·`reason` 형식을 병존시키지 않는다.

### 2.3 selector의 실제 입출력

selector는 읽기 전용이며 입력을 바꾸거나 receipt를 만들지 않는다. 공통 조회 결과는 `{status: 'ready', value}` 또는 `{status: 'unavailable', error: {code, messageKey}}`다. 조회 code는 `CONTENT_NOT_READY`, `UNKNOWN_ID`, `INVALID_QUERY`, `CAPABILITY_DISABLED`다. 빈 검색 결과는 `ready([])`이며 오류와 다르다.

| Selector | 입력 | ready 값의 필수 의미 |
|---|---|---|
| `selectBootStatus` | 현재 Slice, 검증된 bundle 상태 | `loading/ready/blocked`, 공개 가능한 이유 |
| `selectShellView` | 앱 화면 상태 | 하나의 `home/game` |
| `selectHomeView` | Slice, boot, 앱 화면 상태 | 이름 정책, `persistence: notImplemented`, `gallery: emptyCatalog` (S0~2) |
| `selectDayLabel` | GameState | Day 숫자와 `DAY NN / 30` |
| `selectCurrentPhase` | GameState | phase ID와 표시 key |
| `selectPhaseSteps` | GameState | 순서가 고정된 단계별 `completed/current/future/blocked` |
| `selectFreeActionStatus` | GameState | 점심·방과 후 각 `available/used/future/blocked`, 공개 사유 |
| `selectAllowedCommands` | GameState, 검증된 콘텐츠 문맥 | 공개 명령별 허용 여부·공개 거부 사유; test port 없음 |
| `selectDailyClass` | GameState | S1 완료 불리언만; S2 선택 topic 참조 추가 |
| `selectStudyTopicSummaries` | S2 state, ScienceCatalog | 7주제 ID·제목·단계·상승 출처·다음 행동 |
| `selectStudyOutcomePreview` | S2 state, catalog, topic ID | 현재·예상 단계, 슬롯 비용 1, 허용 여부·사유; 호감도 예측 없음 |
| `selectPeriodicTableCapabilities` | S2 state, 호출 문맥 | State가 확정한 문맥과 완성된 allow-list |
| `selectPeriodicTableCells` | S2 state, catalog, 선택적 group/period filter, 문맥 | 정본 참조·족·주기 좌표 20개와 셀별 matchesFilter; 필터 없음은 전부 true |
| `selectElementDetail` | S2 state, catalog, 원소 ID, 호출 문맥 | 허용된 정본 필드; 일반 문맥에서만 주의 설명, 시험 정답 힌트 생성 없음 |
| `selectSearchResults` | state, catalog, 검색어, 문맥 | 정본 참조 목록 또는 조회 오류 |
| `selectComparison` | state, catalog, 선택 ID들, 문맥 | 승인 필드별 비교·주의 태그 또는 조회 오류 |
| `selectSnapshotSummary` | 검증된 in-memory snapshot | 종류·Day·phase·`durability: memoryOnly` |

Science가 query·학습·capability 계산을 소유하고 State facade가 상태와 결합해 공개한다. 별도 UI adapter에서 같은 규칙을 재계산하지 않는다. 조회 capability는 사용자 입력 boolean을 신뢰하지 않고 매번 State와 유효 문맥에서 재계산한다. 현재 phase가 `exam`이면 호출자가 `general`을 전달해도 시험 제한이 우선한다. 실제 시험 답안·문항 문맥은 후속 시험 subsystem 소유이며 Slice 2는 가짜 문항을 생성하지 않는다.

## 3. 회차 전체 receipt와 snapshot 원자성

**결정 036의 Day별 receipt 삭제 부분을 대체한다.** Slice 1~2는 적용 성공한 모든 변경 명령의 receipt를 회차 종료까지 유지하고 `dayStart`, `examResolved`, `terminal` snapshot에 포함한다. 다른 회차는 다른 run ID와 빈 receipt로 시작한다. 조회·실패·중복은 새 receipt를 기록하지 않는다.

- 현재 30일 모델은 하루 6개 변경 전이와 시험 결과 최대 3개이므로 최대 183개 성공 receipt다(factory 제외). Day 경계 전용 cache·tombstone·정리 알고리즘을 만들지 않는다. 후속 매점 등 슬롯 비소비 변경 명령 도입 시 크기 예산을 별도 재검토하되 임의 eviction으로 보장을 약화시키지 않는다.
- `commitDayEnd`는 Day 변경·당일 초기화·state revision 증가·필요 snapshot revision 증가·자기 receipt 기록을 한 후보에 반영한다. 다음 Day에서도 이전 Day 명령의 동일 재전송은 `duplicate`이며 다음 Day를 다시 진행시키지 않는다.
- 서로 다른 run의 envelope는 receipt 조회 전 `WRONG_RUN`이다. 같은 run에서 ID 재사용·다른 payload 또는 다른 기대 revision은 충돌이다. 이미 진행된 현재 상태에 대한 동일 재전송도 현재 상태를 보존한다.
- snapshot revision은 **체크포인트 생성 전이**에서만 1 증가한다. 최초 Day 1은 0, 이후 `dayStart`·시험 합격 `examResolved`·퇴학/노멀 terminal이 각각 1 증가한다. 단순 snapshot 투영·검증·JSON round-trip은 어느 revision도 바꾸지 않는다.
- 게임 효과·revision·receipt·ledger가 확정된 같은 후보에서 snapshot을 순수 투영한다. 잘못된 snapshot이나 후보를 일부 채워 정상화하지 않는다. in-memory adapter는 마지막 승인된 후보를 교체할 뿐 영속 저장 성공을 알리지 않는다.
- Slice 3 실제 저장은 별도 승인한다. 그때 **승인된 체크포인트 전이에서만** 메모리 후보 공개 전 영속 원자 커밋을 확인한다. 일반 Day 중간 전이에 영속 저장을 추가하지 않으며 이번 결정은 Day 기반 저장 경계를 늘리지 않는다.

## 4. Science query 정본과 수용 검사

### 4.1 허용 정의

원소의 readonly TypeScript 정본은 `elements.ts` 하나, topic 정본은 `studyTopics.ts` 하나다. topic ID·타입도 그 소유 모듈에서 내보내고 State·UI가 목록을 복제하지 않는다. `ScienceCatalog`는 검증 완료된 두 정본의 조합이지 다른 사실 원본이 아니다.

`ElementFactField`는 `atomicNumber`, `symbol`, `nameKo`, `nameEn`, `group`, `period`, `shellElectrons`, `valenceElectrons`의 닫힌 집합이다. `conceptKeys`는 아래 표의 개념 key만 허용한다.

```ts
type ScienceQueryDefinition =
  | { readonly kind: 'facts'; readonly fields: readonly ElementFactField[] }
  | { readonly kind: 'searchIdentity' }
  | { readonly kind: 'filterGroupPeriod' }
  | { readonly kind: 'compare'; readonly arity: 2 | 'many';
      readonly fields: readonly ElementFactField[] }
```

| topic ID | concept key | 필수 query 정의 |
|---|---|---|
| `topic-identity` | `identity` | facts(번호·기호·한영 이름), searchIdentity |
| `topic-group-period` | `group-period` | facts(족·주기), filterGroupPeriod |
| `topic-shells` | `shells` | facts(번호·주기·전자껍질) |
| `topic-valence` | `valence` | facts(족·원자가전자) |
| `topic-similarity` | `similarity` | facts(기호·족·주기·원자가전자) |
| `topic-stability` | `stability` | facts(기호·전자껍질·원자가전자) |
| `topic-comparison` | `comparison` | facts(전체 8필드), compare(2, 전체 8필드), compare(many, 전체 8필드) |

위 query들은 도구 정의이지 mission·dialogue의 정답이나 새 캐릭터 콘텐츠가 아니다. facts의 fields는 표에 대응하는 정확한 집합이고 중복을 허용하지 않는다. 원소의 H/He/Ne/Ar 주의 태그는 일반 문맥의 상세·비교 결과에 정본 참조로 함께 제공해 과잉 일반화를 방지한다.

### 4.2 실행·검증 규칙

- catalog validator는 정확한 원소 20개 수용값·불변식, 7개 topic ID·concept·필수 query의 정확한 집합, fields·arity·중복·미등록 참조·버전을 검사한다. 임의 JavaScript 함수·수식 문자열·eval·원소별 teachingTags registry는 금지한다.
- 일반 검색은 mastery 0부터 가능하다. trim 후 빈 검색은 20개 전체다. `1`~`20` 정수 문자열은 번호 exact match, 그 밖은 정본 기호·한영 이름에 `toLowerCase()` 후 부분 일치다. 결과는 원자번호 오름차순이며 사실을 생성하지 않는다.
- 필터 입력은 `group?: 1..18`, `period?: 1..4` 중 하나 이상이며 둘이면 AND다. 관련 topic level 1이 필요하다. 두 원소 비교는 서로 다른 정확히 2개 ID와 비교 level 2, 복합 비교는 서로 다른 3~20개 ID와 비교 level 3이 필요하다. 출력은 선택 ID 순서를 보존한다.
- 시험 문맥은 결정 021의 기본 상세 필드·공간 배열만 허용한다. 검색·필터·비교는 topic·숙련도·요청 경로와 무관하게 `CAPABILITY_DISABLED`이고 결과값을 반환하지 않는다. 주의 태그는 정본 검증과 일반 문맥의 설명에 사용하며 시험에 추가 설명·진단을 노출하지 않는다.
- Slice 2는 7개 mastery와 마지막 상승 출처만 저장한다. mastery 0은 source key 없음, 1 이상은 실제 상승 출처가 필수다. `studyTogether`는 타입 예약만 가능하고 Slice 2 실행·snapshot의 실제 상승 출처로 사용하지 않는다. 무료 복습은 기존 출처를 덮어쓰지 않는다.
- QA의 독립 기대값은 `docs/12` 5.6절의 승인 수용표다. 정본으로 기대값을 다시 계산하는 자기 비교만으로 정확성을 합격시키지 않는다. 기대값은 test-only assertion이며 앱의 두 번째 runtime catalog·fallback으로 import하지 않는다.

## 5. 자산 경로와 오류 경계

### 5.1 입력 allow-list와 URL 보존

- 가상 placeholder에는 path·format·치수·URL이 없다. 실제 바이너리 path는 **`assets/` 아래 파일**만 허용한다.
- 각 segment는 ASCII `[A-Za-z0-9_-]+`에 `.`과 같은 문자군을 반복 연결한 형식만 허용한다. 즉 `a`, `a.b`, `a-b_2.webp`는 가능하고 빈 segment·선행/후행 점·연속 점·`.`·`..`는 불가다. 마지막 segment는 선언된 format의 확장자를 가진 파일이어야 한다.
- `%`·공백·비ASCII·제어문자·역슬래시·프로토콜·호스트·query·hash·선행/후행 slash·중복 slash를 거부한다. decode·encode·trim·case-fold로 고쳐서 수용하지 않는다. `%2e%2e`, `%2E.`, `.%2e`, `%252e%252e`, `%2f`, `%5c`는 모두 **URL 생성 전 거부**다.
- 검증 후 결정 046의 두 단계 URL 해석을 각각 한 번 수행한다. 최종 URL은 appBaseUrl과 같은 origin이고, pathname이 정확한 `appBaseUrl.pathname + 'assets/'` 경계 아래여야 하며 search·hash는 비어 있어야 한다. 단순 `/assets` 문자열 포함 검사는 충분하지 않다.
- document base는 앱 부트 시 신뢰된 `document.baseURI`에서 주입하고 `<base>` 태그를 사용하지 않는다. resolver는 DOM을 직접 요구하지 않는 순수 함수로 테스트하고 배포 base는 `./` 단일값이다.
- 대소문자는 보존하며 build artifact와 exact case로 비교한다. ASCII 파일명 제약은 사용자 이름 Unicode 허용과 무관하다.

| document | path | 기대 결과 |
|---|---|---|
| `https://example.test/lovechemistry/` | `assets/ui/a.webp` | `https://example.test/lovechemistry/assets/ui/a.webp` |
| `https://example.test/lovechemistry/index.html?x=1#top` | 같은 path | 위와 동일 |
| `https://example.test/LoveChemistry/` | 같은 path | 대문자 예시 base를 그대로 보존 |
| `https://example.test/` | 같은 path | `https://example.test/assets/ui/a.webp` |
| 위 모든 기준 | 인코딩·절대·비허용 path | URL·네트워크 요청 없이 거부 |

### 5.2 실패 분류와 재시도

| 경계 | 예 | 사용자 동작 | 상태 영향 |
|---|---|---|---|
| 부트 필수 metadata·virtual manifest 무효 | 중복 ID, 잘못된 status, 금지 필드, fallback 순환·누락 참조 | `blocked`, 오류·재시도, 실행 동작 없음 | GameState 생성·변경 없음 |
| 정상 가상 placeholder | 승인된 CSS/text 항목 | 준비 상태 표시, 네트워크 0 | 없음 |
| 정상 catalog의 소비자 요청 오류 | 알 수 없는 asset ID·종류 불일치 | 중립 fallback, 개발·QA 진단 | 게임 진행·해금 불변 |
| 통합된 실제 이미지 파일 오류 | 네트워크·404·decode 실패 | 해당 영역 fallback·오류, 선택적 사용자 재시도 | 슬롯·관계·저장·phase 불변 |
| Science 필수 bundle 무효(S2) | 원소값·topic·참조 오류 | 게임 생성·진행 차단, 진단·재시도 | 기존 상태·저장 삭제나 자동 수정 없음 |

Slice 0~2 boot manifest는 모든 항목이 `status = placeholder`, `associations = []`, 종류 중립의 유효 fallback이고 바이너리 필드가 없어야 한다. CG·캐릭터 존재를 드러내는 ID·개수·이름을 fixture·접근성 라벨에 넣지 않는다. 실제 자산 예시는 path 검증용 문자열일 뿐 배포 바이너리 생성을 요구하지 않는다.

오류 code·messageKey는 계층이 소유하고 사용자에게 원시 path·스택·숨은 콘텐츠 ID를 노출하지 않는다. 자동 무한 재시도는 하지 않는다. 필수 bundle 재시도 성공 전에는 막힌 동작을 열지 않는다. 한 이미지의 실패로 앱 전체를 막지 않고, 잘못된 필수 catalog를 이미지 fallback으로 정상 처리하지도 않는다.

## 6. 작업·카피·검증 책임

| 작업/파일 | 단일 통합 담당 | 검토·지원 |
|---|---|---|
| package.json, package-lock.json, TS·Vite 설정, npm scripts | Frontend | QA 검증 요구, PM 범위 승인 |
| Vitest·RTL·Playwright·axe 설정 및 tests/ | QA | Frontend가 scripts·lockfile 변경 통합 |
| AppRoot·부트·셸·overlay·CSS·이름 validator | Frontend | State guard, Asset 필수 manifest, QA |
| state/commands·selectors facade·receipt·snapshot | State | Systems 순수 규칙, QA |
| elements·studyTopics·Science query·validator·학습 규칙 | Science/Game Systems | State 원자 적용, QA 독립 수용값 |
| assetManifest·resolveAsset·path·fallback | Asset Integration | Frontend 렌더링, QA 경로 검증 |
| 중립 copy key·사용 문맥 | Frontend | State 의미, Narrative 스포일러·가독성 검토 |
| 키보드·포커스·200%·reduced motion·데스크톱/모바일 브라우저 수동 검증 | QA | Frontend 수정·기기 지원, PM 최종 증거 확인 |
| 공유 계약·승인·최종 인수 | PM | 소유 역할과 QA |

패키지 관리자는 npm, 단일 lockfile은 package-lock.json이다. 패키지 버전은 구현 승인 후 선택·설치하고 승인된 `graphemer@1.4.0`만 정확히 고정한다. 지금 패키지나 설정 파일을 생성하지 않는다. 승인 Slice에 필요한 파일만 생성하고 존재하지 않는 빈 디렉터리를 clone 전제 조건으로 삼지 않는다. lockfile을 여러 역할이 따로 재생성하지 않는다.

S0 이름 확인은 “이름을 사용할 수 있습니다. 게임 시작 기능은 아직 준비 중입니다.”, S0~2 불러오기는 “저장·불러오기는 아직 구현되지 않았습니다.”로 표현한다. S1~2 게임에는 “개발 검증용 진행입니다. 새로고침하면 진행이 유지되지 않습니다.”를 지속 표시한다. snapshot 요약은 “메모리 체크포인트”로 표시하고 “저장 완료”라고 하지 않는다. `persistence = notImplemented`를 “저장 데이터 없음”과 혼동하지 않는다.

이 문구는 중립 기술 검증 카피 승인이지 출시 카피·최종 서사 승인이 아니다. Narrative는 공개 가능한 의미·인물/사건 누설을 검토하며 상태 의미를 바꾸지 않는다. 호감도·루트·함께 공부가 유예됐다는 이유로 최종 제품에서 제거하지 않는다.

## 7. 수정 인수 기준과 잔여 게이트

| ID | 문서·향후 테스트 기대값 |
|---|---|
| FIX-01 | 여섯 역할 지침과 다섯 V2 설계가 현행 공통 계약을 참조하고 원안을 실행 기준으로 사용하지 않음 |
| FIX-02 | 같은 envelope 재전송은 현재 상태·revision·이벤트 무변경 duplicate; ID 충돌·stale·잘못된 run·미등록 명령은 원본 불변 거부 |
| FIX-03 | payload key 순서만 다른 요청의 fingerprint 동일; revision 변경은 다른 fingerprint; 비JSON·미등록 필드 거부 |
| FIX-04 | Day 종료 직후 및 다음 Day 진행 후 이전 요청 재전송 모두 duplicate; 두 번째 Day 증가·슬롯 소비 없음 |
| FIX-05 | terminal 동일 재전송은 duplicate, 새 명령은 거부; snapshot 반복 투영은 revision 불변; 새 회차는 빈 receipt |
| FIX-06 | 20개 승인 수용값·7 topic/query 집합·He=2·H 주의·출처 불변식 독립 검사; 잘못된 정본을 자체 기대값으로 합격시키지 않음 |
| FIX-07 | S1 topic 흔적 없음; S2 selfStudy만 실행; level 3 거부 슬롯 미소비; 시험 general 문맥 위장도 검색·비교 차단 |
| FIX-08 | 소문자 실제 Pages 경로·대문자 예시·root·index/query/hash URL oracle 통과, 인코딩 우회와 case mismatch 거부 |
| FIX-09 | 필수 manifest 무효는 부트 차단, 정상 placeholder는 무요청 정상, 단일 이미지 실패는 국소 fallback; 상태 불변 |
| FIX-10 | UI에 실제 저장·출시 플레이 오인 없음, 담당·파일 통합 경계 명시, 수동 검증에 키보드·모바일·브라우저 증거 포함 |
| FIX-11 | production test port·raw score 부재와 Day 10 fail-closed는 기존 결정 044대로 source·artifact·E2E 검증 |
| FIX-12 | 후속 대표 루트는 사실 활용·인물 동기·필수 사건·시험·저장·결말의 연결을 증명하고 단순 퀴즈·선물 반복으로 대체하지 않음 |

수정된 계약은 REVIEW-01~07의 PM 조정안으로 확정한다. 기존 2026-09-28 QA PASS는 그 당시 결정 022~046에 대한 이력이며 이 수정에 자동 승계하지 않는다. **결정 047~053의 별도 QA 재검토와 Slice별 구현 승인은 아직 필요하다.** 실행 가능한 앱·테스트는 없으므로 위 인수표는 테스트 명세이며 실행 PASS를 뜻하지 않는다.

## 8. 이번 수정의 진단 기록

2026-10-26 Node 진단에서 문서의 URL reference oracle 102개, 정본 JSON·fingerprint oracle 13개, receipt 경계 추상 모델 11개 assertion을 확인했다. 정상 소문자/대문자/root/index URL, 인코딩·경로·format·case 거부, key 순서·revision 차이·비JSON 거부, Day 전환·진행 후 재전송·run 충돌·terminal 재전송을 포함한다.

이는 문서 규약의 reference 절차를 점검한 것이며 **실제 resolver·상태기계·과학 데이터·빌드·영속 저장·브라우저의 실행 테스트나 독립 QA 합격은 아니다**. 진단 코드는 repository의 애플리케이션·테스트 파일로 생성하지 않았다. 구현 승인 후 실제 코드에서 FIX-01~12를 다시 검증해야 한다.
