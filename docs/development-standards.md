# Development standards

Coding standards for this repo. `/code-review` checks changes against this document.

## Files

- **Name a file after its default export.** The filename (minus extension) matches the default export exactly, including case. A default-exported function `parseDecklist` lives in `parseDecklist.ts`; a default-exported class `RulesEngine` lives in `RulesEngine.ts`.
- **One default export per file.** If a file needs a second top-level concept, it belongs in its own file.
- **Keep source files to 200 lines or fewer.** Test files are exempt (see below). This counts every line, including blank lines and comments. When a file approaches the limit, split it by responsibility rather than trimming comments or formatting.
- **Exceptions to the naming rule:** barrel files (`index.ts`, see below) the executable entry point `src/main.ts` and the files in `scripts/` have no default export and keep those names.
- Supporting named exports (types, small helpers used only by the default export) may sit beside the default export, as long as the file stays within the limit.
- Test files mirror the file under test: `parseDecklist.ts` is tested by `parseDecklist.test.ts`. Test files are exempt from the 200-line limit and may run longer.

## Folder structure

- **Organise `src/` by domain concept**, one camelCase folder per concept from `GLOSSARY.md` (`decklist/`, `cardData/`, `rulesEngine/`, `playerAgent/`, `gameLog/`, `findings/`, `run/`). Create a folder only when its concept has code. No catch-all `shared/` or `types/` folders: a type lives with the concept that owns it.
- **Colocate tests** next to the file they test. Fixtures live in a `fixtures/` folder inside the owning folder. End-to-end tests that cross folders, such as the CLI process tests, live in the top-level `test/`.
- **Every folder that other folders use has an `index.ts` barrel.** A barrel contains only re-exports of what other folders may use, and no logic. Tests and anything not re-exported are private to the folder.
- **Import another folder only through its barrel** (`../decklist/index.js`). Files inside a folder may import their siblings directly.
- **Dependencies flow one way:** `cli` → `run` → (`rulesEngine`, `playerAgent`, `findings`) → (`gameLog`, `cardData`, `decklist`, `effectSchema`). `findings` read only game logs. `playerAgent` sees a game only through a view the rules engine exposes. Nothing imports from `cli` or `run` except the layer above.
- **`cardData/` resolves Decklist names against the cached Scryfall Oracle file** (Card data in `GLOSSARY.md`). It may import `decklist` through its barrel; `decklist` never imports it.
- **`scripts/` holds one-off command-line tasks run with `tsx`** (for example `scripts/refreshCards.ts`, behind `npm run cards:refresh`). A script is a thin entry point like `src/main.ts`: it has no default export, keeps its file name, contains no logic and imports domain folders only through their barrels. `check:deps` covers it too.
- **The CLI is thin:** it parses arguments, calls the domain folders and prints. It holds no parsing or simulation logic.
- **Card effect data** (ADR 0001): the effect schema and validator are code in `src/effectSchema/`. Validated, cached translations are committed JSON in `data/effects/`, one file per card. Raw downloaded card data goes in `data/cards/`, which is gitignored and fetched by a script. Tests use small fixtures and never fetch it.
- This is a single npm package; do not split into workspaces unless a second deployable appears.
- `npm run check:deps` (dependency-cruiser) enforces the barrel and dependency-direction rules in `src/` and `scripts/`.

## TypeScript

- `strict` mode stays on; fix type errors rather than suppressing them.
- Run `npm run typecheck` regularly. TypeScript is pinned to 6.0.x because `typescript-eslint` and `dependency-cruiser` do not support 7 yet; upgrade once both do.

## Linting, formatting and checks

- **ESLint** (`npm run lint`) uses the `typescript-eslint` recommended rules and fails source files over 200 lines (test files are exempt).
- **Prettier** (`npm run format` to fix, `npm run format:check` to verify) owns all formatting. Do not argue style in review; run the formatter.
- **`npm run check`** runs the typecheck, lint, format check, dependency check and tests. A husky **pre-commit hook** runs it, so a commit that fails any of these is rejected. Do not bypass it with `--no-verify`.

## Testing

- Tests use Vitest (`npm test`) and never touch the network.
- Test behaviour through public interfaces (seams), not internals. Agree the seams before writing tests; see the `tdd` skill.
- Expected values come from known literals or worked examples, never from recomputing the code's logic.
- Fixtures live in a `fixtures/` folder beside the tests that use them (top-level `test/fixtures/` for the cross-folder CLI tests).

## Pull requests

- **Merge PRs with squash merge, always.** Each PR lands on `main` as a single commit; do not use merge commits or rebase merges.
- **Delete the remote branch after merging.** For example, `gh pr merge --squash --delete-branch`.

## Domain language

- Use the vocabulary in `GLOSSARY.md` for names in code, tests and error messages (Decklist, Game, Run, Finding, and so on). Avoid the terms the glossary lists under _Avoid_.
- Respect the decisions in `docs/adr/`.

## Errors

- Errors that reach the user say what went wrong and where (for example, the line number and text of a malformed Decklist line).
