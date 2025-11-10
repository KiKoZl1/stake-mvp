# Stake MVP — Monorepo Overview

Welcome to the Stake MVP workspace. This README is designed as an onboarding manual for humans and AI assistants. It explains what we are building, how to shape the workspace, and how every major dependency fits together. Treat it as the table of contents for the entire repo.

---

## 1. Vision & Scope
- **Primary goal**: Deliver the LINES slot experience with a Svelte runes + PIXI front end while reusing the existing math SDK and RGS/Stake Engine transport.
- **Non‑negotiables**:
  - /math stays untouched so certified math builds remain valid.
  - Debug mode must mirror the legacy TESTESDK (same book fixtures, query params, deterministic RNG hooks).
  - The repo must act as a skinning template: another team can fork it and drop in assets/themes without rewriting core logic.
- **Technology pillars**: Svelte 5 (runes), PIXI v7, Vite, pnpm workspaces, Storybook, Lingui, shared packages, Stake Engine integration.

---

## 2. Repository Layout (High Level)
| Path | Description |
| --- | --- |
| /web | Primary game client (Svelte + PIXI) plus Storybook config, RGS glue, assets. |
| /packages | Shared components, utilities, configs, transport layers, PIXI bindings. |
| /math | Math SDK delivered by the math team. **Do not modify.** |
| /shared | Legacy helpers/assets migrated from TESTESDK (only what the app still uses). |
| /docs | Living documents (migration plan, architecture, debug, build notes). |
| /.vscode | Workspace-wide VS Code settings that keep the Svelte language server aligned. |
| stake-mvp.code-workspace | VS Code workspace definition that opens web/, packages/, math/ in one window. |

For subsystem details jump to [docs/architecture.md](docs/architecture.md).

---

## 3. Dependency Stack
| Layer | Dependency | Purpose |
| --- | --- | --- |
| Runtime | Node.js 20.x | Supported LTS used by Vite/Svelte and pnpm scripts. |
| Package manager | pnpm 8.x | Manages workspace symlinks and reproducible installs. |
| Front end | Svelte 5 (runes) | Component model for UI + state stores. |
| Rendering | PIXI v7, Spine runtime | GPU canvas, animations, filters. |
| Build | Vite + esbuild | Dev server and production bundling. |
| L10n | Lingui | Extract/compile translation catalogs. |
| Testing/docs | Storybook 8, svelte-check, ESLint | Component preview, TS validation, linting. |
| Backend bridge | Stake Engine (RGS transport) | Delivers books/events from math server. |

Install native dependencies (Windows Build Tools / XCode CLT) if pnpm logs mention missing compilers.

---

## 4. Workspace Provisioning
1. **Clone** the repo: git clone git@github.com:stake/stake-mvp.git && cd stake-mvp.
2. **Node version**: corepack enable then corepack prepare pnpm@8 --activate. Optional: use 
vm use 20.
3. **Install**: pnpm install (root). This wires every package via workspaces.
4. **Bootstrap VS Code**: open stake-mvp.code-workspace so folders + settings load.
5. **Configure Git hooks** (optional): run pnpm dlx husky install if we add hooks later.
6. **Smoke test**: pnpm --filter web dev → ensure http://localhost:5173 renders the lobby background and logs debug output.
7. **Storybook check**: pnpm --filter web storybook (see section 9 if aliases fail).
8. **Document anything special** (VPN, proxies) inside [docs/debug.md](docs/debug.md) when encountered.

---

## 5. Running Surfaces & Scripts
`ash
pnpm install                # once, at the repo root
pnpm --filter web dev       # Vite dev server
pnpm --filter web storybook # Storybook (component lab)
pnpm --filter web build     # Production bundle
pnpm --filter web check     # svelte-check + TS
pnpm lint                   # ESLint across packages
`
- pnpm dev accepts query params (debug flags). See [docs/debug.md](docs/debug.md#6-debugging-with-book-fixtures).
- Add -- --host if you need LAN testing.

---

## 6. Editor & Tooling Setup
1. Install VS Code extensions: **Svelte for VS Code**, **ESLint**, **Prettier**, **Path Intellisense**.
2. Ensure .vscode/settings.json contains:
   `json
   {
     "svelte.enable-ts-plugin": true,
     "svelte.language-server.tsconfigPath": "./web/tsconfig.app.json",
     "typescript.tsdk": "web/node_modules/typescript/lib"
   }
   `
3. Restart the Svelte Language Server (Ctrl+Shift+P → Svelte: Restart Language Server).
4. Verify View → Output → Svelte logs Using tsconfig from c:/dev/stake-mvp/web/tsconfig.app.json.
5. Clear %APPDATA%/Code/User/globalStorage/svelte.svelte-vscode if the log keeps pointing elsewhere.
6. Optional: enable iles.associations for .svelte so Prettier formats automatically.

---

## 7. Environment Variables & Secrets
| Variable | Location | Description |
| --- | --- | --- |
| RGS_URL | OS env or .env files | Base endpoint for Stake/Remote Game Server. Omit to force debug mode. |
| STAKE_ENV | .env, CI | Environment label (dev, qa, prod) surfaced in logs. |
| LINGUI_LOCALE | Query param or store | Overrides default locale for quick testing. |
| AUTH_TOKEN | Secure store | Player/session credential forwarded to Stake Engine. |
| ASSET_CDN | .env | Optional override when loading from CDN instead of /public. |

Env files: create web/.env.local for personal overrides; never commit secrets.

---

## 8. Developing New Functionality (Example Flow)
**Scenario**: add a "Lightning Wild" feature that highlights a reel and awards an instant multiplier.
1. **Design contract**: document the math event payload in docs/architecture.md under book events.
2. **Update stores**: add state in packages/state-shared (e.g., lightningWildStore) and expose derived values in stateGame under web/src/state.
3. **Handle book event**: edit web/src/rgs/bookEventHandlerMap.ts to react to the new event from Stake Engine/math.
4. **Render UI**:
   - PIXI: create web/src/components/LightningWild.svelte using pixi-svelte primitives (glow filters, timed tweens).
   - HTML overlay: update web/src/components/WinPanel.svelte if copy/scores change.
5. **Wire stage**: register the new component in Board.svelte or Stage.svelte and feed it the derived store.
6. **Add Storybook story**: create web/src/stories/LightningWild.stories.svelte using the same state mocks used by debug mode.
7. **Test**:
   - pnpm --filter web dev -- --scenario=feature --bookId=lightning
   - pnpm --filter web storybook
   - Document findings in [docs/debug.md](docs/debug.md) and keep docs/migration-plan.md updated.

Use this workflow for any new feature: update contract → stores → handlers → components → stories → docs.

---

## 9. Storybook Playbook
1. Run pnpm --filter web storybook. If aliases fail, copy the paths section from web/tsconfig.app.json into web/.storybook/tsconfig.json or install @storybook/addon-svelte-csf latest.
2. Stories live inside web/src/stories/. Prefer the CSF Svelte format so controls/args work.
3. To add a new story:
   - Create <Component>.stories.svelte and import the component via alias (import Board from 'components/Board.svelte').
   - Provide mock stores by importing from state-shared and calling .set() with fixture data.
   - If the feature depends on book payloads, place the JSON under web/src/stories/data/books/ and reuse it in both Storybook and debug mode.
4. Use Storybook to validate accessibility states (sound off, autoplay, paytable) without running the full game.
5. Document tricky knobs (like forcing scatter positions) in [docs/debug.md](docs/debug.md#6-debugging-with-book-fixtures).

---

## 10. Stake Engine Integration
- Stake Engine is the orchestration layer that brokers requests between the front end and the Remote Game Server (RGS).
- Flow:
  1. Front end dispatches a command (spin, buy bonus) via packages/rgs-requests.
  2. Stake Engine validates jurisdiction/session, forwards the call to math, and streams back a book (sequence of events).
  3. web/src/rgs/session.ts normalizes the payload and feeds it to ookEventHandlerMap.
  4. Each event mutates stores and triggers PIXI/Svelte updates.
- When RGS_URL is missing, we bypass Stake Engine and load fixtures from web/src/rgs/debug.ts, but the code path stays identical so math changes can be rehearsed locally.
- If Stake Engine introduces a new endpoint or header, update packages/rgs-requests, document the contract in [docs/architecture.md](docs/architecture.md#stake-engine-integration), and add the env var to section 7 above.

---

## 11. Debug & QA Workflows
- Full instructions live in [docs/debug.md](docs/debug.md).
- Quick checklist:
  1. Pick query params (?mode=debug&scenario=bonus&bookId=3).
  2. Inspect the console for createPlayBookUtils logs; it prints every book event.
  3. Capture HAR files when hitting real RGS.
  4. Use Storybook for component-level regressions (especially anticipation, multiplier panel, paytable).
  5. Log troubleshooting steps back into docs/debug.md if you discover a new fix.

---

## 12. Migration Status
See [docs/migration-plan.md](docs/migration-plan.md) for the always-updated backlog. Snapshot:
- ✅ Bootstrap, asset pipeline, debug parity, package import, Storybook wiring, gameplay loops, editor setup.
- 🔄 Pending: book handler audit, Storybook stability, build/check optimization, RGS QA flows, skinning cookbook, Stake Engine hardening.

---

## 13. Contribution Guidelines
1. Branch from main (eature/<name> or ix/<name>).
2. Run pnpm lint and pnpm --filter web check before pushing.
3. Update docs (README, architecture, debug, migration plan) whenever workflows or contracts change.
4. PR checklist:
   - Summary + motivation.
   - Verification steps (dev server, Storybook, screenshots, logs).
   - Mention math/RGS/Stake Engine impacts.
5. Reviewers must validate code, docs, and devserver output.

---

## 14. Known Issues & Workarounds
| Issue | Status | Workaround |
| --- | --- | --- |
| Svelte LS ignores aliases | TS 6 change; investigating. | Ensure .vscode/settings.json exists; clear Svelte LS cache. |
| pnpm run check slow | Packages compiled from source. | Scope command (pnpm --filter web check) until we emit package builds. |
| Storybook alias errors | Pending config patch. | Copy alias config into .storybook/tsconfig.json or use 	sconfigPaths plugin. |
| ignoreDeprecations warnings | CLI flag deprecated in TS 6+. | Only set "ignoreDeprecations": "6.0" in tsconfig; remove CLI usage. |
| WebGL/PIXI blank canvas | GPU/browser issue. | Verify drivers, disable hardware accel toggles, inspect manifest paths. |

---

## 15. Documentation Index
- [README.md](README.md) — you are here.
- [docs/migration-plan.md](docs/migration-plan.md) — roadmap & backlog.
- [docs/architecture.md](docs/architecture.md) — subsystem deep dive & extension map.
- [docs/debug.md](docs/debug.md) — debug flows, Storybook notes, troubleshooting.
- [docs/pending-build.md](docs/pending-build.md) — build stabilization notes.

---

## 16. Glossary
| Term | Meaning |
| --- | --- |
| **Book** | Sequence of math events describing a spin outcome. |
| **Stake Engine** | Middleware between the client and RGS handling auth, jurisdiction, wallets. |
| **RGS** | Remote Game Server delivering math outcomes/books. |
| **Spine** | 2D skeletal animation format used for anticipation/backgrounds. |
| **Runes** | Svelte 5 syntax ($state, $props, $derived). |
| **Manifest** | PIXI asset descriptor loaded by createStage. |
| **Fixture** | Saved RGS payload used for deterministic debug sessions. |

---

## 17. Support
- **Math questions** → math SDK team (see /math docs if available).
- **Tooling** → platform enablement squad (owners of packages/config-*).
- **Gameplay/UI** → gameplay squad (owners of web/src/game, web/src/components).
- **Stake Engine** → backend integrations squad (maintainers of packages/rgs-*).

Keep this README exhaustive. Whenever you add a dependency, workflow, or environment knob, link it here and reference the deep-dive docs.
