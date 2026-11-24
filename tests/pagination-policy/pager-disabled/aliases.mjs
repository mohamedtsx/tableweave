import {
  declared,
  packageRoot,
  sourceAliases,
} from "../../controls/harness/resolve.mjs";

export function aliases() {
  return [
    ...sourceAliases(),
    { find: "react", replacement: packageRoot("react") },
    { find: "react-dom", replacement: packageRoot("react-dom") },
    ...["button", "label", "list-box", "pagination", "select"].map((name) => ({
      find: `@heroui/react/${name}`,
      replacement: declared(`@heroui/react/${name}`),
    })),
    {
      find: /^@internationalized\/date$/,
      replacement: declared("@internationalized/date", "react"),
    },
    {
      find: /^@heroui\/styles\/css$/,
      replacement: declared("@heroui/styles/css"),
    },
    { find: /^tailwindcss$/, replacement: declared("tailwindcss/index.css") },
  ];
}
