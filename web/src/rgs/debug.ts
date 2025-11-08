import type { RoundPayload } from './types';

function qs(name: string) { return new URLSearchParams(location.search).get(name); }
export function isDebug() { return qs('debug') === '1'; }

export async function debugPlay(): Promise<{ round: RoundPayload }> {
  const scenario = (qs('scenario') || 'fs').toLowerCase();
  if (scenario === 'respin') return { round: { id:'debug-respin', events: respinEvents() } };
  return { round: { id:'debug-fs', events: fsEvents() } };
}

function baseIntro() {
  return [
    { type:'spinStart', bet:1_000_000, mode:'classic' },
    { type:'reelStop', reel:1, symbols:['A','E','S'] },
    { type:'reelStop', reel:2, symbols:['E','S','E'] },
    { type:'reelStop', reel:3, symbols:['S','E','W3'] },
    { type:'waysWin', ways:[{symbol:'E', reels:[1,2,3], mult:1.0, win:150_000}] },
    { type:'setTotalWin', amount:150_000 },
  ];
}

function fsEvents(): any[] {
  const e:any[] = [...baseIntro()];
  e.push({ type:'fsStart', totalSpins:3 });

  e.push({ type:'fsSpinStart', index:1 });
  e.push({ type:'stickyWildAdd', reel:3, row:1, mult:2 });
  e.push({ type:'reelStop', reel:1, symbols:['A','E','D'] });
  e.push({ type:'reelStop', reel:2, symbols:['E','E','G'] });
  e.push({ type:'reelStop', reel:3, symbols:['W2','X','X'] });
  e.push({ type:'reelStop', reel:4, symbols:['H','A','D'] });
  e.push({ type:'reelStop', reel:5, symbols:['I','A','D'] });
  e.push({ type:'hypeUp', value:1 });
  e.push({ type:'fsSetSpinWin', amount:300_000 });

  e.push({ type:'fsSpinStart', index:2 });
  e.push({ type:'reelStop', reel:1, symbols:['A','E','D'] });
  e.push({ type:'reelStop', reel:2, symbols:['E','E','G'] });
  e.push({ type:'reelStop', reel:3, symbols:['W2','X','X'] });
  e.push({ type:'reelStop', reel:4, symbols:['H','A','D'] });
  e.push({ type:'reelStop', reel:5, symbols:['I','A','D'] });
  e.push({ type:'hypeUp', value:2 });
  e.push({ type:'fsSetSpinWin', amount:500_000 });

  e.push({ type:'fsSpinStart', index:3 });
  e.push({ type:'reelStop', reel:1, symbols:['A','E','D'] });
  e.push({ type:'reelStop', reel:2, symbols:['E','E','G'] });
  e.push({ type:'reelStop', reel:3, symbols:['W2','X','X'] });
  e.push({ type:'reelStop', reel:4, symbols:['H','A','D'] });
  e.push({ type:'reelStop', reel:5, symbols:['I','A','D'] });
  e.push({ type:'hypeUp', value:3 });
  e.push({ type:'fsSetSpinWin', amount:900_000 });

  e.push({ type:'fsEnd', totalWin:1_700_000 });
  e.push({ type:'finalWin' });
  return e;
}

function respinEvents(): any[] {
  const e:any[] = [
    { type:'spinStart', bet:1_000_000, mode:'classic' },
    { type:'reelStop', reel:1, symbols:['S','E','A'] },
    { type:'reelStop', reel:2, symbols:['E','S','E'] },
    { type:'reelStop', reel:3, symbols:['A','B','C'] },
    { type:'reelStop', reel:4, symbols:['D','E','F'] },
    { type:'reelStop', reel:5, symbols:['G','H','I'] },
    { type:'respinStart' },
    { type:'reelLock', reels:[1,2] },
    { type:'reelRespin', reels:[3,4,5] },
    { type:'reelStop', reel:3, symbols:['S','E','W2'] },
    { type:'reelStop', reel:4, symbols:['E','E','G'] },
    { type:'reelStop', reel:5, symbols:['H','A','D'] },
    { type:'respinEnd' },
    { type:'fsStart', totalSpins:1 },
    { type:'fsSpinStart', index:1 },
    { type:'stickyWildAdd', reel:3, row:1, mult:3 },
    { type:'reelStop', reel:1, symbols:['A','E','D'] },
    { type:'reelStop', reel:2, symbols:['E','E','G'] },
    { type:'reelStop', reel:3, symbols:['W3','X','X'] },
    { type:'reelStop', reel:4, symbols:['H','A','D'] },
    { type:'reelStop', reel:5, symbols:['I','A','D'] },
    { type:'hypeUp', value:1 },
    { type:'fsSetSpinWin', amount:420_000 },
    { type:'fsEnd', totalWin:420_000 },
    { type:'finalWin' },
  ];
  return e;
}
