import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
if (process.argv[2] === "--resolve") {
  const owner = JSON.parse(fs.readFileSync(path.join(root, "wp13-owner.json")));
  const names = [
    "@tableweave/react",
    "@tableweave/react/contracts",
    "@tableweave/react/filters",
    "@tableweave/react/criteria",
    "@tableweave/react/reordering",
    "@tableweave/react/reordering-controller",
    ...(/^(styled|vite-styled|next)-/.test(owner.key)
      ? [
          "@tableweave/heroui",
          "@tableweave/heroui/sortable",
          "@tableweave/heroui/styles.css",
        ]
      : []),
  ];
  console.log(
    JSON.stringify(
      Object.fromEntries(
        names.map((name) => [name, import.meta.resolve(name)]),
      ),
    ),
  );
}
// Loaded by the actual consumer-local Vite only in final bundle execution.
export default async function configuration() {
  const owner = JSON.parse(fs.readFileSync(path.join(root, "wp13-owner.json"))),
    styled = /^(styled|vite-styled|next)-/.test(owner.key),
    modules = new Set();
  return {
    root,
    plugins: [
      ...(styled ? [(await import("@tailwindcss/vite")).default()] : []),
      {
        name: "actual-wp13-module-receipts",
        moduleParsed(info) {
          modules.add(info.id);
        },
        closeBundle() {
          fs.writeFileSync(
            path.join(root, "wp13-bundle-observations.json"),
            `${JSON.stringify({ modules: [...modules].sort(), styled }, null, 2)}\n`,
            { flag: "wx" },
          );
        },
      },
    ],
    build: {
      outDir: "wp13-bundle",
      emptyOutDir: false,
      lib: {
        entry: path.join(root, "wp13.entry.mjs"),
        formats: ["es"],
        fileName: "consumer",
      },
    },
  };
}
