# FIELDNOTES — 프리미엄 농작물 프로젝트 Storybook

농가에서 생산하는 프리미엄 농작물 서비스의 리서치·BX·디자인·개발·마케팅 산출물을 기록하고 공유하는 문서 사이트입니다.

- FIELDNOTES는 이 **문서 공간의 임시 이름**입니다. 실제 농산물 브랜드명이 아닙니다.
- 작물·품종·고객·가격·공급 능력·인증·채널 자동 연동은 정해지지 않았습니다. 문서의 가설을 확정된 기준으로 옮겨 적지 않습니다.
- 사이트의 색·서체는 문서 공간용 임시 테마이며 상품 브랜드 디자인이 아닙니다.

## 구성

| 영역 | 내용 |
| --- | --- |
| 시작하기 | 프로젝트 홈(H01), 문서 탐색·본문 검색(H02) |
| BX | 글로벌 벤치마크 35개(B00), 문서 4개 |
| 디자인 | 디자인 토큰(D00), 문서 4개, 컴포넌트 6종·스토리 18개 |
| 개발 · 마케팅 · 운영 | 문서 4 · 3 · 3개 |
| 자료실 | 리서치 PDF, WBS Excel, 작성 템플릿, 구조화 데이터, 문서별 Markdown |

## 실행

Node 22.12 이상이 필요합니다.

```bash
npm ci               # package-lock.json 기준으로 설치
npm run dev          # http://localhost:6006 미리보기
npm run content      # content/*.json → MDX·메타데이터·Markdown 생성
npm run check        # 타입 검사 + 콘텐츠 무결성 검사
npm run build        # 콘텐츠 생성 후 dist/에 정적 빌드
npm run verify:build # dist/index.json의 실제 ID, 다운로드, 상대 경로 검사
```

## 폴더

```
content/guide-data.json      문서 원본 (본문·표·출처·상태)
content/benchmarks.json      벤치마크 원본 (사실·해석·공식 출처)
content/published-ids.json   한 번 공유된 문서 ID 등록부
scripts/                     생성·검증 스크립트
src/pages/                   홈·탐색·문서 상세·벤치마크·자료실·토큰 화면
src/components/UI.tsx        공통 컴포넌트
src/stories/*.mdx            자동 생성 (직접 고치지 않음)
src/stories/components/      컴포넌트 스토리 (직접 작성)
src/generated/               자동 생성
public/downloads/            원본 산출물과 자동 생성 Markdown
```

## 문서를 추가·수정하는 절차

**수정 → 미리보기 → 검증 → 승인 → 게시** 순서를 지킵니다.

1. **수정** — `content/guide-data.json`의 `documents`에 문서를 추가하거나 고칩니다. 초안을 글로 먼저 쓸 때는 `public/downloads/guide-template.md`를 사용합니다.
2. **미리보기** — `npm run content` 후 `npm run dev`로 화면·표·링크를 확인합니다.
3. **검증** — `npm run check`, `npm run build`, `npm run verify:build`가 모두 통과해야 합니다.
4. **승인** — 번호가 있는 작업 브랜치(`feat/NNN-이름`)에서 변경을 검토받습니다.
5. **게시** — 승인 후 `dev`에만 반영합니다. `main`에는 머지·푸시하지 않습니다. 외부 배포는 별도 승인을 받아 수동으로 실행합니다.

### 새 문서에 필요한 값

```json
{
  "id": "ops-pricing",
  "code": "OPS04",
  "category": "운영",
  "title": "가격 검토 기준",
  "eyebrow": "PRICING REVIEW",
  "summary": "한두 문장 요약",
  "status": "초안",
  "updatedAt": "2026-11-10",
  "readingMinutes": 3,
  "tags": ["가격"],
  "sections": [{ "id": "scope", "title": "절 제목", "body": ["문단"] }],
  "sources": [{ "label": "출처 이름", "url": "https://example.com" }],
  "related": ["ops-farm"]
}
```

- `category`: BX / 디자인 / 개발 / 마케팅 / 운영
- `status`: 리서치 완료 / 검토 중 / 초안 / 운영 기준. 상태는 문서의 성숙도이며, 가설을 ‘운영 기준’으로 표시하지 않습니다.
- 절에는 `bullets`, `table`(`headers`, `rows`), `callout`(`title`, `body`)을 선택해서 넣습니다. 표의 모든 행은 머리글과 칸 수가 같아야 합니다.
- 새 `id`는 `content/published-ids.json`의 `documents` 끝에 추가합니다.

### 공유 주소 규칙

문서 주소는 `id`로만 만들어집니다: `…/?path=/docs/doc-<id>--docs`

- 제목·순서·코드·분야를 바꿔도 주소는 유지됩니다.
- **`id`는 바꾸거나 지우지 않습니다.** 등록부에 있는 ID가 사라지면 `npm run check`가 실패합니다.
- 색인 화면의 주소는 `home`, `explore`, `benchmarks`, `tokens`, `archive`로 고정돼 있습니다(`scripts/lib/content.mjs`).

### 출처와 변경 이력

- 외부 사실에는 공식 출처(https)를 `sources`에 남깁니다. 벤치마크는 `fact`(확인한 사실)와 `lesson`(우리 사업에 대한 해석)을 나눠 적습니다.
- 내용을 고치면 `updatedAt`을 갱신하고, 무엇을 왜 바꿨는지 커밋 메시지에 적습니다. 결정 사항의 기록 방식은 운영 문서 OPS03을 따릅니다.

## 배포

- `.github/workflows/ci.yml` — 작업 브랜치·`dev`·PR에서 빌드와 검사를 실행합니다. 배포하지 않습니다.
- `.github/workflows/deploy-pages.yml` — 수동 실행 전용이며 `dev`에서 `publish`를 입력했을 때만 GitHub Pages에 게시합니다.
- 빌드는 상대 경로만 사용하므로 `https://<계정>.github.io/<저장소>/` 같은 하위 경로에서 동작합니다.
- **GitHub Pages 사이트는 저장소가 비공개여도 주소를 아는 누구나 볼 수 있습니다.** 게시 전에 공개 범위를 확인합니다.

## 접근성

`@storybook/addon-a11y`는 패널에 검사 결과를 보여주는 도구이며(`a11y.test: 'todo'`), 설정만으로 접근성 검증이 끝난 것은 아닙니다. 화면을 바꾸면 키보드 탐색, 포커스 표시, 대비, 작은 화면을 직접 확인합니다.
