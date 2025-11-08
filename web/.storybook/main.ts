import type { StorybookConfig } from '@storybook/svelte-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|ts|svelte)', '../src/**/*.stories.mdx'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/svelte-vite',
    options: {}
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    const allow = config.server.fs.allow ?? [];
    if (!allow.includes(process.cwd())) {
      allow.push(process.cwd());
    }
    config.server.fs.allow = allow;
    return config;
  }
};

export default config;
