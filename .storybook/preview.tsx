import type { Preview } from '@storybook/react-vite';
import { fieldnotesTheme } from './theme';
import '../src/styles.css';
import '../src/portals/portal.css';
const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: { order: ['시작하기', '작업 기록', '최종 포트폴리오', 'BX', '디자인', ['*', '컴포넌트'], '개발', '마케팅', '운영', '자료실'], method: 'alphabetical', locales: 'ko-KR' },
    },
    controls: { expanded: true },
    backgrounds: { options: { paper: { name: 'Paper', value: '#f7f8f4' }, white: { name: 'White', value: '#ffffff' } } },
    // 'todo'는 접근성 위반을 패널에 경고로만 표시한다. 자동 테스트 통과를 뜻하지 않는다.
    a11y: { test: 'todo' },
    docs: { toc: false, theme: fieldnotesTheme },
  },
};
export default preview;
