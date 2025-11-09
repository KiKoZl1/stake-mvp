const { INITIAL_VIEWPORTS } = require('storybook/viewport');

const preview = {
    parameters: {
        layout: 'fullscreen',
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        viewport: {
            options: {
                ...INITIAL_VIEWPORTS,
                stake: {
                    name: 'stake iframe',
                    styles: {
                        width: '1200px',
                        height: '675px',
                    },
                },
                stakeMini: {
                    name: 'stake mini player',
                    styles: {
                        width: '400px',
                        height: '225px',
                    },
                },
                stakeMiniExpanded: {
                    name: 'stake mini player (expanded)',
                    styles: {
                        width: '800px',
                        height: '450px',
                    },
                },
            },
        },
    },
    initialGlobals: {
        viewport: { value: 'stake', isRotated: false },
    },
};

module.exports = preview;
