import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
  viteFinal: async (config) => ({ ...config, base: './' }),
};
export default config;
