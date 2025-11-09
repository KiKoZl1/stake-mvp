# Pending Build Tasks

## Context
- Running `npm run check` (or `svelte-check`) still exceeds the Node heap even with `NODE_OPTIONS=--max-old-space-size=8192`.
- TypeScript attempts to load every file under `packages/*` directly; those packages currently lack build artifacts (`dist/`) or `.d.ts` outputs.
- Invoking `tsc` on the whole workspace produces many “module has no exported member” errors because TS consumes raw source in the packages.

## Work Items
1. **Split lint/check workflow**
   - Create dedicated tsconfig files so we can run `svelte-check` only for `web/src/**` and `tsc` for smaller subsets instead of loading the entire workspace at once.
   - Alternatively, generate `.d.ts` per package and point aliases to those builds, reducing what the checker needs to parse.
2. **Package builds**
   - Define a build pipeline for each package (Vite/Rollup/tsup/etc.) to emit JS + declarations into `packages/<pkg>/dist`.
   - Update aliases (`vite.config.js`, `tsconfig.*`) to consume those build outputs instead of raw source.
   - Add a root script (`npm run build:packages`) that keeps `dist/` updated.
3. **Story data handling**
   - Large files under `web/src/stories/data` still pressure the check. Convert them to JSON/assets or keep them excluded from the TS configs used for diagnostics.
4. **Final build validation**
   - Once packages emit build artifacts, rerun `npm run check` and `npm run build` to ensure the app bundles successfully for the Stake Engine.