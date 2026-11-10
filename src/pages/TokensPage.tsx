import { BookLink, Button, Callout, DataTable, PageFooter, PageTop, StatusBadge, TokenSwatch } from '../components/UI';
import { routes, statuses } from '../data';

const colors = [
  { name: 'Forest', value: '#265340', usage: '주요 행동과 강조에 사용하는 문서 공간의 중심색' },
  { name: 'Paper', value: '#f7f8f4', usage: '오래 읽는 문서의 기본 표면' },
  { name: 'Ink', value: '#20362c', usage: '제목과 본문의 기본 텍스트' },
  { name: 'Accent', value: '#d4dd80', usage: '핵심 정보와 선택 상태를 보조하는 강조색' },
  { name: 'Border', value: '#e1e5dc', usage: '카드와 정보 구역의 경계' },
  { name: 'Muted', value: '#68756b', usage: '본문보다 낮은 위계의 보조 정보' },
];
const type = [
  { token: '--fn-text-display', sample: '기준과 기록', use: '페이지 제목' },
  { token: '--fn-text-title', sample: '세 가지 포지셔닝 가설', use: '절 제목' },
  { token: '--fn-text-heading', sample: '확인한 사실', use: '카드·소제목' },
  { token: '--fn-text-body', sample: '농가가 입증할 수 있는 중심 가치를 찾습니다.', use: '본문' },
  { token: '--fn-text-small', sample: '2026-11-10 · 3분 읽기', use: '보조 정보' },
];
const space = ['--fn-space-1', '--fn-space-2', '--fn-space-3', '--fn-space-4', '--fn-space-5', '--fn-space-6', '--fn-space-7', '--fn-space-8'];

export function TokensPage() {
  return <div className="fn-page sb-unstyled">
    <PageTop section="디자인 · D00" storyId={routes.tokens} />
    <main>
      <header className="page-head tone-orange">
        <p className="eyebrow">D00 / 디자인 · DESIGN TOKENS</p>
        <h1>디자인 토큰</h1>
        <p className="lead">이 문서 사이트가 실제로 사용하는 컬러·타이포·간격 값입니다. 아래 견본은 CSS 변수를 그대로 읽어 그립니다.</p>
        <dl className="doc-meta"><div><dt className="sr-only">문서 상태</dt><dd><StatusBadge status="운영 기준" /></dd></div></dl>
        <Callout title="적용 범위" tone="notice">문서 공간의 임시 테마입니다. 실제 농산물 브랜드의 색·서체·패키지 디자인으로 확정된 값이 아닙니다.</Callout>
      </header>

      <section className="section" aria-labelledby="token-color">
        <div className="section-head"><p className="eyebrow">COLOR</p><h2 id="token-color">컬러</h2><p>색상값을 누르면 클립보드에 복사합니다. Muted는 큰 글자와 아이콘에 쓰고, 작은 보조 글자는 대비를 높인 --fn-muted-text(#5b685e)를 씁니다.</p></div>
        <div className="token-grid">{colors.map((color) => <TokenSwatch key={color.name} {...color} />)}</div>
      </section>

      <section className="section" aria-labelledby="token-type">
        <div className="section-head"><p className="eyebrow">TYPOGRAPHY</p><h2 id="token-type">타이포그래피</h2><p>시스템 한글 서체를 사용하고, 한국어 문장은 단어 단위로 줄바꿈합니다.</p></div>
        <ul className="type-list">{type.map((item) => <li key={item.token}><p style={{ fontSize: `var(${item.token})` }}>{item.sample}</p><span><code>{item.token}</code> · {item.use}</span></li>)}</ul>
      </section>

      <section className="section" aria-labelledby="token-space">
        <div className="section-head"><p className="eyebrow">SPACING · RADIUS</p><h2 id="token-space">간격과 모서리</h2></div>
        <ul className="space-list">{space.map((token) => <li key={token}><span className="space-bar" style={{ width: `var(${token})` }} aria-hidden="true" /><code>{token}</code></li>)}</ul>
        <div className="radius-row">{['--fn-radius-s', '--fn-radius-m', '--fn-radius-l'].map((token) => <div key={token} style={{ borderRadius: `var(${token})` }}><code>{token}</code></div>)}</div>
      </section>

      <section className="section" aria-labelledby="token-status">
        <div className="section-head"><p className="eyebrow">STATUS · ACTION</p><h2 id="token-status">상태와 행동</h2><p>상태는 색과 글자, 점의 모양을 함께 사용해 구분합니다.</p></div>
        <DataTable caption="문서 상태 표시" headers={['표시', '의미']} rows={statuses.map((status) => [<StatusBadge key={status} status={status} />, { '리서치 완료': '조사 범위 안에서 사실 확인을 마친 자료', '검토 중': '결정 전 검토안', 초안: '논의를 시작하기 위한 첫 제안', '운영 기준': '문서 공간에 지금 적용하는 작업 기준' }[status]])} />
        <div className="button-row"><Button>주요 행동</Button><Button variant="secondary">보조 행동</Button><Button variant="quiet">조용한 행동</Button><Button disabled>비활성</Button></div>
        <p className="section-links"><BookLink storyId="ui-button--docs">컴포넌트 예제 보기</BookLink><BookLink storyId="doc-design-foundations--docs">문서 공간의 시각 원칙</BookLink><BookLink storyId="doc-design-components--docs">토큰과 컴포넌트 사용법</BookLink></p>
      </section>
    </main>
    <PageFooter />
  </div>;
}
