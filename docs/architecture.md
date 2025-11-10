# Architecture Overview — stake-mvp

This document explains every moving part of the stake-mvp monorepo: execution layers, packages, data contracts, and extensibility hooks. Use it with README.md (high-level onboarding) and docs/debug.md (operational guide).

---

## 1. Repository Layout Recap
| Path | Purpose | Notes |
| --- | --- | --- |
| /web | Svelte + PIXI runtime for the LINES experience. | Contains app entry (App.svelte), game logic, stage builders, RGS glue, Storybook config, assets. |
| /packages | Shared libraries consumed by web (and future skins). | Components, utils, configs, transports, PIXI bindings; each has its own package.json. |
| /math | Math SDK delivered externally. | Treated as opaque dependency; consumed via APIs exposed through state-* packages. |
| /shared | Legacy shared assets/scripts migrated from TESTESDK. | Only the required pieces were copied. |
| /docs | Living documentation. | Update when workflows change. |

---

## 2. Execution Layers

### 2.1 Front-End Composition (web/)
1. src/main.ts bootstraps Svelte runes and mounts App.svelte onto #app.
2. App.svelte stitches providers: global styles, authentication gate, Lingui i18n loader, Stake Engine session wiring, and the Game component.
3. src/game/ holds PIXI board controllers, anticipation logic, multiplier orchestration, and actor/state machines (e.g., ctor.ts, oard.ts).
4. src/stage/ contains PIXI Application factories (createStage.ts) configuring renderers, viewports, asset manifests, filters.
5. src/state/ adapts cross-package stores to the app (derivations, watchers, persistence to localStorage).
6. src/rgs/ provides transport glue: session.ts, debug.ts, ookEventHandlerMap.ts translating math events to UI mutations.
7. src/stories/ reuses components in Storybook; fixtures stay in sync with debug mode.

### 2.2 Shared Packages
| Prefix | Description |
| --- | --- |
| components-* | UI building blocks separated by concern (layout, PIXI, shared wrappers, HTML primitives). |
| utils-* | Pure helpers (bet math, layout, resize observers, event emitters, fetchers, sound, slots, xstate wrappers). |
| state-* | Writable Svelte stores shared across surfaces (bets, sessions, math adapters, UI toggles). |
| config-* | Tooling presets (Vite, Svelte, Storybook, Lingui, TS). |
| gs-* | Stake Engine/RGS transport clients, mock servers, debug overlays. |
| pixi-svelte | Custom PIXI bindings exposed as Svelte components (Container, SpineProvider, SpineTrack, filters, ticker helpers). |

Packages are imported via TypeScript paths defined at the root 	sconfig.json; web/tsconfig.app.json extends it so .svelte files see the same aliases.

### 2.3 Stake Engine / RGS Layer
- **Stake Engine** mediates between the front end and the Remote Game Server (RGS). Responsibilities:
  - Auth/jurisdiction enforcement.
  - Wallet debits/credits.
  - Book streaming (sequence of math events).
  - Session heartbeats.
- **RGS** is the math backend returning deterministic book data.
- packages/rgs-requests exports the HTTP/WebSocket client. web/src/rgs/session.ts consumes it and exposes runes stores for UI.
- Debug mode (web/src/rgs/debug.ts) mimics Stake Engine by reading JSON fixtures. The rest of the stack stays unchanged so feature work never diverges.

---

## 3. Data & Control Flow
`
Player Action → (state-shared) → rgs-requests → Stake Engine → RGS → book events → bookEventHandlerMap → stateGame/stateUi → Svelte/PIXI components
`
1. **Input**: UI components (spin button, buy bonus) dispatch intent via createPlayBookUtils.
2. **Transport**: packages/rgs-requests sends an HTTP/WS call to Stake Engine or to the debug shim.
3. **Book Receipt**: Stake Engine/math responds with a book (array of events). Each event contains metadata (type, payload, timing).
4. **Orchestration**: ookEventHandlerMap routes events to domain actions (update board, set anticipation, update multiplier, show win panel).
5. **Rendering**:
   - PIXI controllers mutate containers/states (reels, backgrounds, overlays).
   - Svelte runes update derived stores and HTML overlays (panels, modals, paytable).
6. **Persistence/Telemetry**: Stores in state-shared sync important values to localStorage/event bus to maintain continuity across reloads and debug sessions.

---

## 4. Rendering Architecture (PIXI + Svelte)
- pixi-svelte exposes PIXI primitives as Svelte components; they accept props for textures, filters, anchors, etc.
- Each reel is composed of:
  - Board.svelte orchestrating symbol containers.
  - web/src/game/reelController.ts handling physics (spin duration, easing, bounce).
  - stateGame providing reel positions/anticipation flags.
- Anticipation flows:
  - Book event nticipationStart toggles stateGame.anticipations.
  - Anticipations.svelte maps over reels and renders Anticipation.svelte instances using SpineProvider/SpineTrack to play animations (nticipation_intro/loop/out).
- Background and global FX live in Background.svelte, using Rectangle, Container, Spine layers, and color grading filters.
- PIXI Application is created once in createStage.ts and exposed through context so components can attach/detach containers safely.

---

## 5. State Management
| Store | Source | Purpose |
| --- | --- | --- |
| stateBet | state-shared | Base bet config (stake, lines, currency). |
| stateBetDerived | state-shared | Derived multipliers, formatted labels. |
| stateGame | web/src/state/stateGame | Board state, anticipation flags, multiplier meters. |
| stateSession | state-shared + web/src/state/session | Auth tokens, jurisdiction, Stake Engine session info. |
| stateUi | state-shared | Toggles (sound, modals, paytable, autoplay). |

All stores are runes-enabled: components access them via const value = (store) or $derived. Never create ad-hoc global stores—extend state-shared instead and document the addition here.

---

## 6. Stake Engine Integration Details
- **Endpoints**: defined in packages/rgs-requests/src/endpoints.ts. Include /session/start, /spin, /bonus-buy, /resume.
- **Headers**: Authorization, Stake-Env, and correlation IDs. Keep them in sync with Stake Engine rollout notes.
- **Error handling**: session.ts retries transient failures; fatal errors bubble to stateUi so modals can display actionable messages.
- **Versioning**: Stake Engine may expose capabilities via response headers. Surface them in stores so UI can feature-gate functionality.
- **Local development**: when RGS_URL is absent, debug mode feeds JSON fixtures but still runs through gs-requests, guaranteeing API compatibility.

When Stake Engine changes contracts (new fields, new endpoints), update:
1. packages/rgs-requests (types and client logic).
2. web/src/rgs/bookEventHandlerMap.ts (if events shift).
3. Documentation (README env vars, this section, debug guide instructions).

---

## 7. Extending the System
### 7.1 Adding a New Book Event
1. Define the event schema with math + Stake Engine teams.
2. Add TypeScript types in web/src/rgs/events.ts (or equivalent file).
3. Update ookEventHandlerMap to handle the event.
4. Update affected stores (stateGame, stateUi).
5. Render UI/PIXI changes.
6. Add debug fixtures under web/src/stories/data/books/ to exercise the event.
7. Document the event in this file and in docs/debug.md (query params, toggles).

### 7.2 Creating a New Component
- Prefer adding reusable primitives under packages/components-* if other skins could consume the component.
- Use pixi-svelte primitives for canvas-bound visuals; use HTML + runes for overlays.
- Add Storybook coverage so QA can test without running the full game.

### 7.3 Skinning Guidelines
- Keep base assets under web/src/assets. For skins, create themed folders or packages (e.g., packages/skin-stake) and make the asset manifest configurable.
- Use CSS variables or store-driven values for typography/colors; avoid hardcoding brand references in logic.

---

## 8. Toolchain & Build System
- **Vite**: web/vite.config.js imports shared presets from packages/config-vite. Includes tsconfig paths, alias resolution, PIXI optimizations.
- **Svelte**: svelte.config.js sets 	ypescript.configFile = './tsconfig.app.json' so the compiler and VS Code agree.
- **Storybook**: web/.storybook/main.ts extends packages/config-storybook. PIXI globals and runes features are polyfilled there.
- **TypeScript project references**: root 	sconfig.json references web/tsconfig.app.json and packages/tsconfig.json so pnpm --filter web check only pulls what is necessary.
- **Lingui**: packages/config-lingui stores CLI configuration; run pnpm --filter web extract to update message catalogs.

---

## 9. Assets, Audio, Localization
- Asset manifest defined in web/src/stage/manifest.ts (or similar). Keep file paths relative to /src/assets to simplify CDN overrides.
- Audio: web/src/audio/ contains cues; packages/utils-sound manages the WebAudio context. Expose toggles through stateUi.
- Localization: web/src/i18n loads Lingui catalogs; add new strings via pnpm --filter web extract and compile with pnpm --filter web lingui:compile.

---

## 10. Deployment Targets
| Surface | Command | Notes |
| --- | --- | --- |
| Local dev | pnpm --filter web dev | Vite + debug mode. |
| Storybook | pnpm --filter web storybook | Component regression testing. |
| Production build | pnpm --filter web build | Outputs /web/dist; served via CDN + SPA host; Stake Engine URL injected at runtime. |
| Math validation | External pipeline | Ensure our contracts match the certified math version. |

CI/CD pipeline TBD; add documentation once Jenkins/GitHub Actions is live.

---

## 11. Ownership Matrix
| Area | Owner | Notes |
| --- | --- | --- |
| PIXI stage & reels | Gameplay/front-end squad | Files under web/src/components, web/src/stage, web/src/game. |
| Shared packages | Platform squad | Maintain packages/*, publish versions if we externalize. |
| Stake Engine transport | Backend integration squad | Own packages/rgs-*, web/src/rgs/*, env contracts. |
| Tooling | Platform enablement | packages/config-*, .vscode, build scripts. |
| Documentation | Everyone | Keep README, architecture, debug, migration plan current. |

---

## 12. Pending Architectural Decisions
- **Shared package outputs**: decide between consuming raw source vs. emitting dist/ artifacts for faster IDE/test runs.
- **Svelte language server & TS 6/7**: monitor ignoreDeprecations path and document migration.
- **Skinning architecture**: formalize how skins override manifests, fonts, copy, sounds (possibly via theme packages).
- **Automated testing**: choose tests (Vitest, Playwright, PIXI snapshots, xstate simulations) and add pipelines.
- **Stake Engine streaming**: evaluate migrating from HTTP polling to WebSocket streaming for near-real-time events.

Update this document whenever we add a subsystem, alter contracts, or finalize a decision.
