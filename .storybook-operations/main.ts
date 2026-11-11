import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/portal-stories/operations/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  // 허용된 운영 자산만 generator가 이 디렉터리에 복사한다.
  staticDirs: ['../.cache/operations-public'],
  core: { disableTelemetry: true },
  viteFinal: async (config) => ({ ...config, base: './', publicDir: false }),
};

export default config;
