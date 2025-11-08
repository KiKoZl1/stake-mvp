import type { PixiPoint, Sizes } from './types';
export declare const REM = 16;
export declare const MIN_CLICKABLE_SIZE: number;
export declare const getPointValues: ({ point, defaultValue, }: {
    point: PixiPoint;
    defaultValue: number;
}) => number[];
export declare const anchorToPivot: ({ anchor, sizes }: {
    anchor: PixiPoint;
    sizes: Sizes;
}) => {
    x: number;
    y: number;
};
/**
 * Detects if WebGL is enabled.
 * Inspired from http://www.browserleaks.com/webgl#howto-detect-webgl
 *
 * @return { number } -1 for not Supported,
 *										0 for disabled
 *										1 for enabled
 */
export declare function detectWebGL(): 1 | 0 | -1;
export declare const preloadFont: () => Promise<void>;
export declare function propsSyncEffect<TProps extends object, TTarget>({ props, target, ignore, }: {
    props: TProps;
    target?: TTarget | (() => TTarget);
    ignore?: (keyof TProps)[];
}): void;
