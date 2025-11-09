const path = require('node:path');

const config = {
    stories: ['../src/**/*.stories.@(js|ts|svelte)', '../src/**/*.mdx'],
    addons: ['@storybook/addon-svelte-csf', '@storybook/addon-docs'],
    framework: {
        name: '@storybook/svelte-vite',
        options: {
            svelteOptions: {
                compilerOptions: {
                    runes: true,
                },
            },
        },
    },
    staticDirs: ['../public'],
    async viteFinal(baseConfig) {
        const legacyShim = {
            find: '@storybook/addon-svelte-csf/dist/runtime/LegacyTemplate.svelte',
            replacement: path.resolve(__dirname, './shims/LegacyTemplate.svelte'),
        };

        if (Array.isArray(baseConfig.resolve?.alias)) {
            baseConfig.resolve.alias.push(legacyShim);
        } else if (baseConfig.resolve?.alias && typeof baseConfig.resolve.alias === 'object') {
            baseConfig.resolve.alias = {
                ...baseConfig.resolve.alias,
                [legacyShim.find]: legacyShim.replacement,
            };
        } else {
            baseConfig.resolve = {
                ...(baseConfig.resolve ?? {}),
                alias: [legacyShim],
            };
        }

        return baseConfig;
    },
};

module.exports = config;
