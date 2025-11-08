import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
export type Props = Partial<SPINE_PIXI.Bone> & {
    boneName: Parameters<SPINE_PIXI.Spine['skeleton']['findBone']>[0];
};
declare const SpineBone: import("svelte").Component<Props, {}, "">;
type SpineBone = ReturnType<typeof SpineBone>;
export default SpineBone;
