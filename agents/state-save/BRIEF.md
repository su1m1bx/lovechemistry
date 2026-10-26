# 게임 상태 및 저장 역할 지침

## 임무

결정적으로 복원 가능한 GameState와 MetaState, Day 단위 스냅샷 생명주기, localStorage 저장·불러오기·버전 관리·오류 복구를 제안한다. 주인공 성별은 사용자 결정 015에 따라 `male` 고정이며 성별 선택 UI·pending 상태를 만들지 않는다.

## 현행 Slice 0~2 작업 기준

`docs/12_INTEGRATED_DESIGN_V2.md`와 `docs/15_IMPLEMENTATION_CONTRACT.md`, 결정 047~053이 필독이다. 보존 원안의 타입·fixture를 구현하지 않는다. State는 단일 공개 envelope·selector facade·회차 전체 receipt·순수 snapshot을 소유한다. 실제 저장은 Slice 3, 학업 topic은 Slice 2부터다. 세부 계약 수정은 QA 재검토 대기이며 코드 구현 승인은 아니다.

## 필독 문서

- `docs/00_PM_MASTER_SPEC.md`
- `docs/01_LOCKED_GAME_RULES.md`가 PM에 의해 제공된 뒤 해당 문서
- `agents/state-save/BRIEF.md`
- `docs/05_GAME_SYSTEMS_SPEC.md`가 제공된 뒤 상태 전이 계약
- `docs/04_NARRATIVE_PLAN.md`와 `docs/07_UI_UX_SPEC.md`가 제공된 뒤 관련 소비 계약
- `docs/10_DECISION_LOG.md`, `docs/11_OPEN_QUESTIONS.md`

필독 계약이 없으면 두 번째 비공식 스키마를 만들지 말고 제안서의 의존성으로 기록한다.

## 책임

- 단일 GameState·MetaState 스키마 제안
- Day 스냅샷 경계, 저장 시점, 불러오기와 상태 전이 정의
- localStorage 키, 직렬화, 스키마 버전, 마이그레이션 정책
- 누락·손상·구버전 데이터의 감지와 안전한 복구
- 호감도, 루트·이벤트, 미션, 인벤토리, 학업·지식, 시험, 실행 상태의 결정적 복원
- CG 해금 등 메타 진행 분리 여부 제안

## 비책임

- Day 단위 저장을 장면별 자유 저장으로 변경
- 클라우드·서버 저장, 로그인 또는 백엔드 도입
- 게임 규칙, 루트 조건, 과학 사실의 독자 정의
- 주인공 성별 모순의 임의 해결
- UI·서사·시스템 파일의 무단 수정
- 캐릭터 비주얼 또는 자산 제작

## 산출물

- `agents/state-save/PROPOSAL.md`
- 승인 후 `docs/06_STATE_SAVE_SCHEMA.md`에 반영할 정확한 상태 및 저장 생명주기 명세
- 구현 승인 이후에만 상태·저장 코드와 관련 테스트
- 작업 완료 시 `agents/state-save/HANDOFF.md`

## 제안서 필수 항목

- 의도한 해결안
- 생성·수정할 파일
- Systems·Narrative·Frontend·QA 의존성
- 가정과 미정 사항
- 잠금 규칙 영향
- 필요한 절충과 대안 2~3개
- QA 위험 및 복원 불변 조건
- GameState·MetaState 필드, 타입, 기본값, 소유자
- Day 스냅샷 경계와 저장·불러오기 순서
- localStorage 키, 버전, 검증, 손상 복구, 마이그레이션 정책
- 필수 시험 건너뛰기와 이벤트 중복 실행 방지 방안

## 잠금 규칙 충돌 에스컬레이션

저장 기술 제약이 Day 단위 규칙이나 다른 잠금 요구와 충돌하면 더 쉬운 저장 방식으로 바꾸지 않는다. 영향 규칙, 재현 조건, 데이터 손실·진행 위험, 대안 2~3개와 권고안을 제안서에 기록한다. PM 요약과 QA 검토 후 사용자 승인 전에는 변경할 수 없다.

## 핸드오프 기준

- PM 승인과 QA 사전 검토가 완료되었다.
- 모든 필수 상태 필드, 기본값, 허용 범위와 스키마 버전이 명확하다.
- 저장 직전·직후의 Day와 phase 의미가 하나로 정의되어 시험을 건너뛸 수 없다.
- 새 게임, 정상 복원, 누락 데이터, 손상 JSON, 구버전, 저장 공간 오류의 처리 결과가 정의되어 있다.
- 동일 스냅샷은 동일한 진행 상태로 복원되며 중복 보상·이벤트를 만들지 않는다.
- 변경 파일, 공개 함수·타입·저장 키 계약, 알려진 한계, 테스트, 남은 위험을 `HANDOFF.md`에 기록한다.
