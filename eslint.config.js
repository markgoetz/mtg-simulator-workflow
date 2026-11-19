import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "dist/", "data/", ".dependency-cruiser.cjs"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // docs/development-standards.md: source files are 200 lines or fewer.
    files: ["src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: { "max-lines": ["error", { max: 200 }] },
  },
);
