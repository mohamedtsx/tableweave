import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { aliases } from "./aliases.mjs";
import { own, root } from "./guard.mjs";

const run = process.env.PAGER_UNITS_RUN;
if (!run || !/^[a-z][a-z0-9-]*$/.test(run))
  throw new Error("Choose unique PAGER_UNITS_RUN");
const output = join(own, ".artifacts", run);
mkdirSync(join(own, ".artifacts"), { recursive: true });
mkdirSync(output);
export default {
  root,
  cacheDir: join(output, "vite-cache"),
  esbuild: { jsx: "automatic" },
  resolve: { alias: aliases(), dedupe: ["react", "react-dom"] },
  test: {
    include: [join(own, "render.test.tsx")],
    environment: "node",
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    watch: false,
    forbidOnly: true,
    retry: 0,
    reporters: ["default", "json"],
    outputFile: { json: join(output, "vitest.json") },
    coverage: { enabled: false, reportsDirectory: join(output, "coverage") },
  },
};
