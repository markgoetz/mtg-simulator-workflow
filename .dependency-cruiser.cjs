/** Enforces the module boundaries described in docs/development-standards.md. */
module.exports = {
  forbidden: [
    {
      name: "no-deep-imports",
      severity: "error",
      comment: "A file may import another folder only through that folder's index.ts barrel.",
      from: { path: "^src/([^/]+)/" },
      to: { path: "^src/[^/]+/(?!index\\.ts$)", pathNot: "^src/$1/" },
    },
    {
      name: "no-deep-imports-from-src-root",
      severity: "error",
      comment: "Entry files directly under src/ also go through a folder's barrel.",
      from: { path: "^src/[^/]+\\.ts$" },
      to: { path: "^src/[^/]+/(?!index\\.ts$)" },
    },
    {
      name: "scripts-use-barrels",
      severity: "error",
      comment: "Scripts import domain folders only through their index.ts barrels.",
      from: { path: "^scripts/" },
      to: { path: "^src/[^/]+/(?!index\\.ts$)" },
    },
    {
      name: "domain-must-not-import-cli",
      severity: "error",
      comment: "Dependencies flow one way: the CLI depends on domain folders, never the reverse.",
      from: { path: "^src/(?!cli/)[^/]+/" },
      to: { path: "^src/cli/" },
    },
    {
      name: "rules-engine-and-player-agent-are-independent",
      severity: "error",
      comment: "The rules engine and the Player agent meet only through the Game view; the batch wires them together.",
      from: { path: "^src/rulesEngine/" },
      to: { path: "^src/playerAgent/" },
    },
    {
      name: "player-agent-must-not-import-rules-engine",
      severity: "error",
      comment: "A Player agent sees a Game only through the Game view.",
      from: { path: "^src/playerAgent/" },
      to: { path: "^src/rulesEngine/" },
    },
    {
      name: "game-view-and-game-log-are-leaves",
      severity: "error",
      comment: "The Game view and Game log sit below the rules engine, Player agent and batch.",
      from: { path: "^src/(gameView|gameLog)/" },
      to: { path: "^src/(batch|rulesEngine|playerAgent|findings)/" },
    },
    {
      name: "only-cli-imports-batch",
      severity: "error",
      comment: "Nothing imports from batch except the layer above it.",
      from: { path: "^src/(?!cli/|batch/)[^/]+" },
      to: { path: "^src/batch/" },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
  },
};
