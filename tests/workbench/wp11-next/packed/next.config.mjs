import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Ordinary outside-workspace consumer: no source OR emitted-workspace aliases.
/** @satisfies {import("next").NextConfig} */
const config = {
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  typescript: { ignoreBuildErrors: false },
};
export default config;
