import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"], // produce both import/require
  dts: true, // generate .d.ts
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2022",
});
