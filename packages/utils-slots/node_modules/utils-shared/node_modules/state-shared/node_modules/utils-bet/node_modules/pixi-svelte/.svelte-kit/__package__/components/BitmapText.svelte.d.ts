import * as PIXI from 'pixi.js';
import type { Sizes, OverwriteCursor } from '../types';
export type Props = OverwriteCursor<PIXI.TextOptions> & {
    onresize?: (arg0: Sizes) => void;
};
declare const BitmapText: import("svelte").Component<Props, {}, "">;
type BitmapText = ReturnType<typeof BitmapText>;
export default BitmapText;
