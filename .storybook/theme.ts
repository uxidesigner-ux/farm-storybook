import { create } from 'storybook/theming';
// manager(사이드바·툴바)와 docs 화면이 같은 임시 테마를 쓴다. 상품 브랜드의 확정 시각 체계가 아니다.
export const fieldnotesTheme = create({
  base: 'light', brandTitle: 'FIELDNOTES · 프로젝트 스토리북',
  brandImage: './brand-lockup.svg', brandUrl: './?path=/docs/home--docs', brandTarget: '_self',
  colorPrimary: '#265340', colorSecondary: '#265340',
  appBg: '#f7f8f4', appContentBg: '#ffffff', appPreviewBg: '#f7f8f4',
  appBorderColor: '#e1e5dc', appBorderRadius: 8,
  textColor: '#20362c', textInverseColor: '#ffffff', textMutedColor: '#5b685e',
  barTextColor: '#5b685e', barSelectedColor: '#265340', barHoverColor: '#265340', barBg: '#ffffff',
  inputBg: '#ffffff', inputBorder: '#7f8c82', inputTextColor: '#20362c', inputBorderRadius: 8,
  fontBase: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
  fontCode: '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
});
