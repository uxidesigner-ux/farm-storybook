import type { Preview } from '@storybook/react-vite';
import { operationsTheme } from './theme';
import '../src/styles.css';
import '../src/portals/portal.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    options: { storySort: { order: ['운영 시작', '브랜드', '디자인', '콘텐츠', '개발', '마케팅', '운영', '브랜드 포트폴리오'], method: 'alphabetical', locales: 'ko-KR' } },
    backgrounds: { options: { paper: { name: 'Paper', value: '#f7f8f4' } } },
    a11y: { test: 'todo' },
    docs: { toc: false, theme: operationsTheme },
  },
};

export default preview;
