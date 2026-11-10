import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';
const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: { order: ['시작하기', 'BX', '디자인', '개발', '마케팅', '운영', '자료실'], method: 'alphabetical', locales: 'ko-KR' },
    },
    controls: { expanded: true },
    backgrounds: { options: { paper: { name: 'Paper', value: '#f7f8f4' }, white: { name: 'White', value: '#ffffff' } } },
    a11y: { test: 'todo' },
    docs: { toc: false },
  },
};
export default preview;
