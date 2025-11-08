import * as PIXI from 'pixi.js';
import type { OverwriteCursor } from '../types';
export type Props = OverwriteCursor<PIXI.GraphicsOptions> & {
    isMask?: boolean;
    draw: (graphics: PIXI.Graphics) => void;
};
declare const Graphics: import("svelte").Component<Props, {}, "">;
type Graphics = ReturnType<typeof Graphics>;
export default Graphics;
