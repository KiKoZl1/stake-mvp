# Debug & Troubleshooting Guide — stake-mvp

Use this document whenever you need to run the game locally, reproduce math events, or fix tooling issues (Storybook, Svelte LS, TypeScript). Share it with every contributor.

---

## 1. Prerequisites
- Node.js 20.x (matches the engines in package.json).
- pnpm 8.x (workspaces rely on it). npm also works but will reinstall shared deps per package.
- VS Code with the **Svelte for VS Code** extension installed.
- Graphics drivers capable of running WebGL (PIXI requires it).

---

## 2. Install & Bootstrap
`Bash
pnpm install       # run at repo root; installs web + packages
pnpm --filter web dev   # optional: scoped dev server
`
- First install might take a while because each package is symlinked into 
ode_modules.
- If Windows Defender locks files, re-run pnpm install with admin permissions.

---

## 3. VS Code Configuration
1. Open the workspace file stake-mvp.code-workspace (double-click from Explorer).
2. Confirm .vscode/settings.json exists at the repo root with:
   `json
   {
     "svelte.enable-ts-plugin": true,
     "svelte.language-server.tsconfigPath": "./web/tsconfig.app.json"
   }
   `
3. Restart the Svelte Language Server: Ctrl+Shift+P → Svelte: Restart Language Server.
4. Open View → Output → Svelte. The first line must read:
   `
   Using tsconfig from c:/dev/stake-mvp/web/tsconfig.app.json
   `
5. If it points anywhere else, delete %APPDATA%/Code/User/globalStorage/svelte.svelte-vscode, restart VS Code, and repeat the steps.

### Common LS issues
| Symptom | Fix |
| --- | --- |
| .svelte files cannot import from pixi-svelte or state-shared. | Language server is loading the wrong 	sconfig. Re-run step 4 and ensure the output shows the app config. |
| "Module has no exported member" errors only inside .svelte. | Same fix as above; .ts files use workspace TS while LS might still be stuck on defaults. |
| "Invalid value for --ignoreDeprecations". | TS 6 enforces string values. Ensure "ignoreDeprecations": "6.0" and remove CLI flags referencing it. |

---

## 4. Running the Game (Dev Server)
`Bash
cd web
pnpm dev
`
- Opens http://localhost:5173/ by default.
- Query parameters control debug behavior (see section 6).
- Environment variables live in web/.env.* (when present) or are read from the OS env.

### Useful scripts
| Command | Description |
| --- | --- |
| pnpm dev | Vite dev server with hot module replacement. |
| pnpm check | Runs svelte-check + TypeScript project references. Heavy until we optimize packages. |
| pnpm build | Production Vite build. |
| pnpm lint | Applies ESLint rules from packages/eslint-config-custom. |

---

## 5. Storybook Workflow
1. From web/ run pnpm storybook.
2. The config in web/.storybook extends packages/config-storybook (ensures PIXI globals, runes support, shared decorators).
3. Known gaps:
   - TypeScript path aliases sometimes fail when Storybook spawns its own TS server. If imports break, copy the alias section from web/tsconfig.app.json into .storybook/tsconfig.json temporarily.
   - CSS order warnings may appear because PIXI injects styles at runtime. Suppress by adding previewHead overrides if necessary.
4. Once Storybook opens, use the ComponentsGame stories to validate stage state and event handling.

---

## 6. Debugging with Book Fixtures
- Endpoint: web/src/rgs/debug.ts.
- Books live under web/src/stories/data/books/ and mimic RGS payloads.
- Launch the dev server with query params, e.g.:
  - http://localhost:5173/?mode=debug&scenario=base&bookId=12
  - 
andom=true toggles RNG shuffling.
  - ForceScatter=1 guarantees scatter hits on the specified reel.
- createPlayBookUtils logs the currently loaded book and event progression to the console. Keep DevTools open.

### Query parameters
| Param | Values | Description |
| --- | --- | --- |
| mode | debug, prod | Switches between local fixtures and real RGS. |
| scenario | Base, Bonus, etc. | Chooses a folder under stories/data/books. |
| BookId | numeric | Selects a specific JSON file. |
| BookIndex | numeric | For arrays of books, choose the index. |
| 
andom | 	rue/false | Shuffle events for stress testing. |
| ForceScatter | reel index | Force scatter symbol placement for anticipation tests. |

---

## 7. RGS Integration Tests
1. Set mode=prod (or remove the param) and configure 
gs_url via environment variable.
2. Ensure authentication tokens are valid; stateSession will log errors if the handshake fails.
3. Trigger live rounds and observe Network tab. Each response should match the schema consumed by BookEventHandlerMap.
4. Capture HAR files for QA and attach them to tickets when bugs appear.

---

## 8. Troubleshooting Matrix
| Issue | Symptoms | Resolution |
| --- | --- | --- |
| PIXI canvas blank | Stage never renders, console shows Cannot read property 'renderer'. | Check createStage.ts for failed asset loads, confirm manifest paths, ensure GPU drivers allow WebGL. |
| Anticipation not firing | SpineProvider errors or missing scatter events. | Confirm pixi-svelte exports exist (language server fix) and that stateGame.anticipations receives events from BookEventHandlerMap. |
| 
pm run check impossible to finish | TS spends time compiling every package. | Run pnpm --filter web check or temporarily disable heavy packages. Future improvement: emit dist/ for packages. |
| Storybook cannot resolve aliases | Imports like pixi-svelte fail only there. | Mirror the alias config into .storybook/tsconfig.json or use 	sconfigPaths plugin. |
| Localization missing strings | UI shows IDs instead of translated text. | Run pnpm extract (Lingui) and ensure catalogs under web/src/i18n are compiled. |

---

## 9. Logging & Instrumentation
- Use packages/utils-event-emitter for pub/sub style logs.
- console.group each book event while debugging; collapse after validating to keep logs readable.
- When working on math integration, mirror RGS payloads into web/src/rgs/__fixtures__ and note them in tickets.

---

## 10. Checklists
### Before committing
- pnpm lint
- pnpm --filter web check
- Update docs if workflow/config changed.

### Before QA handoff
- Capture a debug session (screen recording or HAR).
- Verify Storybook stories for the touched component.
- Confirm README/architecture/debug references are still valid.

Keep this guide synchronized with reality; whenever a new flag, script, or troubleshooting step appears, add it here.
