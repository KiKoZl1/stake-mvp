export type Props = {
    slotName: string;
    children: Snippet;
};
import { type Snippet } from 'svelte';
declare const SpineSlot: import("svelte").Component<Props, {}, "">;
type SpineSlot = ReturnType<typeof SpineSlot>;
export default SpineSlot;
