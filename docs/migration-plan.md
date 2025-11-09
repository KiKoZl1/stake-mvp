# Migration Plan - LINES to Stake MVP

This document tracks the full migration of the LINES slot template into the `stake-mvp` workspace. It is the single source of truth while we finish the port and turn this repo into our reusable slot template.

## 1. Context & Vision
- **Goal**: run the complete LINES experience (UI, gameplay loop, assets, tooling) inside `C:\dev\stake-mvp` using the existing math SDK and local RGS debug flow.
- **Workspace**: all commands/edits happen strictly under `C:\dev\stake-mvp` so the repository remains consistent with VS Code and the user's tooling.
- **Constraints**:
  - Keep the math SDK (`/math`) intact and keep supporting local `src/rgs/debug.ts` simulations.
  - Avoid depending on TESTESDK once the copy is complete; everything must live in this repo.
  - Prepare the repo so future games reuse this codebase by swapping only art/assets.
- **Deliverable**: a Vite/Svelte project that mirrors LINES behaviour, passes Storybook checks, and ships with documentation explaining how to reskin it.

## 2. What Was Imported
| Area | Source in LINES | Destination here | Notes |
| --- | --- | --- | --- |
| Packages | `TESTESDK/packages/*` | `packages/*` | Components, utils, state stores, Pixi helpers, configs |
| Web app | `apps/lines/src/*` | `web/src/*` | Components, game logic, i18n, stories, RGS helpers |
| Assets | `apps/lines/static/assets` | `web/src/assets` | Sprites, spines, bitmap fonts, audio, loaders |
| Tooling | `config-*`, `.storybook/`, Lingui, Turbo | replicated | All configs copied so aliases/scripts match |
| Scripts | `apps/lines/package.json` | `web/package.json` | Dev/build/storybook scripts now target local packages |

## 3. Completed Milestones
### 3.1 Template bootstrap
- `web/src/App.svelte` matches the LINES bootstrap (GlobalStyle, Authenticate, LoadI18n, Game).
- All LINES packages/components/game/i18n/stories live in this repo; imports resolve via aliases in `web/vite.config.js` and `web/tsconfig.app.json`.
- `src/assets/**` contains the full asset manifest and `src/game/assets.ts` exposes URLs for spritesheets, spines, bitmap fonts, and audio.

### 3.2 Tooling alignment
- `web/package.json` upgraded to the same dependency set as LINES (Svelte 5.39, Vite 7, Storybook 9, Lingui, pixi-svelte, etc.).
- `svelte.config.js` uses runes and re-exports `config-svelte`.
- `vite.config.js` builds alias maps for every package (`components-*`, `utils-*`, `state-*`, configs, `$env/static/public`).
- `$env/static/public` shim lives at `web/src/env/public.ts`; `packages/state-shared/src/stateUrl.svelte.ts` reads `window.location` instead of `$app/state`.

### 3.3 Runtime integration
- `web/src/rgs/requests.ts` routes to `rgs-requests-remote` when `rgs_url` exists or falls back to `src/rgs/debug.ts` for local play.
- `src/stage/createStage.ts` loads symbol/reel spritesheets with `pixi.Assets`, applies the LINES graphics, and disables worker usage to respect CSP.
- CSP now allows `data:` / `blob:` for `connect-src`, `img-src`, and `font-src`, so PIXI can load inline textures/audio without violations.

### 3.4 Repository structure
- Every shared package now lives under `/packages`; no dependency on TESTESDK remains.
- Turbo/PNPM configs reference the local packages (workspace).
- This document (`docs/migration-plan.md`) acts as the ongoing log.

### 3.5 Debug tooling
- `src/rgs/debug.ts` now loads the actual books from `web/src/stories/data/{base,bonus}_books.ts`, so the local simulator feeds the same `BookEvent` stream as production. By default (`npm run dev` + `?debug=1`) it randomly picks both scenario (base/bonus) and book. Override it with:
  - `scenario=base|bonus|random` (`random` forces a new draw each time)
  - `bookId=<id>` or `bookIndex=<index>` to lock a specific book
  - `random=1` to shuffle books even when a specific scenario was provided

### 3.6 Storybook config
- `.storybook/main.ts` and `preview.ts` now re-export the shared `config-storybook` presets, so Storybook uses the same settings as the LINES template.

### 3.7 Gameplay polish
- Added `updateGlobalMult` handling: `stateGame` tracks the current global multiplier + visibility, `bookEventHandlerMap` emits the UI events, and the `GlobalMultiplier` component is mounted so bonus rounds mirror the template behaviour (including the reset after the free-spin outro).

## 4. Outstanding Gaps (Detailed)
### 4.1 Book events & emitter wiring
- `updateGlobalMult` is covered, but we still need to watch the console when spinning against live RGS data in case new event types appear.
- Capture any new book-event signatures and mirror the original LINES handlers so `createPlayBookUtils` never hits the "Missing bookEventHandler" log.
- Keep validating that the shared contexts (BoardContext, event emitter, hotkeys, modals) stay initialised inside `App.svelte` during autoplay, bonus buy, and resume scenarios.

### 4.2 Storybook & developer tooling
- `.storybook` config from LINES still needs to be wired into `web/.storybook/` and scripts adjusted to use `config-storybook`.
- `npm run storybook` currently spins up the old placeholder setup (or fails). Need to copy `main.ts`, `preview.ts`, and ensure the Vite aliases match the app.
- `npm run check` fails because the config packages are only referenced via workspace; decide whether to add them as `file:` devDependencies or limit checks to `web/src`.

### 4.3 QA & math integration
- After book handlers exist, validate the full loop: start spin via UI, receive outcomes from `src/rgs/debug.ts`, update balances (`state-shared/stateBet`), and stop animations.
- No automated tests exist yet; plan smoke/snapshot tests around the debug flow once the UI stabilises.

### 4.4 Template hardening
- Once the game is functional, reorganise packages/components/utils so the repo becomes an easy-to-skin template (document dependencies, add diagrams, etc.).
- Document how to clone the repo and build a new game by swapping assets + translations.

## 5. Next Actions (Short Term)
1. **Book handlers**: complete `web/src/game/bookEventHandlerMap.ts`, `playBookEvent`, and register the handler map so spins finish.
2. **Emitter/context wiring**: verify `components-shared` providers (BoardContext, event emitter, modals, hotkeys) are active after the new handlers are in place.
3. **RGS validation**: run both debug (`src/rgs/debug.ts`) and remote (`rgs_url`) flows to confirm spins settle and balances update.
4. **Storybook enablement**: copy `.storybook` config from LINES, hook it into `web/.storybook`, and make sure `npm run storybook` serves the migrated stories.

## 6. Future Cleanup & Template Work
- Reorganise folders (group components/utils, document alias ownership) once gameplay + tooling are stable.
- Write how-to guides: deploying, running tests, creating a new game skin, onboarding math outputs.

## 7. Tracking Progress
- Update this file whenever a milestone completes or a new blocker is discovered.
- Use git history to tie commits to the steps above (reference file paths when possible).
- Keep a checklist per section (Completed / Outstanding / Next) to make hand-offs easy.