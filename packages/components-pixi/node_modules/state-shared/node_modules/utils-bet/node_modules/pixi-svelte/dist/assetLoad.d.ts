import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
import type { RawType, RawAsset, RawSprites, SpineSrc, RawAudio } from './types';
export declare const getProcessed: ({ key, type, rawAsset, src, }: {
    key: string;
    type: RawType;
    rawAsset: RawAsset;
    src: string | SpineSrc;
}) => import("pixi.js").Dict<import("./types").LoadedSprite> | {
    [x: string]: SPINE_PIXI.SkeletonData;
} | {
    [x: string]: RawSprites;
} | {
    [x: string]: import("./types").LoadedSprite[];
} | {
    [x: string]: RawAudio;
} | undefined;
