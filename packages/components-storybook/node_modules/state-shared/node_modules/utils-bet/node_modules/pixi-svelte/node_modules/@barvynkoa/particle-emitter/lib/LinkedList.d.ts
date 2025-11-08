import { Container } from 'pixi.js';
export interface ListNode extends Container {
    nextNode: ListNode | null;
    previousNode: ListNode | null;
}
export declare class LinkedList {
    private _first;
    private _last;
    private _size;
    get first(): ListNode | null;
    get last(): ListNode | null;
    get size(): number;
    add<T>(node: T): ListNode;
    remove<T>(node: T): ListNode;
    indexOf<T>(node: T): number;
    forEach(callback: (node: ListNode, index: number) => void): void;
    getAll(): ListNode[];
}
