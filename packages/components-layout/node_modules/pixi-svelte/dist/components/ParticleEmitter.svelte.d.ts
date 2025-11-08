import { Emitter, type EmitterConfigV3, type EmitterConfigV2, type EmitterConfigV1 } from '@barvynkoa/particle-emitter';
export type Props = Partial<Emitter> & {
    key: string;
    emitSpeed?: number;
    config: EmitterConfigV3 | EmitterConfigV2 | EmitterConfigV1;
};
declare const ParticleEmitter: import("svelte").Component<Props, {}, "">;
type ParticleEmitter = ReturnType<typeof ParticleEmitter>;
export default ParticleEmitter;
