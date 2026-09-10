import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist"] },
  tseslint.configs.recommended,
  prettier,
);
