export type DocStatus = '리서치 완료' | '검토 중' | '초안' | '운영 기준';
export type Category = 'BX' | '디자인' | '개발' | '마케팅' | '운영';
export interface DocSection { id: string; title: string; body: string[]; bullets?: string[]; table?: { headers: string[]; rows: string[][] }; callout?: { title: string; body: string }; }
export interface GuideDocument { id: string; category: Category; title: string; eyebrow: string; summary: string; status: DocStatus; updatedAt: string; readingMinutes: number; tags: string[]; sections: DocSection[]; sources?: { label: string; url: string }[]; code: string; storyTitle: string; storyId: string; }
export interface Brand { id: string; name: string; region: string; model: string; status: string; fact: string; lesson: string; urls: string[]; }
