import { EventEmitter } from './emitter';

export type BookEvent =
 | { type:'spinStart'; bet:number; mode:string }
 | { type:'reelStop'; reel:number; symbols:string[] }
 | { type:'waysWin'; ways:Array<{symbol:string; reels:number[]; mult:number; win:number}> }
 | { type:'setTotalWin'; amount:number }
 | { type:'finalWin' }
 | { type:'fsStart'; totalSpins:number }
 | { type:'fsSpinStart'; index:number }
 | { type:'stickyWildAdd'; reel:number; row:number; mult:number }
 | { type:'hypeUp'; value:number }
 | { type:'fsSetSpinWin'; amount:number }
 | { type:'fsEnd'; totalWin:number }
 | { type:'respinStart' }
 | { type:'reelLock'; reels:number[] }
 | { type:'reelRespin'; reels:number[] }
 | { type:'respinEnd' };

export function createBookPlayer(emitter: EventEmitter) {
  const play = async (events: BookEvent[]) => {
    for (const e of events) await emitter.emit(e.type, e);
  };
  return { play };
}
