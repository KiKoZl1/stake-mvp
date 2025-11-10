# Migration Plan — LINES → Stake MVP

This document is the canonical timeline for migrating the LINES template into the stake-mvp workspace. Every time we complete or reprioritize work, update this plan so any teammate (or chatbot) can reconstruct context quickly.

---

## 1. Scope & Vision
- **Objective**: run the entire LINES experience inside web/ (Svelte runes + PIXI) reusing the math SDK, debug fixtures, and shared packages.
- **Workspace**: all development happens under C:/dev/stake-mvp (monorepo with web/, packages/, math/, shared/).
- **Invariants**:
  - /math stays untouched so regulation/math audits remain valid.
  - src/rgs/debug.ts must keep parity with the legacy TESTESDK knobs (scenario, book selection, deterministic seeds).
  - The repo must remain template-able: one command to scaffold a skin, no TESTESDK hard-coupling.
- **Deliverables**: working Vite/Svelte build, coherent Storybook, reproducible dev env, documentation bundle (README.md, docs/architecture.md, docs/debug.md, this plan).

---

## 2. Source Mapping (TESTESDK → stake-mvp)
| Surface | Legacy location | stake-mvp target | Notes |
| --- | --- | --- | --- |
| Shared packages | packages/* | packages/* | Components, utils, states, configs, fetched verbatim. |
| Game app | apps/lines/src/** | web/src/** | PIXI scenes, Svelte components, RGS glue, localization. |
| Assets | apps/lines/static/assets/** | web/src/assets/** | Sprite sheets, background videos, bitmap fonts, audio. |
| Tooling | config-*, .storybook | packages/config-*, web/.storybook/** | Turbo, Vite, Svelte, Storybook presets. |
| Fixtures & stories | apps/lines/src/stories/** | web/src/stories/** | Books, paylines, debug data reused by RGS debug mode. |

---

## 3. Completed Milestones
1. **Bootstrap** — web/src/App.svelte mirrors the legacy entry point (global styles, auth gate, i18n loader, Game root). TypeScript aliases live in 	sconfig.app.json + vite.config.js.
2. **Asset pipeline** — src/stage/createStage.ts consumes the production manifest (symbols, reel strips, background layers). CSP updated to allow data/blob URLs required by PIXI loaders.
3. **Debug parity** — src/rgs/debug.ts reads the same book fixtures as Storybook, honoring scenario, bookId, bookIndex, 
andom, and forceScatter. CLI/docs list every flag.
4. **Packages imported** — every components-*, utils-*, state-*, config-*, 
gs-* package lives inside the monorepo. 
gs-requests auto-redirects to debug endpoints when no 
gs_url is provided.
5. **Storybook wiring** — web/.storybook/main.ts + preview.ts extend packages/config-storybook, patched for Vite + Svelte runes. Stories render real PIXI canvases with shared stores.
6. **Gameplay sync** — bookEventHandlerMap covers multiplier updates, scatter anticipation, background transitions. stateGame owns the multiplier panel; GlobalMultiplier, Win, Background reproduce the LINES choreography.
7. **Editor configuration** — .vscode/settings.json in the repo root sets svelte.language-server.tsconfigPath to ./web/tsconfig.app.json, ensuring aliases resolve inside .svelte files.
8. **Documentation kickoff** — Outline for README, architecture, and debug docs defined; this migration plan is tracked in git and referenced by onboarding.

---

## 4. Open Tracks & Backlog

### 4.1 Game Features & Events
- Audit bookEventHandlerMap against the production event list (freeSpinRetrigger, BonusBuy, 
esume, jackpot) and add missing handlers.
- Ensure createPlayBookUtils never logs "Missing bookEventHandler".
- Port outstanding UI widgets (hotkeys, quick bet, modals) and document ownership in docs/architecture.md.

### 4.2 Storybook & Tooling
- 
pm run storybook still needs TS alias + CSS order fixes; follow the checklist that will live in docs/debug.md.
- 
pm run check is slow because packages are consumed from source — decide whether to emit dist/ builds or create lighter tsconfig layers.
- Align @storybook/addon-svelte-csf versions with the PIXI controls so regression tests stay deterministic.

### 4.3 RGS / Math Integration
- Run sessions against a real 
gs_url to confirm round lifecycle, wallet updates, and state synchronization (stateBet, stateUi, stateSession).
- Keep docs/debug.md updated whenever new query params, feature flags, or sample books are introduced.
- Document math build/QA responsibilities (what lives under /math, how to request RNG seeds).

### 4.4 Template Hardening
- Finalize directory ownership guidelines (who edits packages/, who owns web/, how skins override assets) — cross-reference in docs/architecture.md.
- Author a “skinning cookbook” describing how to swap assets, typography, voice overs, and localized strings without touching core math.

---

## 5. Next Concrete Actions
1. **Handlers & contexts** — finish mapping book events, validate providers (BoardContext, event emitter, overlays, hotkey manager).
2. **Storybook** — make 
pm run storybook green end-to-end, document the resolution steps in README + debug doc.
3. **Build & check** — settle on a build strategy for shared packages (prebuilt artifacts vs. tsconfig project references) so 
pm run check and 
pm run build pass locally and in CI.
4. **QA loop** — run full rounds via RGS and the local debug server, capture logs/screenshots, and archive them in docs/debug.md.
5. **Living docs** — keep README, architecture, debug, and this plan synchronized whenever a workflow changes.

---

## 6. References
- README.md — high-level onboarding (root of the repo).
- docs/architecture.md — system layout and ownership map.
- docs/debug.md — run modes, parameters, troubleshooting.
- .vscode/settings.json — required VS Code settings for the Svelte TS language server.
- docs/migration-plan.md — this file (state of the project).
