import * as PIXI from 'pixi.js';
export function createApp({ assets }) {
    const reset = () => {
        stateApp.loaded = false;
        stateApp.loadingProgress = 0;
        stateApp.loadedAssets = {};
        stateApp.pixiApplication = undefined;
    };
    const stateApp = $state({
        reset,
        assets,
        loaded: false,
        loadingProgress: 0,
        loadedAssets: {},
        pixiApplication: undefined,
    });
    return {
        stateApp,
    };
}
