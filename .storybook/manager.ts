import { addons } from 'storybook/manager-api';
import { fieldnotesTheme } from './theme';
addons.setConfig({
  theme: fieldnotesTheme,
  navSize: 280,
  // 문서 ID는 영문(--docs)으로 고정하고, 사이드바에는 한국어 이름으로 보여준다.
  sidebar: { showRoots: true, renderLabel: (item) => (item.type === 'docs' && item.name === 'Docs' ? '가이드' : item.name) },
});
