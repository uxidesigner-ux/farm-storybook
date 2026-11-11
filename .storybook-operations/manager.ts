import { addons } from 'storybook/manager-api';
import { operationsTheme } from './theme';

addons.setConfig({
  theme: operationsTheme,
  navSize: 280,
  sidebar: { showRoots: true, renderLabel: (item) => (item.type === 'docs' && item.name === 'Docs' ? '운영 가이드' : item.name) },
});
