# 2차 통합 설계 QA 사전검토

**검토일:** 2026-09-28  
**검토 유형:** 구현 전 문서·계약 정적 검토  
**검토 범위:** 다섯 `agents/*/DESIGN_V2.md`, `docs/00`~`12`, 결정 022~046, `agents/qa/BRIEF.md`, `TEST_PLAN.md`, `REPORT.md`  
**전체 판정:** **문서 계약 PASS / S0~S2 READY FOR PM IMPLEMENTATION AUTHORIZATION / 구현 미승인 / 코드·패키지·런타임·production build NOT TESTED**  
**구현 작업:** 없음. 문서만 검토·갱신했다.

결정 043~046 및 역할별 정렬 문서를 재검토해 QA-V2-001~004를 문서 계약 기준으로 닫았다. 이 판정은 PM이 구현 승인을 요청할 수 있다는 뜻일 뿐 코드 합격, 구현 착수 승인, 통합 합격 또는 출시 합격이 아니다. 사용자 지시에 따라 실제 구현은 계속 금지한다.

## 1. Findings

### Critical

발견 없음. 30일, 시험일·50점 경계, Day 기반 저장, 과학 범위, 홈 전용 갤러리, 무음, 무백엔드 잠금을 직접 변경하는 V2 문서 결함은 발견하지 않았다.

### High

#### QA-V2-001: Slice 1이 Slice 2 소유의 일곱 topic 정본을 선행 요구한다

- **판정:** `CLOSED / 문서 계약 PASS`
- **재검토 근거:** 결정 043과 `docs/12_INTEGRATED_DESIGN_V2.md:91-110`, `321-389`, `553-570`이 Slice 1을 topic 없는 generic 수업과 완료 불리언으로 축소하고, `StudyTopicId`, `selectedTopicId`, topic 입력 및 무료 `0→1`을 ScienceCatalog가 활성화되는 Slice 2로 함께 이동했다. State·Science·Frontend V2 최신 우선 절도 같은 의미이며 Slice 1 fake topic을 금지한다.
- **잔여 검증:** 실제 타입, snapshot, command surface 및 Slice 1 artifact의 topic 흔적 부재는 구현 후 `NOT TESTED`다.
- **근거:** `docs/10_DECISION_LOG.md:208-213`과 `docs/12_INTEGRATED_DESIGN_V2.md:55-59`는 Science catalog·과학 데이터가 Slice 2부터 필요하다고 확정한다. 그러나 `docs/12_INTEGRATED_DESIGN_V2.md:91-98`, `299-313`, `508-513`은 Slice 1 상태와 production command에 `StudyTopicId`, `dailyClass.selectedTopicId`, `completeMorningClass(topicId)`를 요구한다.
- **교차 근거:** State V2 원안은 Slice 1의 `COMPLETE_CLASS`에 topic이 없고(`agents/state-save/DESIGN_V2.md:175-183`), Slice 2에서만 `topicId` 필수 명령으로 대체한다(`agents/state-save/DESIGN_V2.md:361-375`, `425-428`). 반면 Science V2는 미등록 topic 거부를 요구한다(`agents/science-game-systems/DESIGN_V2.md:383-389`). Slice 1에는 이를 판정할 승인 topic registry가 없다.
- **실패 양상:** Slice 1이 일곱 topic enum·fixture를 복제하면 Slice 2보다 먼저 Science 계약을 구현한다. 검증 없이 임의 문자열을 받으면 `unknown-id` 가드와 snapshot 의미를 검증할 수 없다. 과학 fake를 넣으면 Slice 경계와 결정 022를 위반한다.
- **차단 범위:** Slice 1 전체 구현 승인, Slice 1 snapshot 스키마 확정, Slice 1과 Slice 2의 통합 API. Slice 0은 차단하지 않는다.
- **최소 해결 권고:** Slice 1에서는 `dailyClass`를 오전·오후 완료 불리언만 가진 과학 비의존 상태로 축소하고 `completeMorningClass(commandId)`만 사용한다. topic 선택·`selectedTopicId`·무료 `0→1`은 일곱 topic 정본이 활성화되는 Slice 2에서 함께 추가한다. PM은 결정 033을 후속 결정으로 정정하고 통합 설계의 Slice 1 타입·command·snapshot 불변식을 같은 변경에서 정렬해야 한다.
- **대안:** PM이 topic ID 집합 자체를 Science catalog와 분리된 Slice 1 선행 계약으로 명시할 수 있으나, Slice 1 UI가 과학 주제를 실제로 노출하지 않고 Slice 2까지 상승을 적용하지 않는다는 경계를 추가로 증명해야 한다. 최소 변경안보다 중복·오해 위험이 커 비권고한다.
- **분류:** 잠금 변경이 아닌 역할·Slice 계약 수정이다. `BLOCKED CHANGE REQUEST`는 아니다.

#### QA-V2-002: 시험 test-only 49/50/100 port의 production 비노출을 실제로 증명할 경계가 없다

- **판정:** `CLOSED / 문서 계약 PASS`
- **재검토 근거:** 결정 044와 `docs/12_INTEGRATED_DESIGN_V2.md:116-135`, `250-276`, `574-581`이 tests-only 파일, production export·registry 부재, `src`→`tests` import 금지, production 단일 entry graph, marker artifact 검사, Day 10 fail-closed E2E와 재주입 거부를 모두 확정했다. State·Science·Frontend V2 최신 우선 절도 공개 `ExamStubCommand` 제안을 폐기했다.
- **잔여 검증:** source graph, emitted artifact, public exports 및 E2E는 구현 후 `NOT TESTED`다.
- **근거:** 결정 034는 production fail-closed와 test-only port만 승인한다(`docs/10_DECISION_LOG.md:315-322`). 통합 설계도 번들 노출 검사를 요구하지만(`docs/12_INTEGRATED_DESIGN_V2.md:110-115`), port는 논리 표에만 있고(`docs/12_INTEGRATED_DESIGN_V2.md:519-525`) 채택 파일 구조에는 test-only 모듈·import 경계가 없다(`docs/12_INTEGRATED_DESIGN_V2.md:178-233`). 구현 전 체크리스트도 파일·빌드 경계 계획과 E2E 방법이 아직 필요하다고 명시한다(`docs/12_INTEGRATED_DESIGN_V2.md:723-730`).
- **교차 근거:** State V2는 `ExamStubCommand`를 일반 상태 설계와 같은 공개 논리 영역에 선언한다(`agents/state-save/DESIGN_V2.md:175-191`)고 하면서 production UI 비호출만 요구한다(`agents/state-save/DESIGN_V2.md:292-304`). UI에서 숨기는 것만으로 공개 export·동적 command registry·production import를 막았다고 증명할 수 없다.
- **실패 양상:** 사용자 화면에 버튼이 없어도 production command union, barrel export, debug hook 또는 emitted chunk에 raw score 주입 경로가 남을 수 있다. 그러면 실제 시험 전 필수 시험을 우회할 수 있다.
- **차단 범위:** Slice 1 시험 경계와 전체 Slice 1 구현 승인. 일반 Day 전이 설계의 문서 정합성 자체는 영향받지 않는다.
- **해결 권고:** 구현 승인 전에 test adapter의 파일 위치와 import 방향을 확정한다. test-only adapter는 production entry graph와 production command registry에 포함되지 않아야 하며, production facade는 raw score 명령을 export하지 않아야 한다.
- **필수 검증:** production export surface에 port 부재, production import graph에 test fixture 부재, production build artifact에 test-only marker/module 부재, Day 10 E2E에서 일반 명령·UI·직접 registry 요청 모두 `exam`을 통과하지 못함, test build에서만 49/50/100 및 재주입 거부를 검증해야 한다.
- **분류:** 잠금 변경이 아닌 테스트 가능성·번들 경계 보완이다. `BLOCKED CHANGE REQUEST`는 아니다.

### Medium

#### QA-V2-003: grapheme fallback의 알고리즘·버전·기대 결과가 고정되지 않았다

- **판정:** `CLOSED / 문서 계약 PASS`
- **재검토 근거:** 결정 045와 `docs/12_INTEGRATED_DESIGN_V2.md:300-319`이 `graphemer@1.4.0` 결과만 acceptance 정본으로 확정하고 `Intl.Segmenter`를 진단 전용으로 제한했다. 0·12·13 경계, 한글 자모, 결합 악센트, ZWJ, modifier, 국기, 내부 공백 및 `Cc` 거부 fixture가 고정됐다.
- **잔여 검증:** 패키지 설치, fixture 실행과 지원 브라우저 결과는 구현 후 `NOT TESTED`다.
- **근거:** 결정 025는 `Intl.Segmenter` 우선과 테스트 가능한 fallback을 승인한다(`docs/10_DECISION_LOG.md:233-241`). 통합 설계는 같은 corpus 비교만 요구하고(`docs/12_INTEGRATED_DESIGN_V2.md:276-284`, `671-677`), 선택 구현 제출을 미완료 체크리스트로 남긴다(`docs/12_INTEGRATED_DESIGN_V2.md:728`).
- **실패 양상:** fallback이 어떤 Unicode grapheme 규칙을 따르는지, `Intl.Segmenter`와 결과가 다를 때 어느 결과가 정본인지 알 수 없어 12/13 경계의 기대값을 재현할 수 없다.
- **차단 범위:** Slice 0 이름 validator와 새 게임 이름 계약. 홈 셸·갤러리 등 다른 Slice 0 범위는 차단하지 않는다.
- **해결 권고:** PM 구현 결정으로 fallback 알고리즘과 Unicode/UAX #29 기준 버전 또는 검증된 구현을 고정하고, 한글 자모·ZWJ emoji·modifier·국기·결합 악센트의 기대 grapheme 수와 불일치 처리 정책을 fixture 표로 정한다. 패키지를 채택한다면 별도 구현 승인 뒤에만 추가한다.
- **분류:** 잠금 변경 없음.

#### QA-V2-004: `base: './'` 상대 resolver의 URL 테스트 oracle이 완결되지 않았다

- **판정:** `CLOSED / 문서 계약 PASS`
- **재검토 근거:** 결정 046, `docs/12_INTEGRATED_DESIGN_V2.md` 8절, Frontend·Asset Integration V2 최신 우선 절과 `docs/09_ASSET_MANIFEST.md`가 `document.baseURI` 기준 두 단계 URL 해석, directory/index/query/hash/root 기대 URL, 금지 path 및 exact-case 비교를 같은 의미로 확정했다.
- **잔여 검증:** production build artifact와 Pages 동등 경로 실행은 구현 후 `NOT TESTED`다.
- **근거:** 결정 028은 `base: './'`와 resolver의 1회 결합을 승인한다(`docs/10_DECISION_LOG.md:261-268`). 자산 계약은 current URL 추측을 금지하면서 build가 제공한 app base를 사용하라고 한다(`docs/09_ASSET_MANIFEST.md:62-74`). 통합 설계는 같은 원칙과 결과 검사만 두고(`docs/12_INTEGRATED_DESIGN_V2.md:543-552`, `707-712`), 경로 검증 방법을 구현 전 미완료 항목으로 둔다(`docs/12_INTEGRATED_DESIGN_V2.md:732`).
- **실패 양상:** 상대값 `./`을 어떤 절대 document base에 대해 해석하는지 정하지 않으면 `/LoveChemistry/`, `/LoveChemistry/index.html`, query/hash가 있는 첫 로드에서 저장소명 중복, 파일명 기준 결합 또는 루트 이탈 구현이 모두 계약을 통과했다고 주장할 수 있다.
- **차단 범위:** Slice 0 자산 resolver와 Pages 배포 계약. 가상 placeholder 자체와 자산 ID 계약은 차단하지 않는다.
- **해결 권고:** resolver 입력에 Vite 제공 base와 검증된 manifest path를 명시하고, document base를 절대 기준으로 한 1회 해석 절차를 고정한다. `/LoveChemistry/`, `/LoveChemistry/index.html`, 루트 `/`, query/hash, trailing slash, 선행 `/`, `public/`, `..`, 대소문자 불일치의 정확한 기대 URL·거부 결과 표를 구현 승인 전에 추가한다.
- **분류:** 잠금 변경 없음.

### Low

발견 없음.

## 2. 엄격 검토 결과

| 검토 항목 | 판정 | 근거·제한 |
|---|---|---|
| Slice 0 Science/GameState/persistence 비요구 | `PASS` | `docs/12:55-73`은 세 영역을 명시적으로 제외한다. 역할별 초안의 넓은 부트안보다 결정 022와 통합 문서가 우선한다. 구현은 `NOT TESTED` |
| Slice 1 topic 선행 경계 | `PASS` | 결정 043으로 QA-V2-001 종료. 실행은 `NOT TESTED` |
| production 시험 fail-closed | `PASS` 문서 계약 | 결정 044로 test-only import·export·build·E2E oracle 확정. 실행은 `NOT TESTED` |
| Slice 1 순수 snapshot과 Day 저장 | `PASS` | `docs/12:98-106`, `350-366`은 순수 round-trip과 in-memory만 포함하고 localStorage·Meta를 제외한다. UI 오인 금지도 명시됐다. 실제 persistence는 `NOT TESTED` |
| 원소 20개·He/H·주의 태그 | `PASS` | `docs/12:402-438`의 20개 값, He=2, H/He/Ne/Ar caution tag와 불변식이 Science Bible과 일치 |
| `teachingTags` 제거·topic query 소유 | `PASS` | 결정 030과 `docs/12:398-400`, `588-589`가 원소 중복 필드를 제거하고 topic에 concept/query를 둠 |
| 무료 수업·selfStudy·level 3·studyTogether | `PASS` | `docs/12:467-476`은 오후 완료 `0→1`, Slice 2의 `selfStudy`만 2·3, level 3 사전 거부, `studyTogether` UI·command 비노출을 명시. 구현은 `NOT TESTED` |
| HomeShell gallery guard | `PASS` | 상호 배타 셸, GameShell 후보 제외, 홈 전용 guard가 `docs/12:27-35`, `531-540`에 있음. 우회 E2E는 `NOT TESTED` |
| 빈 catalog 스포일러 안전 | `PASS` | 결정 040과 `docs/12:48-62`는 가짜 슬롯·Ne 존재·개수 누설을 금지 |
| virtual placeholder | `PASS` | `docs/09:19-33`과 결정 029는 바이너리 없는 CSS/text 표현과 스포일러·외형 금지를 명시 |
| 이름·접근성·브라우저 | `PASS` 문서 계약 | 결정 045로 단일 grapheme oracle 확정. WCAG 2.2 AA와 브라우저 실행은 `NOT TESTED` |
| Vite base·resolver | `PASS` 문서 계약 | 결정 046으로 두 단계 해석과 URL·거부 oracle 확정. build·Pages는 `NOT TESTED` |
| 최종 대사·루트 상세 금지 | `PASS` | 결정 039와 `docs/12:554-562`는 final dialogue, 실제 SceneId/ChoiceId, route 상세를 금지. 기존 `docs/04` 골격은 배경 제안이며 V2 fixture 승격 금지 |
| 결정 022~046의 무단 잠금 변경 | `PASS` | 모두 PM 권한의 구현 시점·내부 상태·API·QA 범위 결정이다. 043~046도 잠금값을 바꾸지 않고 Slice 소유권과 검증 oracle만 구체화한다 |

## 3. Slice 게이트

| Slice | 문서 계약 결과 | QA 게이트 | 실행 상태 |
|---|---|---|---|
| Slice 0 | Science·GameState·persistence 제외, 셸·갤러리·placeholder·이름·resolver 계약 `PASS` | `READY FOR PM IMPLEMENTATION AUTHORIZATION` | 코드·접근성·브라우저·Pages `NOT TESTED` |
| Slice 1 | topic 없는 Day/phase·슬롯·fail-closed·순수 snapshot·test-only 경계 `PASS` | `READY FOR PM IMPLEMENTATION AUTHORIZATION` | 상태기계·snapshot·번들·E2E `NOT TESTED` |
| Slice 2 | Science 값·topic ownership·학습·주기율표 및 Slice 1 연계 계약 `PASS` | `READY FOR PM IMPLEMENTATION AUTHORIZATION` | 데이터·validator·UI·접근성 `NOT TESTED` |

Slice 0~2는 문서 계약 기준 `READY FOR PM IMPLEMENTATION AUTHORIZATION`이다. 그러나 PM 또는 사용자의 별도 구현 승인 전에는 Ready to Code나 구현 착수로 해석하지 않는다.

## 4. Change Control

- 결정 022~046에서 사용자 승인이 필요한 잠금 변경을 몰래 포함한 항목은 발견하지 않았다.
- 종료된 finding은 모두 PM 권한 범위의 계약·검증 보완이며 `BLOCKED CHANGE REQUEST`가 아니다.
- Day 기반 저장을 실제 장면 저장으로 확대, 시험 test port를 production에 노출, 시험 도구 범위를 확대, 무료 수업으로 2·3 지급, 홈 밖 갤러리 허용처럼 잠금을 바꾸는 해결안은 허용하지 않는다.
- 위와 같은 잠금 변경이 해결안으로 제안되면 QA는 승인하지 않고 별도 `BLOCKED CHANGE REQUEST`로 전환해 사용자 승인 전까지 차단한다.

## 5. 재검토 결론

1. 결정 043으로 topic 소유·명령·snapshot 계약이 정렬됐다.
2. 결정 044로 시험 test-only port의 파일·import·export·production build 및 단위·E2E oracle이 문서화됐다.
3. 결정 045로 단일 grapheme 구현, 기대 corpus와 Segmenter 불일치 정책이 확정됐다.
4. 결정 046으로 `base: './'` resolver의 입력·해석 기준과 URL·거부 fixture가 확정됐다.
5. QA-V2-001~004는 문서 계약 기준 `CLOSED`다. 코드 합격에는 구현 후 별도 실행 증거가 필요하다.
