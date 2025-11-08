import { type Props as BaseProps } from './AnimatedSprite.svelte';
export type Props = Omit<BaseProps, 'textures'> & {
    key: string;
};
declare const SpriteSheet: import("svelte").Component<Props, {}, "">;
type SpriteSheet = ReturnType<typeof SpriteSheet>;
export default SpriteSheet;
