import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
type SpineState = SPINE_PIXI.Spine['state'];
type TrackEntry = SPINE_PIXI.TrackEntry;
export type Props = Partial<TrackEntry> & {
    trackIndex: Parameters<SpineState['setAnimation']>[0];
    animationName: Parameters<SpineState['setAnimation']>[1];
};
declare const SpineTrack: import("svelte").Component<Props, {}, "">;
type SpineTrack = ReturnType<typeof SpineTrack>;
export default SpineTrack;
