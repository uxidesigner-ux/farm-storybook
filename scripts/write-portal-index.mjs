import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#193c30" />
  <meta name="description" content="네 개의 프리미엄 식재료 브랜드. 포트폴리오 감상과 추천, 모든 작업 기록, 서비스 운영 기준을 목적에 맞게 찾아보세요." />
  <title>FIELDNOTES — 브랜드와 그 뒤의 기록</title>
  <link rel="icon" type="image/svg+xml" href="./journal/favicon.svg" />
  <script>
    // 이미 공유된 Storybook 주소를 새 작업 기록 주소로 그대로 이어 준다.
    const legacyQuery = new URLSearchParams(window.location.search);
    if (legacyQuery.has('path') || legacyQuery.has('id')) {
      window.location.replace('./journal/' + window.location.search + window.location.hash);
    }
  </script>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f3f2eb;color:#18382b;font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit}main{max-width:1440px;margin:auto;padding:64px 6vw 48px}header{display:flex;align-items:center;justify-content:space-between;padding-bottom:28px;border-bottom:1px solid #bec8bb;font-size:12px;letter-spacing:.15em}header a{text-decoration:none;font-weight:700}.label{font-size:11px;letter-spacing:.15em;margin:0 0 22px;text-transform:uppercase}.intro{padding:88px 0 66px;max-width:850px}h1{font-size:clamp(40px,5.8vw,80px);line-height:1.13;font-weight:500;letter-spacing:-.065em;margin:0 0 30px;word-break:keep-all}.lead{font-size:17px;line-height:1.8;max-width:620px;color:#59685d;word-break:keep-all}.portals{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:20px}.portal{display:flex;flex-direction:column;min-height:360px;background:#e6eadf;padding:34px;text-decoration:none;transition:background .2s,transform .2s;outline-offset:6px}.portal:first-child{background:#193c30;color:#f5f3e9}.portal:hover{transform:translateY(-4px);background:#dfe6d4}.portal:first-child:hover{background:#24513f}.number{font-size:12px;letter-spacing:.1em;opacity:.7;margin-bottom:44px}.portal h2{font-size:28px;font-weight:500;letter-spacing:-.045em;margin:0 0 16px;word-break:keep-all}.portal p{font-size:14px;line-height:1.8;margin:0 0 30px;opacity:.8;word-break:keep-all}.action{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;border-top:1px solid currentColor;padding-top:18px}.arrow{font-size:22px;font-weight:400}footer{display:flex;justify-content:space-between;gap:24px;border-top:1px solid #bec8bb;margin-top:72px;padding-top:22px;font-size:11px;line-height:1.8;color:#647163}a:focus-visible{outline:3px solid #b29a33}@media(max-width:900px){.portals{grid-template-columns:1fr}.portal{min-height:270px}.number{margin-bottom:28px}.intro{padding:58px 0 40px}main{padding:32px 6vw}header{font-size:10px}footer{flex-direction:column;margin-top:44px}}@media(prefers-reduced-motion:reduce){.portal{transition:none}.portal:hover{transform:none}}
  </style>
</head>
<body>
<main>
  <header><a href="./">FIELDNOTES</a><span>PREMIUM PRODUCE / BRAND EXPERIENCE</span></header>
  <section class="intro" aria-labelledby="intro-title">
    <p class="label">Four brands. One thoughtful beginning.</p>
    <h1 id="intro-title">브랜드를 보고,<br />그 뒤의 기준을 읽다.</h1>
    <p class="lead">고운밭, 오나리, 헤칼레, 에르사.<br />완성된 브랜드를 살펴보고, 만들어진 과정과 운영에 필요한 기준을 목적에 맞게 확인하세요.</p>
  </section>
  <nav class="portals" aria-label="세 가지 공간">
    <a class="portal" href="./showcase/"><span class="number">01 / BRAND PORTFOLIOS</span><h2>브랜드 포트폴리오</h2><p>네 프로젝트의 FINAL을 로그인 없이 감상하세요. 추천할 때 계정을 확인하며, 프로젝트마다 한 번씩 마음에 드는 프로젝트를 모두 추천할 수 있습니다.</p><span class="action">포트폴리오와 추천 보기 <span class="arrow" aria-hidden="true">↗</span></span></a>
    <a class="portal" href="./journal/?path=/docs/home--docs"><span class="number">02 / WORK JOURNAL</span><h2>전체 작업 기록</h2><p>리서치, 후보안, 시도와 수정, 승인된 결정까지. 왜 지금의 결과에 도달했는지 작업의 흐름을 확인합니다.</p><span class="action">작업 스토리북 열기 <span class="arrow" aria-hidden="true">↗</span></span></a>
    <a class="portal" href="./operations/?path=/docs/ops-home--docs"><span class="number">03 / OPERATING STANDARDS</span><h2>서비스 운영 기준</h2><p>브랜드·디자인·콘텐츠·개발·마케팅·운영 담당자가 함께 사용하는 기준과 출시 전에 정할 사항을 확인합니다.</p><span class="action">운영 스토리북 열기 <span class="arrow" aria-hidden="true">↗</span></span></a>
  </nav>
  <footer><span>FIELDNOTES / PREMIUM PRODUCE PROJECT</span><span>브랜드 경험 제안 · 서비스 출시 준비 단계</span></footer>
</main>
</body>
</html>`;
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
fs.writeFileSync(path.join(root, 'dist/.nojekyll'), '');
console.log('세 공간 인덱스와 기존 Storybook 주소 전환을 생성했습니다.');
