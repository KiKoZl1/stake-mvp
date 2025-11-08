import * as PIXI from 'pixi.js';
import type { LoadedAssets, Assets } from './types';
export declare function createApp({ assets }: {
    assets: Assets;
}): {
    stateApp: {
        reset: () => void;
        assets: Assets;
        loaded: boolean;
        loadingProgress: number;
        loadedAssets: LoadedAssets;
        pixiApplication: PIXI.Application | undefined;
    };
};
export type App = ReturnType<typeof createApp>;
