# 결정 기록

이 문서는 PM 수준의 승인된 구현 결정과 프로젝트 관리 결정을 기록한다. `PROPOSAL`, `OPEN QUESTION`, `DEFERRED` 상태는 승인된 제품 결정이 아니며, 잠금 제품 규칙은 사용자 승인 없이 변경하지 않는다.

## 2026-09-03 / 001

- **쟁점:** PM 초기 문서 작업의 기준일과 현재 단계
- **검토한 선택지:** 즉시 구현 시작 / 역할별 제안과 계약 검토부터 시작
- **결정:** 2026-09-03에 PM 초기화를 기록하고, 현재 단계를 문서·제안 단계로 둔다. 아직 Ready to Code로 판정하지 않는다.
- **이유:** 마스터 규격은 계약 안정화, PM 승인, 고위험 항목 QA 사전 검토 후 구현하도록 요구한다.
- **영향 파일:** `README.md`, `docs/10_DECISION_LOG.md`, `agents/*/BRIEF.md`

## 2026-09-03 / 002

- **쟁점:** 프론트엔드 기술 스택
- **검토한 선택지:** 특정 프레임워크·번들러 즉시 확정 / Frontend UI/UX 제안과 타 역할 제약 검토 후 확정
- **결정:** 프론트엔드 프레임워크, 번들러, 테스트 도구 및 구체적인 코드 구조는 **제안 검토 전까지 미정**으로 유지한다.
- **이유:** 기술 선택은 PM 권한 범위지만 GitHub Pages, 데이터, 상태·저장, QA 요구를 함께 검토해야 하며 현재는 제안 전 단계다.
- **영향 파일:** `README.md`, `docs/10_DECISION_LOG.md`, `agents/frontend-uiux/BRIEF.md`, `agents/state-save/BRIEF.md`, `agents/qa/BRIEF.md`
- **후속 상태:** 제안 검토가 완료되어 2026-09-03 / 010 결정으로 대체됐다.

## 2026-09-03 / 003

- **쟁점:** PM 마스터 사본의 기준 위치
- **검토한 선택지:** 별도 사본 추가 / 저장소 내 지정 문서를 단일 기준 사본으로 사용
- **결정:** 저장소 내 PM 마스터 사본의 기준 위치를 `docs/00_PM_MASTER_SPEC.md`로 기록한다.
- **이유:** 역할별 문서가 동일한 제품 기준을 참조하고 사본 불일치를 피하기 위해서다.
- **영향 파일:** `README.md`, `docs/10_DECISION_LOG.md`, `agents/*/BRIEF.md`

## 초기화 시점 미결정 원칙

- 이 초기화 기록은 액션 비용, 호감도 증감량, 세부 루트, 세부 화면, 저장 스키마, 자산 크기 또는 캐릭터 비주얼을 확정하지 않는다.
- 이후 결정은 날짜와 순번, 쟁점, 검토한 선택지, 결정, 이유, 영향 파일을 갖춰 추가한다.
- 잠금 규칙 변경은 사용자 승인 사실과 QA 위험 검토를 함께 기록해야 한다.

## 2026-09-03 / 004

- **현재 상태:** `PARTIALLY SUPERSEDED` (2026-09-03 / 017을 거쳐 / 020으로 최종 대체). 시험일 phase와 Character End 없이 도달한 Day 30의 방과 후·`dayEnd`, Day 31 없음은 유지하며 `endingResolution`의 학기말 Character End 판정은 폐기됐다.
- **쟁점:** Day 10·20·30의 시험 위치와 Day 30 종료 순서
- **검토한 선택지:** 아침 조회 직후 시험 후 점심 진행 / 오후 수업 뒤 시험 후 합격자만 방과 후 진행 / Day 30 시험 직후 결말 직행
- **결정:** 세 시험일 모두 `morningHomeroom → morningClass → lunchFreeTime → afternoonClass → exam → (50 미만 terminal / 50 이상 afterSchoolFreeTime) → dayEnd` 순서로 진행한다. Day 30은 합격 후 방과 후와 `dayEnd`를 거친 뒤 `endingResolution`으로 가며 Day 31은 만들지 않는다.
- **이유:** 일반 일과의 학습·점심 기회를 보존하면서 시험 실패 즉시 종료를 보장하고, Day 30 마지막 방과 후 결과를 결말 자격에 포함하기 위해서다.
- **영향 파일:** `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/narrative/PROPOSAL.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 005

- **쟁점:** 30일 자유 행동의 슬롯 수와 시험일 방과 후 제공 조건
- **검토한 선택지:** 가변 행동 포인트 / 점심·방과 후 각 1회 / 시험일 자유 행동 축소
- **결정:** Day 1~30에 점심 1행동과 방과 후 1행동을 제공해 회차 최대를 60으로 한다. 시험일 방과 후는 50점 이상 합격한 경우에만 제공한다.
- **이유:** 하루에 모든 활동을 할 수 없다는 자원 압박을 단순하고 검증 가능하게 유지하면서 시험 합격 이후의 학교생활 흐름을 보존한다.
- **영향 파일:** `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/narrative/PROPOSAL.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 006

- **쟁점:** 미션 진행 상태의 역할 간 불일치 가능성
- **검토한 선택지:** 5상태 축약 / 보고 가능·만료를 포함한 7상태 / 역할별 별도 상태
- **결정:** 미션 상태를 `locked`, `available`, `active`, `readyToTurnIn`, `completed`, `failed`, `expired` 일곱 개로 통일한다.
- **이유:** 목표 달성과 보고 완료를 분리하고 실패와 기한 만료를 구분해야 미션 보상·복원·UI가 같은 의미를 유지할 수 있다.
- **영향 파일:** `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 007

- **쟁점:** 잠금 규칙에 없는 호감도 상·하한과 UI 최대 게이지
- **검토한 선택지:** `-100~100` clamp / 범위 밖 저장 거부 / 게임플레이 제한 없이 JavaScript 안전 정수만 검증
- **결정:** 호감도에는 게임플레이 cap·clamp를 두지 않고 JavaScript 안전 정수만 허용한다. 안전 정수를 벗어나는 연산은 상태 변경 없이 거부하며 UI는 유한 최대 게이지를 전제하지 않는다.
- **이유:** 잠금 문서가 정하지 않은 상·하한을 새 규칙으로 만들지 않으면서 비정상 수치와 저장 손상은 명확히 차단하기 위해서다.
- **영향 파일:** `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 008

- **쟁점:** Day 기반 저장과 시험 제출 결과의 재응시 방지 경계
- **검토한 선택지:** Day 시작만 저장 / 모든 중간 phase 저장 / Day 시작 기본 저장과 시험 결과 전용 강제 체크포인트
- **결정:** 사용자 관점의 기본 저장은 Day 시작 스냅샷으로 한다. 제출 전 종료는 해당 Day 시작과 같은 고정 문항·순서로 복원한다. 합격 제출은 세 시험일 모두 같은 Day `afterSchoolFreeTime`의 시스템 강제 `examResolved`로 즉시 원자 커밋하고, 실패 제출은 terminal로 즉시 원자 커밋한다. `examResolved`는 사용자 임의 장면 저장 슬롯이 아니다.
- **이유:** 장면별 자유 저장으로 확대하지 않으면서 제출 결과 롤백·재응시·필수 시험 우회를 막고 승인된 시험일 순서를 그대로 복원하기 위해서다.
- **영향 파일:** `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/narrative/PROPOSAL.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 009

- **현재 상태:** `SUPERSEDED` (2026-09-03 / 017을 거쳐 / 020으로 최종 대체). Day 30 전용 판정은 폐기됐고, 복수 후보 선택·자격 후 숨은 실패 없음은 / 020의 즉시 Character End 문맥으로 대체됐다.

- **쟁점:** Day 30에 복수 캐릭터 엔딩 자격이 생긴 경우의 결정 방식과 최종 장면 실패 여부
- **검토한 선택지:** 최고 호감도 자동 선택 / 먼저 완료한 루트 자동 선택 / 자격 후보 중 플레이어 선택
- **결정:** Day 30 `dayEnd` 뒤 자격 후보를 계산하고 후보만 보여 플레이어가 한 명을 선택한다. 자격을 얻은 뒤의 최종 장면에는 결과를 뒤집는 숨은 실패를 두지 않는다.
- **이유:** 비공개 우선순위로 원치 않는 엔딩이 선택되는 문제를 피하고, 이미 검증한 자격과 최종 결과 사이의 예측 가능성을 보장하기 위해서다.
- **영향 파일:** `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/narrative/PROPOSAL.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 010

- **쟁점:** GitHub Pages용 프런트엔드 및 테스트 기술 스택과 V1 화면 전환 방식
- **검토한 선택지:** Vanilla TypeScript / Preact / React, URL history 라우터 / 해시 라우터 / 무라우터 앱 상태 전환
- **결정:** React + TypeScript + Vite + CSS Modules를 사용하고 Vitest·React Testing Library, Playwright, axe를 테스트 도구로 사용한다. V1은 URL 라우터 없이 앱 상태로 화면을 전환한다.
- **이유:** 데이터 중심 화면과 접근성 테스트 생태계를 확보하면서 GitHub Pages history 폴백과 URL 직접 진입에 의한 상태 가드 우회 위험을 줄이기 위해서다.
- **영향 파일:** `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/07_UI_UX_SPEC.md`, `docs/11_OPEN_QUESTIONS.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 011

- **현재 상태:** `PARTIALLY SUPERSEDED` (2026-09-03 / 018을 거쳐 / 021로 최종 대체). 10문항×10점과 `49/50/100` 테스트는 유지하며 시험 중 주기율표 비허용은 제한된 기본 조회 허용으로 대체됐다.

- **쟁점:** 시험 문항 수·배점, 시험 중 학습 도구 허용, 경계 판정 검증
- **검토한 선택지:** 가변 문항·혼합 배점 / 고정 10문항·각 10점, 시험 중 주기율표 허용 / 비허용
- **결정:** 각 시험은 고정 10문항, 문항당 10점으로 구성하고 시험 중 주기율표 조회를 금지한다. 실제 생성 점수와 별개로 합격 판정 함수는 임의 점수 49·50·100을 각각 별도 테스트한다.
- **이유:** 100점 체계와 고정 복원을 단순화하고, 10점 단위 문항에서 직접 생성되지 않는 49점도 잠금 경계로 독립 검증하기 위해서다.
- **영향 파일:** `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 012

- **쟁점:** 새 회차의 시작 재화와 공부 숙련도 범위
- **검토한 선택지:** 재화 미사용 / 시작 재화 가변 / 시작 재화 3,000, 불리언 학습 / 다단계 숙련도
- **결정:** 새 회차 시작 재화는 3,000이며 각 공부 주제 숙련도는 정수 0~3으로 시작값은 0이다.
- **이유:** 버튼형 매점의 초기 구매 선택과 학습 진행을 단순하고 검증 가능한 수치로 제공하기 위해서다.
- **영향 파일:** `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`

## 2026-09-03 / 013

- **쟁점:** 일곱 집중 루트의 수치 도달성 및 Ne 일반 파밍 우회 방지 증명
- **검토한 선택지:** 최종 대본까지 수치 유예 / 대표 루트만 검증 / 일곱 루트의 제안 단계 정적 예산 계약
- **결정:** 상세 대본은 유예하되 일곱 루트 모두 시작 호감도 10에서 80 이상, 필수 이벤트·미션, 시험 공부 행동을 포함한 집중 경로를 제시하고 각 총 자유 행동을 42 이하로 제한한다. Ne는 일반 대화·선물 최대 보상과 특수 필수 체인 포함 합계를 분리 검증한다. 개별 양수 델타는 `+1`, `+3`, `+5`, `+8`만 사용한다.
- **이유:** 콘텐츠를 조기에 확정하지 않고도 60행동 안의 엔딩 도달성, 복구 여유, Ne의 고난도와 가능성을 구현 전에 정적으로 차단·검증하기 위해서다.
- **영향 파일:** `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `agents/narrative/PROPOSAL.md`, `agents/science-game-systems/PROPOSAL.md`

## 2026-09-03 / 014

- **현재 상태:** `PARTIALLY SUPERSEDED` (2026-09-03 / 017, 018을 거쳐 / 020, 021로 최종 대체). Day 30 캐릭터 엔딩 시점 정렬은 즉시 Character End로, 시험 중 주기율표 비허용 정렬은 제한된 기본 조회 허용으로 대체됐다. 나머지 조정은 유지한다.

- **쟁점:** QA-001~006에 대한 PM 계약 조정 완료 범위와 구현 승인 상태
- **검토한 선택지:** 계약 조정과 동시에 전체 구현 승인 / 상세 콘텐츠까지 확정 / 승인 구현 계약만 정렬하고 상세 콘텐츠·코드는 후속 게이트로 유지
- **결정:** 004~013의 승인 구현 결정을 Narrative, Systems, State/Save, UI/UX 계약과 각 담당 제안서에 동일하게 반영한다. 이로써 QA-001~006의 문서상 원인인 시험일·Day 30 순서, 루트 수치 도달성, 호감도 범위, 미션 상태, 시험 저장 경계를 해소한다. 상세 대사·최종 미션·문항·아이템·개별 보상 배치는 `PROPOSAL` 또는 `DEFERRED`로 유지하며, 본 조정만으로 코드 구현이나 전체 Ready to Code를 승인하지 않는다.
- **이유:** 잠금 규칙을 변경하지 않고 교차 역할 계약을 하나로 만들되, 아직 작성되지 않은 상세 콘텐츠와 런타임 검증을 승인된 것으로 오인하지 않게 하기 위해서다.
- **영향 파일:** `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `agents/narrative/PROPOSAL.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/state-save/PROPOSAL.md`, `agents/frontend-uiux/PROPOSAL.md`, `docs/10_DECISION_LOG.md`
- **QA 상태:** QA-001~006의 계약상 차단 원인은 PM 문서에서 해소됐다. QA 소유 보고서의 공식 상태 변경과 Ready to Code 판정은 수정 문서 재검토 후 별도로 수행한다.

## 2026-09-03 / 015

- **쟁점:** OQ-001 주인공 성별 모순
- **사용자 지시:** 주인공을 남성으로 확정하고 이름은 사용자 입력으로 유지한다. 캐릭터 비주얼은 계속 유예하며 주인공 외형을 발명하지 않는다.
- **PM 제안:** 없음. 사용자 결정을 상태·서사·UI 계약에 일관되게 반영한다.
- **결정:** `OQ-001`을 `RESOLVED`로 분리한다. `player.gender`는 선택·대기 구조가 아닌 고정값 `male`로 단순화하고 성별 선택 UI를 두지 않는다.
- **철회 사유:** 마스터가 `pending/configurable`을 요구한 이유는 상충한 기존 진술을 사용자 승인 없이 해소하지 않기 위해서였다. 사용자가 남성을 명시적으로 선택해 그 보류 사유가 해소됐다.
- **영향 파일:** `docs/01_LOCKED_GAME_RULES.md`, `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `docs/10_DECISION_LOG.md`, `docs/11_OPEN_QUESTIONS.md`, 네 담당 `PROPOSAL.md`

## 2026-09-03 / 016

- **쟁점:** GS-REV-01 무료 수업과 행동 슬롯 학습의 역할
- **사용자 지시:** 숙련도 `0~3`은 유지하되 무료 수업은 `0→1`만 허용하고, `2·3`은 점심·방과 후 행동 슬롯을 쓰는 혼자·함께 공부로만 획득한다. 숙련도별 실질 이점을 명시하고 시험 자동 보정·자동 정답을 금지하며 1~20 핵심 사실의 기본 조회와 기존 시험 공부 행동 예산을 보존한다.
- **PM 제안:** UI와 State는 `획득 출처`, 현재 단계, 다음 단계에 필요한 행동 슬롯을 같은 계약으로 표시·검증한다.
- **결정:** 사용자 지시를 승인 계약으로 반영한다. 미션 학습 보상과 무료 수업은 숙련도 `2·3`을 지급하지 않으며 기존 루트 예산의 시험 공부 9행동을 대체하지 못한다.
- **이유:** 무료 수업만으로 7주제 전체를 완성하는 것을 막고, 시간 관리와 학습 선택의 실제 비용을 유지하면서 필수 사실 접근은 공정하게 보장하기 위해서다.
- **영향 파일:** `docs/01_LOCKED_GAME_RULES.md`, `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, 네 담당 `PROPOSAL.md`

## 2026-09-03 / 017

- **현재 상태:** `SUPERSEDED` (2026-09-03 / 020). OQ-002의 질문 등록과 임시 구현 차단은 사용자 확정으로 종료됐다.

- **쟁점:** GS-REV-02 캐릭터 엔드 판정 시점
- **사용자 지시:** 기존 Day 30 전용 승인을 철회하고 `OQ-002`로 등록한다. 선택지는 `30일 이내 조건 충족 즉시`와 `Day 30 시험 통과 후 학기말 판정`이며 사용자 답변 전 트리거 구현을 차단한다. 사용자 추천은 즉시 엔딩 방식이다.
- **PM 제안:** 없음. 문서에는 두 방식의 상태·UX·저장 영향을 병기하고 한 시점을 확정하지 않는다.
- **결정:** 결정 009의 Day 30 판정 부분을 `SUPERSEDED/PENDING`, 결정 014의 관련 정렬 부분을 `PARTIALLY SUPERSEDED/PENDING`으로 둔다. 자격 후 숨은 실패 없음과 복수 후보 처리도 즉시 엔딩 방식에서 의미가 달라지므로 함께 재검토한다.
- **철회 사유:** 마스터는 `route-ending condition` 도달을 요구하지만 정확한 최종 트리거 시점을 사용자 승인 없이 Day 30으로 고정할 권한을 PM에게 부여하지 않았다.
- **유지 사항:** 노멀 엔드는 30일 종료, 시험 Day 10·20·30, 50점 미만 즉시 퇴학이다.
- **구현 상태:** `OQ-002` 답변 전 캐릭터 엔드 트리거 구현 `BLOCKED`.
- **영향 파일:** `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, 네 담당 `PROPOSAL.md`, `docs/11_OPEN_QUESTIONS.md`

## 2026-09-03 / 018

- **현재 상태:** `SUPERSEDED` (2026-09-03 / 021). OQ-003의 질문 등록과 임시 구현 차단은 사용자 확정으로 종료됐다.

- **쟁점:** GS-REV-03 시험 중 주기율표 접근
- **사용자 지시:** 시험 10문항×10점과 `49/50/100` 테스트는 유지 승인하고, 시험 중 주기율표 비허용만 철회해 `OQ-003`의 허용/비허용 선택으로 등록한다. 사용자 답변 전 구현을 차단한다.
- **PM 제안:** 현재 전문가 권고는 비허용이다. 허용안을 선택할 경우 기본 사실과 숙련도 도구의 허용 범위를 추가로 명시해야 한다.
- **결정:** 결정 011과 결정 014의 해당 부분을 `PARTIALLY SUPERSEDED/PENDING`으로 둔다. 관련 문서는 두 옵션을 지원하는 계약만 유지한다.
- **철회 사유:** 비허용은 사용자 승인을 받지 않은 PM 구현 결정이었다.
- **구현 상태:** `OQ-003` 답변 전 시험 중 주기율표 접근 가드·허용 정책 구현 `BLOCKED`.
- **영향 파일:** `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, 관련 담당 `PROPOSAL.md`, `docs/11_OPEN_QUESTIONS.md`

## 2026-09-03 / 019

- **쟁점:** GS-REV-04 Na의 일반 불참과 관계적으로 부정적인 거절 구분
- **사용자 지시:** 다른 캐릭터 공략을 위한 일반 초대 거절, 일정 충돌, 정중한 불참은 기본 호감도 `0`으로 하고, 명시적 약속 파기·책임 전가·수락한 공동 계획의 무책임한 이탈에만 `-3/-6` 등 승인 델타를 사용한다.
- **PM 제안:** 콘텐츠 데이터는 Na의 음수 델타에 관계 맥락 사유를 명시하고 일반적인 타 루트 선택에는 음수 보상을 배정하지 않는다.
- **결정:** Character Bible의 잠긴 `반복적으로 involvement 거부`는 일반 타 루트 선택 페널티가 아니라 관계 맥락에서 지속적으로 Na를 배제하거나 책임을 회피하는 서사 선택으로 해석한다. 잠긴 성격·실패 성향 자체는 변경하지 않는다.
- **이유:** 30일 기회비용을 이중 처벌하지 않으면서 Na의 책임·참여 중심 관계 과제를 보존하기 위해서다.
- **영향 파일:** `docs/01_LOCKED_GAME_RULES.md`, `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `agents/science-game-systems/PROPOSAL.md`, `agents/narrative/PROPOSAL.md`

## 2026-09-03 / 020

- **쟁점:** OQ-002 Character End 판정 시점, 시험 우선순위, 복수 후보와 종료 저장
- **사용자 승인:** 호감도 80 이상, 필수 미션 완료, 필수 이벤트 완료, route-ending condition 도달을 완성한 효과 트랜잭션 직후 자격을 판정한다. 성공 회차의 Day 30 이전 종료와 아직 도달하지 않은 미래 시험 미실행을 30일 학기·Day 10·20·30 시험 규칙의 명시적 예외로 승인한다.
- **결정:** 시험 보류 조건이 없고 후보가 1명이면 실패 없는 최종 캐릭터 장면 뒤 해당 Character End와 메타 해금을 terminal로 원자 커밋한다. 하나의 다인 이벤트 효과로 후보가 2명 이상 동시에 생기면 그 자격 후보만 즉시 표시하고 한 명을 선택해 정확히 하나만 확정한다. 자격 획득 뒤 숨은 실패는 없다.
- **시험 우선순위:** 현재 시험 phase 또는 이미 도달한 필수 시험이 미완료면 자격 판정을 합격 완료까지 보류한다. 시험을 우회할 수 없고 50점 미만이면 후보보다 퇴학을 우선해 terminal 커밋한다. Character End 확정 뒤 미래 시험은 실행하지 않는다.
- **노멀 엔드:** Character End 없이 Day 30에 도달하면 종합 시험을 치르고, 합격 뒤 방과 후와 `dayEnd`까지 완료한 후 노멀 엔드를 terminal로 커밋한다. Day 31은 없다.
- **잠금 영향:** 마스터의 30일 학기·세 시험·기존 결말 시점에 대한 사용자 승인 변경·예외다. `docs/00` 사본은 변경하지 않으며 `docs/01`과 역할 계약은 이 결정의 supersession을 따른다. 결정 009는 최종 `SUPERSEDED`, 결정 014는 관련 부분 `PARTIALLY SUPERSEDED`, 결정 017은 `SUPERSEDED`다.
- **도달성 계약:** 기존 최대 Day 29 조건 충족 가능성은 유지한다. 최종 실제 데이터는 루트별 `earliestCompletionDay`, 그 시점까지 도달한 필수 시험의 합격 완료, phase별 행동 가능량, 필수 체인·보조 관계·시험 공부의 행동 수와 보상 합을 함께 정적 검증해야 한다.
- **상태:** OQ-002 `RESOLVED`; 관련 구현의 제품 결정 차단 해제. 상세 콘텐츠·코드는 자동 승인하지 않는다.
- **영향 파일:** `docs/01_LOCKED_GAME_RULES.md`, `docs/04_NARRATIVE_PLAN.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `docs/10_DECISION_LOG.md`, `docs/11_OPEN_QUESTIONS.md`, 네 담당 `PROPOSAL.md`

## 2026-09-03 / 021

- **쟁점:** OQ-003 시험 중 주기율표 접근 범위와 시험 문맥 보존
- **사용자 승인:** 시험 중 주기율표를 조회 전용 도구로 열 수 있고 조회 자체는 행동 비용이 없다.
- **결정:** 시험에서는 원소 1~20의 정본 원자번호, 기호, 한국어·영어 이름, 족, 주기, 전자껍질별 전자배치, 승인된 원자가전자 정보만 제공한다. 기본 주기율표 공간 배열과 원소 상세 열람은 허용한다. 검색, 숙련도 기반 족·주기 필터, 두 원소 비교, 복합 비교, 미션·대화 힌트, 오답 진단은 비활성화한다.
- **상태·UX:** 주기율표는 시험 답안, 고정 문항 순서, 현재 문항 위치를 유지하는 오버레이·도구 문맥으로 열고 닫으면 동일 문항으로 복귀한다. 조회는 답을 자동 선택하거나 점수를 보정하지 않는다. 이 런타임 문맥 보존은 새 중간 저장 경계나 장면별 자유 저장을 만들지 않는다.
- **잠금 영향:** 결정 011의 시험 중 비허용 부분과 결정 014의 관련 정렬 부분을 `PARTIALLY SUPERSEDED`, 결정 018을 `SUPERSEDED`한다. 10문항×10점, `49/50/100`, 제출 불가역성, Day 기반 저장은 유지한다.
- **상태:** OQ-003 `RESOLVED`; 관련 구현의 제품 결정 차단 해제. 상세 UI·문항·코드는 자동 승인하지 않는다.
- **영향 파일:** `docs/01_LOCKED_GAME_RULES.md`, `docs/05_GAME_SYSTEMS_SPEC.md`, `docs/06_STATE_SAVE_SCHEMA.md`, `docs/07_UI_UX_SPEC.md`, `docs/10_DECISION_LOG.md`, `docs/11_OPEN_QUESTIONS.md`, 관련 담당 `PROPOSAL.md`

## 2026-09-28 / 022

- **쟁점:** Slice 0 부트에서 과학 데이터를 필수로 검증할지와 새 게임 시작 경계
- **검토한 선택지:** Slice 0부터 Science catalog 필수 / 원소 stub·fake로 대체 / app metadata와 virtual asset manifest만 검증하고 Science는 Slice 2에서 활성화
- **결정:** Slice 0 부트는 app metadata와 virtual asset manifest만 검증한다. Science catalog는 Slice 2부터 부트 필수 bundle이다. Slice 0에서 원소 stub·fake를 금지한다. 이름 검증 UI는 허용하지만 `GameState` 생성과 Day 진입은 Slice 1부터다.
- **이유:** 앱 골격 검증에 과학 구현을 억지로 결합하거나 거짓 과학값을 만들지 않고 슬라이스 경계를 명확히 하기 위해서다.
- **잠금 영향:** 없음. 과학 단일 정본과 정확성 잠금을 보존하는 구현 시점 구체화다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, Frontend·Science·State V2 구현 계약

## 2026-09-28 / 023

- **쟁점:** Frontend V2 파일 구조의 추상화 수준
- **검토한 선택지:** 제안 폴더·adapter·컴포넌트를 모두 선생성 / 화면별 단일 파일 중심 / 셸·도메인 경계는 유지하되 실제 재사용 시에만 분리
- **결정:** `HomeShell`, `GameShell`, domain `systems/state/data`, 단일 `OverlayHost` 경계는 유지한다. 한 화면 전용 adapter와 컴포넌트는 먼저 화면 모듈에 두고 두 화면 이상에서 실제 재사용되거나 독립 테스트 경계가 필요할 때 분리한다.
- **이유:** 책임 경계는 보존하면서 초기 파일 폭증과 추상화 비용을 줄이기 위해서다.
- **잠금 영향:** 없음. PM 권한의 코드 조직 결정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 `src/` 구조

## 2026-09-28 / 024

- **쟁점:** 홈·게임 셸과 화면 전환 방식
- **검토한 선택지:** 두 셸 동시 유지·CSS 전환 / URL 라우터 / 상호 배타 셸과 무라우터 앱 상태
- **결정:** `HomeShell`과 `GameShell`을 동시에 렌더링하지 않는다. 갤러리는 `HomeShell`에만 둔다. V1 무라우터 결정을 유지한다.
- **이유:** 활성 게임의 갤러리 우회를 구조적으로 차단하고 GitHub Pages 및 상태 정본을 단순하게 유지하기 위해서다.
- **잠금 영향:** 없음. 홈 전용 갤러리 잠금을 강화한다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 앱 셸·가드

## 2026-09-28 / 025

- **현재 상태:** `PARTIALLY SUPERSEDED` (2026-09-28 / 045). 이름의 trim, `1~12 grapheme`, `Cc` 금지와 일반 Unicode 허용은 유지한다. `Intl.Segmenter` 우선·fallback 정책은 폐기하고 고정된 `graphemer@1.4.0` 결과를 유일한 판정 정본으로 사용한다.
- **쟁점:** 사용자 입력 이름과 grapheme 계산 정책
- **검토한 선택지:** UTF-16 길이 / ASCII·한글만 허용 / 일반 Unicode를 grapheme 단위로 검증
- **결정:** 이름은 trim 후 `1~12 grapheme`, Unicode 제어문자 `Cc` 금지, 일반 Unicode 문자·숫자·emoji·결합 문자·내부 공백 허용으로 한다. `Intl.Segmenter`를 우선하고 테스트 가능한 Unicode grapheme fallback을 사용한다. 주인공 성별은 `male` 고정이다.
- **이유:** 사용자 인식 문자 기준의 예측 가능한 길이와 국제 문자 허용을 함께 보장하기 위해서다.
- **QA 위험:** 브라우저·Unicode 버전에 따른 Segmenter와 fallback 결과 차이를 공통 corpus로 확인한다.
- **잠금 영향:** 없음. 이름 입력의 미정 구현 정책과 결정 015의 소비다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 이름 validator·UI·QA fixture

## 2026-09-28 / 026

- **쟁점:** Slice 0 접근성 설정과 MetaState 키
- **검토한 선택지:** 임시 `optionalSettings` 키 영속 / 설정 화면 제거 / 시스템 환경을 CSS로 존중하고 설명만 제공
- **결정:** Slice 0은 영속 설정 키를 발명하지 않는다. `prefers-reduced-motion` 등 시스템 환경을 CSS로 존중하고 설명만 제공한다. `optionalSettings` UI와 Meta 영속은 후속 승인까지 유예한다.
- **이유:** 승인되지 않은 저장 스키마와 설정 의미가 초기 구현에 굳는 것을 막기 위해서다.
- **잠금 영향:** 없음. 접근성 목표를 유지하는 구현 범위 결정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 Home UI·CSS

## 2026-09-28 / 027

- **쟁점:** `localStorage` 불가 환경의 세션 전용 진행과 저장 구현 시점
- **검토한 선택지:** 경고 후 메모리 플레이 / 저장 없이 플레이하고 저장처럼 표시 / 영속 저장 불가 시 새 게임·불러오기 차단
- **결정:** 저장 불가 세션 전용 플레이를 승인하지 않는다. 실제 저장은 Slice 3에서 구현하며 그때 영속 저장을 사용할 수 없으면 새 게임과 불러오기를 차단한다. Slice 0~2의 in-memory 상태·snapshot을 저장 완료로 표시하지 않는다.
- **이유:** 날짜 기반 저장에 대한 사용자 기대와 진행 손실 위험을 숨기지 않기 위해서다.
- **잠금 영향:** 없음. Day 기반 `localStorage` 잠금을 보존한다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 부트·저장 UX

## 2026-09-28 / 028

- **쟁점:** GitHub Pages의 Vite base와 public 자산 URL
- **검토한 선택지:** 고정 저장소 절대 base / 루트 `/assets` / 문서 상대 `base: './'`와 resolver 결합
- **결정:** Vite `base: './'`를 사용한다. public runtime path는 `assets/...` 상대 경로로 저장하고 resolver가 빌드 base와 한 번 결합한다. 절대 `/assets/...`, 런타임 `public/`, 저장소명 하드코딩을 금지한다.
- **이유:** 저장소명 변경과 Pages 하위 경로에서 이중 접두어·루트 경로 오류를 막기 위해서다.
- **잠금 영향:** 없음. GitHub Pages 하위 경로 잠금을 구체화한다.
- **영향 파일:** `docs/09_ASSET_MANIFEST.md`, `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 Vite·resolver·배포 테스트

## 2026-09-28 / 029

- **쟁점:** Asset Integration CR-AI-01~05 채택 여부
- **검토한 선택지:** 기존 WebP placeholder 계약 유지 / V2 제안 일부 채택 / 다섯 CR 전체 채택
- **결정:** CR-AI-01~05를 모두 채택한다. Slice 0~2 CSS/text virtual placeholder, `integrated`만 바이너리 로드, 정규화된 `associations`, base/public/resolver 책임 분리, 실제 자산 승인 전 preload 유예를 적용한다.
- **이유:** 이미지 생성 없이 구조를 검증하고 승인·파일 통합·배포 경로·스포일러 책임을 분리하기 위해서다.
- **잠금 영향:** 없음. 비주얼 유예와 자산 경로 잠금을 보존한다.
- **영향 파일:** `docs/09_ASSET_MANIFEST.md`, `docs/12_INTEGRATED_DESIGN_V2.md`

## 2026-09-28 / 030

- **쟁점:** Science canonical runtime source, 검증 경계와 원소 필드
- **검토한 선택지:** JSON 정본 / TS와 JSON 이중 정본 / readonly TypeScript 모듈 하나와 별도 unknown validator
- **결정:** canonical runtime source는 TypeScript readonly 데이터 모듈 하나다. `unknown` 입력 validator는 별도 순수 함수다. 원소 필수 필드는 `id`, `atomicNumber`, `symbol`, `nameKo`, `nameEn`, `group`, `period`, `shellElectrons`, `valenceElectrons`, `cautionTags`다. 원소별 `teachingTags` 중복 저장을 제거하고 study topic 정의가 concept/query 책임을 소유한다. 20개 값과 불변식은 Science V2 표를 채택한다.
- **이유:** 컴파일 시 읽기 전용성과 런타임 경계 검증을 분리하고 교육 분류의 중복 정본을 막기 위해서다.
- **잠금 영향:** 없음. 과학 단일 정본 잠금의 형식·필드 결정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 Science data·validator

## 2026-09-28 / 031

- **쟁점:** 7개 topic, 숙련도와 Slice 2 학습 행동 범위
- **검토한 선택지:** 검색도 숙련도 잠금 / 모든 학습 모드 즉시 구현 / 검색 항상 허용과 `selfStudy`만 실행
- **결정:** Science V2의 7개 topic ID와 mastery `0~3` 계약을 채택한다. 일반 검색은 항상 허용한다. 무료 수업은 오후 완료 때 `0→1`, Slice 2의 `selfStudy`만 `2·3`을 만들 수 있다. level 3 공부는 실행 전 차단해 슬롯을 소비하지 않는다. `studyTogether`는 타입·확장점만 예약하고 Slice 2 UI·명령에서는 실행 불가다.
- **이유:** 핵심 조회 공정성과 행동 비용을 보존하면서 캐릭터·장면 없는 가짜 함께 공부를 만들지 않기 위해서다.
- **잠금 영향:** 없음. 결정 016과 학습 방향의 구체화다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 학습 state·systems·UI

## 2026-09-28 / 032

- **쟁점:** 선택 가능한 자유 행동이 없을 때 진행 방식
- **검토한 선택지:** 행동이 생길 때까지 대기 / 자동 진행 / 명시적 무보상 슬롯 포기
- **결정:** `passFreeTime`을 승인한다. 현재 점심 또는 방과 후 슬롯을 사용 완료로 표시하고 보상·숙련도·호감도·플래그를 만들지 않는다.
- **이유:** 하루 행동 압박과 슬롯 상한을 유지하면서 콘텐츠 부족·조건 불충족 소프트락을 막기 위해서다.
- **잠금 영향:** 없음. 승인된 점심·방과 후 각 1슬롯 모델의 명령 구체화다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 Day command·UI·QA

## 2026-09-28 / 033

- **현재 상태:** `PARTIALLY SUPERSEDED` (2026-09-28 / 043). 오전·오후 명령 분리와 UI의 selector·command 소비는 유지한다. `selectedTopicId`와 topic 입력·무료 숙련도 상승은 Slice 1이 아니라 ScienceCatalog가 활성화되는 Slice 2부터 도입한다.
- **쟁점:** 오전 선택 주제를 오후까지 보존하는 Day 상태와 command 분리
- **검토한 선택지:** phaseStep·UI 로컬 상태로 추론 / 수업 단일 명령 / 명시적 daily class state와 오전·오후 명령
- **결정:** 당일 상태에 `selectedTopicId`, `morningCompleted`, `afternoonCompleted`를 추가한다. 공개 명령은 `completeMorningHomeroom`, `completeMorningClass(topicId)`, `resolveFreeAction`·`passFreeTime`, `completeAfternoonClass`, `commitDayEnd`처럼 오전·오후를 분리한다. UI는 selector·command 결과만 소비한다.
- **이유:** 무료 수업 상승을 오후 완료 시점에 결정적으로 적용하고 UI의 규칙 재구현을 막기 위해서다.
- **잠금 영향:** 없음. 상태 내부 표현과 API 결정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 State·Systems·Frontend 계약

## 2026-09-28 / 034

- **쟁점:** Slice 1에서 실제 시험이 없는 Day 10·20·30 처리
- **검토한 선택지:** production 통과 버튼 / 임의 점수 UI / exam phase에서 정지하고 테스트 포트만 주입
- **결정:** Slice 1 production UI에는 시험 stub을 노출하지 않는다. 시험일 `exam` phase에서 fail-closed로 정지한다. 단위·통합 테스트 전용 port만 `49 | 50 | 100`을 주입해 경계를 검증한다. 실제 시험 UI·채점 전 제품 화면에서 시험을 통과할 수 없다.
- **이유:** 시험 우회용 임시 기능이 제품 경로로 굳는 것을 막으면서 잠금 경계와 phase를 조기 검증하기 위해서다.
- **잠금 영향:** 없음. 필수 시험과 퇴학 잠금을 보존한다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 시험 guard·test fixtures

## 2026-09-28 / 035

- **쟁점:** Slice 1의 Day 저장 경계 검증과 실제 브라우저 영속화 시점
- **검토한 선택지:** 모든 저장을 Slice 3까지 유예 / Slice 1부터 localStorage 완성 / 순수 snapshot만 Slice 1에서 구현
- **결정:** Slice 1에 `dayStart`, `examResolved`, `terminal` 순수 snapshot 생성·전체 검증·정본 JSON round-trip과 in-memory adapter를 포함한다. 실제 localStorage, A/B, checksum, migration, Meta는 Slice 3으로 유예한다. UI는 in-memory를 실제 저장으로 표현하지 않는다.
- **이유:** Day·시험·종료 경계의 직렬화 가능성을 조기에 검증하면서 임시 영속 형식을 제품 계약으로 굳히지 않기 위해서다.
- **잠금 영향:** 없음. Day 기반 저장 경계를 보존하는 구현 순서 결정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 snapshot·in-memory adapter·UI copy

## 2026-09-28 / 036

- **쟁점:** 학습 파생 상태와 두 종류의 멱등성 기록
- **검토한 선택지:** `studiedTopics` 중복 저장 / command ID를 모든 멱등성에 공용 / 파생 상태와 receipt·ledger 분리
- **결정:** `studiedTopics`는 저장하지 않고 `mastery > 0`에서 파생한다. command receipt는 전송 멱등성, effect ledger는 보상 멱등성으로 분리한다. Slice 1 receipt는 Day 단위로 유지하고 다음 `dayStart`에서 정리하며 현재 Day `examResolved`·`terminal`까지 보존한다.
- **이유:** 중복 상태 불일치와 명령 재전송·게임 효과 중복의 책임 혼동을 막기 위해서다.
- **잠금 영향:** 없음. 내부 상태 정규화와 멱등성 계약이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 GameState·snapshot validator

## 2026-09-28 / 037

- **쟁점:** Slice 1 시험 상태의 최소 위치와 향후 호환 처리
- **검토한 선택지:** 비영속 개발 변수 / Slice 1부터 완성 Academic exams / 최소 `examGate` 후 실제 시험 Slice에서 흡수
- **결정:** Slice 1 `examGate`는 비영속 개발 구조가 아니라 최소 상태 필드로 사용한다. 실제 시험 Slice에서 Academic exams 계약으로 흡수한다. 아직 배포 저장이 없으므로 호환 코드·migration을 만들지 않는다.
- **이유:** 시험 우회 방지 상태는 직렬화 검증하되 미완성 시험 스키마를 조기 고정하지 않기 위해서다.
- **잠금 영향:** 없음. 상태 구현 세부 결정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 Slice 1 GameState·시험 Slice

## 2026-09-28 / 038

- **쟁점:** 결정 020 즉시 Character End와 Slice 1~2의 관계 데이터 부재
- **검토한 선택지:** 임시 affection·route 구현 / ending 호출 자체 유예 / 효과 뒤 no-op evaluator 확장점
- **결정:** Slice 1~2는 모든 성공 효과와 후보 검증 뒤 호출되는 no-op Character End evaluator 확장점만 둔다. route, mission, affection, ending scene, Meta 해금을 구현하지 않는다.
- **이유:** 결정 020의 호출 위치를 보존하면서 관계 도메인을 슬라이스 범위보다 앞당기지 않기 위해서다.
- **잠금 영향:** 없음. 기존 사용자 승인 엔딩 계약의 비기능 확장점이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 command pipeline

## 2026-09-28 / 039

- **쟁점:** Slice 0~2 Narrative 산출물 수준
- **검토한 선택지:** 임시 캐릭터 대사·루트 fixture / 텍스트 없음 / 중립 시스템 카피와 의미 템플릿
- **결정:** 중립 시스템 카피는 허용한다. 최종 캐릭터 대사, 루트 상세, 실제 `SceneId`·`ChoiceId`는 금지한다. 과학 설명은 Science 정본 참조와 의미 템플릿만 사용한다.
- **이유:** 초기 UX 검증은 가능하게 하되 임시 대사·ID·과학값이 최종 콘텐츠로 굳는 것을 막기 위해서다.
- **잠금 영향:** 없음. 캐릭터·과학 정본과 콘텐츠 유예를 보존한다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 system copy·fixture

## 2026-09-28 / 040

- **쟁점:** Slice 0 홈 갤러리의 카탈로그 부재 처리
- **검토한 선택지:** 캐릭터별 가짜 잠금 슬롯 / 전체 갤러리 숨김 / 카탈로그 없는 정상 빈 상태
- **결정:** Slice 0 갤러리는 카탈로그 없음 상태를 정상 빈 상태로 표시한다. 가짜 잠금 슬롯, 캐릭터·루트·사건명, Ne 존재와 항목 수를 누설하지 않는다.
- **이유:** 홈 전용 접근 기능은 검증하면서 미승인 CG 목록과 히든 루트 스포일러를 만들지 않기 위해서다.
- **잠금 영향:** 없음. 홈 전용 갤러리와 스포일러 경계를 보존한다.
- **영향 파일:** `docs/09_ASSET_MANIFEST.md`, `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 Gallery UI

## 2026-09-28 / 041

- **쟁점:** 접근성 목표와 지원 브라우저 QA 기준
- **검토한 선택지:** 브라우저 미정 유지 / 최신 한 종류만 지원 / 주요 데스크톱 현재·직전과 대표 최신 모바일
- **결정:** WCAG 2.2 AA를 목표로 키보드, 포커스, 200% 확대, reduced motion을 필수 QA 범위로 둔다. 지원 기준은 최신 안정 Chrome·Firefox·Safari 및 직전 주요 버전, iOS Safari·Android Chrome 대표 최신 버전이다.
- **이유:** grapheme, CSS, focus, 모바일 표 동작을 검증할 현실적인 최소 호환 범위를 확정하기 위해서다.
- **잠금 영향:** 없음. UI 품질·QA 기준 결정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 QA 계획·브라우저 행렬

## 2026-09-28 / 042

- **쟁점:** Slice 0~2를 막지 않는 유예와 금지 범위
- **검토한 선택지:** 비주얼·콘텐츠 확정 전 구현 차단 / 임시값으로 선결정 / 유연 계약으로 구현하고 상세는 유예
- **결정:** 최종 시각색·서체, 실제 자산 비율, final copy, 실제 시험 콘텐츠, route/story는 구현을 막지 않는 유예로 둔다. 호감도·루트 구현은 Slice 2 완료 뒤 별도 승인 전까지 금지한다.
- **이유:** 구조·상태·과학 도구 검증을 진행하되 미승인 비주얼과 콘텐츠를 사실상 확정하지 않기 위해서다.
- **잠금 영향:** 없음. 비주얼·콘텐츠 유예와 역할 게이트를 보존한다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, 향후 Slice 승인·Narrative·Asset 계획

## 2026-09-28 / 043

- **쟁점:** Slice 1이 Slice 2 소유 topic 정본을 선행 소비하는 계약
- **검토한 선택지:** Slice 1에 일곱 topic enum·fixture 복제 / 검증 없는 임시 topic 사용 / Slice 1 수업을 과학 비의존 generic 전이로 두고 Slice 2에서 topic을 함께 활성화
- **결정:** Slice 1 `DailyClassState`는 `morningCompleted`, `afternoonCompleted`만 가지며 `selectedTopicId`와 `StudyTopicId`를 갖지 않는다. Slice 1의 `completeMorningClass(commandId)`와 `completeAfternoonClass(commandId)`는 generic 수업 완료이고 숙련도를 변경하지 않으며, Slice 1 snapshot에도 topic이 없다. Slice 2에서 ScienceCatalog를 활성화할 때 `selectedTopicId`를 `DailyClassState`에 추가하고 `completeMorningClass(topicId, commandId)` 및 오후 완료 시 무료 `0→1`을 함께 도입한다. 아직 배포 persistence가 없으므로 이 추가를 위한 migration·호환 코드를 만들지 않는다. Slice 1 fake topic은 금지한다.
- **supersession:** 결정 033의 `selectedTopicId`, Slice 1 topic 입력과 그에 의존한 상태 부분을 `PARTIALLY SUPERSEDED`한다. 오전·오후 명령 분리와 UI가 selector·command 결과만 소비한다는 원칙은 유지한다.
- **이유:** Science 정본이 없는 Slice 1에서 topic을 복제·추정하지 않고, 과학 데이터 소유권과 Slice 경계를 일치시키기 위해서다.
- **QA 상태:** QA-V2-001의 문서상 원인을 해소하는 PM 계약이다. QA 재검토 전 Slice 1~2를 Ready to Code로 판정하지 않는다.
- **잠금 영향:** 없음. 역할·Slice 경계와 내부 API 시점의 정정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, State·Science·Frontend V2 구현 계약

## 2026-09-28 / 044

- **쟁점:** 시험 결과 test port가 production export·import graph·build artifact에 유입되지 않음을 증명할 경계
- **검토한 선택지:** UI에서만 숨김 / production command union에 test command 포함 / production과 test import graph를 파일 단위로 분리
- **결정:** production facade와 command registry인 `src/state/commands.ts` 또는 동등 위치에는 raw score command·port·type을 export하지 않는다. 검증된 시험 결과 적용 함수는 향후 실제 시험 subsystem용 internal module인 논리 위치 `src/state/internal/applyVerifiedExamOutcome.ts`에 두되, 실제 시험 Slice 전에는 production entry graph에서 import하지 않는다. 테스트 전용 adapter는 `tests/helpers/resolveExamForTest.ts`에만 두고 marker `slice-test-exam-outcome-v1`을 포함하며 `49 | 50 | 100`만 허용한다. production `src`에서 `tests` import는 금지한다.
- **빌드·검증:** Vite/Vitest 설정은 tests가 helper를 import할 수 있게 하되 production build input은 `src/main.tsx` 단일 graph다. 테스트는 production public exports와 command registry의 raw score API 부재, source import boundary, production build artifact의 marker 부재, Day 10 production E2E fail-closed, test graph에서 `49/50/100` 경계와 결과 재주입 거부를 검증한다.
- **이유:** 화면 비노출만으로는 임의 점수 주입 경로의 번들·registry 노출을 막을 수 없으므로 production과 test의 도달 가능성을 구조적으로 분리해야 한다.
- **QA 상태:** QA-V2-002의 문서상 원인을 해소하는 PM 계약이다. 실제 source·build·E2E 증거는 구현 후 검증하며 QA 재검토 전 Ready to Code로 판정하지 않는다.
- **잠금 영향:** 없음. 필수 시험 fail-closed를 보존하는 테스트·빌드 경계 보완이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, State·Science·Frontend V2 구현 계약, 향후 test/build 구조

## 2026-09-28 / 045

- **쟁점:** 이름 grapheme 계산의 환경별 불일치와 유일한 acceptance oracle
- **검토한 선택지:** `Intl.Segmenter` 우선+임의 fallback / 코드포인트 fallback / 버전 고정 grapheme 구현을 유일한 정본으로 사용
- **결정:** 구현 승인 시 direct dependency `graphemer` 정확히 `1.4.0`을 사용하고 그 결과만 authoritative grapheme count로 사용한다. `Intl.Segmenter`는 진단 비교에만 사용할 수 있고 acceptance를 바꾸지 않는다. 지원 환경에서 package unavailable은 build failure이며 코드포인트 fallback으로 조용히 전환하지 않는다. 이번 문서 조정에서는 패키지를 설치하지 않는다.
- **fixture oracle:** `''=0`, `김철수=3`, `가나다라마바사아자차카타=12`, 그 뒤 `파` 추가 `=13`, decomposed `가=1`, `e\u0301=1`, family ZWJ emoji `=1`, skin-tone emoji `=1`, Korean flag `=1`, `김 철수=4`다. `Cc` 포함 입력은 count와 무관하게 거부하며 ECMAScript trim 후 `1~12`만 허용한다.
- **supersession:** 결정 025의 `Intl.Segmenter` 우선·fallback 부분을 `PARTIALLY SUPERSEDED`한다. 나머지 이름 정책과 `gender = male`은 유지한다.
- **이유:** 브라우저·Unicode 구현 차이와 fallback 모호성을 제거해 12/13 경계의 재현 가능한 단일 판정을 만들기 위해서다.
- **QA 상태:** QA-V2-003의 문서상 원인을 해소하는 PM 계약이다. 패키지 설치·fixture 실행은 별도 구현 승인 뒤 수행하며 QA 재검토 전 Ready to Code로 판정하지 않는다.
- **잠금 영향:** 없음. 이름 validator 구현과 QA oracle의 확정이다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, Frontend V2 구현 계약, 향후 package manifest·이름 validator·QA fixture

## 2026-09-28 / 046

- **쟁점:** `base: './'`에서 document URL 형태와 무관한 자산 URL의 정확한 해석·거부 oracle
- **검토한 선택지:** 현재 route·surface 문자열 기준 결합 / 문자열 접두어 결합 / 검증된 path와 document base를 순차 URL 해석
- **결정:** manifest path를 먼저 검증한 뒤 `appBaseUrl = new URL(import.meta.env.BASE_URL, document.baseURI)`, 이어서 `assetUrl = new URL(validatedPath, appBaseUrl)`로 해석한다. 두 단계는 각각 정확히 한 번 수행하고 현재 surface·route 문자열은 사용하지 않는다. Vite `base`는 `./` 단일값이다.
- **URL oracle:** `BASE_URL='./'`에서 document가 `https://example.test/LoveChemistry/` 또는 `https://example.test/LoveChemistry/index.html?x=1#top`이면 `assets/ui/a.webp`는 `https://example.test/LoveChemistry/assets/ui/a.webp`다. document가 `https://example.test/`이면 `https://example.test/assets/ui/a.webp`다.
- **거부 oracle:** 선행 `/`, `public/`, `.`·`..` segment, 역슬래시, protocol·host, query·hash, 빈 path, duplicate slash, trailing slash를 거부한다. 대소문자는 변환하지 않고 manifest path와 build artifact를 문자 단위 exact case로 비교해 mismatch를 거부한다.
- **이유:** 문서가 디렉터리 URL인지 `index.html` URL인지, query/hash가 있는지에 따라 저장소명 중복·루트 이탈·파일명 기준 결합이 생기지 않도록 단일 해석 절차와 기대값을 고정하기 위해서다.
- **QA 상태:** QA-V2-004의 문서상 원인을 해소하는 PM 계약이다. production Pages build 검증은 구현 후 수행하며 QA 재검토 전 Ready to Code로 판정하지 않는다.
- **잠금 영향:** 없음. GitHub Pages 하위 경로 배포의 resolver·검증 구체화다.
- **영향 파일:** `docs/12_INTEGRATED_DESIGN_V2.md`, Frontend V2 구현 계약, 향후 Vite·asset resolver·Pages QA
