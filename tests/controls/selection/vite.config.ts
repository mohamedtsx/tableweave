import { defineConfig } from "vite";
import { sourceVite } from "../harness/resolve.mjs";
export default defineConfig(await sourceVite(import.meta.url));
