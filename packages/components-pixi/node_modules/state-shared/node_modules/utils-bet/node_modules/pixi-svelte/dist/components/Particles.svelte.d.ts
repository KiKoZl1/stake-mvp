import * as PIXI from 'pixi.js';
export type Props = {
    key: string;
    size: number;
    init: (particles: PIXI.Particle[]) => void;
    update: (particles: PIXI.Particle[]) => void;
};
declare const Particles: import("svelte").Component<Props, {}, "">;
type Particles = ReturnType<typeof Particles>;
export default Particles;
