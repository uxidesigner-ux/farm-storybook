import { create } from 'storybook/theming';
// 문서 공간의 공통 테마. 서비스 브랜드의 최종 디자인 토큰과 구분한다.
export const makeFieldnotesTheme = (title: string, home: string) => create({
  base: 'light', brandTitle: title,
  brandImage: './brand-lockup.svg', brandUrl: `./?path=/docs/${home}--docs`, brandTarget: '_self',
  colorPrimary: '#265340', colorSecondary: '#265340',
  appBg: '#f7f8f4', appContentBg: '#ffffff', appPreviewBg: '#f7f8f4',
  appBorderColor: '#e1e5dc', appBorderRadius: 8,
  textColor: '#20362c', textInverseColor: '#ffffff', textMutedColor: '#5b685e',
  barTextColor: '#5b685e', barSelectedColor: '#265340', barHoverColor: '#265340', barBg: '#ffffff',
  inputBg: '#ffffff', inputBorder: '#7f8c82', inputTextColor: '#20362c', inputBorderRadius: 8,
  fontBase: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
  fontCode: '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
});
export const fieldnotesTheme = makeFieldnotesTheme('FIELDNOTES · 작업 기록', 'home');
