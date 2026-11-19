# Source is organised by domain concept, with barrel files as each folder's public surface

`src/` has one folder per glossary concept (decklist, rules engine, player agent, game log, findings, run). Each folder has an `index.ts` barrel that re-exports only what other folders may use, and other folders import only through it. Tests are colocated, so the barrel is what keeps tests and internals out of other folders' view. A `dependency-cruiser` check enforces the barrel rule and a one-way dependency direction.

Files are otherwise named after their default export, so barrels and the `src/main.ts` entry point are the two named exceptions.

## Considered Options

- **Technical layers (`parsers/`, `services/`, `models/`).** Familiar, but a single concept is spread over several folders and the names don't match the glossary.
- **No barrels; import files directly.** Keeps the naming rule exception-free, but then every file in a folder is public, including tests and helpers.
- **A shared `types/` folder.** Convenient, but becomes a dumping ground that every folder depends on.

## Consequences

- Moving code between folders is a deliberate act: it changes the public surface through a barrel.
- The boundary rules are a deterministic check (`npm run check:deps`), not a convention to remember.
- A concept used by several folders is a prompt to give it its own folder.
