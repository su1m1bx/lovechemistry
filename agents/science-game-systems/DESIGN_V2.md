# Science & Game Systems 2차 설계

## 현행 작업 계약 / 2026-10-26

- `docs/12_INTEGRATED_DESIGN_V2.md`, `docs/15_IMPLEMENTATION_CONTRACT.md`, 결정 047~053이 Slice 0~2의 적용 기준이다. 아래 보존 원안의 API·teachingTags·loader·미정 목록을 복사하지 않는다.
- Science 정본은 Slice 2에서만 활성화한다. Slice 1에 topic enum·fixture·원소 fake를 제공하지 않는다.
- 원소 정본 `elements.ts`와 topic 정본 `studyTopics.ts`는 Science 소유다. `teachingTags`·관련 registry는 폐기하고 `cautionTags`와 topic concept/query를 사용한다. 닫힌 ScienceQueryDefinition과 정확한 7 topic/query 집합은 `docs/15` 4절을 따른다.
- Science는 순수 query·capability·학습 전이 규칙을 제공하고 State가 공개 envelope·selector facade와 원자 커밋을 소유한다. UI 입력 effectId와 역할별 CommandResult는 사용하지 않는다.
- 공개 실행은 performSelfStudy만, 무료 상승은 오후 완료 0→1만, level 3은 슬롯 미소비 거부다. 함께 공부·관계·미션의 실제 콘텐츠·효과는 후속 승인까지 예약한다.
- 조회 문맥을 State에서 재검증하며 exam에서 general 위장 요청도 검색·필터·비교를 열지 않는다. 시험에는 결정 021의 기본 필드만 제공한다.
- 독립 수용값 assertion과 runtime 사실 정본을 분리한다. 필수 Science 무효는 fallback 없이 차단하고 이미지 실패와 혼용하지 않는다.
- 상태: **PM 계약 수정 반영 / QA 재검토 필요 / 구현 미승인·NOT TESTED**.

## 보존 원안 / 2026-09-28 / 구현 근거 아님

**상태:** `SLICE 1~2 DESIGN PROPOSAL / 구현 승인 아님`  
**범위:** Slice 1 하루 루프 + Slice 2 과학 정본·공부·주기율표  
**작성일:** 2026-09-28  
**구현 여부:** 문서만 작성. 코드·런타임 데이터·패키지 생성 없음.

## 1. 목적과 설계 경계

이 문서는 기존 승인 계약을 Slice 1~2에서 구현 가능한 단위로 구체화한다. 기준은 `docs/00`~`03`, `05`, `06`, `08`, `10`, `11`과 관련 담당 `BRIEF.md`·`PROPOSAL.md`다. 충돌 시 잠금 규칙, 사용자 승인 결정 015·016·019·020·021, PM 승인 구현 결정, 본 설계 순으로 우선한다.

### 포함

- Day 1~30의 일반일·시험일 phase와 점심·방과 후 각 1개 행동 슬롯
- 원소 1~20 과학 정본의 정확한 필드·값·불변식
- 일곱 학습 주제와 숙련도 `0~3` 획득·효용
- 일반 플레이와 시험 중 주기율표 capability
- Slice 1~2 필수 콘텐츠 loader와 실패 처리
- 다른 계층이 소비할 public selector·command 계약
- 구현 전 수용 테스트와 QA 위험

### 범위 밖

- 최종 시험 문제은행, 문항 문구·선택지·해설과 출제 순서
- 루트별 이벤트·미션·보상·엔딩 상세
- 최종 아이템·매점 카탈로그와 경제 밸런스
- 대사, 캐릭터 외형, CG·자산 제작
- 저장 어댑터·UI 컴포넌트·패키지·코드 구현

시험은 Slice 1~2에서 **일정·phase·주기율표 제한 capability와 결과 연동 경계**만 정의한다. 채점 입력을 만드는 문제은행과 시험 화면 구현은 후속 범위다.

### 1.1 최신 PM 계약 정렬(결정 043~044)

이 절은 아래 원안 중 충돌하는 제안보다 우선한다. 문서 정렬일 현재 코드·build 증거는 없으며 QA 재검토 전 구현 승인 또는 Ready to Code를 뜻하지 않는다.

- Slice 1은 ScienceCatalog, `StudyTopicId`, `selectedTopicId`, topic fixture를 소비하지 않는다. 당일 수업 상태는 `morningCompleted`, `afternoonCompleted`뿐이고 오전·오후 수업은 generic 완료이며 숙련도 변화가 없다. Slice 1 snapshot에도 topic이 없고 fake topic을 금지한다.
- Slice 2에서 ScienceCatalog와 일곱 topic 정본을 활성화할 때 `selectedTopicId`와 `completeMorningClass(topicId, commandId)`를 함께 도입한다. `completeAfternoonClass(commandId)`가 무료 `0→1` 또는 복습을 적용한다. 배포 persistence가 없어 migration·compatibility code는 없다.
- 아래 2.6, 3, 4, 9절에서 `DailyClassState.selectedTopicId`, topic 수업과 무료 상승을 Slice 1에도 적용하는 것으로 읽히는 부분은 **Slice 2 한정으로 정정**됐다. Slice 1 command는 topic 없는 generic 형태다.
- `applyExamResolution`을 raw score production public command로 읽는 제안은 **SUPERSEDED**다. production façade·registry에는 raw score command·port·type이 없다. 향후 검증 결과 적용 함수의 논리 위치는 `src/state/internal/applyVerifiedExamOutcome.ts`지만 실제 시험 Slice 전 production entry graph에서 import하지 않는다.
- test adapter는 `tests/helpers/resolveExamForTest.ts`에만 두고 marker `slice-test-exam-outcome-v1`, 점수 `49 | 50 | 100`만 허용한다. production `src`에서 tests import를 금지하며 production build input은 `src/main.tsx` 단일 graph다. public export·registry·source graph·artifact marker·Day 10 fail-closed·재주입 거부를 검증한다.

결정 043~044는 모두 잠금 변경 없음이다.

## 2. 구체 설계안

### 2.1 Slice 경계

| Slice | 책임 | 완료 기준 |
|---|---|---|
| Slice 1 | Day 표시, phase 전이, 점심·방과 후 슬롯, 일반일·시험일 분기, Day 종료 | 잘못된 phase 명령은 상태 불변으로 거부되고 Day 31이 생성되지 않음 |
| Slice 2 | 원소 정본, 7개 학습 주제, 숙련도 전이, 일반·시험 주기율표 capability, 필수 데이터 loader | 정본 전체 검증 통과 전 플레이를 시작하지 않고 과학값을 다른 도메인에 복제하지 않음 |

Slice 2는 Slice 1의 오전·오후 수업과 자유 행동 슬롯을 소비한다. Slice 1이 과학 규칙을 하드코딩하거나 Slice 2가 별도 달력을 만들지 않는다.

### 2.2 원소 1~20 정본 필드

정본 레코드는 아래 필드만 필수로 한다.

| 필드 | 제약 | 용도 |
|---|---|---|
| `id` | `element-01`~`element-20`, 유일·불변 | 모든 소비 데이터의 참조 키 |
| `atomicNumber` | 정수 `1~20`, 유일 | 원자번호 및 정렬 기준 |
| `symbol` | 표준 대소문자, 유일 | 원소 기호 |
| `nameKo` | 아래 표의 정본 표기, 유일 | 한국어 표시 |
| `nameEn` | 아래 표의 정본 표기, 유일 | 영어 보조 표시 |
| `group` | 정수 `1~18` | 현대식 족 |
| `period` | 정수 `1~4` | 주기 |
| `shellElectrons` | 안쪽 껍질부터 양의 정수 배열 | 교육용 전자배치 |
| `valenceElectrons` | 정수 `1~8` | 본 범위의 최외각 전자 수 |
| `teachingTags` | 승인된 태그 ID의 중복 없는 배열 | 수업·질의 연결 |
| `cautionTags` | 승인된 태그 ID의 중복 없는 배열 | 과잉 일반화 방지 |

`electronTotal`, `shellCount`, 표시용 전자배치 문자열은 파생값이므로 정본에 저장하지 않는다. 캐릭터 성격, 공략 여부, 말투, 관계 해석은 원소 정본 필드가 아니다.

### 2.3 원소 1~20 정확한 수용표

| ID | 번호 | 기호 | 한국어 이름 | 영어 이름 | 족 | 주기 | 전자껍질 분포 | 원자가전자 | 필수 주의 태그 |
|---|---:|---|---|---|---:|---:|---|---:|---|
| `element-01` | 1 | H | 수소 | Hydrogen | 1 | 1 | `1` | 1 | `hydrogen-not-alkali-equivalent` |
| `element-02` | 2 | He | 헬륨 | Helium | 18 | 1 | `2` | 2 | `filled-first-shell` |
| `element-03` | 3 | Li | 리튬 | Lithium | 1 | 2 | `2, 1` | 1 | - |
| `element-04` | 4 | Be | 베릴륨 | Beryllium | 2 | 2 | `2, 2` | 2 | - |
| `element-05` | 5 | B | 붕소 | Boron | 13 | 2 | `2, 3` | 3 | - |
| `element-06` | 6 | C | 탄소 | Carbon | 14 | 2 | `2, 4` | 4 | - |
| `element-07` | 7 | N | 질소 | Nitrogen | 15 | 2 | `2, 5` | 5 | - |
| `element-08` | 8 | O | 산소 | Oxygen | 16 | 2 | `2, 6` | 6 | - |
| `element-09` | 9 | F | 플루오린 | Fluorine | 17 | 2 | `2, 7` | 7 | - |
| `element-10` | 10 | Ne | 네온 | Neon | 18 | 2 | `2, 8` | 8 | `filled-outer-shell` |
| `element-11` | 11 | Na | 나트륨 | Sodium | 1 | 3 | `2, 8, 1` | 1 | - |
| `element-12` | 12 | Mg | 마그네슘 | Magnesium | 2 | 3 | `2, 8, 2` | 2 | - |
| `element-13` | 13 | Al | 알루미늄 | Aluminium | 13 | 3 | `2, 8, 3` | 3 | - |
| `element-14` | 14 | Si | 규소 | Silicon | 14 | 3 | `2, 8, 4` | 4 | - |
| `element-15` | 15 | P | 인 | Phosphorus | 15 | 3 | `2, 8, 5` | 5 | - |
| `element-16` | 16 | S | 황 | Sulfur | 16 | 3 | `2, 8, 6` | 6 | - |
| `element-17` | 17 | Cl | 염소 | Chlorine | 17 | 3 | `2, 8, 7` | 7 | - |
| `element-18` | 18 | Ar | 아르곤 | Argon | 18 | 3 | `2, 8, 8` | 8 | `filled-outer-shell` |
| `element-19` | 19 | K | 칼륨 | Potassium | 1 | 4 | `2, 8, 8, 1` | 1 | - |
| `element-20` | 20 | Ca | 칼슘 | Calcium | 2 | 4 | `2, 8, 8, 2` | 2 | - |

### 2.4 원소 정본 불변식

1. 레코드 수는 정확히 20이고 `atomicNumber` 집합은 정확히 `{1..20}`이다.
2. `id === "element-" + atomicNumber의 2자리 0 채움`이다.
3. `id`, `atomicNumber`, `symbol`, `nameKo`, `nameEn`은 각각 중복이 없다.
4. `sum(shellElectrons) === atomicNumber`다.
5. `shellElectrons.length === period`다.
6. 각 껍질 값은 양의 안전 정수다. 1주기 최외각은 최대 2, 나머지 본 범위 최외각은 최대 8이다.
7. `valenceElectrons === shellElectrons.at(-1)`이다. He는 2이며 18족 일반값 8로 덮어쓰지 않는다.
8. 위 표의 번호·기호·이름·족·주기·전자 분포·원자가전자는 필드별로 정확히 일치해야 한다.
9. H에는 `hydrogen-not-alkali-equivalent`, He에는 `filled-first-shell`, Ne·Ar에는 `filled-outer-shell`이 반드시 존재한다.
10. `teachingTags`와 `cautionTags`는 중복이 없고 승인된 태그 사전에만 존재한다.
11. 소비 콘텐츠는 `elementId` 또는 정본 질의만 저장한다. 원자번호·족·주기·전자배치를 독립 사실로 복제하면 검증 실패다.
12. 원소 20 밖 ID, 고급 화학 분류 또는 캐릭터 해석을 필수 과학 정본에 넣지 않는다.

### 2.5 일곱 학습 주제

| 주제 ID | 정본 명칭 | 포함 개념 | 대표 활용 |
|---|---|---|---|
| `topic-identity` | 원소의 정체 | 원자번호, 이름, 기호 | 기본 식별·조회 |
| `topic-group-period` | 족과 주기 | 세로 족, 가로 주기, 위치 읽기 | 족·주기 필터 |
| `topic-shells` | 전자껍질 분포 | 안쪽부터의 전자 수, 주기와 껍질 수 | 분포 해석 |
| `topic-valence` | 원자가전자 | 승인 범위의 최외각 전자 추론 | 같은 족 비교 |
| `topic-similarity` | 같은 족의 유사성과 차이 | 유사한 경향, 완전 동일하지 않음 | H/Na/K, F/Cl 비교 |
| `topic-stability` | 안정한 전자배치 | 채워진 최외각 껍질 | He/Ne/Ar 비교 |
| `topic-comparison` | 원소 자료 비교 | 1~20의 여러 조건 결합·자료 해석 | 두 원소·복합 비교 |

주제 수와 ID 집합은 Slice 2의 콘텐츠 계약이다. 표시 문구는 과학 의미를 바꾸지 않는 범위에서 교정할 수 있지만 ID를 다른 의미로 재사용하지 않는다.

### 2.6 숙련도 `0~3` 획득 규칙

| 출처 | 선행 단계 | 결과 | 슬롯 | 규칙 |
|---|---:|---:|---:|---|
| 무료 일과 수업 | 0 | 1 | 0 | 같은 날 오전에 주제를 선택하고 오후 수업까지 완료했을 때 1회 적용 |
| 무료 일과 수업 | 1~3 | 변화 없음 | 0 | 복습·진단만 제공 |
| 혼자 공부 | 0 | 1 | 현재 자유시간 1 | 한 행동에 한 단계만 상승 |
| 혼자 공부 | 1 | 2 | 현재 자유시간 1 | 허용 |
| 혼자 공부 | 2 | 3 | 현재 자유시간 1 | 허용 |
| 혼자 공부 | 3 | 3 | 소비 전 차단 | 수치 상승 없는 공부를 기본 허용하지 않음 |
| 함께 공부 | 0~2 | `min(3, 현재+1)` | 현재 자유시간 1 | 과학 진행은 혼자 공부와 동일, 관계 효과는 Slice 3 이후 별도 트랜잭션 |
| 함께 공부 | 3 | 3 | 소비 전 차단 | 콘텐츠 장면만을 위해 소비하려면 별도 승인된 행동 ID 필요 |
| 미션 보상 | 모두 | 변화 없음 | 미션 계약 따름 | 단서 적용·복습 피드백만 가능 |

무료 수업 상승은 `afternoonClass` 완료 때 적용한다. 오전 수업 직후 `1`로 만들면 오후 수업을 건너뛰어도 무료 상승을 얻는 계약 위반이 생기므로 금지한다. 수업 중 선택한 주제와 오전 완료 여부는 당일 진행 상태로 유지한다.

### 2.7 단계별 효용과 시험 비보정

| 단계 | 모든 주제에 공통인 의미 | 허용 효용 |
|---:|---|---|
| 0 | 미학습 | 원소 1~20 핵심 사실 기본 조회만 가능 |
| 1 | 소개 | 시험 범위 체크리스트, 해당 주제의 기초 오답 진단; `topic-group-period`는 족·주기 필터 활성 |
| 2 | 연습 | 해당 주제를 요구하는 대화 해석 단서와 미션 비정답형 힌트; `topic-comparison`은 두 원소 비교 활성 |
| 3 | 숙달 | 해당 주제의 승인 범위 내 심화 오답 설명과 일부 더 나은 해결·대화 선택의 이해 또는 해금; `topic-comparison`은 복합 비교 활성 |

불변 규칙:

- 숙련도는 시험 점수, 문항 배점, 합격 기준, 정답 여부를 보정하지 않는다.
- 숙련도는 시험 답안을 자동 선택하거나 선택지를 제거하지 않는다.
- 원자번호·기호·한국어/영어 이름·족·주기·전자껍질 분포·승인된 원자가전자 정보는 일반 플레이에서 숙련도와 무관하게 조회 가능하다.
- `dialogueInsight`, `missionHint`, `errorDiagnosis`는 소비 콘텐츠가 요구 `topicId`와 최소 단계를 선언할 때만 selector가 허용한다. selector가 정답 문구를 생성하지 않는다.
- 무료 수업과 미션 보상은 기존 루트 도달성의 시험 공부 9행동을 대체하지 않는다.

### 2.8 주기율표 capability

#### 일반 플레이

| Capability | 조건 | 행동 비용 |
|---|---|---:|
| `viewLayout` | 항상 | 0 |
| `viewElementDetail` | 항상, 1~20만 | 0 |
| `searchIdentity` | 항상 | 0 |
| `filterGroupPeriod` | `topic-group-period >= 1` | 0 |
| `compareTwo` | `topic-comparison >= 2` | 0 |
| `compareCompound` | `topic-comparison >= 3` | 0 |
| `missionHint` | 관련 주제 `>= 2`이고 호출 미션이 비정답형 힌트를 선언 | 0 |
| `dialogueInsight` | 관련 주제 `>= 2`이고 호출 장면이 단서를 선언 | 0 |
| `basicErrorDiagnosis` | 관련 주제 `>= 1`, 시험 제출 뒤 또는 비시험 학습 문맥 | 0 |
| `advancedErrorExplanation` | 관련 주제 `>= 3`, 승인 범위 안, 시험 제출 뒤 또는 비시험 문맥 | 0 |

검색은 이름·기호·원자번호에만 적용하며 정본 밖 지식을 검색 결과로 만들지 않는다. 일반 capability는 UI가 임의 추론하지 않고 selector 결과를 소비한다.

#### 시험 문맥

| Capability | 허용 여부 |
|---|---|
| 기본 주기율표 공간 배열 | 허용 |
| 원소 1~20 상세의 번호·기호·한/영 이름·족·주기·전자껍질 분포·승인 원자가전자 | 허용 |
| 열기·닫기와 같은 문항 복귀 | 허용, 행동 비용 0 |
| 검색 | 금지 |
| 족·주기 필터 | 금지 |
| 두 원소·복합 비교 | 금지 |
| 미션·대화 힌트 | 금지 |
| 기초·심화 오답 진단 | 금지 |
| 답 자동 선택·선택지 제거·점수 보정 | 금지 |

시험 capability는 숙련도와 무관한 고정 집합이다. 오버레이 왕복은 `answersByQuestion`, 문항·선택지 순서, `currentQuestionIndex`, 호출 포커스를 보존하며 새 저장 체크포인트를 만들지 않는다.

### 2.9 일반일·시험일 phase와 행동 슬롯

#### 일반일

`morningHomeroom → morningClass → lunchFreeTime → afternoonClass → afterSchoolFreeTime → dayEnd`

#### Day 10·20·30 시험일

`morningHomeroom → morningClass → lunchFreeTime → afternoonClass → exam → (50 미만 terminal / 50 이상 afterSchoolFreeTime) → dayEnd`

Day 30은 Character End가 없는 경우 시험 합격, 방과 후, `dayEnd` 뒤 노멀 엔드로 terminal이 되며 Day 31을 만들지 않는다. Character End의 상세 판정은 Slice 1~2 범위 밖이지만 결정 020의 조기 terminal과 미래 시험 미실행을 phase guard가 수용해야 한다.

#### 슬롯 규칙

- 매일 점심 슬롯 1개, 방과 후 슬롯 1개다.
- 시험일 점심은 시험 전에 사용한다. 방과 후 슬롯은 50점 이상 합격 뒤에만 열린다.
- 혼자 공부·함께 공부·만남·미션 수행·장소 행동은 현재 phase의 슬롯 1개를 소비한다.
- 주기율표·미션 목록·인벤토리·상태 조회, 매점 열기와 단순 구매, 행동 확정 전 취소는 슬롯을 소비하지 않는다.
- 슬롯 소비 행동은 사전 검증, 후보 상태 생성, 전체 효과 반영, 불변식 검증, 상태 교체를 한 원자적 command로 수행한다.
- 사용할 수 있는 콘텐츠 행동이 없어도 진행이 막히지 않도록 `passFreeTime`을 제공한다. 이 명령은 현재 슬롯을 사용 완료로 표시하지만 보상·숙련도·호감도·플래그를 만들지 않는다. 이는 행동 기회를 포기하는 것이며 추가 슬롯을 주지 않는다.
- 이미 사용한 슬롯에서 행동 또는 `passFreeTime`을 다시 요청하면 상태 변화 없이 거부한다.

### 2.10 필수 데이터 loader와 실패 처리

Slice 1~2의 필수 bundle은 `elements`, `studyTopics`, `teachingTagRegistry`, `scienceContentVersion`이다. 로더는 원시 입력을 신뢰하지 않고 아래 순서로 처리한다.

1. 필수 리소스를 모두 읽는다.
2. JSON/모듈 형태를 구조 검증한다.
3. ID·열거값·안전 정수·중복·참조를 검증한다.
4. 2.4절의 원소 불변식과 정확한 수용표를 검증한다.
5. 일곱 주제의 정확한 ID 집합과 capability 참조를 검증한다.
6. 전체가 성공한 경우에만 불변 `ScienceCatalog`를 공개한다.

실패 분류:

| 코드 | 예 | 처리 |
|---|---|---|
| `resource-unavailable` | 정적 파일 누락, 잘못된 Pages 경로 | bundle 전체 실패 |
| `parse-failed` | 잘못된 JSON·모듈 값 | bundle 전체 실패 |
| `schema-invalid` | 필수 필드 누락, 잘못된 타입 | bundle 전체 실패 |
| `invariant-violated` | 전자 합 불일치, 20개 아님 | bundle 전체 실패 |
| `duplicate-id` | 원소·주제·태그 중복 | bundle 전체 실패 |
| `unknown-reference` | 미등록 태그·주제 참조 | bundle 전체 실패 |
| `version-incompatible` | 저장 `contentVersion`과 비호환 | 활성 회차 로드 차단, 원본 저장 보존 |

필수 과학 bundle 실패 시 **부분 원소 목록, 추정값, 마지막 항목 복사, 빈 배열 정상 처리, 내장 대체 과학값**을 사용하지 않는다. 앱은 진단 가능한 `fatalContentError` 상태로 들어가고 새 게임·불러오기·활성 게임 진행을 비활성화한다. 재시도와 홈 복귀 안내는 제공할 수 있으나 실패가 해결되기 전 GameState를 생성·변경·저장하지 않는다. 기존 저장은 삭제하거나 마이그레이션하지 않는다.

loader 오류의 사용자 문구는 기술 스택·원시 경로·스택을 노출하지 않고 오류 코드와 재시도 가능 여부를 전달한다. 개발 진단에는 실패 리소스와 검증 경로를 남기되 원소 사실을 자동 교정하지 않는다.

## 3. 필요한 데이터 구조(TypeScript 유사)

아래는 논리 계약이며 구현 코드가 아니다.

```ts
type ElementId = `element-${string}`;
type StudyTopicId =
  | 'topic-identity'
  | 'topic-group-period'
  | 'topic-shells'
  | 'topic-valence'
  | 'topic-similarity'
  | 'topic-stability'
  | 'topic-comparison';

type Mastery = 0 | 1 | 2 | 3;
type ExamDay = 10 | 20 | 30;
type FreeTimePhase = 'lunchFreeTime' | 'afterSchoolFreeTime';
type Phase =
  | 'morningHomeroom'
  | 'morningClass'
  | 'lunchFreeTime'
  | 'afternoonClass'
  | 'exam'
  | 'afterSchoolFreeTime'
  | 'dayEnd'
  | 'endingSelection'
  | 'characterEndingScene'
  | 'terminal';

interface ElementRecord {
  readonly id: ElementId;
  readonly atomicNumber: number;
  readonly symbol: string;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly group: number;
  readonly period: number;
  readonly shellElectrons: readonly number[];
  readonly valenceElectrons: number;
  readonly teachingTags: readonly string[];
  readonly cautionTags: readonly string[];
}

interface StudyTopicDefinition {
  readonly id: StudyTopicId;
  readonly titleKo: string;
  readonly conceptKeys: readonly string[];
}

interface ScienceCatalog {
  readonly contentVersion: string;
  readonly elements: readonly ElementRecord[];
  readonly elementById: Readonly<Record<ElementId, ElementRecord>>;
  readonly studyTopics: readonly StudyTopicDefinition[];
  readonly teachingTagRegistry: readonly string[];
}

interface DailyClassState {
  readonly selectedTopicId: StudyTopicId | null;
  readonly morningCompleted: boolean;
  readonly afternoonCompleted: boolean;
}

interface Slice12CalendarState {
  readonly day: number; // 1..30
  readonly phase: Phase;
  readonly freeActions: {
    readonly lunchUsed: boolean;
    readonly afterSchoolUsed: boolean;
  };
  readonly dailyClass: DailyClassState;
}

interface Slice12AcademicState {
  readonly topicProgressById: Readonly<Record<StudyTopicId, Mastery>>;
  readonly topicLastProgressSourceById: Readonly<
    Partial<Record<StudyTopicId, 'classIntro' | 'selfStudy' | 'studyTogether'>>
  >;
}

type PeriodicTableContext =
  | { readonly kind: 'general'; readonly source: 'menu' | 'study' | 'mission' | 'dialogue' }
  | { readonly kind: 'exam'; readonly examDay: ExamDay; readonly questionId: string };

interface PeriodicTableCapabilities {
  readonly viewLayout: true;
  readonly viewElementDetail: true;
  readonly searchIdentity: boolean;
  readonly filterGroupPeriod: boolean;
  readonly compareTwo: boolean;
  readonly compareCompound: boolean;
  readonly missionHint: boolean;
  readonly dialogueInsight: boolean;
  readonly basicErrorDiagnosis: boolean;
  readonly advancedErrorExplanation: boolean;
}

type ContentLoadIssueCode =
  | 'resource-unavailable'
  | 'parse-failed'
  | 'schema-invalid'
  | 'invariant-violated'
  | 'duplicate-id'
  | 'unknown-reference'
  | 'version-incompatible';

type ScienceCatalogLoadResult =
  | { readonly ok: true; readonly catalog: ScienceCatalog }
  | {
      readonly ok: false;
      readonly fatal: true;
      readonly issues: readonly {
        readonly code: ContentLoadIssueCode;
        readonly resource: string;
        readonly path?: string;
      }[];
    };
```

위 `selectedTopicId` 포함 `DailyClassState`는 결정 043에 따라 **Slice 2 전용**이다. Slice 1은 topic 없이 완료 불리언 두 개만 가지며 Day 시작은 `false/false`다. Slice 2 Day 시작에서만 `null/false/false`, 시험 합격 체크포인트에서 선택 주제와 `true/true`를 요구한다.

## 4. Public Selectors / Commands

UI는 상태 필드를 직접 조합해 규칙을 재구현하지 않는다. selector는 순수 읽기이며 command만 상태를 변경한다. 모든 command는 같은 입력에 같은 결과를 내고 실패 시 원본 상태를 그대로 반환한다.

### 4.1 Selectors

| 공개 selector | 입력 | 출력·보장 |
|---|---|---|
| `selectDayLabel` | GameState | `DAY NN / 30` |
| `selectCurrentPhase` | GameState | 현재 `Phase` |
| `selectIsExamDay` | GameState | Day가 10·20·30인지 여부. terminal 미래 시험은 false 취급 가능 |
| `selectFreeActionStatus` | GameState, `FreeTimePhase` | `available`, `used`, `wrong-phase`, `blocked-by-exam`, `terminal` 중 하나 |
| `selectAllowedCommands` | GameState | 현재 phase에서 호출 가능한 command ID와 불가 사유 |
| `selectStudyTopicSummaries` | GameState, ScienceCatalog | 7개 주제의 현재 단계, 다음 단계, 상승 가능한 출처 |
| `selectStudyOutcomePreview` | GameState, topic, mode | 예상 단계, 슬롯 비용, 실행 가능 여부와 이유. 호감도 결과는 포함하지 않음 |
| `selectPeriodicTableCapabilities` | GameState, context | 2.8절의 capability 고정 결과 |
| `selectPeriodicTableCells` | ScienceCatalog | 원자번호순 20개와 실제 족·주기 좌표 |
| `selectElementDetail` | ScienceCatalog, ElementId | 정본 상세 또는 명시적 `not-found`; 추정값 없음 |
| `selectSearchResults` | catalog, query, capabilities | 일반 검색 허용 때만 이름·기호·번호 결과; 시험에서는 `capability-disabled` |
| `selectComparison` | catalog, ids, capabilities | 허용된 2개/복합 비교의 정본 필드; 비허용 시 값 대신 사유 |

Selector는 배열 순서·UI 표시 상태·DOM을 규칙 근거로 사용하지 않는다. 오류를 빈 정상 결과로 숨기지 않는다.

### 4.2 Commands

| 공개 command | 필수 입력 | 성공 효과 | 주요 거부 조건 |
|---|---|---|---|
| `completeMorningHomeroom` | `effectId` | `morningClass`로 전이 | 잘못된 phase, 중복 effect |
| `completeMorningClass` | `topicId`, `effectId` | 당일 주제 선택·오전 완료, `lunchFreeTime` 전이 | 미등록 주제, 이미 선택, 잘못된 phase |
| `performStudy` | `topicId`, `mode`, 선택적 `partnerId`, `effectId` | 현재 자유 슬롯 1개 소비, 최대 한 단계 상승 | 자유시간 아님, 슬롯 사용됨, 단계 3, 함께 공부 partner 누락 |
| `performFreeAction` | 검증된 `actionId`, `effectId` | 액션 정본 효과와 슬롯을 원자 적용 | 미등록·조건 불충족·중복·잘못된 phase |
| `passFreeTime` | `effectId` | 현재 슬롯만 사용 완료 | 자유시간 아님, 슬롯 사용됨 |
| `completeAfternoonClass` | `effectId` | 오전 선택 주제의 무료 `0→1` 또는 복습 결과 적용; 일반일은 방과 후, 시험일은 시험으로 전이 | 오전 미완료·주제 없음·잘못된 phase |
| `applyExamResolution` | `examDay`, `score`, 후속 시험 결과 참조, `effectId` | `<50` terminal, `>=50` 방과 후 연동 경계 | 문제은행·채점기가 아닌 UI가 임의 점수 전달, Day 불일치, 재제출 |
| `endDay` | `effectId` | Day 1~29는 다음 Day 시작; Day 30은 승인된 terminal 흐름에 위임 | 슬롯/필수 phase 미완료, 시험 미완료, Day 31 시도 |

논리 결과 형식:

```ts
type CommandResult<S> =
  | {
      readonly ok: true;
      readonly state: S;
      readonly appliedEffectId: string;
      readonly events: readonly DomainEvent[];
    }
  | {
      readonly ok: false;
      readonly state: S; // 입력과 동일
      readonly reason:
        | 'wrong-phase'
        | 'slot-used'
        | 'unknown-id'
        | 'prerequisite-not-met'
        | 'already-applied'
        | 'mastery-maxed'
        | 'exam-required'
        | 'terminal-state'
        | 'invariant-failed';
    };
```

위 표의 public `applyExamResolution(examDay, score, ...)` 제안은 결정 044로 **SUPERSEDED**다. production public command·registry·type에는 raw score가 없으며, 후속 시험 subsystem의 검증 결과는 1.1절의 internal 경계만 사용한다.

## 5. 타 담당 충돌

| 담당 | 충돌·경계 | 2차 설계 처리 |
|---|---|---|
| State/Save | 기존 `CalendarState`에는 오전에 선택한 수업 주제를 오후까지 보존할 명시 필드가 없음 | `dailyClass` 추가를 상태 계약 변경 후보로 제시. State가 정확한 저장 위치·스키마 버전을 소유하며 Systems가 별도 상태를 만들지 않음 |
| State/Save | `topicLastProgressSourceById`만으로 무료 수업의 오전·오후 완료를 증명할 수 없음 | 상승 결과와 당일 수업 진행을 분리. 전자는 Academic, 후자는 Calendar/runtime 소유 |
| State/Save | `applyExamResolution`과 `examResolved` 커밋은 State 소유 원자 저장과 겹침 | Systems는 사전 조건·후속 phase만 정의하고 저장 커밋 구현은 State 소유 |
| Frontend | UI 제안은 일반 검색을 기본 제공하고 시험에서는 금지함 | capability selector 하나를 정본으로 두어 화면별 하드코딩을 금지. UI는 disabled 사유와 포커스 복귀를 표현 |
| Frontend | UI가 단계별 도구를 직접 계산할 위험 | 현재 숙련도 원시값과 별도로 `selectPeriodicTableCapabilities`를 제공 |
| Narrative | 대화 단서·미션 힌트의 문구와 공개 수준은 Narrative 소유 | Systems는 `topicId`, 최소 단계, 비정답형 여부만 판정하고 문구·정답을 생성하지 않음 |
| Narrative | 함께 공부의 장면·호감도 효과는 Slice 3 이후 관계 계약과 결합 | Slice 2는 과학 단계와 슬롯 소비만 정의. 장면·호감도는 같은 효과 트랜잭션의 후속 확장점이며 임시 수치를 넣지 않음 |
| QA | QA 문서의 Slice 1~2는 구현 증거가 없어 `NOT TESTED` | 본 문서는 테스트 가능한 ID와 예상값만 제공하며 PASS를 주장하지 않음 |
| Asset Integration | 자산 loader 실패와 과학 콘텐츠 loader 실패가 혼동될 수 있음 | 과학 필수 bundle 실패는 fatal, 이미지 실패는 승인 플레이스홀더로 복구. 같은 fallback 정책을 사용하지 않음 |

`dailyClass` 추가와 public API 확정은 잠금 변경이 아니라 역할 간 계약 갱신이다. PM이 승인하면 `docs/05`, `docs/06`, UI 소비 계약을 같은 변경에서 정렬해야 한다.

## 6. 타협

1. **핵심 사실 전체 공개:** 성장감을 사실 잠금이 아니라 활용 capability에 둔다. 점진 공개의 연출은 약해지지만 필수 과학 정보 소프트락과 미션 교착을 막는다.
2. **필수 bundle fail-closed:** 과학 일부만 없어도 게임 진행을 막는다. 가용성은 낮아지지만 잘못된 사실·부분 정본으로 저장을 오염시키지 않는다.
3. **무료 수업 상승을 오후에 적용:** 오전 직후 즉시 보상보다 피드백이 늦다. 대신 오전 선택과 오후 복습이라는 승인 계약을 실제 전이로 보장한다.
4. **단계 3 공부 기본 차단:** 이미 숙달한 주제의 무보상 슬롯 낭비를 막는다. 서사상 다시 공부해야 하면 Narrative가 별도 행동 ID와 명시적 결과를 제안해야 한다.
5. **`passFreeTime` 제공:** 선택 압박을 유지하면서 콘텐츠 부족·조건 불충족에 따른 소프트락을 막는다. 사용한 슬롯은 복구되지 않고 아무 보상도 없다.
6. **시험 capability 별도 고정:** 일반 capability를 재사용해 일부만 숨기는 대신 시험 전용 allow-list를 쓴다. 중복처럼 보이지만 금지 기능 누출 위험을 줄인다.

## 7. 미정

- 정본의 실제 파일 형식과 경로(JSON 또는 TypeScript 데이터 모듈). 단일 런타임 정본 원칙은 확정 유지.
- `teachingTags` 전체 승인 사전과 각 원소의 선택 태그. 표의 필수 `cautionTags`만 본 설계에서 확정 제안.
- 30일별 무료 수업 주제 선택 제한 또는 권장표. 현재 설계는 매일 7주제 중 하나를 선택 가능하다고 가정.
- 함께 공부 가능 캐릭터·장면·호감도 효과·선행 조건.
- 일반 플레이에서 기초 검색을 항상 제공할지에 대한 최종 PM 승인 상태. 기존 UI 제안과 본 설계는 항상 제공을 권고하되 `docs/05`의 승인 상태 표에는 아직 명시적 승인으로 분류되지 않음.
- `passFreeTime`의 사용자 표시명과 확인 UX. 시스템 효과는 본 제안대로 무보상 슬롯 소비.
- `dailyClass`의 GameState 정확한 위치와 schemaVersion 반영 여부.
- loader 재시도 횟수·진단 로깅 형식·사용자 오류 문구.
- 목표 브라우저 최소 버전과 성능 예산.

시험 문제은행·루트·미션 상세는 미정 목록이 아니라 명시적 범위 밖이다.

## 8. QA 사전 리스크

| 위험 | 심각도 | 사전 차단 조건 |
|---|---|---|
| 과학값이 UI·문항·서사에 복제됨 | High | 소비 데이터에서 독립 과학 필드 발견 |
| loader가 19개 원소·부분 성공을 정상 처리 | Critical | 전체 검증 전 catalog 또는 GameState 공개 |
| He 원자가전자를 8로 일반화 | High | 정확한 수용표 불일치 |
| H를 알칼리 금속과 동일시 | High | 필수 주의 태그·문구 가드 누락 |
| 오전 수업만 마치고 무료 `0→1` 획득 | High | 오후 완료 전 숙련도 변경 |
| 무료 수업·미션으로 `1→2` 또는 `2→3` | Critical | 상승 출처 불변식 위반 |
| 한 공부 행동이 두 단계 이상 상승 | High | `0→2`, `1→3` 발생 |
| 숙련도 3 행동이 무고지로 슬롯만 소비 | Medium | 실행 전 차단·비용 고지 없음 |
| 일반 capability가 시험 오버레이에 누출 | Critical | 검색·필터·비교·힌트·진단 중 하나라도 활성 |
| 시험 도구 왕복으로 답안·문항 위치 유실 | Critical | 문맥 보존 실패 또는 새 체크포인트 생성 |
| 숙련도가 점수·정답에 영향 | Critical | 채점식 또는 선택지에 mastery 보정 존재 |
| 시험일 방과 후가 합격 전에 열림 | Critical | `exam` 미완료에서 방과 후 command 허용 |
| `passFreeTime`이 슬롯을 쓰지 않거나 보상을 줌 | High | 하루 2행동 상한 우회 또는 파밍 가능 |
| command 실패가 부분 상태를 남김 | Critical | 슬롯만 소비되거나 숙련도만 상승하는 부분 적용 |
| Day 30 뒤 Day 31 생성 | Critical | calendar 범위 위반 |
| 과학 loader 실패가 저장 초기화로 이어짐 | Critical | 기존 저장 삭제·덮어쓰기 |
| 자산 fallback을 과학값 fallback에 오용 | High | 플레이스홀더 과학 사실 표시 |

QA는 정적 데이터 검증과 command 단위 검증을 먼저 통과시킨 뒤 UI 통합을 검토해야 한다. 본 문서만으로 G1 또는 Slice 1~2를 PASS 처리하지 않는다.

## 9. 수용 테스트

### 9.1 과학 정본·loader

| ID | 준비·행동 | 기대 결과 |
|---|---|---|
| `V2-SCI-01` | 수용표 전체를 로드 | 정확히 20개, 번호 1~20 각 1회 |
| `V2-SCI-02` | 모든 원소의 껍질 합·배열 길이 검사 | 합=원자번호, 길이=주기 |
| `V2-SCI-03` | H, He, Ne, Ar, K, Ca 검사 | 표의 값과 주의 태그가 정확함 |
| `V2-SCI-04` | He `valenceElectrons=8` 변조 | `invariant-violated`, catalog 미공개 |
| `V2-SCI-05` | 원소 하나 삭제 | bundle fatal, 19개 부분 표 미표시 |
| `V2-SCI-06` | 번호·기호·ID 중복 | `duplicate-id` 또는 invariant 실패 |
| `V2-SCI-07` | 미등록 태그 참조 | `unknown-reference`, catalog 미공개 |
| `V2-SCI-08` | 필수 리소스 경로 실패 | `resource-unavailable`, 새 게임·로드 비활성, 저장 불변 |
| `V2-SCI-09` | 정상 재시도 | 하나의 완전한 catalog만 공개, 실패 중 GameState 미생성 |
| `V2-SCI-10` | 소비 fixture 검사 | 과학값 복제 없이 `elementId`·질의만 존재 |

### 9.2 학습

| ID | 준비·행동 | 기대 결과 |
|---|---|---|
| `V2-LRN-01` | 주제 0, 오전 수업 완료 | 여전히 0, 선택 주제만 당일 상태에 기록 |
| `V2-LRN-02` | 위 상태에서 오후 수업 완료 | 1, 출처 `classIntro`, 슬롯 소비 없음 |
| `V2-LRN-03` | 주제 1, 무료 수업 하루 완료 | 1 유지, 복습·진단 결과만 발생 |
| `V2-LRN-04` | 주제 0, 자유시간 혼자 공부 | 슬롯 1개 소비, 1 |
| `V2-LRN-05` | 주제 1, 함께 공부 | 슬롯 1개 소비, 2, 출처 `studyTogether` |
| `V2-LRN-06` | 주제 2, 혼자 공부 | 슬롯 1개 소비, 3 |
| `V2-LRN-07` | 주제 3, 일반 공부 요청 | 실행 전 `mastery-maxed`, 슬롯 불변 |
| `V2-LRN-08` | 미션 보상에 숙련도 상승 요청 | 거부 또는 데이터 검증 실패, 단계 불변 |
| `V2-LRN-09` | 한 행동에서 0→2 효과 요청 | 전체 거부, 슬롯·단계 모두 불변 |
| `V2-LRN-10` | 일곱 주제 ID 검사 | 정확한 7개 집합, 누락·추가·중복 없음 |

### 9.3 주기율표 capability

| ID | 준비·행동 | 기대 결과 |
|---|---|---|
| `V2-PT-01` | 모든 숙련도 0, 일반 상세 열기 | 20개 핵심 사실 조회, 비용 0 |
| `V2-PT-02` | `topic-group-period=0/1` | 필터 false/true |
| `V2-PT-03` | `topic-comparison=1/2/3` | 두 원소 비교 false/true/true, 복합 비교 false/false/true |
| `V2-PT-04` | 관련 주제 1/2의 미션 힌트 | false/true, 정답 자동 노출 없음 |
| `V2-PT-05` | 시험 중 숙련도 전부 3 | 검색·필터·비교·힌트·진단 모두 false |
| `V2-PT-06` | 시험 중 원소 상세 | 승인된 기본 사실만 표시 |
| `V2-PT-07` | 시험 오버레이 열기·닫기 | 답안·문항·선택지 순서·현재 위치·호출 포커스 유지, 비용 0 |
| `V2-PT-08` | 주기율표 조회 전후 상태 비교 | GameState 동일 |

### 9.4 Day·phase·명령

| ID | 준비·행동 | 기대 결과 |
|---|---|---|
| `V2-DAY-01` | 일반일 전체 진행 | 잠금 순서 그대로 전이 |
| `V2-DAY-02` | 시험일 오후 수업 완료 | 방과 후가 아니라 `exam` 진입 |
| `V2-DAY-03` | 시험 미완료 상태에서 방과 후·Day 종료 요청 | 거부, 상태 불변 |
| `V2-DAY-04` | 시험 결과 49 | 즉시 terminal/expelled 연동 |
| `V2-DAY-05` | 시험 결과 50·100 | 같은 Day 방과 후 연동 |
| `V2-DAY-06` | 점심 공부 후 추가 행동 | `slot-used`, 첫 결과만 유지 |
| `V2-DAY-07` | 점심 `passFreeTime` | 점심 슬롯 사용, 다른 효과 없음 |
| `V2-DAY-08` | 잘못된 phase에서 공부 | `wrong-phase`, 상태 불변 |
| `V2-DAY-09` | 같은 `effectId` 재호출 | 중복 효과·슬롯 소비 없음 |
| `V2-DAY-10` | 후보 상태 불변식 실패 주입 | command 전체 롤백 |
| `V2-DAY-11` | Day 29 종료 | Day 30 아침 시작 |
| `V2-DAY-12` | Day 30 종료 흐름 | Day 31 없이 terminal 위임 |
| `V2-DAY-13` | terminal 상태에서 모든 진행 command | `terminal-state`, 상태 불변 |

### 9.5 교차 계약

| ID | 준비·행동 | 기대 결과 |
|---|---|---|
| `V2-X-01` | UI가 capability selector 없이 시험 필터 요청 | command/selector 계층에서 차단 |
| `V2-X-02` | Day 시작 상태 생성 | `dailyClass=null/false/false`, 두 슬롯 미사용 |
| `V2-X-03` | 시험 합격 체크포인트 후보 | 당일 수업 완료, 점심 사용, 방과 후 미사용 |
| `V2-X-04` | 다음 Day 생성 | `dailyClass`와 두 슬롯 초기화, 학업 숙련도 유지 |
| `V2-X-05` | loader 실패 중 기존 저장 존재 | 저장 원문·revision 불변, 로드 시도는 오류 안내 |

## 10. Change Request 후보

현재 Slice 1~2를 설계대로 진행하기 위해 **잠금 규칙을 바꾸는 즉시 Change Request는 없다.** 아래 요구가 추후 제기되면 일반 구현 결정으로 흡수하지 말고 Change Request 후보로 올린다.

| 후보 | 변경 내용 | 영향받는 잠금·승인 계약 | 권고 |
|---|---|---|---|
| `CR-V2-01` | 과학 정본 일부 실패 상태에서도 추정·대체 데이터로 플레이 허용 | 과학 단일 정본·정확성, 저장 결정성 | 비권고. fail-closed 유지 |
| `CR-V2-02` | 무료 수업 또는 미션 보상으로 숙련도 2·3 지급 | 결정 016, 행동 압박, 시험 공부 예산 | 비권고 |
| `CR-V2-03` | 숙련도에 시험 점수 보너스·자동 정답 부여 | 결정 016, 시험 비보정 | 비권고 |
| `CR-V2-04` | 시험 중 검색·필터·비교·힌트·진단 허용 | 결정 021의 명시적 allow-list | 사용자 재승인 전 차단 |
| `CR-V2-05` | 점심·방과 후 슬롯 수 또는 시험일 순서 변경 | 결정 004·005 및 잠금 일과 | 사용자 영향 검토 후 별도 승인 필요 |
| `CR-V2-06` | 원소 20 밖 또는 고급 화학을 필수 학습·평가에 추가 | 잠금 교육 범위 | 비권고, 사용자 승인 필요 |

다음은 Change Request가 아니라 PM 계약 갱신 후보 항목이다.

- `CalendarState` 또는 동등한 런타임 상태에 `dailyClass` 추가
- 일반 검색 기본 제공의 승인 상태 명문화
- `passFreeTime` command와 무보상 슬롯 소비 규칙 승인
- 본 문서의 selector·command 이름을 역할 간 공개 계약으로 채택

이 네 항목은 승인 시 `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, Frontend 소비 계약, QA 테스트 계획을 함께 갱신해야 하며, 그 전에는 코드 구현 승인을 뜻하지 않는다.
