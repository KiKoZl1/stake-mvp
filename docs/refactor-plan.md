# Refactor & Compliance Plan - stake-mvp

This document tracks the end-to-end cleanup required to take the current prototype to a production-ready Stake Engine slot. It complements `docs/pending-build.md` by recording **what is changing**, **why**, and **what is already done** so we never lose context between sessions/branches.

---

## 1. North Star

| Area | Goal |
| --- | --- |
| **Slot runtime** | Pure runes Svelte + typed event emitter, no legacy `export let`/`on:` warnings, all UI features (`Autoplay`, `ModePanel`, `Settings`, `HUD`, etc.) reactive via `$props`/stores. |
| **RGS / Math integration** | `packages/rgs-requests` + `web/src/rgs` share a single typed client, dev fixtures mirror real artifacts, book events typed, state machine handles all states. |
| **Tooling & build** | `pnpm --filter web check` and `build` run without OOM, stories only import typed data, config packages provide their own `.d.ts` (e.g., `@lingui/conf`, Storybook). |
| **Pixi / Storybook** | `pixi-svelte` exports typed APIs (`createApp`, `PixiApp`, contexts, components), story packages consume those types, no implicit `any` or duplicate props. |

---

## 2. Workstreams & Status

### 2.1 UI / EventEmitter cleanup

- [x] Autoplay, Intro, Settings, ModePanel, HUD rewritten using `$props`, `visible` flags, and no `export let`.
- [x] `story` snippets use `@const storyTemplate` (temporary hack) to keep Svelte's type checker happy.
- [x] Expand `EmitterEvent` unions (`web/src/game/typesEmitterEvent.ts`) with sound/multiplier/transition events so `eventEmitter.broadcast` is typed everywhere. (Done 2025-11-10 - includes `soundBetMode`/`soundPress*` payloads.)
- [ ] Migrate remaining UI components (`Sound`, `GlobalMultiplier`, `Anticipations`, etc.) to the updated event typings and remove deprecated `on:` directives (`on:click`, `on:keydown` -> `onclick`, etc.).

### 2.2 RGS / Stores / Machines

- [x] `state-shared` now re-exports the real `.svelte.ts` stores via wrapper files; TS no longer relies on blanket `declare module`.
- [x] `web/src/rgs/requests.ts` validates params, wraps debug mode, and no longer injects fields (`id`) missing in `BetType`.
- [x] `packages/utils-xstate/src/createPrimaryMachines.ts` gained helpers `hasErrorField/hasBalanceField/hasRoundField`.
- [x] Added `getPaddingBoard(gameType)` so both the actor and `bookEventHandlerMap` pass `RawSymbol[][]` into `enhancedBoard`.
- [ ] Guard the remaining `data.balance`, `data.round` accesses (lines 150+) and finish the TODO list in `createPrimaryMachines` so everything behaves under the new guards.
- [ ] Fix `stateGameDerived.enhancedBoard.preSpin` calls in stories/components (pass typed `RawSymbol` board data instead of plain `string` names).

### 2.3 Pixi / Storybook types

- [x] `pixi-svelte` exports `createApp` + new `PixiApp` type to avoid the `<App>` vs type clash.
- [x] Story data (`base_events.ts`, `bonus_events.ts`) now matches `BookEvent` (with `index`) so `playBookEvent` has real types.
- [x] `UiSprite` consumers (bet/buy/drawer buttons) no longer pass unsupported `key` props.
- [ ] Update `pixi-svelte` component exports (e.g., `Container`, `Text`, `Rectangle`, `ParticleEmitter`, etc.) so importing packages stop complaining about missing members. This requires checking `packages/pixi-svelte/src/lib/components/*.svelte` and their `index.ts`.
- [ ] Many storybook components expect Pixi-specific props (`Particle.direction`, `turningSpeed`, `speed`). Add local interfaces extending PIXI types (e.g., `type DemoParticle = PIXI.Particle & { direction: number; ... }`) within the story files.
- [ ] `ComponentsGame.stories.svelte`, `ModeBase/BONUS` stories still error because `{@const storyTemplate = ...}` sits outside the snippet block. Replace with `<Story {...args} let:story>` pattern or wrap with `<svelte:fragment slot="template">`.
- [ ] `messagesMap` merge: ensure every locale key exists (maybe import the base map and spread defaults).

### 2.4 Tooling / Config packages

- ✅ Added workspace-level `types/workspace-packages.d.ts` and referenced it from all tsconfigs.
- ✅ Added `config-lingui/lingui-conf.d.ts` to silence `@lingui/conf` missing types.
- ✅ `rgs-fetcher` generics now only allow paths that define the requested method.
- 🔜 `packages/config-storybook/src/main.ts` and `preview.ts` import `.cjs`; ensure `tsconfig` includes those files (or add `declare module '*.cjs'` which we already did) and align the `StorybookConfig` shape (framework options expect `FrameworkOptions` - probably need `{ name: '@storybook/svelte-vite', options: { builder?: 'vite'; } }`).
- 🔜 Address runes warnings triggered by `on:` directives or plain `let` state in UI components (autoplay, settings, hud). Need to adopt `$state()` for local state and convert events to native attributes (`onclick`, `onkeydown`).

---

## 3. Remaining Error Buckets (as of 2025-11-10)

| Bucket | Representative Errors | Plan |
| --- | --- | --- |
| **Story data / Snippets** | `storyTemplate` placement, `BookEvent` union mismatches | Replace inline spreads with typed helpers (`const book = baseBooks[index] as Book;`), move `storyTemplate` inside snippet via `<Story ... let:template>`. |
| **Pixi Storybook demos** | `Particle.direction`, duplicate `children`, `Container` exports | Add local helper interfaces and ensure `pixi-svelte` exports all symbols; fix story markup to avoid repeated `children`. |
| **UI Run** | Non-reactive `let` and deprecated `on:` usage | Wrap state with `$state`, replace directives with native events, ensure modals set focus via `$effect`. |
| **Config packages** | `config-storybook` `.cjs` imports missing from tsconfig include, framework typing mismatch | Include `packages/config-storybook/src/**/*.cjs` via `tsconfig.app/check`, and adjust the config type to the new Storybook 10 signature. |
| **RGS / Machines** | `createPrimaryMachines.ts` still accesses `data.balance` without guards | Finish node guards so `data.balance`/`data.round` reads go through `hasBalanceField` helpers and return early otherwise. |
| **Symbol/Pixi typing** | `SymbolSpineMain` expects `animationName`, story fixtures still type-cast raw strings | Narrow symbol unions (e.g., provide discriminated props for animation-bearing symbols) and finish migrating story fixtures to typed helpers. |

---

## 4. Next 3 Actions

1. **Storybook Snippet Fixes** - Replace the ad-hoc `storyTemplate` pattern with Storybook's recommended `render` API (`const meta: Meta = { render: (args) => ... }`), and ensure fixtures cast to real `BookEvent` arrays.

2. **Pixi Story Exports** - Audit `packages/pixi-svelte/src/lib/components/index.ts` so stories can import `SpineProvider`, `Text`, `Rectangle`, `Sprite`, etc., and add helper interfaces for particle demos.

3. **RGS / Machine Guards** - Finish `packages/utils-xstate/src/createPrimaryMachines.ts` safety helpers so `handleUpdateBalance` only runs when `data.balance` exists, aligning with the new predicate helpers.

Once these are in, re-run `pnpm --filter web check` to see the next wave (should fall well below 100 errors).

---

_Last updated: 2025-11-10 (PT-BR/EN mix kept to match existing docs)._
