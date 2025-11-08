import type { Snippet } from 'svelte';
import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
import type { OverwriteCursor } from '../types';
export type Props = OverwriteCursor<Omit<SPINE_PIXI.SpineOptions, 'children'>> & {
    spineData: SPINE_PIXI.SkeletonData;
    children: Snippet;
};
declare const BaseSpineProvider: import("svelte").Component<Props, {}, "">;
type BaseSpineProvider = ReturnType<typeof BaseSpineProvider>;
export default BaseSpineProvider;
