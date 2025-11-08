import { Particle } from '../../Particle';
import { SpawnShape } from './SpawnShape';
import type { ObjectProperty } from '../editor/Types';
/**
 * A SpawnShape that randomly picks locations inside a rectangle.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'rect',
 *     data: {
 *          x: 0,
 *          y: 0,
 *          w: 10,
 *          h: 100
 *     }
 * }
 * ```
 */
export declare class Rectangle implements SpawnShape {
    static type: string;
    static editorConfig: ObjectProperty;
    /**
     * X (left) position of the rectangle.
     */
    x: number;
    /**
     * Y (top) position of the rectangle.
     */
    y: number;
    /**
     * Width of the rectangle.
     */
    w: number;
    /**
     * Height of the rectangle.
     */
    h: number;
    constructor(config: {
        /**
         * X (left) position of the rectangle.
         */
        x: number;
        /**
         * Y (top) position of the rectangle.
         */
        y: number;
        /**
         * Width of the rectangle.
         */
        w: number;
        /**
         * Height of the rectangle.
         */
        h: number;
    });
    getRandPos(particle: Particle): void;
}
