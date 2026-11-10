export type DocStatus = '리서치 완료' | '검토 중' | '초안' | '운영 기준';
export type Category = 'BX' | '디자인' | '개발' | '마케팅' | '운영';
export interface DocSection { id: string; title: string; body: string[]; bullets?: string[]; table?: { headers: string[]; rows: string[][] }; callout?: { title: string; body: string }; }
export interface GuideDocument {
  /** 공유 URL에 쓰이는 고정 ID. 제목·순서가 바뀌어도 유지한다. */
  id: string;
  /** 사이드바와 카드에 보이는 고정 문서 코드(예: B01). */
  code: string;
  category: Category; title: string; eyebrow: string; summary: string; status: DocStatus; updatedAt: string; readingMinutes: number; tags: string[]; sections: DocSection[];
  sources?: { label: string; url: string }[];
  related?: string[];
  /** 자료실의 고정 산출물 ID. 해당 문서에서 바로 내려받을 자료를 지정한다. */
  downloadAssetIds?: string[];
  storyTitle: string; storyId: string; markdownHref: string;
}
export interface Brand { id: string; name: string; region: string; model: string; status: string; fact: string; lesson: string; urls: string[]; }
export interface ArchiveFile { id: string; type: string; title: string; description: string; detail: string; version: string; status: string; href: string; }
