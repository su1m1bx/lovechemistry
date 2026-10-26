# 구현 준비 충돌 점검

**점검일:** 2026-10-26  
**대상:** 현재 다음 작업인 Slice별 구현 승인 준비, 공개 인터페이스·테스트 준비, 문구 검토, 담당 배정 및 Git 연결  
**성격:** PM 관점의 문서 대조·위험 식별. QA 공식 재검토나 구현 승인이 아니다.

## 1. 요약

기존 QA-V2-001~004의 `CLOSED / 문서 계약 PASS` 이력은 유지한다. 다만 역할별 옛 제안과 통합 계약의 차이, 아직 구체화되지 않은 인터페이스와 경계 조건 때문에 그대로 분담 구현하면 충돌할 수 있다.

아래 우선순위는 **이번 점검의 조정 권고**이며 기존 QA 심각도나 공식 차단 판정을 대체하지 않는다. `High`는 해당 구현에 앞서 계약을 합의할 것을 권고하는 항목이고 전체 Slice 0~2의 일괄 차단을 뜻하지 않는다.

| ID | 우선순위 | 충돌 지점 | 영향 시점 | 조정 주 담당 |
|---|---|---|---|---|
| REVIEW-01 | High | 옛 역할 설계와 통합 계약을 서로 다른 기준으로 구현 | Slice 0 착수 전부터 | PM 및 각 역할 |
| REVIEW-02 | High | 명령·selector·오류·fingerprint의 실제 공개 계약 불일치 | Slice 1~2 통합 전 | State + Systems + Frontend |
| REVIEW-03 | High | Day 전환 receipt 정리와 명령 재전송 보장 | Slice 1 상태기계 구현 전 | State + QA |
| REVIEW-04 | Medium | topic query 정의 부재와 과학 정본·검증 책임 | Slice 2 데이터·도구 구현 전 | Science + State + QA |
| REVIEW-05 | High | 인코딩된 점 경로와 URL 정규화의 경로 이탈 | Slice 0 resolver 구현 전 | Asset + Frontend + QA |
| REVIEW-06 | Medium | 부트 manifest 실패 차단과 런타임 자산 fallback 구분 | Slice 0 부트·자산 연동 전 | Asset + Frontend |
| REVIEW-07 | Medium | 공통 파일·테스트 설정·수동 검증 담당 중복 또는 누락 | 초기 설정과 통합 전 | PM + Frontend + QA |

## 2. 상세 점검

### REVIEW-01 / 옛 제안이 살아 있어 잘못된 구현 기준을 고를 수 있음

- **근거:** `docs/12_INTEGRATED_DESIGN_V2.md` 1·3·11절은 후속 PM 결정과 통합 계약이 역할별 미채택 제안보다 우선한다고 명시한다. 하지만 `agents/state-save/DESIGN_V2.md` 2.2절·7절은 Slice 0 저장 검사와 저장 fixture를, 2.8절은 `academics.topics`와 함께 공부 실행을 여전히 원안으로 담고 있다. Frontend V2 2.1절·3.4절에도 저장·복원 UI가 남아 있다. Science V2 2.2·2.10·3절에는 제거된 `teachingTags`와 관련 registry가 남아 있다.
- **예상 충돌:** Frontend가 Slice 0 저장 요약을 요구하거나, State와 Science가 서로 다른 학업 상태 shape를 만들거나, 제거된 태그·함께 공부 실행을 먼저 구현한다.
- **권고:** 구현 작업서마다 `docs/12`와 적용 결정 번호를 고정하고, 옛 제안의 비채택 항목을 명시적으로 나열한다. 이미 해결된 규칙을 새 미정 사항으로 다시 올리지 않는다. 실제 문서 정렬은 소유 역할과 PM 검토 뒤 수행한다.

### REVIEW-02 / 함수명만 같아도 실제 명령 계약이 맞지 않을 수 있음

- **근거:** `docs/12` 6절은 `commandId`, `applied/duplicate/rejected`와 함수명을 정하지만 selector의 구체 입출력, 공통 명령 envelope와 오류 타입은 충분히 정의하지 않는다. State V2 2.4절은 `expectedStateRevision`과 `COMMAND_ID_CONFLICT`를 사용하고, Science V2 4.2절은 `effectId`와 `already-applied`, `performStudy` 등을 사용한다. 통합 계약은 `performSelfStudy`를 채택한다. fingerprint 정본 직렬화는 `docs/12` 13절에서 유예돼 있다.
- **예상 충돌:** UI가 revision 없이 호출하거나, 전송 중복을 게임 효과 중복과 혼동하거나, 같은 오류가 역할마다 다른 코드로 반환된다. 객체 키 순서·누락값·revision 포함 여부가 다르면 같은 요청의 재전송 판정도 달라진다.
- **권고:** State 소유의 공통 command envelope·receipt·결과·오류 계약, Systems 소유의 행동 가능 판정, UI가 소비하는 selector view를 먼저 합의한다. fingerprint에 포함할 필드와 직렬화 기대값을 고정하고 `runId`, `commandId`, `effectId`의 생성 주체와 수명을 분리한다. UI가 누락된 규칙을 자체 계산하게 하지 않는다.

### REVIEW-03 / 다음 Day에서 receipt를 지우면 경계 명령 재시도 의미가 모호함

- **근거:** `docs/12` 5.3절은 receipt를 다음 `dayStart`에서 정리하도록 한다. 동시에 6.4절은 같은 ID·fingerprint를 revision 검사보다 먼저 확인해 `duplicate`로 반환하도록 한다. `commitDayEnd` 자체가 다음 `dayStart`를 생성하지만 그 명령 receipt의 Day 귀속과 정리 순서는 명시되지 않았다.
- **예상 충돌:** Day 1 종료 성공 뒤 응답을 놓쳐 같은 요청을 재전송했을 때, 구현 순서에 따라 `duplicate`, `STALE_STATE` 또는 ID 재사용 허용이 달라질 수 있다. 이는 즉시 Day가 중복 증가한다는 확정 결함이 아니라 중복 방지 보장 범위의 빈틈이다.
- **권고:** 이전 Day receipt 정리와 경계 명령 receipt 기록 순서, 같은 ID의 다른 Day·다른 회차 사용 허용 여부, 경계 재전송의 기대 결과를 합의한다. `commitDayEnd` 직후 재전송, 다음 Day 진행 후 재전송, 시험 결과·terminal 재전송을 별도 테스트한다. effect ledger를 Day receipt와 함께 삭제하지 않는다.

### REVIEW-04 / Science query 인터페이스가 이름만 있어 소비 계층이 따로 만들 위험

- **근거:** `docs/12` 5.5절은 `queryDefinitions: readonly ScienceQueryDefinition[]`를 요구하지만 해당 타입·허용 질의·검증 규칙의 구체 정의는 현재 문서에서 확인되지 않는다. 5.7절은 topic과 capability의 의미를 정하고, Science V2 3절의 topic 타입은 `conceptKeys`까지만 제시한다.
- **예상 충돌:** Frontend가 필터·비교식을 독자 작성하거나, State가 topic 목록을 다시 정의하거나, Science validator와 UI가 서로 다른 query shape를 사용한다. 정본을 읽어 같은 정본과만 비교하는 테스트는 잘못된 과학값도 놓칠 수 있다.
- **권고:** Science가 query 정의·타입·참조 유효성·실패 결과를 소유하고 State와 UI는 이를 소비한다. QA는 문서의 승인 수용값으로 정확성을 별도 확인하되, 테스트용 기대값을 두 번째 런타임 과학 catalog나 가짜 학습 데이터로 사용하지 않는다.

### REVIEW-05 / `%2e%2e` 경로가 URL 해석 중 상위 경로로 정규화됨

- **근거:** `docs/09_ASSET_MANIFEST.md` 3·4절과 `docs/12` 8절은 점 segment·절대 경로 등을 URL 생성 전에 거부하도록 한다. Asset V2는 URL 인코딩 전 값을 저장하도록 하지만 `%` 입력의 거부·해석과 URL 생성 후 경로 포함 관계의 기대값은 명시돼 있지 않다.
- **진단 재현:** Node의 WHATWG URL 파서에 승인된 두 단계 결합 절차를 적용했다.

  | document 기준 | 입력 path | URL 파서 결과 |
  |---|---|---|
  | `https://example.test/lovechemistry/` | `assets/ui/a.webp` | `https://example.test/lovechemistry/assets/ui/a.webp` |
  | 같은 기준 | `assets/%2e%2e/%2e%2e/out.webp` | `https://example.test/out.webp` |

- **예상 충돌:** validator가 문자열 `..`만 검사하면 `assets/`로 시작하고 literal 점 segment도 없는 입력이 저장소 밖을 가리킬 수 있다. **실제 validator는 아직 없으므로 제품 취약점이 확인됐다는 뜻은 아니다.** URL 파서 동작과 누락된 거부 기대값을 확인한 것이다.
- **권고:** 인코딩된 경로를 허용할지와 검증 순서를 합의한다. 최소한 인코딩된 점 segment의 대소문자·혼합형을 거부 테스트에 넣고, 최종 URL의 origin과 앱의 `assets/` 하위 경로 보존도 검증한다. 경로 계약을 수정한다면 Asset·PM·QA 검토를 거친다.

### REVIEW-06 / 잘못된 manifest를 부트 실패와 fallback 중 어디서 처리하는지 구분 필요

- **근거:** `docs/12` 3.1절은 부트의 virtual manifest가 유효하지 않으면 fail-closed로 홈 실행 동작을 막는다. `docs/09` 8절은 미등록 ID·잘못된 path·fallback 순환 등에 가상 fallback을 반환하도록 한다.
- **예상 충돌:** 한 담당자는 잘못된 초기 manifest도 fallback으로 통과시키고, 다른 담당자는 런타임 이미지 하나의 404 때문에 앱 전체를 차단할 수 있다.
- **권고:** 부트 필수 manifest의 구조·참조 검증 실패, 정상 가상 placeholder, 소비자의 미등록 ID 요청, 통합 이미지의 네트워크 실패를 구분해 테스트한다. 부트 실패 정책과 개별 이미지 복구 정책을 같은 예외 처리기로 합치지 않는다. 과학 필수 bundle 실패는 이미지와 달리 대체값 없이 차단한다.

### REVIEW-07 / 첫 설정과 공유 파일의 편집 책임·검증 담당이 겹칠 수 있음

- **근거:** `docs/12` 4·10·16절은 구조와 영역 소유권을 정하지만 아직 프로젝트 설정 파일이 없고 수동 검증 담당도 미배정이다. `src/state/commands.ts`, 부트·상태 결합, Science catalog, manifest·resolver는 역할 간 접점이다.
- **예상 충돌:** Frontend와 QA가 각자 Vite/Vitest/Playwright 설정이나 package lockfile을 만들거나, Systems와 State가 같은 command·selector를 각각 구현한다. 빈 폴더는 Git에 들어가지 않으므로 다른 환경에서 로컬 골격을 전제로 작업하는 것도 실패할 수 있다.
- **권고:** 초기 패키지·빌드 설정과 lockfile 통합 담당 1명, State 공개 facade 담당, Science catalog 담당, Asset resolver 담당을 작업서에서 배정한다. QA는 검증 요구와 테스트를 제공하고 공유 설정 변경은 통합 담당과 조정한다. 키보드·포커스·200%·모바일·브라우저 수동 검증 담당과 증거 형식도 배정한다. 파일은 필요한 Slice에서 생성하며 골격 전체를 선구현하지 않는다.

## 3. 이미 결정됐으며 다시 열지 않을 경계

| 경계 | 유지할 계약과 충돌 예방 |
|---|---|
| Slice 0 새 게임 | 이름 검증만 수행. GameState·Day 진입과 Science fake를 넣지 않음 |
| Slice 1 수업 | topic 없는 일반 전이. topic·무료 숙련도 상승은 Slice 2에서 동시 도입 |
| 저장과 개발 검증 | Slice 1~2 in-memory는 개발·통합 검증용. 실제 저장으로 표시하거나 저장 없는 출시 모드로 공개하지 않음 |
| 시험과 30일 검증 | production은 시험 phase에서 멈춤. 49/50/100은 tests-only graph에서만 주입. 30일 테스트를 위해 제품용 통과 버튼·debug export를 만들지 않음 |
| 학습과 콘텐츠 | Slice 2는 selfStudy만 실행, level 3은 슬롯 미소비 거부. studyTogether 실행·호감도·루트는 후속 별도 승인 |
| 갤러리 | 홈 전용·카탈로그 없는 정상 빈 상태. 가짜 슬롯·숨은 캐릭터 존재를 누설하지 않음 |
| UI 카피 | 중립 기능·상태 문구는 가능. final 캐릭터 대사·SceneId·ChoiceId를 발명하지 않음 |
| 사용자 확정 질문 | OQ-001~003은 해결됨. 이번 기술·역할 조정 권고를 기존 제품 질문의 재개로 취급하지 않음 |

## 4. Git 및 배포 경계

- 지정 원격: `origin = https://github.com/su1m1bx/lovechemistry.git`.
- 점검 시점에 `git ls-remote`는 성공했고 ref 목록이 비어 있었다. 따라서 당시 비교할 원격 변경·병합 충돌은 없었다. push 시점에 바뀌면 일반 push의 거부를 따르고 강제로 덮어쓰지 않는다.
- 커밋·push는 문서 보관 작업이며 구현 승인·GitHub Pages 배포와 다르다. Pages 설정·실배포는 아직 검증하지 않았다.
- 저장소 이름은 소문자 `lovechemistry`다. 문서의 대문자 `/LoveChemistry/`는 테스트 예시이며 실제 배포 경로로 하드코딩하지 않는다. 루트·예시 경로뿐 아니라 실제 소문자 경로와 `index.html?x=1#top`에서도 resolver를 검증한다.
- `base: './'`, 무라우터 전환, 파일명 exact-case 비교는 그대로 유지한다. 원격 이름을 맞추기 위해 대소문자를 일괄 변환하지 않는다.

## 5. 권고 조정 순서

1. **Slice 0 승인 준비:** REVIEW-01의 작업 기준 고정, REVIEW-05·06의 자산 검증 경계, REVIEW-07의 설정·검증 담당을 정리한다.
2. **Slice 1 착수 전:** REVIEW-02의 공개 명령·결과·오류·fingerprint와 REVIEW-03의 Day 경계 멱등성을 합의한다.
3. **Slice 2 착수 전:** REVIEW-04의 query 정의와 원소·topic 수용 검사, State·UI 소비 계약을 정리한다.
4. 각 변경은 담당 제안 → PM 계약·결정 기록 → 관련 QA 재검토 → 별도 구현 승인 순으로 처리한다.

이번 점검에서는 제품 잠금 변경이 필요한 새 요구를 발견하지 않았다. 승인 결정, 기존 QA 보고서와 구현 금지는 그대로 유지한다. 실행한 것은 원격 Git 조회와 URL 파서 진단이며 앱·테스트·production build는 계속 `NOT TESTED`다.
