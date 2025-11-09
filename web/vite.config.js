import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageAliases = [
  'components-layout',
  'components-pixi',
  'components-shared',
  'components-storybook',
  'components-ui-html',
  'components-ui-pixi',
  'constants-shared',
  'envs',
  'pixi-svelte',
  'pixi-svelte-storybook',
  'rgs-fetcher',
  'state-shared',
  'utils-bet',
  'utils-book',
  'utils-event-emitter',
  'utils-fetcher',
  'utils-layout',
  'utils-resize-observer',
  'utils-shared',
  'utils-slots',
  'utils-sound',
  'utils-xstate',
  'config-lingui',
  'config-storybook',
];

const aliasFromPackages = Object.fromEntries(
  packageAliases.map((pkg) => [pkg, path.resolve(__dirname, `../packages/${pkg}`)])
);

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      ...aliasFromPackages,
      'config-svelte': path.resolve(__dirname, '../packages/config-svelte/index.js'),
      'config-vite': path.resolve(__dirname, '../packages/config-vite/index.js'),
      'config-ts': path.resolve(__dirname, '../packages/config-ts/base.json'),
      'rgs-requests-remote': path.resolve(__dirname, '../packages/rgs-requests/index.ts'),
      'rgs-requests': path.resolve(__dirname, './src/rgs/requests.ts'),
      '$env/static/public': path.resolve(__dirname, './src/env/public.ts'),
    },
  },
  base: './',
  server: {
    fs: {
      allow: [__dirname, path.resolve(__dirname, '..')],
    },
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        'connect-src * data: blob:',
        "font-src 'self' data:",
        "worker-src 'self' blob:",
        "object-src 'none'",
      ].join('; '),
    },
  },
});

