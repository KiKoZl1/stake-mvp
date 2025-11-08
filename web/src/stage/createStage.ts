// /src/stage/createStage.ts
import {
  Application,
  Assets,
  Container,
  Graphics,
  Text,
  TextStyle,
  BlurFilter,
  Ticker,
  Sprite,
  Texture,
  Spritesheet,
} from 'pixi.js';
import assetManifest from '../game/assets';

const SYMBOL_FRAME_MAP: Record<string, string> = {
  A: 'l1.webp',
  B: 'l2.webp',
  C: 'l3.webp',
  D: 'l4.webp',
  E: 'h1.webp',
  F: 'h2.webp',
  G: 'h3.webp',
  H: 'h4.webp',
  I: 'h5.webp',
  S: 's.png',
  W: 'w.png',
  X: 'explodedW.png',
};

const SYMBOL_DEFAULT_FRAME = SYMBOL_FRAME_MAP.A;
const SYMBOL_BASE_SIZE = 200;
const FRAME_BASE_WIDTH = 1080;
const FRAME_BASE_HEIGHT = 900;

let symbolSheetPromise: Promise<Spritesheet> | null = null;
const loadSymbolSheet = () => {
  if (!symbolSheetPromise) {
    symbolSheetPromise = Assets.load<Spritesheet>(assetManifest.symbolsStatic.src);
  }
  return symbolSheetPromise;
};

let reelsFrameSheetPromise: Promise<Spritesheet> | null = null;
const loadReelsFrameSheet = () => {
  if (!reelsFrameSheetPromise) {
    reelsFrameSheetPromise = Assets.load<Spritesheet>(assetManifest.reelsFrame.src);
  }
  return reelsFrameSheetPromise;
};

Assets.setPreferences({
  preferWorkers: false,
});

const REELS = 5;
const ROWS = 3;               // ✅ corrigido
const PADDING = 14;
const CELL_R = 18;
const BUFFER_ABOVE = 2;
const BUFFER_BELOW = 2;
const TOTAL_ROWS = ROWS + BUFFER_ABOVE + BUFFER_BELOW;

const MERICA_MODE = true;

type Cell = {
  root: Container;
  bg: Graphics;
  icon: Sprite;
  stroke?: Graphics;
  symbol: string;
};

type Column = {
  root: Container;   // wrapper
  rail: Container;   // trilho (deslocado verticalmente)
  cells: Cell[];
  glow: Graphics;    // brilho ao parar
  lock: Graphics;    // overlay de reel lock
  spinning: boolean;
  speed: number;     // px por frame (escala do ticker)
  step: number;      // altura efetiva do “tile” (rowH + PADDING)
  scroll: number;
  targetSpeed: number;
  accel: number;
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
  startSpin: (opts?: { turbo?: boolean }) => void;
  endSpin: () => void;
  highlightWays: (ways: Array<{ symbol: string; reels: number[] }>) => void;
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
  if (!MERICA_MODE) return sym === 'S' ? '\u272D' : sym;
  const emoji: Record<string,string> = {
    A:'\u{1F964}', // drink
    B:'\u{1F354}', // burger
    C:'\u{1F576}', // shades
    D:'\u{1F920}', // cowboy hat
    E:'\u{1F386}', // fireworks
    F:'\u{1F3B8}', // guitar
    G:'\u{1F699}', // truck tire
    H:'\u{1F985}', // eagle
    I:'\u{1F69A}', // pickup
    S:'\u{1F5FD}', // statue
  };
  if (sym.startsWith('W')) return '\u{1F985}';
  return emoji[sym] ?? sym;
}

function randSym(): string {
  const pool = ['A','B','C','D','E','F','G','H','I'];
  const wildChance = Math.random();
  if (wildChance > 0.92) return 'W5';
  if (wildChance > 0.88) return 'W3';
  if (wildChance > 0.82) return 'W2';
  if (Math.random() > 0.9) return 'S';
  return pool[(Math.random()*pool.length)|0];
}

function makeCell(w: number, h: number): Cell {
  const root = new Container();

  const bg = new Graphics();
  bg.roundRect(0, 0, w, h, CELL_R).fill(0x111111);
  bg.alpha = 0.95;

  root.addChild(bg);

  const icon = new Sprite(Texture.WHITE);
  icon.anchor.set(0.5);
  icon.position.set(w / 2, h / 2);
  icon.alpha = 0.98;
  icon.width = icon.height = Math.min(w, h) * 0.7;
  root.addChild(icon);

  const stroke = new Graphics();
  root.addChild(stroke);

  return { root, bg, icon, stroke, symbol: 'A' };
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
  const app = new Application();
  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    resizeTo: hostEl
  });
  const [symbolSheet, reelsFrameSheet] = await Promise.all([
    loadSymbolSheet(),
    loadReelsFrameSheet(),
  ]);

  const textureForSymbol = (sym: string) => {
    const frame = frameForSymbol(sym);
    return symbolSheet.textures[frame] ?? Texture.WHITE;
  };


  const root = new Container();
  root.sortableChildren = true;
  app.stage.addChild(root);

  const frame = new Graphics();
  frame.zIndex = 1;

  const frameSprites = {
    bg: new Sprite(reelsFrameSheet.textures['frame_bg.png'] ?? Texture.WHITE),
    fade: new Sprite(reelsFrameSheet.textures['frame_fade.png'] ?? Texture.WHITE),
    edge: new Sprite(reelsFrameSheet.textures['frame_edge.png'] ?? Texture.WHITE),
  };
  frameSprites.bg.zIndex = 0;
  frameSprites.fade.alpha = 0.45;
  frameSprites.fade.zIndex = 1;
  frameSprites.edge.zIndex = 4;

  root.addChild(frameSprites.bg);
  root.addChild(frameSprites.fade);
  root.addChild(frame);
  root.addChild(frameSprites.edge);

  const grid = new Container();
  grid.zIndex = 2;
  root.addChild(grid);

  const gridMask = new Graphics();
  gridMask.zIndex = 2;
  root.addChild(gridMask);
  grid.mask = gridMask;

  const respinFlash = new Graphics();
  respinFlash.zIndex = 5;
  respinFlash.alpha = 0;
  root.addChild(respinFlash);

  const winOverlay = new Graphics();
  winOverlay.zIndex = 4;
  winOverlay.alpha = 0;
  root.addChild(winOverlay);

  const columns: Column[] = [];

  const blur = new BlurFilter();
  blur.strength = 0;
  root.filters = [blur];

  // layout vars
let colW = 0;
let rowH = 0;
let symbolSize = 0;
let turboMode = false;

function gaussianRand(min = 0, max = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  const normalized = (num / 3) + 0.5;
  return min + normalized * (max - min);
}

  const frameForSymbol = (sym: string) => {
    if (sym.startsWith('W')) {
      return SYMBOL_FRAME_MAP.W;
    }
    const key = sym.toUpperCase();
    return SYMBOL_FRAME_MAP[key as keyof typeof SYMBOL_FRAME_MAP] ?? SYMBOL_DEFAULT_FRAME;
  };

  const applySymbol = (cell: Cell, sym: string) => {
    cell.symbol = sym;
    cell.bg.tint = colorFor(sym);
    const tex = textureForSymbol(sym);
    cell.icon.texture = tex;
    const targetScale = symbolSize > 0 ? symbolSize / SYMBOL_BASE_SIZE : 1;
    cell.icon.scale.set(targetScale);
    cell.icon.position.set(colW / 2, rowH / 2);
    cell.stroke?.clear();
    if (sym.startsWith('W') || sym === 'S') {
      cell.stroke?.roundRect(4, 4, colW - 8, rowH - 8, CELL_R - 6).stroke({ color: 0xfff28a, width: 3 });
    }
  };

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

    const frameScaleX = stageW / FRAME_BASE_WIDTH;
    const frameScaleY = stageH / FRAME_BASE_HEIGHT;
    frameSprites.bg.position.set(0, 0);
    frameSprites.fade.position.set(0, 0);
    frameSprites.edge.position.set(0, 0);
    frameSprites.bg.scale.set(frameScaleX, frameScaleY);
    frameSprites.fade.scale.set(frameScaleX, frameScaleY);
    frameSprites.edge.scale.set(frameScaleX, frameScaleY);

    const padOuter = 22;
    const gridW = stageW - padOuter * 2;
    const gridH = stageH - padOuter * 2;
    grid.position.set(padOuter, padOuter);
    gridMask.position.set(padOuter, padOuter);
    gridMask.clear();
    gridMask.roundRect(0, 0, gridW, gridH, 22).fill(0xffffff);

    colW = (gridW - (REELS - 1) * PADDING) / REELS;
    rowH = (gridH - (ROWS - 1) * PADDING) / ROWS;
    const step = rowH + PADDING;
    symbolSize = Math.max(48, Math.round(rowH * 0.82));

    if (columns.length === 0) {
      for (let c = 0; c < REELS; c++) {
        const rootCol = new Container();
        const rail = new Container();
        const glow = new Graphics();
        glow.alpha = 0;
        rootCol.addChild(glow);
        rootCol.addChild(rail);

        const cells: Cell[] = [];
        for (let r = 0; r < TOTAL_ROWS; r++) {
          const cell = makeCell(colW, rowH);
          applySymbol(cell, randSym());
          rail.addChild(cell.root);
          cells.push(cell);
        }

        const lock = new Graphics();
        lock.visible = false;
        rootCol.addChild(lock);

        columns.push({
          root: rootCol,
          rail,
          cells,
          glow,
          lock,
          spinning: false,
          speed: 0,
          targetSpeed: 0,
          accel: 0.18,
          step,
          scroll: 0,
        });
        grid.addChild(rootCol);
      }

    }

    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const cx = c * (colW + PADDING);
      col.root.position.set(cx, 0);

      col.glow.clear();
      col.glow.roundRect(0, 0, colW, gridH, CELL_R).stroke({ color: 0xffcf40, width: 3 });

      col.lock.clear();
      col.lock.roundRect(0, 0, colW, gridH, CELL_R).fill({ color: 0x112200, alpha: 0.42 });

      col.step = step;
      col.scroll = 0;
      col.rail.y = -BUFFER_ABOVE * step;

      col.cells.forEach((cell, idx) => {
        cell.root.position.set(0, idx * step);
        cell.bg.clear();
        cell.bg.roundRect(0, 0, colW, rowH, CELL_R).fill(0x111111);
        applySymbol(cell, cell.symbol);
      });
    }
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

  // ticker para “rolar” enquanto spinning=true
  const spinTicker = (tk: Ticker) => {
    const delta = tk.deltaTime / 60;
    for (const col of columns) {
      if (!col.spinning) continue;

      const acc = col.accel ?? 0.18;
      col.speed += (col.targetSpeed - col.speed) * acc;
      col.scroll += col.speed * delta;

      while (col.scroll >= col.step) {
        col.scroll -= col.step;
        const first = col.cells.shift()!;
        col.cells.push(first);
        applySymbol(first, randSym());
        col.cells.forEach((cell, idx) => cell.root.position.set(0, idx * col.step));
      }

      const overshoot = Math.exp(-col.speed * 0.12) * Math.sin((col.scroll / col.step) * Math.PI);
      col.rail.y = -BUFFER_ABOVE * col.step + col.scroll + overshoot * 4;
    }
  };

  layout();
  const ro = new ResizeObserver(() => layout());
  ro.observe(hostEl);

  hostEl.innerHTML = '';
  hostEl.appendChild(app.canvas as any);

  function setColumn(reel: number, symbols: string[]) {
    const idx = reel - 1;
    const col = columns[idx];
    if (!col) return;

    const settleDelay = turboMode ? 80 : 200;
    const revealDelay = turboMode ? 18 : 40;
    const delay = settleDelay + idx * (turboMode ? 30 : 70);

    setTimeout(() => {
      col.targetSpeed = turboMode ? 3 : 2;

      const stopDelay = (ROWS * revealDelay) + 80;
      setTimeout(() => {
        col.spinning = false;
        col.speed = 0;
        col.scroll = 0;
        col.rail.y = -BUFFER_ABOVE * col.step;

        for (let r = 0; r < ROWS; r++) {
          setTimeout(() => {
            const sym = symbols[r] ?? randSym();
            const cell = col.cells[BUFFER_ABOVE + r];
            applySymbol(cell, sym);
            cell.icon.scale.set(1.25);
            setTimeout(() => cell.icon.scale.set(1), turboMode ? 80 : 160);
          }, r * revealDelay);
        }

        setTimeout(() => {
          for (let i = 0; i < BUFFER_ABOVE; i++) applySymbol(col.cells[i], randSym());
          for (let i = BUFFER_ABOVE + ROWS; i < TOTAL_ROWS; i++) applySymbol(col.cells[i], randSym());
          col.cells.forEach((cell, idx2) => cell.root.position.set(0, idx2 * col.step));
        }, ROWS * revealDelay + 30);

        fadeTo(col.glow, 0, 1, 160);
        setTimeout(() => fadeTo(col.glow, 1, 0, 260), 200);
        bump(col.rail, ticker);
      }, stopDelay);
    }, delay);
  }

  function setSticky(reel: number, row: number, mult: number) {
    const idx = reel - 1;
    const col = columns[idx];
    if (!col) return;
    const cell = col.cells[BUFFER_ABOVE + row] ?? col.cells[BUFFER_ABOVE];

    const g = cell.stroke!;
    g.clear();
    g.roundRect(3, 3, colW - 6, rowH - 6, CELL_R - 6).stroke({ color: 0xf5d742, width: 4 });

    const t = new Text({
      text: `x${mult}`,
      style: new TextStyle({ fill: 0xf5d742, fontSize: Math.round(rowH * 0.24), fontWeight: '900' })
    });
    t.anchor.set(0.5);
    t.position.set(colW - 28, 24);
    cell.root.addChild(t);

    let s = 0.6;
    const fn = (tk: Ticker) => {
      s += 0.08;
      t.scale.set(Math.min(1, s));
      if (s >= 1) ticker.remove(fn);
    };
    ticker.add(fn);
  }

  let hypeLevel = 0;
  function setHype(v: number) {
    hypeLevel = v;
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
    for (let i = 0; i < REELS; i++) columns[i].lock.visible = reels.includes(i + 1);
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

  let spinTickerAdded = false; // ✅ evita add duplicado

  function startSpin(opts?: { turbo?: boolean }) {
    turboMode = opts?.turbo ?? false;
    if (!spinTickerAdded) {
      ticker.add(spinTicker);
      spinTickerAdded = true;
    }

    const baseDelay = turboMode ? 60 : 160;
    const baseTarget = turboMode ? 22 : 16;
    const baseAcceleration = turboMode ? 0.25 : 0.18;

    columns.forEach((col, idx) => {
      col.spinning = false;
      col.speed = 0;
      col.targetSpeed = baseTarget;
      col.scroll = 0;
      col.accel = baseAcceleration;

      const startDelay = idx * baseDelay;
      setTimeout(() => {
        col.spinning = true;
        col.speed = baseTarget * 0.4;
      }, startDelay);
    });

    let cur = blur.strength;
    const targetBlur = turboMode ? 1.4 : 1.8;
    const fn = (tk: Ticker) => {
      cur += 0.2;
      blur.strength = Math.min(targetBlur, cur);
      if (blur.strength >= targetBlur) ticker.remove(fn);
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

  const wayColors = [0xfff28a, 0x7ad1ff, 0xff93d5, 0x9efc79];

  function highlightWays(ways: Array<{ symbol: string; reels: number[] }>) {
    winOverlay.clear();
    if (!ways?.length) {
      fadeTo(winOverlay, winOverlay.alpha, 0, 200);
      return;
    }

    winOverlay.alpha = 1;
    ways.forEach((way, idx) => {
      const color = wayColors[idx % wayColors.length];
      const segments: { x: number; y: number }[] = [];

      (way.reels || []).forEach((reelIndex) => {
        const col = columns[reelIndex - 1];
        if (!col) return;
        const visible = col.cells.slice(BUFFER_ABOVE, BUFFER_ABOVE + ROWS);
        const match = visible.find((cell) => cell.symbol === way.symbol) ?? visible[1];
        if (!match) return;
        pulseCell(match);
        const x = grid.x + col.root.x + colW / 2;
        const y = grid.y + col.root.y + col.rail.y + match.root.y + rowH / 2;
        segments.push({ x, y });
      });

      if (segments.length > 1) {
        winOverlay.lineStyle(5, color, 0.85);
        winOverlay.moveTo(segments[0].x, segments[0].y);
        for (let i = 1; i < segments.length; i++) {
          winOverlay.lineTo(segments[i].x, segments[i].y);
        }
      }
    });

    setTimeout(() => fadeTo(winOverlay, winOverlay.alpha, 0, 220), turboMode ? 200 : 380);
  }

  function pulseCell(cell: Cell) {
    const baseScaleX = cell.icon.scale.x || 1;
    const baseScaleY = cell.icon.scale.y || 1;
    let elapsed = 0;
    const pulse = (tk: Ticker) => {
      elapsed += tk.deltaTime / 60;
      const progress = Math.min(1, elapsed / 0.6);
      const ease = 1 + 0.15 * Math.sin(progress * Math.PI);
      cell.icon.scale.set(baseScaleX * ease, baseScaleY * ease);
      if (progress >= 1) {
        cell.icon.scale.set(baseScaleX, baseScaleY);
        ticker.remove(pulse);
      }
    };
    ticker.add(pulse);

    const g = cell.stroke!;
    g.clear();
    g.roundRect(2, 2, colW - 4, rowH - 4, CELL_R - 4).stroke({ color: 0xfff28a, width: 4 });
    setTimeout(() => g.clear(), 400);
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
    highlightWays,
  };
}
