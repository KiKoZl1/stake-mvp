import { type Props as BaseProps } from './BaseSprite.svelte';
export type Props = Omit<BaseProps, 'texture'> & {
    debug?: boolean;
    key: string;
};
declare const Sprite: import("svelte").Component<Props, {}, "">;
type Sprite = ReturnType<typeof Sprite>;
export default Sprite;
