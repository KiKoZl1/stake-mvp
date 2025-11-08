import type * as PIXI from 'pixi.js';
import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
import type { App as ContextApp } from './createApp.svelte';
export declare function setContextApp(value: ContextApp): void;
export declare function getContextApp(): ContextApp;
export declare function createContextParent(value: PIXI.Container): {
    parent: PIXI.Container<PIXI.ContainerChild>;
    addToParent: (node: PIXI.ContainerChild) => void;
};
export declare function getContextParent(): ReturnType<typeof createContextParent>;
export declare function setContextParticleParent(value: PIXI.ParticleContainer): void;
export declare function getContextParticleParent(): PIXI.ParticleContainer;
export declare function setContextSpine(value: SPINE_PIXI.Spine): void;
export declare function getContextSpine(): SPINE_PIXI.Spine;
export declare function setContextSpineEventEmitter(value: PIXI.EventEmitter): void;
export declare function getContextSpineEventEmitter(): PIXI.EventEmitter;
