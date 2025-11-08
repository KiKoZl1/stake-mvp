import * as PIXI from 'pixi.js';
import type { Snippet } from 'svelte';
import type { OverwriteCursor } from '../types';
export type Props = OverwriteCursor<PIXI.ParticleContainerOptions> & {
    children: Snippet;
};
declare const ParticleContainer: import("svelte").Component<Props, {}, "">;
type ParticleContainer = ReturnType<typeof ParticleContainer>;
export default ParticleContainer;
