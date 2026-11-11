# FIELDNOTES — 프리미엄 농작물 브랜드 프로젝트

고운밭, ONARI, HECALE, ERSA의 브랜드 포트폴리오와 서비스 준비 과정을 공유하는 프로젝트입니다. 하나의 배포 안에서 **포트폴리오**, **전체 작업 기록**, **서비스 운영 기준**을 각각 독립된 화면으로 제공합니다.

FIELDNOTES는 문서 공간의 이름입니다. 실제 운영할 브랜드 1개, 작물·상품 구성·가격·공급 조건은 아직 결정되지 않았습니다. 디자인 승인과 서비스 출시 준비 상태를 구분해서 기록합니다.

## 세 공간

| 경로 | 대상과 목적 | 포함되는 내용 |
| --- | --- | --- |
| `/` | 처음 방문하는 사람 | 세 공간으로 이동하는 인덱스, 기존 공유 주소 연결 |
| `/showcase/` | 브랜드를 감상하고 의견을 남기는 사람 | 네 프로젝트의 FINAL을 브라우저 너비로 감상하는 화면, 프로젝트 인덱스의 추천 수, 엄지척 투표 버튼 |
| `/journal/` | 기획·디자인·개발 과정에 참여하는 사람 | 요청과 변경 과정, 결정 이유, 포트폴리오, 기존 리서치와 후보안, 원본 산출물, 컴포넌트 |
| `/operations/` | 실제 서비스 운영을 준비하는 담당자 | 브랜드·디자인·콘텐츠·개발·마케팅·운영 기준, 확인할 사항, 브랜드별 최종 포트폴리오 |

추천은 반복 투표를 허용합니다. 추천 수는 의견 수집 자료이며 최종 운영 브랜드의 승인 결과를 뜻하지 않습니다.

두 Storybook은 별도의 설정과 엔트리로 빌드됩니다. 운영판은 허용된 운영 문서와 포트폴리오 자산만 복사하며, 과거 조사 자료와 외부 디자인 참고 작업을 포함하지 않습니다. 작업 기록판은 기존 자료와 공유 ID를 보존합니다.

### 작업 기록에 보존된 자료

| 영역 | 내용 |
| --- | --- |
| 기존 문서 | BX 8개, 디자인 4개, 개발 4개, 마케팅 3개, 운영 5개: 총 24개 |
| 탐색 | 홈, 문서 검색, 시장 벤치마크, 디자인 사례, 토큰, 자료실 |
| 조사 | 시장 벤치마크 35개, Plus X 공개 프로젝트 분석 146개 |
| 컴포넌트 | 6종, 문서 6개, 스토리 18개 |
| 원본 산출물 | 리서치·WBS·템플릿, BX Foundation PDF·ZIP·Markdown, 분석 CSV·심층 분석, 결정 기록·농가 질문지, 구조화 데이터와 문서별 Markdown |
| 신규 기록 | 초기 서비스 구상부터 심볼·응용·최종 포트폴리오·공유 화면까지의 요청, 결정, 변경 이유와 근거 |

146개는 조사 시점의 공식 공개 프로젝트 목록이며 역사상 모든 작업을 뜻하지 않습니다. 시장 사례 35개와 디자인 참고 작업 146개는 서로 다른 조사 집합입니다. 기존 문서의 가설과 초안을 현재 승인된 운영 기준으로 취급하지 않습니다.

### 운영 문서의 상태

| 상태 | 사용 방식 |
| --- | --- |
| 확정 기준 | 현재 승인된 범위에서 적용할 기준 |
| 운영 제안 | 담당자가 검토하고 실제 조건에 맞게 확정할 절차와 기준 |
| 결정 대기 | 출시 또는 적용 전에 필요한 정보와 책임자의 결정이 남아 있는 항목 |

ONARI의 선택 심볼과 DM Sans Medium 대문자 영문 워드마크 A 조합은 승인된 디자인입니다. 이것이 단일 운영 브랜드 선정, 농가 계약, 상품 확정 또는 판매 개시를 의미하지는 않습니다.

## 실행과 검증

Node 22.12 이상이 필요합니다. CI는 Node 24를 사용합니다.

```bash
npm ci                 # package-lock.json 기준 설치
npm run content        # 원본 → MDX·메타데이터·다운로드 생성
npm run dev            # 작업 기록 Storybook: http://localhost:6006
npm run dev:operations # 운영 기준 Storybook: http://localhost:6007
npm run dev:showcase   # 전체 화면 포트폴리오 Vite 미리보기
npm run check          # TypeScript + 기존 자료 + 신규 포털 콘텐츠 검사
npm run build          # 두 Storybook + 포트폴리오 + 루트 인덱스 빌드
npm run verify:build   # 실제 빌드 ID·자료 분리·다운로드·자산·상대 경로 검사
```

개별 화면만 확인할 때는 `npm run build:journal`, `npm run build:operations`, `npm run build:showcase`를 사용할 수 있습니다. 배포할 때는 항상 `npm run build`로 전체 결과를 만듭니다.

`npm run content`는 `public/portfolio-v15/`의 최종 자산과 `content/portfolio-data.json`을 사용합니다. 원본에 등록된 장표·대표 이미지가 없으면 검사에서 실패합니다. 임시 빈 이미지나 임의 데이터를 자동으로 대신 넣지 않습니다.

## 원본과 생성 파일

| 경로 | 역할 |
| --- | --- |
| `content/journal-records.json` | 작업 단계, 승인·변경·미결정 사항, 근거와 산출물 링크 |
| `content/operations-data.json` | 운영판의 요약·확정 사항·결정 대기 항목과 운영 문서 |
| `content/portfolio-data.json` | 네 브랜드의 소개, Figma 주소, 대표 이미지, FINAL 장표 목록 |
| `content/guide-data.json` | 기존 24개 문서의 원본 |
| `content/benchmarks.json` | 시장 벤치마크의 사실·해석·공식 출처 |
| `content/plusx-research.json` | 디자인 사례 분석·조사 범위·출처 |
| `content/published-ids.json` | 이미 공유된 기존 문서 ID 등록부 |
| `public/portfolio-v15/` | FINAL 장표와 브랜드별 이미지·벡터 자산 |
| `.storybook/` | 작업 기록 Storybook 설정 |
| `.storybook-operations/` | 운영 기준 Storybook 설정 |
| `src/portals/` | 기록·운영·포트폴리오 공통 화면 |
| `src/showcase/` | 전체 화면 포트폴리오와 투표 UI |
| `src/stories/` | 기존 문서 MDX와 컴포넌트 스토리 |
| `src/portal-stories/` | 두 Storybook의 신규 MDX 엔트리, 자동 생성 |
| `src/generated/` | 문서·포털 색인, 자동 생성 |
| `scripts/` | 생성·개발 서버·빌드·검증 |

운영판의 공개 파일은 `.cache/operations-public/`에 매번 새로 구성합니다. `operations-data.json`, `portfolio-data.json`, 운영 문서별 Markdown, 공통 아이덴티티 파일, `portfolio-v15/`만 허용합니다. 포트폴리오 화면은 `.cache/showcase-public/`의 `portfolio-v15/`만 사용합니다. 이 캐시와 `dist/`는 커밋하지 않습니다.

## 문서를 수정하는 절차

1. 목적에 맞는 `content/*.json` 원본을 수정합니다. 새 결정을 과거 기록에 덮어쓰지 말고 결정·변경 이유를 함께 남깁니다.
2. `npm run content`를 실행하여 MDX, 색인과 다운로드를 갱신합니다. 생성 파일을 직접 수정하지 않습니다.
3. 해당 공간의 개발 서버에서 제목·본문·표·링크·모바일 화면을 확인합니다.
4. `npm run check`, `npm run build`, `npm run verify:build`가 모두 통과해야 합니다.
5. 번호가 있는 작업 브랜치(`feat/NNN-이름`)의 변경을 검토하고 `dev`에 반영합니다. `main`에는 머지·푸시하지 않습니다.
6. 게시가 승인된 작업은 `dev`에서 수동 배포 워크플로를 실행합니다. 자동 게시 트리거를 추가하지 않습니다.

### 기존 문서를 추가할 때

`content/guide-data.json`의 `documents` 배열에 `id`, `code`, `category`, `title`, `summary`, `status`, `updatedAt`, `sections`, `sources`와 관련 문서를 작성합니다. 필수 구조는 인접 문서와 `public/downloads/guide-template.md`를 참고합니다. 새 ID는 `content/published-ids.json`에도 등록합니다.

`downloadAssetIds`에는 `scripts/lib/content.mjs`의 `ASSETS`에 등록된 자료 ID를 넣습니다. 외부 사실에는 공식 출처를 남기고, 확인한 사실과 우리 사업에 대한 해석을 구분합니다.

### 신규 작업·운영 문서를 수정할 때

- 작업 기록의 `milestones`는 시간순 `sequence`를 유지합니다. `status`로 완료·대체·승인·미결정을 구분하고 `request`, `decision`, `reason`, `outcome`을 작성합니다.
- 결정 기록에는 `scope`, `decision`, `rationale`을 남깁니다. 이전 결정을 대체했다면 관계를 명시합니다.
- 운영 문서는 `guides`에 `id`, `code`, `category`, `title`, `summary`, `status`, `owner`, `sections`를 작성합니다. 표는 모든 행의 칸 수를 머리글과 맞춥니다.
- 운영 문서에 조사용 레퍼런스의 이름·URL을 넣지 않습니다. 상세한 제작 근거는 작업 기록판에 남깁니다.
- FINAL 장표와 포트폴리오 소개는 순수한 해당 브랜드 내용으로 구성합니다. 새 자산을 등록하면 세 공간의 링크와 배포 결과를 함께 확인합니다.

## 공유 주소

| 대상 | 주소 형식 |
| --- | --- |
| 기존 문서 | `…/journal/?path=/docs/doc-<id>--docs` |
| 전체 작업 기록 | `…/journal/?path=/docs/journal-worklog--docs` |
| 결정과 변경 이유 | `…/journal/?path=/docs/journal-decisions--docs` |
| 운영 홈 | `…/operations/?path=/docs/ops-home--docs` |
| 운영 문서 | `…/operations/?path=/docs/ops-<id>--docs` |
| 브랜드 포트폴리오 문서 | `…/journal/?path=/docs/portfolio-<slug>--docs` 또는 `…/operations/?path=/docs/portfolio-<slug>--docs` |
| 전체 화면 포트폴리오 | `…/showcase/` |

기존 `…/?path=/docs/…` 또는 `…/?id=…` 주소는 query와 hash를 그대로 보존해 `journal/`로 이동합니다. 제목·순서·분야를 바꿔도 ID를 바꾸지 않습니다. 기존 색인 ID `home`, `explore`, `benchmarks`, `plusx`, `tokens`, `archive`도 유지합니다.

## 빌드 결과

`dist/index.html`이 세 공간의 입구입니다. `dist/journal/`, `dist/operations/`, `dist/showcase/`는 각각 독립적으로 열리는 정적 사이트입니다. 모든 정적 자산은 상대 경로를 사용하여 `https://<계정>.github.io/<저장소>/`의 하위 경로에서도 동작합니다.

빌드 검사는 기존 문서·화면·컴포넌트 ID 보존, 다운로드와 원본 일치, 신규 기록 엔트리, 운영판의 명시적 문서 목록, 외부 참고 작업 유입 여부, 세 공간의 포트폴리오 자산, 루트 절대 경로 유무와 기존 URL 전환을 확인합니다.

## 배포

- `.github/workflows/ci.yml`: 작업 브랜치·`dev`·PR에서 빌드, 생성 파일 변경, 타입과 콘텐츠, 최종 결과를 검사합니다. 배포하지 않습니다.
- `.github/workflows/deploy-pages.yml`: 수동 실행 전용입니다. `dev`에서 확인 값 `publish`로 실행할 때 `dist/` 전체를 GitHub Pages에 게시합니다.
- Storybook 작업 기록과 운영판은 URL을 아는 방문자가 열람하는 공유 자료입니다. 별도 인증 기능이 있는 운영 관리자 시스템은 아닙니다.

## 접근성

Storybook의 `@storybook/addon-a11y`는 검사 결과를 확인하는 보조 도구입니다. 설정만으로 접근성 검증이 끝난 것으로 간주하지 않습니다. 화면 변경 시 키보드 탐색, 포커스, 대비, 작은 화면과 이미지 대체 설명을 함께 확인합니다.
