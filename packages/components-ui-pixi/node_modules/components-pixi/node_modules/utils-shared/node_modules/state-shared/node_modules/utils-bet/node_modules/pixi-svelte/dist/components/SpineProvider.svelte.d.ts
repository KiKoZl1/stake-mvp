import { type Props as BaseProps } from './BaseSpineProvider.svelte';
import type { PixiPoint } from '../types';
export type Props = Omit<BaseProps, 'spineData' | 'pivot' | 'scale'> & {
    debug?: boolean;
    key: string;
    anchor?: PixiPoint;
    scale?: PixiPoint;
};
declare const SpineProvider: import("svelte").Component<Props, {}, "">;
type SpineProvider = ReturnType<typeof SpineProvider>;
export default SpineProvider;
