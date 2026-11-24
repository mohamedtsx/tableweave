import {
  copyFileSync,
  existsSync,
  mkdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { own, workspace } from "./public-roots.mjs";

export function archiveRoot() {
  const supplied = process.env.CONTROLS_ARCHIVE_ROOT;
  if (!supplied)
    throw new Error(
      "Main must supply CONTROLS_ARCHIVE_ROOT with a genuine installed tarball consumer",
    );
  const root = realpathSync(resolve(supplied));
  const permitted = join(own, ".artifacts", "archives");
  if (!root.startsWith(`${permitted}${sep}`))
    throw new Error(
      "Staging writes are restricted to the owned fixture .artifacts/archives subtree",
    );
  if (!existsSync(join(root, "package.json")))
    throw new Error("Main-owned archive consumer manifest/install is missing");
  return root;
}
export function confinedRequire(root) {
  const request = createRequire(join(root, "package.json"));
  return (specifier) => {
    const found = realpathSync(request.resolve(specifier));
    if (!found.startsWith(`${root}${sep}`))
      throw new Error(`External archive resolution refused: ${specifier}`);
    return found;
  };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const root = archiveRoot();
  const declared = confinedRequire(root);
  for (const name of [
    "@tableweave/react",
    "@tableweave/react/contracts",
    "@tableweave/heroui",
    "@tableweave/heroui/styles.css",
    "react",
    "react-dom/client",
    "react-aria/I18nProvider",
    "@heroui/styles/css",
    "tailwindcss/index.css",
  ])
    declared(name);
  const files = [
    ...[
      "model.ts",
      "messages.ts",
      "ControlsExample.tsx",
      "controls-example.css",
    ].map((name) => `apps/storybook/src/controls/${name}`),
    ...["fixture.tsx", "fixture.css", "index.html", "env.d.ts", "types.ts"].map(
      (name) => `tests/controls/integration/${name}`,
    ),
  ];
  for (const relative of files) {
    const destination = join(root, relative);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(workspace, relative), destination);
  }
  writeFileSync(
    join(root, "tsconfig.controls.json"),
    JSON.stringify(
      {
        compilerOptions: {
          noEmit: true,
          strict: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          noImplicitOverride: true,
          noFallthroughCasesInSwitch: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noUncheckedSideEffectImports: true,
          verbatimModuleSyntax: true,
          isolatedModules: true,
          forceConsistentCasingInFileNames: true,
          skipLibCheck: false,
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          lib: ["ES2022", "ES2023.Intl", "DOM", "DOM.Iterable"],
          types: ["react", "react-dom"],
          typeRoots: ["./node_modules/@types"],
        },
        include: [
          "apps/storybook/src/controls/*.ts",
          "apps/storybook/src/controls/*.tsx",
          "tests/controls/integration/fixture.tsx",
          "tests/controls/integration/env.d.ts",
          "tests/controls/integration/types.ts",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "Copied only owned application/fixture files; no install, manifests, public aliases or library source fallback",
  );
}
