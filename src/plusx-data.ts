import research from '../content/plusx-research.json';

export type PlusXCategory = 'BX' | 'UX' | 'BX+UX' | 'other';
export type PlusXEvidence = 'official_text' | 'brief_or_image_led' | 'insufficient';
export type PlusXRelevance = 'high' | 'medium' | 'low';

export interface PlusXDeepDive {
  officialFacts: string[];
  touchpoints: { label: string; text: string }[];
  analysis: string;
  validation: string;
  avoidCopying: string;
  limits: string;
  evidenceNote: string;
}

export interface PlusXCase {
  index: number;
  slug: string;
  name: string;
  category: PlusXCategory;
  /** 추가 회고·이미지 확인으로 덮어쓰지 않는 최초 본문·대체텍스트 평가. */
  baseEvidence: PlusXEvidence;
  sourceFacts: string;
  interpretation: string;
  relevance: PlusXRelevance;
  relevanceReason: string;
  limits: string;
  supplementalEvidence: string;
  metadataNote: string;
  visual: { verified: boolean; note: string; observation: string };
  sources: { label: string; url: string }[];
  deepDive: PlusXDeepDive | null;
}

export interface PlusXResearch {
  schemaVersion: number;
  asOf: string;
  scope: { title: string; description: string; baseEvidenceNote: string; limits: string[] };
  counts: {
    projects: number;
    deepDives: number;
    staticVisuals: number;
    categories: Record<PlusXCategory, number>;
    baseEvidence: Record<PlusXEvidence, number>;
  };
  deepDive18: string[];
  staticVisual9: string[];
  projects: PlusXCase[];
}

export const plusxResearch = research as PlusXResearch;
export const plusxCases = plusxResearch.projects;

export const plusxCategoryMeta: Record<PlusXCategory, { label: string; description: string }> = {
  BX: { label: 'BX만', description: '브랜드 경험' },
  UX: { label: 'UX만', description: '사용자 경험' },
  'BX+UX': { label: 'BX + UX', description: '두 범주에 등록' },
  other: { label: '기타', description: '공식 카탈로그의 별도 분류 없음' },
};

export const plusxEvidenceMeta: Record<PlusXEvidence, { label: string; description: string }> = {
  official_text: { label: '공식 설명', description: '본문·대체텍스트에서 설계 의도를 확인한 자료' },
  brief_or_image_led: { label: '짧은 설명·이미지 중심', description: '텍스트가 짧거나 이미지가 중심인 자료' },
  insufficient: { label: '설명 부족', description: '기본 자료만으로 설계 원리를 판단하기 어려운 자료' },
};

export const plusxRelevanceMeta: Record<PlusXRelevance, { label: string; description: string }> = {
  high: { label: '높음', description: '농작물 BX와 직접 연결할 설계 원리가 있는 사례' },
  medium: { label: '중간', description: '일부 접점이나 운영 원리를 참고할 수 있는 사례' },
  low: { label: '낮음', description: '직접 전이할 근거가 제한적인 사례' },
};

/** 검색은 제목뿐 아니라 공식 요약·독자 해석·한계·심층 기록 전체에 적용한다. */
export function plusxSearchText(project: PlusXCase): string {
  const deep = project.deepDive;
  return [
    project.name, project.slug, project.category,
    project.sourceFacts, project.interpretation, project.relevanceReason,
    project.limits, project.supplementalEvidence, project.metadataNote,
    project.visual.note, project.visual.observation,
    ...(deep ? [
      ...deep.officialFacts,
      ...deep.touchpoints.map(point => `${point.label} ${point.text}`),
      deep.analysis, deep.validation, deep.avoidCopying, deep.limits, deep.evidenceNote,
    ] : []),
  ].join(' ').normalize('NFKC').toLocaleLowerCase('ko-KR');
}
