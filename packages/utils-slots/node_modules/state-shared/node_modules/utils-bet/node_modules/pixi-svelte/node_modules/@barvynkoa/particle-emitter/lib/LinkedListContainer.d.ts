import { Container } from 'pixi.js';
/** Interface for a child of a LinkedListContainer (has the prev/next properties added) */
export interface LinkedListChild extends Container {
    nextChild: LinkedListChild | null;
    prevChild: LinkedListChild | null;
}
