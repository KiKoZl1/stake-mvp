import * as PIXI from 'pixi.js';
import type { Sizes, OverwriteCursor } from '../types';
export type Props = OverwriteCursor<PIXI.TextOptions> & {
    onresize?: (arg0: Sizes) => void;
};
declare const Text: import("svelte").Component<Props, {}, "">;
type Text = ReturnType<typeof Text>;
export default Text;
