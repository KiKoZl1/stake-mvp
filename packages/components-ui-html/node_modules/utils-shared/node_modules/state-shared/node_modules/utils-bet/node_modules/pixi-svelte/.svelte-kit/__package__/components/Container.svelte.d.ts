import * as PIXI from 'pixi.js';
import type { Snippet } from 'svelte';
import type { OverwriteCursor } from '../types';
export type Props = OverwriteCursor<Omit<PIXI.ContainerOptions, 'children'>> & {
    children: Snippet;
};
declare const Container: import("svelte").Component<Props, {}, "">;
type Container = ReturnType<typeof Container>;
export default Container;
