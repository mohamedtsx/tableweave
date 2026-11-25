import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  demand,
  directory,
  regular,
  json,
  digest,
  tree,
  fileRecord,
  verifyMap,
  object,
  record,
  write,
  mkdir,
  receipt,
  present,
  capacity,
} from "./receipts.mjs";
import { ownedConsumer, local, revalidate } from "./boundary.mjs";
import { packageArchive } from "./archive.mjs";

export function toolchain(ctx) {
  revalidate(ctx);
  const tools = object(ctx.approval.tools);
  demand(process.version === "v24.22.0", "E_NODE_VERSION");
  const node = fs.realpathSync(process.execPath);
  demand(
    node === path.join(ctx.tools, "bin/node"),
    "E_NODE_NOT_OWNED_TOOLCHAIN",
  );
  demand(digest(fs.readFileSync(node)) === tools.nodeSHA256, "E_NODE_IDENTITY");
  const pnpm = path.join(ctx.tools, "bin/pnpm");
  demand(
    digest(regular(ctx.tools, "bin/pnpm")) === tools.pnpmSHA256,
    "E_PNPM_IDENTITY",
  );
  demand(
    json(ctx.tools, "node_modules/pnpm/package.json").version === "10.13.1",
    "E_PNPM_VERSION",
  );
  const pinned = receipt(ctx, "toolchain-inputs.json");
  for (const file of [
    "bin/node",
    "bin/pnpm",
    "node_modules/pnpm/package.json",
    "node_modules/pnpm/bin/pnpm.cjs",
  ])
    demand(Object.hasOwn(pinned, file), "E_TOOLCHAIN_INPUT_MISSING");
  verifyMap(ctx.tools, pinned);
  return { node, pnpm };
}
export function safeEnvironment(ctx) {
  toolchain(ctx);
  const home = path.join(ctx.run, "home", ctx.key);
  directory(home);
  demand(
    regular(ctx.run, `home/${ctx.key}/user.npmrc`).length === 0 &&
      regular(ctx.run, `home/${ctx.key}/global.npmrc`).length === 0,
    "E_HOME_CONFIG",
  );
  for (const item of fs.readdirSync(home))
    demand(
      ["user.npmrc", "global.npmrc", ".config", ".cache", ".local"].includes(
        item,
      ) && !fs.lstatSync(path.join(home, item)).isSymbolicLink(),
      "E_HOME_UNSELECTED_CONFIG",
    );
  return {
    PATH: `${ctx.tools}/bin`,
    HOME: home,
    XDG_CONFIG_HOME: `${home}/.config`,
    NPM_CONFIG_USERCONFIG: `${home}/user.npmrc`,
    NPM_CONFIG_GLOBALCONFIG: `${home}/global.npmrc`,
    NPM_CONFIG_CACHE: `${home}/.cache/npm`,
    CI: "1",
    DO_NOT_TRACK: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    COREPACK_ENABLE_NETWORK: "0",
    PNPM_HOME: `${ctx.tools}/bin`,
    LANG: "C.UTF-8",
    NO_COLOR: "1",
  };
}
export function execute(ctx, task, options = {}) {
  capacity(ctx.run);
  const tools = toolchain(ctx);
  let executable = tools.node,
    args,
    cwd,
    label = task;
  if (task === "producer-build") {
    demand(ctx.phase === "generate", "E_COMMAND_PHASE");
    executable = tools.pnpm;
    args = ["build"];
    cwd = ctx.producer;
  } else if (["pack-react", "pack-heroui"].includes(task)) {
    demand(ctx.phase === "generate", "E_COMMAND_PHASE");
    const name = task.slice(5);
    executable = tools.pnpm;
    args = [
      "--dir",
      `packages/${name}`,
      "pack",
      "--pack-destination",
      path.join(ctx.run, "archives", name),
    ];
    cwd = ctx.producer;
  } else {
    cwd = ownedConsumer(ctx);
    if (task === "install") {
      demand(ctx.phase === "install", "E_COMMAND_PHASE");
      executable = tools.pnpm;
      args = [
        "install",
        ...(ctx.profile === "ordinary" ? ["--ignore-workspace"] : []),
        "--ignore-scripts",
        "--frozen-lockfile",
      ];
    } else if (task === "workspace-root") {
      demand(ctx.phase === "install", "E_COMMAND_PHASE");
      executable = tools.pnpm;
      args = ["root", "--workspace-root"];
    } else if (task === "compiler") {
      demand(
        ctx.phase === "types" &&
          ["typescript", "typescript-5-9"].includes(options.compiler) &&
          ["positive", "expected", "removed", "after"].includes(options.stage),
        "E_COMPILER_PHASE",
      );
      const config = options.stage === "after" ? "positive" : options.stage;
      args = [
        local(cwd, `node_modules/${options.compiler}/bin/tsc`),
        "-p",
        `tsconfig.${config}.json`,
        "--pretty",
        "false",
        "--noEmit",
        ...(options.list ? ["--listFilesOnly"] : []),
      ];
      label = `${options.compiler}-${options.stage}${options.list ? "-files" : ""}`;
    } else if (task === "resolve-exports") {
      demand(ctx.phase === "bundle", "E_COMMAND_PHASE");
      args = [path.join(cwd, "default-bundle.mjs"), "--resolve"];
    } else if (task === "plain-import") {
      demand(ctx.phase === "bundle", "E_COMMAND_PHASE");
      args = [path.join(cwd, "pure-runtime.mjs")];
    } else if (task === "bundle") {
      demand(ctx.phase === "bundle", "E_COMMAND_PHASE");
      args = [
        local(cwd, "node_modules/vite/bin/vite.js"),
        "build",
        "--config",
        "wp13.bundle.mjs",
      ];
    } else if (task === "family-build") {
      demand(
        ctx.phase === "family-build" &&
          ["next", "start", "vite-headless", "vite-styled"].includes(
            ctx.family,
          ),
        "E_COMMAND_PHASE",
      );
      args =
        ctx.family === "next"
          ? [local(cwd, "node_modules/next/dist/bin/next"), "build"]
          : [local(cwd, "node_modules/vite/bin/vite.js"), "build"];
    } else if (task === "family-runtime") {
      demand(
        ctx.phase === "family-runtime" &&
          ["next", "start", "vite-headless", "vite-styled"].includes(
            ctx.family,
          ),
        "E_RUNTIME_COMMAND_PHASE",
      );
      args = [path.join(cwd, "wp13-family-runtime.mjs")];
    } else if (task === "family-types") {
      demand(
        ctx.phase === "family-build" &&
          ["typescript", "typescript-5-9"].includes(options.compiler),
        "E_COMMAND_PHASE",
      );
      args = [
        local(cwd, `node_modules/${options.compiler}/bin/tsc`),
        "-p",
        "tsconfig.json",
        "--noEmit",
        "--pretty",
        "false",
      ];
      if (options.list) args.push("--listFilesOnly");
      label = `family-${options.compiler}${options.list ? "-files" : ""}`;
    } else if (task === "rac-verifier") {
      demand(
        ctx.phase === "profile-verify" && ctx.profile === "rac-runtime",
        "E_COMMAND_PHASE",
      );
      args = [
        path.join(cwd, "patches/tableweave-rac-table-clone/verify.mjs"),
        cwd,
      ];
    } else throw new Error("E_COMMAND_NOT_ALLOWLISTED");
  }
  const prefix = `logs/${ctx.phase}-${ctx.key}/${label}`;
  demand(
    !present(path.join(ctx.run, `${prefix}.log`)) &&
      !present(path.join(ctx.run, `${prefix}.json`)),
    "E_REPLAY_LOG_EXISTS",
  );
  const result = spawnSync(executable, args, {
    cwd,
    env: {
      ...safeEnvironment(ctx),
      ...(task === "family-runtime" ? { WP13_RUNTIME_FINAL: "1" } : {}),
    },
    shell: false,
    encoding: "utf8",
    timeout: 480000,
    maxBuffer: 8 * 1024 * 1024,
  });
  write(
    ctx.run,
    `${prefix}.log`,
    `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ? String(result.error) : ""}`,
  );
  record(ctx.run, `${prefix}.json`, {
    executable,
    args,
    status: result.status,
    signal: result.signal,
    spawnError: result.error ? result.error.code : null,
  });
  revalidate(ctx);
  if (!options.allowFailure)
    demand(result.status === 0 && !result.error, "E_CHILD_FAILURE_RETAINED");
  return result;
}
export function producerInputs(ctx) {
  revalidate(ctx);
  for (const file of [
    ".pnpmfile.cjs",
    "pnpmfile.cjs",
    "pnpmfile.js",
    "npm-shrinkwrap.json",
  ])
    demand(
      !present(path.join(ctx.producer, file)),
      "E_PRODUCER_UNSELECTED_CONFIG_HOOK",
    );
  demand(
    regular(ctx.producer, ".npmrc").toString("utf8") ===
      "save-exact=true\nstrict-peer-dependencies=true\nauto-install-peers=false\nengine-strict=true\npackage-manager-strict=true\n",
    "E_PRODUCER_CONFIG",
  );
  const checkout = receipt(ctx, "producer-checkout.json");
  demand(
    checkout.status === "main-reviewed-fresh-detached-real-checkout" &&
      checkout.root === ctx.producer &&
      /^[0-9a-f]{40}$/.test(checkout.revision) &&
      checkout.revision === ctx.request.selectedRevision,
    "E_SELECTED_CHECKOUT",
  );
  directory(path.join(ctx.producer, ".git"));
  demand(
    regular(ctx.producer, ".git/HEAD").toString("utf8").trim() ===
      checkout.revision,
    "E_CHECKOUT_REVISION",
  );
  const map = receipt(ctx, "producer-inputs.json");
  for (const file of [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    "tsconfig.base.json",
    "tests/foundation/build.mjs",
    "tests/foundation/copy-styles.mjs",
    "packages/react/package.json",
    "packages/react/tsconfig.build.json",
    "packages/heroui/package.json",
    "packages/heroui/tsconfig.build.json",
  ])
    demand(Object.hasOwn(map, file), "E_PRODUCER_INPUT_MISSING");
  for (const file of [
    "package.json",
    "bin/tsc",
    "lib/tsc.js",
    "lib/_tsc.js",
    "lib/typescript.js",
  ])
    demand(
      Object.hasOwn(
        map,
        path.relative(
          ctx.producer,
          local(ctx.producer, `node_modules/typescript/${file}`),
        ),
      ),
      "E_PRODUCER_REAL_COMPILER_INPUT_MISSING",
    );
  for (const file of Object.keys(map))
    demand(
      /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc|tsconfig\.base\.json|tests\/foundation\/(?:build|copy-styles)\.mjs|packages\/(?:react|heroui)\/(?:src\/|compat\/|package\.json$|README\.md$|tsconfig\.build\.json$)|patches\/|node_modules\/)/.test(
        file,
      ) && !/(?:^|\/)\.env/.test(file),
      "E_PRODUCER_INPUT_PATH",
    );
  verifyMap(ctx.producer, map);
  const bytes = regular(ctx.run, "library-source155.json");
  demand(
    digest(bytes) ===
      "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837",
    "E_CANONICAL_SOURCE155",
  );
  const source = object(JSON.parse(bytes.toString("utf8")));
  demand(Object.keys(source).length === 155, "E_SOURCE155_SET");
  for (const [file, expected] of Object.entries(source)) {
    demand(
      /^packages\/(?:react|heroui)\/src\//.test(file) &&
        Object.hasOwn(map, file),
      "E_SOURCE_INPUT_MISSING",
    );
    const value = fileRecord(ctx.producer, file);
    demand(
      value.sha256 === expected.sha256 &&
        (value.mode & 0o111) === (parseInt(expected.mode, 8) & 0o111),
      "E_SOURCE155_DRIFT",
    );
  }
  for (const name of ["react", "heroui"])
    for (const file of Object.keys(
      tree(path.join(ctx.producer, "packages", name, "src")),
    ))
      if (/\.(?:ts|tsx|css)$/.test(file))
        demand(
          Object.hasOwn(source, `packages/${name}/src/${file}`),
          "E_EXTRA_LIBRARY_SOURCE",
        );
  return map;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}
function packedManifest(source) {
  const value = structuredClone(source);
  for (const key of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ])
    for (const [name, version] of Object.entries(value[key] ?? {}))
      if (version === "workspace:*") {
        demand(name === "@tableweave/react", "E_UNKNOWN_WORKSPACE_PROTOCOL");
        value[key][name] = "0.0.0-wp01.0";
      }
  return value;
}
export function generate(ctx) {
  const inputs = producerInputs(ctx);
  toolchain(ctx);
  demand(
    !present(path.join(ctx.run, "archives")),
    "E_ARCHIVE_DESTINATION_EXISTS",
  );
  const root = json(ctx.producer, "package.json");
  demand(
    root.scripts.build === "node tests/foundation/build.mjs",
    "E_BUILD_RECIPE",
  );
  for (const name of ["react", "heroui"]) {
    demand(
      !present(path.join(ctx.producer, "packages", name, "dist")),
      "E_DIST_NOT_FRESH",
    );
    const pkg = json(ctx.producer, `packages/${name}/package.json`);
    for (const event of [
      "prepare",
      "prepack",
      "postpack",
      "prebuild",
      "postbuild",
    ])
      demand(!pkg.scripts?.[event], "E_UNREVIEWED_LIFECYCLE");
  }
  mkdir(ctx.run, `home/${ctx.key}`);
  write(ctx.run, `home/${ctx.key}/user.npmrc`, "");
  write(ctx.run, `home/${ctx.key}/global.npmrc`, "");
  execute(ctx, "producer-build");
  const output = {},
    archives = {},
    members = {};
  for (const name of ["react", "heroui"]) {
    const pkg = path.join(ctx.producer, "packages", name),
      emitted = tree(path.join(pkg, "dist"));
    demand(Object.keys(emitted).length > 0, "E_EMPTY_EMISSION");
    for (const [file, value] of Object.entries(emitted))
      output[`packages/${name}/dist/${file}`] = value;
    if (name === "heroui")
      for (const file of Object.keys(tree(path.join(pkg, "src"))).filter(
        (file) => file.endsWith(".css"),
      ))
        demand(
          emitted[file]?.sha256 ===
            fileRecord(path.join(pkg, "src"), file).sha256,
          "E_STYLES_COPY_CLOSURE",
        );
    mkdir(ctx.run, `archives/${name}`);
    execute(ctx, `pack-${name}`);
    const files = fs.readdirSync(path.join(ctx.run, "archives", name));
    demand(
      files.length === 1 && files[0].endsWith(".tgz"),
      "E_ONE_REAL_ARCHIVE_REQUIRED",
    );
    const file = `archives/${name}/${files[0]}`,
      bytes = regular(ctx.run, file),
      parsed = packageArchive(bytes, `@tableweave/${name}`);
    demand(
      JSON.stringify(canonical(parsed.manifest)) ===
        JSON.stringify(canonical(packedManifest(json(pkg, "package.json")))),
      "E_PACK_MANIFEST_TRANSFORM",
    );
    const expected = {};
    for (const [item, value] of Object.entries(emitted))
      expected[`package/dist/${item}`] = value;
    expected["package/README.md"] = fileRecord(pkg, "README.md");
    if (name === "heroui")
      for (const item of [
        "runtime.patch",
        "profile.json",
        "verify.mjs",
        "README.md",
        "NOTICE-RAC",
        "LICENSE-APACHE-2.0",
      ])
        expected[`package/compat/rac-table-clone/${item}`] = fileRecord(
          pkg,
          `compat/rac-table-clone/${item}`,
        );
    expected["package/package.json"] = {
      mode: parsed.members.get("package/package.json").mode,
      size: parsed.members.get("package/package.json").bytes.length,
      sha256: digest(parsed.members.get("package/package.json").bytes),
    };
    const actual = [...parsed.members].filter(
      ([, value]) => value.type === "file",
    );
    demand(
      actual.length === Object.keys(expected).length &&
        actual.every(
          ([item, value]) =>
            expected[item]?.sha256 === digest(value.bytes) &&
            expected[item]?.size === value.bytes.length,
        ),
      "E_REAL_OUTPUT_ARCHIVE_CLOSURE",
    );
    archives[name] = { file, sha256: digest(bytes), size: bytes.length };
    members[name] = Object.fromEntries(
      actual.map(([item, value]) => [
        item,
        {
          mode: value.mode,
          size: value.bytes.length,
          sha256: digest(value.bytes),
        },
      ]),
    );
  }
  verifyMap(ctx.producer, inputs);
  record(ctx.run, "generation.json", {
    status: "emitted-and-packed-unapproved",
    candidate: ctx.request.candidate,
    inputsSHA256: digest(regular(ctx.run, "producer-inputs.json")),
    checkoutSHA256: digest(regular(ctx.run, "producer-checkout.json")),
    revision: ctx.request.selectedRevision,
    toolchainSHA256: digest(regular(ctx.run, "toolchain-inputs.json")),
    output,
    archives,
    members,
  });
  return { status: "unapproved-candidate-only", archives };
}
