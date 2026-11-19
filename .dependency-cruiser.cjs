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
      name: "domain-must-not-import-cli",
      severity: "error",
      comment: "Dependencies flow one way: the CLI depends on domain folders, never the reverse.",
      from: { path: "^src/(?!cli/)[^/]+/" },
      to: { path: "^src/cli/" },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    parser: "swc",
    doNotFollow: { path: "node_modules" },
  },
};
