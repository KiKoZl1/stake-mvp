import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
    plugins: [svelte()],
    base: './',
    server: {
        headers: {
            'Content-Security-Policy': [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "connect-src *",
                "font-src 'self' data:",
                "object-src 'none'"
            ].join('; ')
        }
    }
});
