import WebFont from 'webfontloader';
export const REM = 16;
export const MIN_CLICKABLE_SIZE = 3 * REM; // 44 x 44 is minimum clickable size
export const getPointValues = ({ point, defaultValue, }) => {
    const finalDefaultValue = defaultValue === undefined ? 0 : defaultValue;
    if (typeof point === 'number')
        return [point, point];
    return [(point === null || point === void 0 ? void 0 : point.x) || finalDefaultValue, (point === null || point === void 0 ? void 0 : point.y) || finalDefaultValue];
};
export const anchorToPivot = ({ anchor, sizes }) => {
    const { width, height } = sizes;
    const [anchorX, anchorY] = getPointValues({ point: anchor, defaultValue: 0 });
    return { x: width * anchorX, y: height * anchorY };
};
/**
 * Detects if WebGL is enabled.
 * Inspired from http://www.browserleaks.com/webgl#howto-detect-webgl
 *
 * @return { number } -1 for not Supported,
 *										0 for disabled
 *										1 for enabled
 */
export function detectWebGL() {
    // Check for the WebGL rendering context
    if (window && !!window.WebGLRenderingContext) {
        let canvas = document.createElement('canvas'), names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'], context = false;
        for (const i in names) {
            try {
                // @ts-ignore
                context = canvas.getContext(names[i]);
                // @ts-ignore
                if (context && typeof context.getParameter === 'function') {
                    // WebGL is enabled.
                    return 1;
                }
            }
            catch (e) { }
        }
        // WebGL is supported, but disabled.
        return 0;
    }
    // WebGL not supported.
    return -1;
}
export const preloadFont = () => new Promise((resolve) => {
    try {
        WebFont.load({
            typekit: {
                id: 'aba0ebl',
            },
            active: () => {
                resolve();
            },
            inactive: () => {
                console.error('Web font load inactive');
                resolve();
            },
        });
    }
    catch (error) {
        console.error(error);
        resolve();
    }
});
export function propsSyncEffect({ props, target, ignore, }) {
    $effect(() => {
        // The whole thing is wrapped inside an $effect
        // and because of ”props[key]“，it will react with every single props updated.
        let targetInstance = target instanceof Function ? target() : target;
        if (targetInstance) {
            Object.keys(props)
                .filter((key) => (ignore ? !ignore.includes(key) : true))
                .forEach((key) => {
                if (props[key] !== undefined) {
                    // @ts-ignore
                    targetInstance[key] = props[key];
                }
            });
        }
    });
}
