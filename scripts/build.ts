import { $ } from "bun";
import pc from "picocolors";
import { build, type Options } from "tsup";

await $`rm -rf dist`;

const tsupConfig: Options = {
  entry: ["src/**/*.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
} satisfies Options;

await Promise.all([
  build({
    outDir: "dist",
    format: "esm",
    target: "node20",
    cjsInterop: false,
    ...tsupConfig,
  }),
  build({
    outDir: "dist/cjs",
    format: "cjs",
    target: "node20",
    ...tsupConfig,
  }),
]);

await $`tsc --project tsconfig.dts.json`.then(() =>
  console.log(pc.magenta("DTS"), "⚡ Files generated"),
);

await Promise.all([$`cp dist/*.d.ts dist/cjs`]);

process.exit();
