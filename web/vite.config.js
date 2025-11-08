import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aliasFromPackages = Object.fromEntries(
  [
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
    'rgs-requests',
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
  ].map((pkg) => [pkg, path.resolve(__dirname, `../packages/${pkg}/index.ts`)])
);

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      ...aliasFromPackages,
      '$env/static/public': path.resolve(__dirname, './src/env/public.ts'),
    },
  },
  base: './',
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        'connect-src *',
        "font-src 'self' data:",
        "object-src 'none'",
      ].join('; '),
    },
  },
});
