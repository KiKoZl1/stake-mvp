import { setContext, getContext, onMount } from 'svelte';
import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
// App context
const APP_NS = '@@pixi_svelte';
export function setContextApp(value) {
    setContext(APP_NS, value);
}
export function getContextApp() {
    return getContext(APP_NS);
}
// Parent context
const PARENT_NS = '@@pixi_parent';
export function createContextParent(value) {
    const addToParent = (node) => {
        onMount(() => {
            context.parent.addChild(node);
            context.parent.sortChildren();
            return () => {
                if (node)
                    node.destroy(); // Equivalent to onDestroy(); Leave this comment for searching.
            };
        });
    };
    const context = { parent: value, addToParent };
    setContext(PARENT_NS, context);
    return context;
}
export function getContextParent() {
    return getContext(PARENT_NS);
}
// Particle context
const PARTICLE_PARENT_NS = '@@pixi_particle_parent';
export function setContextParticleParent(value) {
    setContext(PARTICLE_PARENT_NS, value);
}
export function getContextParticleParent() {
    return getContext(PARTICLE_PARENT_NS);
}
// Spine context
const SPINE_NS = '@@pixi_spine';
export function setContextSpine(value) {
    setContext(SPINE_NS, value);
}
export function getContextSpine() {
    return getContext(SPINE_NS);
}
// Spine event context
const SPINE_EVENT_EMITTER_NS = '@@pixi_spine_event_emitter';
export function setContextSpineEventEmitter(value) {
    setContext(SPINE_EVENT_EMITTER_NS, value);
}
export function getContextSpineEventEmitter() {
    return getContext(SPINE_EVENT_EMITTER_NS);
}
