import { copyFile } from "node:fs/promises";

await copyFile(
  new URL("../../packages/heroui/src/styles.css", import.meta.url),
  new URL("../../packages/heroui/dist/styles.css", import.meta.url),
);
