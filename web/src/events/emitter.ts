// /src/events/emitter.ts
type Handler<T = any> = (payload: T) => void;

class SimpleEmitter<E extends Record<string, any>> {
  private map = new Map<keyof E, Set<Handler>>();

  on<K extends keyof E>(type: K, fn: Handler<E[K]>) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(fn as Handler);
  }

  off<K extends keyof E>(type: K, fn: Handler<E[K]>) {
    this.map.get(type)?.delete(fn as Handler);
  }

  emit<K extends keyof E>(type: K, payload: E[K]) {
    this.map.get(type)?.forEach((fn) => fn(payload));
  }
}

// Tipagem opcional dos eventos usados no app
type Events = {
  spinStart: void;
  reelStop: { reel: number; symbols: string[] };
  waysWin: { ways: Array<{ win: number }> };
  setTotalWin: { amount: number };
  fsStart: { totalSpins: number };
  fsSpinStart: { index: number };
  stickyWildAdd: { reel: number; row: number; mult: number };
  hypeUp: { value: number };
  fsEnd: void;
  respinStart: void;
  reelLock: { reels: number[] };
  finalWin: void;
};

const emitter = new SimpleEmitter<Events>();

export default emitter;   // permite: import emitter from './events/emitter'
export { emitter };       // permite: import { emitter } from './events/emitter'
