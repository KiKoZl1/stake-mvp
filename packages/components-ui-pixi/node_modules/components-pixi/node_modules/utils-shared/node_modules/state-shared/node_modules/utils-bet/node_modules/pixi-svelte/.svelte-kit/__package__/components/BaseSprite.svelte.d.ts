import * as PIXI from 'pixi.js';
import type { OverwriteCursor } from '../types';
export type Props = OverwriteCursor<PIXI.SpriteOptions> & {
    isMask?: boolean;
};
declare const BaseSprite: import("svelte").Component<Props, {}, "">;
type BaseSprite = ReturnType<typeof BaseSprite>;
export default BaseSprite;
