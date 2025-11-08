import * as PIXI from 'pixi.js';
import type { OverwriteCursor } from '../types';
export type Props = OverwriteCursor<PIXI.AnimatedSpriteOptions> & {
    animationSpeed?: PIXI.AnimatedSprite['animationSpeed'];
    loop?: PIXI.AnimatedSprite['loop'];
    play?: boolean;
};
declare const AnimatedSprite: import("svelte").Component<Props, {}, "">;
type AnimatedSprite = ReturnType<typeof AnimatedSprite>;
export default AnimatedSprite;
