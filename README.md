# 러브 앤 케미스트리

화학 원소를 의인화한 학생들과 30일의 학교생활을 보내는 프론트엔드 전용 연애·교육 시뮬레이션 프로젝트입니다. 배포 목표는 GitHub Pages이며 백엔드와 음향 시스템은 사용하지 않습니다.

## 현재 상태

**Slice 0~2의 충돌 위험 7건을 PM 계약에 반영했습니다. 변경 계약의 QA 재검토와 별도 구현 승인을 기다리는 단계이며 아직 Ready to Code가 아닙니다.**

2026-09-28 QA PASS는 결정 022~046에 대한 과거 이력입니다. 결정 047~053의 현행 계약은 [`docs/15_IMPLEMENTATION_CONTRACT.md`](docs/15_IMPLEMENTATION_CONTRACT.md)이며 새 QA PASS를 뜻하지 않습니다. 애플리케이션 코드·테스트·실제 자산은 아직 없고 런타임·빌드·배포는 `NOT TESTED`입니다.

진행 현황과 다음 게이트는 [`docs/13_PROGRESS.md`](docs/13_PROGRESS.md)에 기록합니다.

충돌 근거와 수정 결과는 [`docs/14_CONFLICT_REVIEW.md`](docs/14_CONFLICT_REVIEW.md)를 참고합니다. 제품 목표는 **배운 화학을 학교생활의 행동과 관계 선택에 활용하는 연애·교육 시뮬레이션**이며 단순 퀴즈·호감도 파밍으로 대체하지 않습니다.

GitHub 저장소: https://github.com/su1m1bx/lovechemistry

현재 저장소 구조는 구현 승인을 뜻하지 않습니다. 기능별 데이터 계약, 담당 역할의 제안서, PM 승인, 고위험 항목에 대한 QA 사전 검토, 구현을 막는 미해결 모순의 해소가 모두 완료된 뒤에만 해당 기능을 Ready to Code로 전환합니다.

## 기준 문서

- 제품 기준 원본: `docs/00_PM_MASTER_SPEC.md`
- 자산 경로 및 플레이스홀더 계약: `docs/09_ASSET_MANIFEST.md`
- PM 결정 기록: `docs/10_DECISION_LOG.md`
- 미해결 질문 및 유예 항목: `docs/11_OPEN_QUESTIONS.md`
- Slice 0~2 통합 구현 계약: `docs/12_INTEGRATED_DESIGN_V2.md`
- 충돌 수정 상세 계약: `docs/15_IMPLEMENTATION_CONTRACT.md`
- 기존 QA 문서 검토 결과(결정 022~046 범위): `agents/qa/DESIGN_V2_REVIEW.md`
- 진행 현황 기록: `docs/13_PROGRESS.md`
- 구현 준비 충돌 점검: `docs/14_CONFLICT_REVIEW.md`
- 사용자 플레이 구상 대조·체크리스트: `docs/16_USER_SCENARIO_REVIEW.md`
- 역할별 작업 지침: `agents/*/BRIEF.md`

`docs/00_PM_MASTER_SPEC.md`의 `LOCKED` 규칙은 사용자 승인 없이 변경할 수 없습니다. 구현 편의, UI 편의, 서사 편의를 이유로 잠금 규칙을 임의로 수정하지 않습니다.

## 작업 절차

1. 담당자는 마스터 규격, 잠금 규칙 문서, 역할별 `BRIEF.md`, 관련 명세를 읽습니다.
2. 담당자는 구현 전에 역할별 제안서를 작성합니다.
3. PM은 역할 간 계약과 잠금 규칙 영향을 검토합니다.
4. 과학, 상태, 시험, 루트, 엔딩 등 고위험 설계는 QA 사전 검토를 거칩니다.
5. PM 승인 후에만 코딩을 시작합니다.
6. 구현 후 담당자 핸드오프와 QA 검증을 거쳐 통합합니다.

## 현재 금지 사항

- 애플리케이션 코드 작성 및 기능 구현
- 승인되지 않은 제품 규칙 확정
- 캐릭터 외형 설계, 캐릭터 이미지 생성, PixAI 프롬프트 작성
- 백엔드, 서버 저장, 로그인, 음향 시스템 도입
- 다른 역할이 소유한 계약을 사전 협의 없이 변경

## 역할

- `science-game-systems`: 과학 정확성 및 게임 시스템
- `narrative`: 서사, 대사, 루트와 미션 상황
- `frontend-uiux`: 화면 구조, 상호작용, 반응형·접근성
- `state-save`: 상태 모델, Day 단위 저장과 복원
- `qa`: 사전 검토, 검증, 통합·출시 차단 판단
- `asset-integration`: 자산 ID, 경로, 형식, 교체 계약
