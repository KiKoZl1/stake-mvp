// /src/stage/createStage.ts
// Compatível com Pixi v8: usa Application.init(), app.canvas e BlurFilter.strength

import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
  BlurFilter,
  Ticker,
} from 'pixi.js';

const REELS = 5;
const ROWS = 3;
const PADDING = 14;
const CELL_R = 18;

const MERICA_MODE = true;

type Cell = {
  root: Container;
  bg: Graphics;
  label: Text;
  stroke?: Graphics;
};

type Column = {
  root: Container;   // wrapper
  rail: Container;   // trilho (para bumps)
  cells: Cell[];
  glow: Graphics;    // brilho ao parar
  lock: Graphics;    // overlay de reel lock
};

export type StageAPI = {
  app: Application;
  setColumn: (reel: number, symbols: string[]) => void;
  setSticky: (reel: number, row: number, mult: number) => void;
  setHype: (v: number) => void;
  setFsMode: (on: boolean) => void;
  setReelLocked: (reels: number[]) => void;
  clearRespin: () => void;
  flashRespin: () => void;
  startSpin: () => void;
  endSpin: () => void;
};

function colorFor(sym: string): number {
  if (sym === 'X') return 0x0b0b0b;
  if (sym === 'S') return 0x5b1a2b;
  if (sym.startsWith('W')) return 0x3b2f0b;
  const map: Record<string, number> = {
    A: 0x1a232b, B: 0x1e2a44, C: 0x2b1f3a, D: 0x20351e,
    E: 0x2e2e2e, F: 0x2e2a1a, G: 0x1f2d33, H: 0x332021, I: 0x1b2b34
  };
  return map[sym] ?? 0x232323;
}

function textFor(sym: string): string {
  if (sym === 'X') return '';
  if (!MERICA_MODE) return sym === 'S' ? '★' : sym;
  const emoji: Record<string,string> = {
    A:'🌭', B:'🕶️', C:'🤠', D:'🛞',
    E:'🎆', F:'🎸', G:'🗽',
    H:'🦅', I:'🛻',
    S:'🧨',
  };
  return emoji[sym] ?? sym;
}

function makeCell(w: number, h: number): Cell {
  const root = new Container();

  const bg = new Graphics();
  bg.roundRect(0, 0, w, h, CELL_R).fill(0x111111);
  bg.alpha = 0.95;

  const label = new Text({
    text: '',
    style: new TextStyle({
      fill: 0xffffff,
      fontSize: Math.round(h * 0.38),
      fontWeight: '900',
      letterSpacing: 1,
      fontFamily: 'Inter, Arial, system-ui'
    })
  });
  label.anchor.set(0.5);
  label.position.set(w/2, h/2);

  root.addChild(bg);
  root.addChild(label);

  const stroke = new Graphics();
  root.addChild(stroke);

  return { root, bg, label, stroke };
}

function bump(rail: Container, ticker: Ticker) {
  let t = 0;
  const baseScaleX = rail.scale.x, baseScaleY = rail.scale.y;
  const basePivotX = rail.pivot.x, basePivotY = rail.pivot.y;
  const basePosX = rail.position.x, basePosY = rail.position.y;

  const fn = (tk: Ticker) => {
    t += tk.deltaTime / 60;
    const s = 1 + 0.06 * Math.exp(-6 * t) * Math.sin(16 * t);
    rail.pivot.set(rail.width/2, rail.height/2);
    rail.position.set(rail.x + rail.width/2, rail.y + rail.height/2);
    rail.scale.set(s, s);
    if (t > 0.35) {
      ticker.remove(fn);
      rail.scale.set(baseScaleX || 1, baseScaleY || 1);
      rail.pivot.set(basePivotX, basePivotY);
      rail.position.set(basePosX, basePosY);
    }
  };
  ticker.add(fn);
}

export async function createStage(hostEl: HTMLElement): Promise<StageAPI> {
  // Pixi v8: construir + init
  const app = new Application();
  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    resizeTo: hostEl
  });

  const root = new Container();
  root.sortableChildren = true;
  app.stage.addChild(root);

  const frame = new Graphics();
  frame.zIndex = 1;
  root.addChild(frame);

  const grid = new Container();
  grid.zIndex = 2;
  root.addChild(grid);

  const respinFlash = new Graphics();
  respinFlash.zIndex = 5;
  respinFlash.alpha = 0;
  root.addChild(respinFlash);

  const columns: Column[] = [];

  const blur = new BlurFilter();
  blur.strength = 0;            // v8 usa strength
  root.filters = [blur];

  let hypeText: Text | null = null;
  let fsBadge: Text | null = null;

  function layout() {
    const W = hostEl.clientWidth;
    const H = hostEl.clientHeight;

    const stageW = Math.min(W * 0.94, 1400);
    const stageH = Math.min(H * 0.86, 760);
    const x0 = (W - stageW) / 2;
    const y0 = (H - stageH) / 2;

    root.position.set(x0, y0);

    frame.clear();
    frame.roundRect(0, 0, stageW, stageH, 20)
      .fill(0x0b0b0b)
      .stroke({ color: 0x242424, width: 1 });

    const padOuter = 22;
    const gridW = stageW - padOuter * 2;
    const gridH = stageH - padOuter * 2;
    grid.position.set(padOuter, padOuter);

    const colW = (gridW - (REELS - 1) * PADDING) / REELS;
    const rowH = (gridH - (ROWS - 1) * PADDING) / ROWS;

    if (columns.length === 0) {
      for (let c = 0; c < REELS; c++) {
        const rootCol = new Container();
        const rail = new Container();
        const glow = new Graphics(); glow.alpha = 0;
        rootCol.addChild(glow);
        rootCol.addChild(rail);

        const cells: Cell[] = [];
        for (let r = 0; r < ROWS; r++) {
          const cell = makeCell(colW, rowH);
          rail.addChild(cell.root);
          cells.push(cell);
        }

        const lock = new Graphics();
        lock.visible = false;
        rootCol.addChild(lock);

        columns.push({ root: rootCol, rail, cells, glow, lock });
        grid.addChild(rootCol);
      }

      if (!hypeText) {
        hypeText = new Text({
          text: 'HYPE x0',
          style: new TextStyle({ fill: 0x9efc79, fontSize: 20, fontWeight: '700' })
        });
        hypeText.position.set(8, -6);
        hypeText.alpha = 0.95;
        root.addChild(hypeText);
      }
      if (!fsBadge) {
        fsBadge = new Text({
          text: 'FS 0/0',
          style: new TextStyle({ fill: 0xffffff, fontSize: 18, fontWeight: '700' })
        });
        fsBadge.position.set(stageW - 90, -6);
        fsBadge.alpha = 0.9;
        root.addChild(fsBadge);
      }
    }

    for (let c = 0; c < REELS; c++) {
      const col = columns[c];
      const cx = c * (colW + PADDING);
      col.root.position.set(cx, 0);

      col.glow.clear();
      col.glow.roundRect(0, 0, colW, gridH, CELL_R).stroke({ color: 0xffcf40, width: 3 });

      col.lock.clear();
      col.lock.roundRect(0, 0, colW, gridH, CELL_R).fill({ color: 0x112200, alpha: 0.42 });

      for (let r = 0; r < ROWS; r++) {
        const cell = col.cells[r];
        cell.root.position.set(0, r * (rowH + PADDING));
        cell.bg.clear();
        cell.bg.roundRect(0, 0, colW, rowH, CELL_R).fill(0x111111);
        cell.label.style.fontSize = Math.round(rowH * 0.38);
        cell.label.position.set(colW/2, rowH/2);
      }
    }

    if (fsBadge) fsBadge.position.set(stageW - 90, -6);
  }

  const ticker = app.ticker;

  function fadeTo(g: Graphics, from: number, to: number, ms = 280) {
    let t = 0;
    const fn = (tk: Ticker) => {
      t += tk.deltaTime / 60;
      const k = Math.min(1, t / (ms / 1000));
      g.alpha = from + (to - from) * k;
      if (k >= 1) ticker.remove(fn);
    };
    ticker.add(fn);
  }

  layout();

  const ro = new ResizeObserver(() => layout());
  ro.observe(hostEl);

  // Em v8, use app.canvas (não app.view)
  hostEl.innerHTML = '';
  hostEl.appendChild(app.canvas as any);

  function setColumn(reel: number, symbols: string[]) {
    const idx = reel - 1;
    const col = columns[idx];
    if (!col) return;

    for (let r = 0; r < ROWS; r++) {
      const sym = symbols[r] ?? 'X';
      const cell = col.cells[r];
      cell.bg.tint = colorFor(sym);
      cell.label.text = sym.startsWith('W') ? sym : textFor(sym);
      cell.label.alpha = sym === 'X' ? 0 : 1;
      cell.stroke?.clear();
    }

    fadeTo(col.glow, 0, 1, 120);
    setTimeout(() => fadeTo(col.glow, 1, 0, 220), 140);
    bump(col.rail, ticker);
  }

  function setSticky(reel: number, row: number, mult: number) {
    const idx = reel - 1;
    const col = columns[idx];
    if (!col) return;
    const cell = col.cells[row] ?? col.cells[0];

    const g = cell.stroke!;
    g.clear();
    g.roundRect(3, 3, cell.bg.width - 6, cell.bg.height - 6, CELL_R - 6).stroke({ color: 0xf5d742, width: 4 });

    const t = new Text({
      text: `x${mult}`,
      style: new TextStyle({ fill: 0xf5d742, fontSize: Math.round(cell.bg.height * 0.24), fontWeight: '900' })
    });
    t.anchor.set(0.5);
    t.position.set(cell.bg.width - 28, 24);
    cell.root.addChild(t);

    let s = 0.6;
    const fn = (tk: Ticker) => {
      s += 0.08;
      t.scale.set(Math.min(1, s));
      if (s >= 1) ticker.remove(fn);
    };
    ticker.add(fn);
  }

  function setHype(v: number) {
    if (hypeText) hypeText.text = `HYPE x${v}`;
  }

  function setFsMode(on: boolean) {
    const w = frame.width || (hostEl.clientWidth * 0.94);
    const h = frame.height || (hostEl.clientHeight * 0.86);
    frame.clear();
    frame.roundRect(0, 0, w, h, 20)
      .fill(on ? 0x0d0f11 : 0x0b0b0b)
      .stroke({ color: on ? 0x3658a1 : 0x242424, width: 2 });
  }

  function setReelLocked(reels: number[]) {
    for (let i = 0; i < REELS; i++) {
      const col = columns[i];
      col.lock.visible = reels.includes(i + 1);
    }
  }

  function clearRespin() { for (let i = 0; i < REELS; i++) columns[i].lock.visible = false; }

  function flashRespin() {
    respinFlash.clear();
    const gridW = grid.width;
    const gridH = grid.height;
    respinFlash.roundRect(grid.x - 6, grid.y - 6, gridW + 12, gridH + 12, 20)
      .stroke({ color: 0xff3470, width: 6 });
    fadeTo(respinFlash, 0, 1, 80);
    setTimeout(() => fadeTo(respinFlash, 1, 0, 260), 120);
  }

  function startSpin() {
    let cur = blur.strength;
    const fn = (tk: Ticker) => {
      cur += 0.25;
      blur.strength = Math.min(2.2, cur);
      if (blur.strength >= 2.2) ticker.remove(fn);
    };
    ticker.add(fn);
  }

  function endSpin() {
    let cur = blur.strength;
    const fn = (tk: Ticker) => {
      cur -= 0.35;
      blur.strength = Math.max(0, cur);
      if (blur.strength <= 0) ticker.remove(fn);
    };
    ticker.add(fn);
  }

  return {
    app,
    setColumn,
    setSticky,
    setHype,
    setFsMode,
    setReelLocked,
    clearRespin,
    flashRespin,
    startSpin,
    endSpin,
  };
}
