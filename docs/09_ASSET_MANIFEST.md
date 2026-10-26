# 자산 매니페스트

**상태:** `V2 자산 소비 계약 승인 / 실제 자산·비주얼·구현 미승인`

**기준:** `docs/00_PM_MASTER_SPEC.md`, `docs/01_LOCKED_GAME_RULES.md`, `docs/12_INTEGRATED_DESIGN_V2.md`

**적용 단계:** Slice 0~2 가상 자산, 후속 실제 자산 통합

## 1. 목적과 경계

화면과 콘텐츠가 파일명 대신 안정된 논리 자산 ID를 사용하도록 매니페스트, 경로, fallback의 책임을 정한다. 이 계약은 자산 제작 승인, 캐릭터 외형 확정, 실제 이미지 추가 또는 preload 승인이 아니다.

- 캐릭터 스프라이트, 캐릭터 포함 CG, 외형 시안, 생성 프롬프트를 현재 만들지 않는다.
- 머리, 눈, 체형, 키, 복장, 액세서리, 화풍, 표정 시트, CG 구도와 실제 자산 비율은 유예한다.
- UI는 HTML/CSS와 실제 텍스트를 우선하며 래스터 UI 전체 화면을 만들지 않는다.
- 음향 자산, ID, 폴더, 로딩 상태를 만들지 않는다.
- Slice 0~2에는 바이너리 이미지가 없어도 정상 동작해야 한다.

## 2. Slice 0~2 가상 placeholder

Slice 0~2의 표준 placeholder는 WebP 실파일이 아니라 CSS와 텍스트로 렌더링하는 가상 항목이다. `path`, `format`, `width`, `height`가 없으며 resolver가 네트워크 URL을 만들지 않는다.

| 종류 | 허용 표현 | 금지 표현 |
|---|---|---|
| 캐릭터 | 테두리·단색 컨테이너와 `캐릭터 영역` 같은 기능 텍스트 | 사람 실루엣, 성별·체형·머리·복장 암시 |
| 배경 | 단색 면과 `배경 준비 중`, 승인된 장소명 | 미승인 구도·최종 미술 암시 |
| CG·갤러리 | 스포일러 없는 상태 텍스트 | 캐릭터·사건·Ne 존재를 추측하게 하는 슬롯·문구 |
| 아이템 | 항목명 또는 일반 텍스트 배지 | 최종 외형·희귀도 확정 |
| UI 장식 | HTML/CSS 선·면·텍스트 | 래스터 프레임, 이미지 속 텍스트 |

정상 placeholder와 실제 파일 로드 실패는 서로 다른 상태로 표시한다. 장식 placeholder는 빈 대체 텍스트를 사용하고 필요한 정보는 실제 텍스트로 제공한다.

Slice 0 홈 갤러리는 카탈로그가 없으면 정상 빈 상태다. 가짜 잠금 슬롯, 캐릭터명, 루트명, 사건명, 조건, Ne 존재나 항목 수를 노출하지 않는다.

## 3. 논리 ID와 경로

- ID는 영문 소문자, 숫자, 점, 밑줄만 사용한다.
- ID에는 확장자와 공개 경로를 넣지 않는다.
- 캐릭터 ID는 `h`, `c`, `o`, `f`, `na`, `cl`, `ne`를 사용한다.
- `neutral`은 예약 표현 ID일 뿐 최종 표정 디자인이 아니다.
- 과학 사실, 호감도, 해금, 루트 조건을 자산 ID에 인코딩하지 않는다.
- 한 번 채택된 ID는 다른 의미로 재사용하지 않는다.

향후 실제 파일의 공개 상대 경로는 다음 패턴을 사용한다.

| 분류 | 공개 상대 경로 패턴 | 저장소 위치 예 |
|---|---|---|
| 캐릭터 | `assets/characters/{characterId}/{expressionId}.{ext}` | `public/assets/characters/h/neutral.webp` |
| CG | `assets/cg/{cgId}.{ext}` | `public/assets/cg/h_route_event_01.webp` |
| 배경 | `assets/backgrounds/{backgroundId}.{ext}` | `public/assets/backgrounds/classroom_day.webp` |
| 아이템 | `assets/items/{itemId}.{ext}` | `public/assets/items/placeholder_gift.webp` |
| UI | `assets/ui/{uiAssetId}.{ext}` | `public/assets/ui/example.webp` |

런타임 `path`는 반드시 `assets/...` 형식이며 다음을 금지한다.

- 선행 `/` 및 절대 `/assets/...`
- `public/` 접두어
- 프로토콜, 호스트, 쿼리, 해시
- `.`·`..` 경로 구간과 역슬래시
- 저장소명 또는 Vite `base`의 중복 저장

## 4. Vite base, public, resolver 책임

V1 Vite `base`는 `./`로 승인한다. 매니페스트는 이 값을 저장하지 않는다.

| 주체 | 책임 | 금지 |
|---|---|---|
| 빌드 설정 | Vite `base: './'`로 문서 기준 상대 산출물 생성 | 매니페스트 항목마다 저장소명 주입 |
| Asset Integration | `public/`의 저장소 위치와 `assets/...` 공개 상대 경로 일치 검수 | 런타임 URL에 `public/` 포함 |
| resolver | 결정 046의 두 단계 URL 해석을 각각 한 번 수행 | base 복제, 현재 surface·route 문자열에서 추측 |
| Frontend | 논리 ID 요청과 resolver 결과 표시 | JSX·CSS·콘텐츠에 `/assets/...` 하드코딩 |
| QA | 루트가 아닌 Pages 동등 경로와 대소문자 검증 | 개발 서버 성공만으로 합격 판정 |

CSS·TS import 자산은 Vite 생성 URL을 사용한다. `public` 실제 자산만 이 문서의 매니페스트 상대 경로와 resolver를 사용한다.

resolver는 manifest path를 먼저 검증한 뒤 다음 순서를 고정한다.

```ts
const appBaseUrl = new URL(import.meta.env.BASE_URL, document.baseURI)
const assetUrl = new URL(validatedPath, appBaseUrl)
```

`BASE_URL='./'`에서 `https://example.test/LoveChemistry/`와 `https://example.test/LoveChemistry/index.html?x=1#top`의 `assets/ui/a.webp`는 모두 `https://example.test/LoveChemistry/assets/ui/a.webp`로 해석한다. `https://example.test/`에서는 `https://example.test/assets/ui/a.webp`다. 빈 path, duplicate slash, trailing slash도 3절의 금지 입력과 함께 거부한다. 대소문자를 변환하지 않고 manifest path와 build artifact를 문자 단위 exact case로 비교한다.

## 5. 매니페스트 레코드

런타임 매니페스트는 논리 ID를 키로 하는 하나의 정본이다.

| 필드 | 필수 | 계약 |
|---|---:|---|
| `id` | 예 | 안정 논리 ID |
| `kind` | 예 | `character`, `cg`, `background`, `item`, `ui`, `placeholder` |
| `status` | 예 | `placeholder`, `proposed`, `approved`, `integrated` |
| `path` | 조건부 | `integrated` 바이너리에서 필수인 공개 상대 경로 |
| `format` | 조건부 | `path`가 있을 때 필수, 실제 인코딩과 일치 |
| `width`, `height` | 조건부 | 실제 파일 검수 후 양의 정수 |
| `placeholderId` | 선택 | 향후 매니페스트 fallback 사용 시 호환 종류 ID |
| `associations` | 예 | 정규화된 연관 목록, 빈 목록 허용 |
| `source` | 실제 자산 | 검수 가능한 출처 기록 참조 |
| `rightsStatus` | 실제 자산 | 사용 권한 확인 상태 |
| `spoilerLevel` | CG·민감 자산 | 노출·진단 제한 분류, 해금 규칙은 아님 |
| `altOwner` | 정보성 자산 | 대체 설명 승인 책임 |

제작·검수 원본과 공개 런타임 projection은 분리할 수 있으나 논리 ID와 상태 의미를 바꾸지 않는다.

## 6. 상태와 로드 가능성

| 상태 | 의미 | 바이너리 로드 |
|---|---|---:|
| `placeholder` | CSS/텍스트 가상 대체 또는 외형 중립 준비 상태 | 경로가 없으면 금지 |
| `proposed` | 후보 슬롯·자산, 미승인 | 금지 |
| `approved` | 내용·권리 검토 승인, 파일 통합 미완료 가능 | 금지 |
| `integrated` | 파일, 경로, 형식, 치수, 권리, 기본 로드 검증 완료 | 허용 |

실제 바이너리 URL은 `integrated`에서만 반환한다. `approved`를 로드 가능 상태로 해석하지 않는다.

## 7. associations

평면 `associationIds` 대신 다음 의미 구조를 사용한다.

| 필드 | 의미 |
|---|---|
| `type` | `character`, `event`, `location`, `item`, `scene`, `galleryEntry` 등 참조 도메인 |
| `id` | 해당 도메인의 정본 ID |
| `role` | 필요한 경우 `subject`, `speaker`, `setting`, `reward`, `thumbnailFor` 등 관계 역할 |

연관은 검색·검수·교체 영향 분석용이다. 해금, 렌더 순서, 엔딩 우선순위, 성격, 외형, 과학 사실을 결정하지 않는다. Slice 0~2에서는 실제 SceneId, ChoiceId, CG 이벤트 ID를 발명하지 않는다.

## 8. resolver와 fallback

resolver는 ID 선언, 종류, 상태, 상대 경로, 형식, fallback 순환을 검증해 URL 또는 구조화된 가상 fallback을 반환한다. 파일 자동 발견, 해금·스포일러 판정, 게임 상태 변경은 책임지지 않는다.

| 실패 | 처리 |
|---|---|
| 미등록 ID | 종류를 알면 종류별 가상 placeholder, 아니면 공통 텍스트 fallback |
| `placeholder`·`proposed`·`approved` | 네트워크 요청 없이 가상 fallback |
| 빈 경로·규칙 위반 | URL을 만들지 않고 가상 fallback |
| 형식·인코딩 불일치 | 다른 실제 자산으로 바꾸지 않고 가상 fallback |
| 404·디코드 실패 | 화면을 유지하고 오류 상태와 가상 fallback 표시 |
| fallback 순환·실패 | 재귀를 중단하고 최종 텍스트 fallback |

미해금 CG는 실제 경로를 요청하지 않는다. 해금된 CG 파일 실패와 미해금 상태를 같은 문구로 합치지 않는다. 자산 실패는 게임 상태, 과학 사실, 해금 상태를 바꾸지 않는다.

## 9. 형식과 유연 레이아웃

- 기본 래스터 형식은 WebP다. 검증된 무손실 투명도 필요가 있을 때만 PNG를 제안한다.
- SVG는 필요성과 외부 참조·스크립트 금지 검수를 별도 승인한다.
- 확장자, 선언 형식, 파일 시그니처는 일치해야 한다.
- 실제 크기와 비율은 레이아웃 고정값이 아니라 검수·변형 선택 메타데이터다.
- Slice 0~2는 고정 이미지 비율을 가정하지 않으며 대화와 조작성을 자산 영역보다 우선한다.
- `contain`·`cover`, 안전 영역, 다중 해상도는 실제 자산 승인 뒤 정한다.

## 10. preload 유예

Slice 0~2에는 이미지 preload를 구현하지 않는다. 실제 파일 목록, 용량, 모바일 메모리, 스포일러 정책이 승인된 뒤 현재 화면과 확정된 다음 문맥의 소수 자산만 측정해 별도 승인한다. 잠긴 CG와 Ne 관련 자산은 해금·문맥 판정 전에 요청하지 않는다.

## 11. 통합·QA 게이트

실제 자산 통합 전 출처·권리, 논리 ID, 경로, 형식, 치수, 투명도, 용량, 대체 설명 책임, 스포일러, fallback을 검토한다.

- `integrated` 항목의 파일 존재, 대소문자, 형식·시그니처·치수 일치를 검사한다.
- 모든 association이 존재하는 올바른 도메인 ID를 참조하는지 검사한다.
- macOS에서 통과한 대소문자 오류가 Pages에서 실패하지 않도록 문자 단위로 비교한다.
- 하위 경로에서 첫 로드·새로고침·오버레이 왕복 후에도 경로가 유지되는지 검사한다.
- 절대 `/assets/...`, `public/`, 저장소명 중복 요청은 0건이어야 한다.
- 바이너리 0개, 모바일 세로·가로, 200% 확대, reduced motion에서도 Slice 0~2 핵심 흐름이 가능해야 한다.
- 실제 자산 비율·preload·시각 회귀는 후속 게이트이며 현재 완료로 판정하지 않는다.

## 12. 결정 상태

CR-AI-01~05는 2026-09-28 PM 구현 결정으로 모두 채택됐다. 이는 잠금 변경이 아니라 외형 유예, GitHub Pages 경로, 자산 통합 상태를 구체화한 계약이다. 코드·바이너리·실제 자산 통합은 여전히 미승인이다.
