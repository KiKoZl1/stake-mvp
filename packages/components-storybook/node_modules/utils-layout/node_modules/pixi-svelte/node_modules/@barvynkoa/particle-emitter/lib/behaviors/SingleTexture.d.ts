import { Texture } from 'pixi.js';
import { Particle } from '../Particle';
import { BehaviorOrder, IEmitterBehavior } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Textuure behavior that assigns a single texture to each particle.
 * String values will be converted to textures with {@link ParticleUtils.GetTextureFromString}.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'textureSingle',
 *     config: {
 *         texture: Texture.from('myTexId'),
 *     }
 * }
 * ```
 */
export declare class SingleTextureBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private texture;
    constructor(config: {
        /**
         * Image to use for each particle.
         */
        texture: Texture | string;
    });
    initParticles(first: Particle): void;
}
