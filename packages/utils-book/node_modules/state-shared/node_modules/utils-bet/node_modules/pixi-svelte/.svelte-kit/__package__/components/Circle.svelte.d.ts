import * as PIXI from 'pixi.js';
import { type Props as BaseProps } from './Graphics.svelte';
import type { PixiPoint } from '../types';
export type Props = Omit<BaseProps, 'pivot' | 'draw'> & {
    anchor?: PixiPoint;
    diameter: number;
    backgroundColor?: PIXI.FillStyle['color'];
    backgroundAlpha?: PIXI.FillStyle['alpha'];
    borderColor?: PIXI.StrokeStyle['color'];
    borderWidth?: PIXI.StrokeStyle['width'];
    borderAlpha?: PIXI.StrokeStyle['alpha'];
};
declare const Circle: import("svelte").Component<Props, {}, "">;
type Circle = ReturnType<typeof Circle>;
export default Circle;
