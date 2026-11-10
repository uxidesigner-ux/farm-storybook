import { Download } from 'lucide-react';
import { BookLink, Callout, DownloadCard, PageFooter, PageTop, StatusBadge } from '../components/UI';
import { categories, dataFiles, documents, files, routes } from '../data';

export function ArchivePage() {
  return <div className="fn-page sb-unstyled">
    <PageTop section="자료실 · A01" storyId={routes.archive} />
    <main>
      <header className="page-head">
        <p className="eyebrow">A01 / 자료실 · ARCHIVE</p>
        <h1>산출물 다운로드</h1>
        <p className="lead">리서치 원본과 계획 문서, 작성 템플릿, 그리고 이 사이트를 만드는 구조화 데이터를 내려받습니다. 각 파일의 상태는 해당 산출물의 성숙도입니다.</p>
      </header>

      <section className="section" aria-labelledby="archive-files">
        <div className="section-head"><p className="eyebrow">ORIGINAL FILES</p><h2 id="archive-files">원본 산출물</h2></div>
        <div className="stack">{files.map((file) => <DownloadCard key={file.id} file={file} />)}</div>
      </section>

      <section className="section" aria-labelledby="archive-data">
        <div className="section-head"><p className="eyebrow">STRUCTURED DATA</p><h2 id="archive-data">구조화 데이터</h2><p>모든 문서와 벤치마크 화면은 아래 두 파일에서 만들어집니다. 다른 도구로 옮기거나 분석할 때 사용하세요.</p></div>
        <div className="stack">{dataFiles.map((file) => <DownloadCard key={file.id} file={file} />)}</div>
      </section>

      <section className="section" aria-labelledby="archive-docs">
        <div className="section-head"><p className="eyebrow">MARKDOWN EXPORT</p><h2 id="archive-docs">문서별 Markdown</h2><p>가이드 문서 {documents.length}개를 표·출처를 포함한 Markdown 파일로 내려받습니다.</p></div>
        {categories.map((category) => <div key={category} className="md-group"><h3>{category}</h3><ul className="md-list">{documents.filter((doc) => doc.category === category).map((doc) => <li key={doc.id}>
          <span className="small-code">{doc.code}</span>
          <BookLink storyId={doc.storyId} className="md-title">{doc.title}</BookLink>
          <StatusBadge status={doc.status} />
          <a href={doc.markdownHref} download={`${doc.id}.md`} className="md-download"><Download size={16} aria-hidden="true" /><span className="sr-only">{doc.title} </span><span>.md</span><span className="sr-only"> 다운로드</span></a>
        </li>)}</ul></div>)}
      </section>

      <Callout title="공유할 때" tone="info">문서마다 고정된 주소가 있습니다. 각 문서 상단의 ‘공유 링크 복사’로 주소를 복사하세요. 제목이나 순서가 바뀌어도 같은 주소로 열립니다. 이 사이트를 볼 수 있는 범위는 배포 위치의 공개 설정을 따릅니다.</Callout>
    </main>
    <PageFooter />
  </div>;
}
