// packages/ddd-kit/tsup.config.ts

import { defineConfig } from "tsup";

export default defineConfig({
  // The entry point(s) of your library.
  entry: ["src/index.ts", "src/domain/index.ts", "src/infra/index.ts"],

  // The output formats. 'esm' and 'cjs' are common for libraries.
  format: ["esm", "cjs"],

  // Generate source maps.
  sourcemap: true,

  // Clean the 'dist' directory before building.
  clean: true,

  dts: false,

  treeshake: true,
  minify: false,
  target: "es2022",
});
