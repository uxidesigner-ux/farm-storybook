import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
addons.setConfig({
  theme: create({
    base: 'light', brandTitle: 'FIELDNOTES · 프로젝트 스토리북',
    brandImage: './brand-lockup.svg', brandUrl: '?path=/docs/h01--docs', brandTarget: '_self',
    colorPrimary: '#265340', colorSecondary: '#265340',
    appBg: '#f7f8f4', appContentBg: '#f7f8f4', appPreviewBg: '#f7f8f4',
    appBorderColor: '#e1e5dc', appBorderRadius: 8,
    textColor: '#20362c', textInverseColor: '#ffffff',
    barTextColor: '#68756b', barSelectedColor: '#265340', barBg: '#ffffff',
    inputBg: '#ffffff', inputBorder: '#d7ded2', inputTextColor: '#20362c',
    fontBase: 'Inter, Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
    fontCode: '"SFMono-Regular", Consolas, monospace',
  }),
  navSize: 264,
  sidebar: { showRoots: true },
});
