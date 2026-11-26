import fs from "node:fs";
import path from "node:path";
import {
  demand,
  digest,
  regular,
  json,
  object,
  record,
  write,
  mkdir,
  fileRecord,
  tree,
  receipt,
  verifyMap,
  capacity,
  present,
  relative,
} from "./receipts.mjs";
import { external, consumerPath, ownedConsumer, local } from "./boundary.mjs";
import { pair } from "./archive.mjs";
import { execute, producerInputs } from "./generation.mjs";

export const ordinaryWorkspace = "packages: []\n";
export function ordinaryNpmrc(ctx) {
  return `registry=https://registry.npmjs.org/\nsave-exact=true\nstrict-peer-dependencies=true\nauto-install-peers=false\nengine-strict=true\npackage-manager-strict=true\nignore-scripts=true\nignore-pnpmfile=true\nshared-workspace-lockfile=false\nnode-linker=isolated\npackage-import-method=copy\nstore-dir=${ctx.run}/store/${ctx.key}\n`;
}
export function selectedWorkspace(ctx) {
  if (ctx.profile === "ordinary") return ordinaryWorkspace;
  if (ctx.profile === "rac-runtime")
    return `${ordinaryWorkspace}patchedDependencies:\n  'react-aria-components@1.22.1': patches/tableweave-rac-table-clone/runtime.patch\n`;
  demand(ctx.profile === "start-sdk-declarations", "E_PROFILE");
  return `${ordinaryWorkspace}patchedDependencies:\n  '@tanstack/start-server-core@1.169.40': patches/@tanstack__start-server-core@1.169.40.patch\n  '@tanstack/start-plugin-core@1.171.50': patches/@tanstack__start-plugin-core@1.171.50.patch\npackageExtensions:\n  '@tanstack/start-server-core@1.169.40':\n    dependencies:\n      '@standard-schema/spec': '1.1.0'\n      cookie-es: '3.1.1'\n`;
}
export function profileAssets(ctx, target, archives) {
  if (ctx.profile === "ordinary") return;
  if (ctx.profile === "rac-runtime") {
    const spec = json(
      ctx.producer,
      "tests/consumers/wp13/profiles/rac-runtime.json",
    );
    for (const name of spec.assets) {
      const original = archives.heroui.members.get(
        `package/compat/rac-table-clone/${name}`,
      )?.bytes;
      demand(
        original &&
          digest(
            regular(target, `patches/tableweave-rac-table-clone/${name}`),
          ) === digest(original),
        "E_PROFILE_NOT_FROM_ARCHIVE",
      );
      if (name !== "profile.json")
        demand(
          digest(original) === spec.companions[name],
          "E_PROFILE_COMPANION",
        );
    }
  } else {
    const spec = json(
      ctx.producer,
      "tests/consumers/wp13/profiles/start-sdk-declarations.json",
    );
    for (const [file, hash] of Object.entries(spec.assets))
      demand(digest(regular(target, file)) === hash, "E_SDK_ASSET_BYTES");
  }
}
export function usesStyled(family) {
  return ["styled", "vite-styled", "next"].includes(family);
}
export function selection(ctx, archives) {
  const matrix = json(ctx.producer, "tests/consumers/wp13/matrix.json");
  const recipe = object(object(ctx.request.consumers)[ctx.key]);
  const pkg = object(recipe.package);
  demand(
    Object.keys(pkg).every((key) =>
      [
        "name",
        "private",
        "type",
        "packageManager",
        "dependencies",
        "devDependencies",
      ].includes(key),
    ) &&
      pkg.name === `wp13-${ctx.key}` &&
      pkg.private === true &&
      pkg.type === "module" &&
      pkg.packageManager === "pnpm@10.13.1",
    "E_CONSUMER_MANIFEST",
  );
  const dependencies = object(pkg.dependencies),
    development = object(pkg.devDependencies);
  demand(
    Object.keys(dependencies).every(
      (name) => !Object.hasOwn(development, name),
    ),
    "E_DUPLICATE_DEPENDENCY_GROUP",
  );
  demand(
    dependencies["@tableweave/react"] === `file:${archives.react.file}`,
    "E_HEADLESS_ARCHIVE_DEPENDENCY",
  );
  if (usesStyled(ctx.family))
    demand(
      dependencies["@tableweave/heroui"] === `file:${archives.heroui.file}`,
      "E_STYLED_ARCHIVE_DEPENDENCY",
    );
  else
    demand(
      !Object.hasOwn(dependencies, "@tableweave/heroui") &&
        !Object.keys(dependencies).some((name) =>
          /heroui|react-aria|tailwind|dnd/.test(name),
        ),
      "E_HEADLESS_UI_DEPENDENCY",
    );
  const allowed = new Set(matrix.familyDependencies[ctx.family]);
  for (const [name, version] of Object.entries({
    ...dependencies,
    ...development,
  })) {
    demand(allowed.has(name), "E_UNSELECTED_FAMILY_DEPENDENCY");
    if (!name.startsWith("@tableweave/"))
      demand(matrix.pins[name] === version, "E_UNSELECTED_VERSION");
  }
  for (const name of matrix.familyDependencies[ctx.family])
    demand(
      Object.hasOwn(dependencies, name) || Object.hasOwn(development, name),
      "E_MANDATORY_DIRECT_DEPENDENCY",
    );
  demand(
    development.typescript === "6.0.3" &&
      development["typescript-5-9"] === "npm:typescript@5.9.3",
    "E_LOCAL_COMPILER_SELECTION",
  );
  const approved = object(object(ctx.approval.consumerLocks)[ctx.key]);
  demand(
    approved.status === "main-reviewed-standalone-lock" &&
      approved.profile === ctx.profile &&
      approved.reactArchive === archives.react.sha256 &&
      approved.herouiArchive === archives.heroui.sha256,
    "E_LOCK_SELECTION",
  );
  const packageBytes = `${JSON.stringify(pkg, null, 2)}\n`;
  demand(
    digest(packageBytes) === approved.packageSHA256,
    "E_LOCK_PACKAGE_BINDING",
  );
  const lock = regular(ctx.run, `locks/${ctx.key}.yaml`);
  demand(digest(lock) === approved.lockSHA256, "E_LOCK_HASH");
  return { recipe, pkg, packageBytes, lock, approved };
}
export function ensureHome(ctx) {
  mkdir(ctx.run, `home/${ctx.key}`);
  for (const file of ["user.npmrc", "global.npmrc"]) {
    const name = `home/${ctx.key}/${file}`;
    if (fs.existsSync(path.join(ctx.run, name)))
      demand(regular(ctx.run, name).length === 0, "E_HOME_CONFIG");
    else write(ctx.run, name, "");
  }
}
export function prepare(ctx, familyStage) {
  const archives = pair(ctx);
  producerInputs(ctx);
  receipt(ctx, "archive-inspection.json");
  const selected = selection(ctx, archives);
  demand(
    ctx.profile === "ordinary",
    "E_HOLD_PROFILE_REQUIRES_MAIN_MANUAL_STAGING",
  );
  const target = external(consumerPath(ctx), true);
  const npmrc = ordinaryNpmrc(ctx);
  demand(
    digest(npmrc) === selected.approved.npmrcSHA256 &&
      digest(ordinaryWorkspace) === selected.approved.workspaceSHA256,
    "E_LOCK_CONFIG_BINDING",
  );
  // Validate ALL fixed copy inputs and any family gate before creating the target.
  const files = {
    "package.json": selected.packageBytes,
    "pnpm-lock.yaml": selected.lock,
    "pnpm-workspace.yaml": ordinaryWorkspace,
    ".npmrc": npmrc,
  };
  for (const name of [
    "headless.ts",
    "reordering-controller.ts",
    "pure-runtime.mjs",
    "default-bundle.mjs",
    ...(usesStyled(ctx.family) ? ["styled.tsx", "styles.css"] : []),
  ])
    files[name] = regular(
      ctx.producer,
      `tests/consumers/wp13/fixtures/${name}`,
    );
  files["matrix.json"] = regular(
    ctx.producer,
    "tests/consumers/wp13/matrix.json",
  );
  files["wp13.bundle.mjs"] = regular(
    ctx.producer,
    "tests/consumers/wp13/fixtures/default-bundle.mjs",
  );
  files["wp13.entry.mjs"] =
    `import * as headless from "@tableweave/react";\nexport {headless};\n${usesStyled(ctx.family) ? 'import * as styled from "@tableweave/heroui";\nimport "./styles.css";\nexport {styled};\n' : ""}`;
  files["wp13-owner.json"] =
    `${JSON.stringify({ protocol: "wp13-current-archives-v1", run: ctx.runId, key: ctx.key }, null, 2)}\n`;
  const familyFiles = familyStage ? familyStage(ctx) : {};
  for (const [file, bytes] of Object.entries(familyFiles)) {
    demand(!Object.hasOwn(files, file), "E_STAGE_COLLISION");
    files[file] = bytes;
  }
  capacity("/tmp/opencode");
  fs.mkdirSync(target);
  for (const [file, bytes] of Object.entries(files)) write(target, file, bytes);
  ensureHome(ctx);
  const frozen = tree(target),
    initialGenerated = {};
  if (ctx.family === "next") {
    initialGenerated["next-env.d.ts"] = frozen["next-env.d.ts"];
    delete frozen["next-env.d.ts"];
  }
  record(ctx.run, `consumer-prepared-${ctx.key}.json`, {
    protocol: "wp13-current-archives-v1",
    candidate: ctx.request.candidate,
    key: ctx.key,
    profile: ctx.profile,
    archives: { react: archives.react.sha256, heroui: archives.heroui.sha256 },
    files: frozen,
    initialGenerated,
  });
  return { target, status: "prepared-not-installed" };
}
export function prepared(ctx) {
  const target = ownedConsumer(ctx),
    archives = pair(ctx),
    selected = selection(ctx, archives);
  const frozen = receipt(ctx, `consumer-prepared-${ctx.key}.json`);
  demand(
    frozen.key === ctx.key &&
      frozen.profile === ctx.profile &&
      frozen.candidate === ctx.request.candidate &&
      frozen.archives.react === archives.react.sha256 &&
      frozen.archives.heroui === archives.heroui.sha256,
    "E_PREPARATION_RECEIPT",
  );
  verifyMap(target, frozen.files);
  const allowed = new Set([
    ...Object.keys(frozen.files),
    ...Object.keys(frozen.initialGenerated ?? {}),
  ]);
  if (present(path.join(ctx.run, `types-${ctx.key}.json`))) {
    const typed = receipt(ctx, `types-${ctx.key}.json`);
    verifyMap(target, typed.generatedInputs);
    for (const file of Object.keys(typed.generatedInputs)) allowed.add(file);
  }
  if (present(path.join(ctx.run, `family-build-${ctx.key}.json`))) {
    const built = receipt(ctx, `family-build-${ctx.key}.json`);
    if (built.generatedInputs && Object.keys(built.generatedInputs).length) {
      verifyMap(target, built.generatedInputs);
      for (const file of Object.keys(built.generatedInputs)) allowed.add(file);
    }
  } else if (
    frozen.initialGenerated &&
    Object.keys(frozen.initialGenerated).length
  )
    verifyMap(target, frozen.initialGenerated);
  function inputs(prefix = "") {
    for (const item of fs.readdirSync(path.join(target, prefix), {
      withFileTypes: true,
    })) {
      const file = prefix ? `${prefix}/${item.name}` : item.name;
      if (
        !prefix &&
        [
          "node_modules",
          ".next",
          "dist",
          ".output",
          ".tanstack",
          "wp13-bundle",
          "wp13-family-build",
          "wp13-bundle-observations.json",
        ].includes(item.name)
      )
        continue;
      demand(!item.isSymbolicLink(), "E_CONSUMER_SOURCE_LINK");
      if (item.isDirectory()) inputs(file);
      else
        demand(
          item.isFile() && allowed.has(file),
          "E_CONSUMER_UNSELECTED_INPUT",
        );
    }
  }
  inputs();
  demand(
    regular(target, "package.json").toString("utf8") ===
      selected.packageBytes &&
      digest(regular(target, "pnpm-lock.yaml")) ===
        selected.approved.lockSHA256 &&
      digest(regular(target, ".npmrc")) === selected.approved.npmrcSHA256 &&
      digest(regular(target, "pnpm-workspace.yaml")) ===
        selected.approved.workspaceSHA256,
    "E_PREPARED_CONFIG_DRIFT",
  );
  demand(
    regular(target, ".npmrc").toString("utf8") === ordinaryNpmrc(ctx),
    "E_UNSAFE_INSTALL_CONFIG",
  );
  demand(
    regular(target, "pnpm-workspace.yaml").toString("utf8") ===
      selectedWorkspace(ctx),
    "E_EXACT_PROFILE_WORKSPACE_REQUIRED",
  );
  profileAssets(ctx, target, archives);
  if (ctx.profile === "ordinary")
    demand(
      regular(target, "pnpm-workspace.yaml").toString("utf8") ===
        ordinaryWorkspace,
      "E_ORDINARY_PRIVATE_PROFILE_LEAK",
    );
  else {
    const handoff = receipt(ctx, `profile-assets-${ctx.key}.json`);
    demand(
      handoff.profile === ctx.profile &&
        handoff.status === "main-manually-staged-and-reviewed" &&
        handoff.key === ctx.key,
      "E_EXPLICIT_PROFILE_HANDOFF",
    );
    verifyMap(target, handoff.files);
    demand(
      !regular(target, ".npmrc")
        .toString("utf8")
        .includes("ignore-scripts=false"),
      "E_PROFILE_SCRIPTS",
    );
  }
  return { target, archives, frozen, selected };
}
export function install(ctx) {
  const state = prepared(ctx);
  demand(
    !present(path.join(state.target, "node_modules")),
    "E_INSTALL_NOT_FRESH_NO_FAILED_TARGET_REUSE",
  );
  ensureHome(ctx);
  if (ctx.profile !== "ordinary") {
    const result = execute(ctx, "workspace-root");
    demand(
      path.resolve(result.stdout.trim()) ===
        path.join(state.target, "node_modules"),
      "E_PARENT_WORKSPACE_SELECTED",
    );
  }
  execute(ctx, "install");
  verifyMap(state.target, state.frozen.files);
  const installed = {};
  const dependencies = {
    ...state.selected.pkg.dependencies,
    ...state.selected.pkg.devDependencies,
  };
  for (const [name, wanted] of Object.entries(dependencies)) {
    const actual = local(state.target, `node_modules/${name}/package.json`),
      file = path.relative(state.target, actual),
      pkg = object(JSON.parse(regular(state.target, file).toString("utf8")));
    if (!name.startsWith("@tableweave/"))
      demand(
        pkg.version === (name === "typescript-5-9" ? "5.9.3" : wanted),
        "E_INSTALLED_VERSION",
      );
    installed[file] = fileRecord(state.target, file);
    if (name.startsWith("@tableweave/")) {
      const key = name.slice("@tableweave/".length),
        root = path.dirname(actual);
      for (const [member, expected] of Object.entries(
        state.archives[key].memberMap,
      )) {
        const relative = path.relative(
          state.target,
          path.join(root, member.slice(8)),
        );
        const value = fileRecord(state.target, relative);
        demand(
          value.sha256 === expected.sha256 && value.size === expected.size,
          "E_INSTALLED_ARCHIVE_BYTES",
        );
        installed[relative] = value;
      }
    }
  }
  for (const compiler of ["typescript", "typescript-5-9"])
    for (const file of [
      "bin/tsc",
      "lib/typescript.js",
      "lib/tsc.js",
      "lib/_tsc.js",
    ]) {
      const actual = local(state.target, `node_modules/${compiler}/${file}`),
        relative = path.relative(state.target, actual);
      installed[relative] = fileRecord(state.target, relative);
    }
  if (!usesStyled(ctx.family))
    demand(
      !fs
        .readdirSync(path.join(state.target, "node_modules/.pnpm"))
        .some((name) => /heroui|react-aria|tailwind|dnd-kit/.test(name)),
      "E_HEADLESS_INSTALL_UI",
    );
  const links = {};
  function inventory(prefix) {
    for (const item of fs.readdirSync(path.join(state.target, prefix), {
      withFileTypes: true,
    })) {
      const file = `${prefix}/${item.name}`;
      if (item.isSymbolicLink()) {
        const resolved = fs.realpathSync(path.join(state.target, file));
        demand(
          resolved.startsWith(`${state.target}/`),
          "E_INSTALLED_LINK_ESCAPE",
        );
        links[file] = {
          target: fs.readlinkSync(path.join(state.target, file)),
          resolved,
        };
      } else if (item.isDirectory()) inventory(file);
      else {
        demand(item.isFile(), "E_INSTALLED_SPECIAL_FILE");
        installed[file] = fileRecord(state.target, file);
      }
    }
  }
  inventory("node_modules");
  record(ctx.run, `installed-${ctx.key}.json`, {
    candidate: ctx.request.candidate,
    key: ctx.key,
    profile: ctx.profile,
    inputs: installed,
    links,
    lock: fileRecord(state.target, "pnpm-lock.yaml"),
    status: "installed-not-runtime-approved",
  });
  return { status: "strict-frozen-install-only", target: state.target };
}
export function installed(ctx) {
  const state = prepared(ctx),
    value = receipt(ctx, `installed-${ctx.key}.json`);
  demand(
    value.key === ctx.key &&
      value.profile === ctx.profile &&
      value.candidate === ctx.request.candidate &&
      value.status === "installed-not-runtime-approved",
    "E_INSTALL_RECEIPT",
  );
  verifyMap(state.target, value.inputs);
  for (const [file, expected] of Object.entries(object(value.links))) {
    const actual = path.join(state.target, file);
    localLink(state.target, file, expected, actual);
  }
  verifyMap(state.target, { "pnpm-lock.yaml": value.lock });
  return { ...state, installed: value };
}
function localLink(root, file, expected, actual) {
  // The regular-file map protects bytes; this map protects pnpm's link topology.
  relative(file);
  object(expected);
  demand(
    file.startsWith("node_modules/") && !file.split("/").includes(".."),
    "E_INSTALLED_LINK_PATH",
  );
  demand(
    fs.lstatSync(actual).isSymbolicLink() &&
      fs.readlinkSync(actual) === expected.target &&
      fs.realpathSync(actual) === expected.resolved &&
      expected.resolved.startsWith(`${root}/`),
    "E_INSTALLED_LINK_DRIFT",
  );
}
export function nativeInputs(ctx, target) {
  const native = receipt(ctx, `native-inputs-${ctx.key}.json`);
  demand(
    native.status === "main-reviewed-provisioned-local-native-files" &&
      native.key === ctx.key,
    "E_HOLD_NATIVE_PROVISIONING",
  );
  for (const file of Object.keys(object(native.files)))
    demand(
      file.startsWith("node_modules/") && !file.includes("/../"),
      "E_NATIVE_INPUT_PATH",
    );
  verifyMap(target, native.files);
  return native.files;
}
export function verifyProfile(ctx) {
  const state = installed(ctx);
  demand(ctx.profile !== "ordinary", "E_ORDINARY_HAS_NO_PRIVATE_PROFILE");
  const handoff = receipt(ctx, `profile-assets-${ctx.key}.json`);
  demand(
    Object.keys(object(handoff.installedAfter)).length > 0,
    "E_PROFILE_INSTALLED_AFTER_MAP_REQUIRED",
  );
  verifyMap(state.target, handoff.installedAfter);
  demand(
    Object.keys(object(handoff.independentOrdinaryBefore)).length > 0,
    "E_INDEPENDENT_ORDINARY_MAP_REQUIRED",
  );
  const ordinaryRoot = external(
    `/tmp/opencode/wp13-consumer-${ctx.runId}-${ctx.family}-ordinary`,
  );
  verifyMap(ordinaryRoot, handoff.independentOrdinaryBefore);
  if (ctx.profile === "rac-runtime") {
    const descriptor = json(
        ctx.producer,
        "tests/consumers/wp13/profiles/rac-runtime.json",
      ),
      asset = state.archives.heroui.members;
    const profile = object(
      JSON.parse(
        asset
          .get("package/compat/rac-table-clone/profile.json")
          .bytes.toString("utf8"),
      ),
    );
    demand(profile.id === descriptor.profileId, "E_PROFILE_ID");
    for (const name of descriptor.assets) {
      const bytes = asset.get(`package/compat/rac-table-clone/${name}`)?.bytes;
      demand(bytes, "E_PROFILE_ARCHIVE_ASSET");
      demand(
        digest(
          regular(state.target, `patches/tableweave-rac-table-clone/${name}`),
        ) === digest(bytes),
        "E_PROFILE_NOT_FROM_ARCHIVE",
      );
      if (name !== "profile.json")
        demand(
          digest(bytes) === descriptor.companions[name] &&
            profile.assets[name] === descriptor.companions[name],
          "E_PROFILE_COMPANION",
        );
    }
    const manifest = local(
        state.target,
        "node_modules/react-aria-components/package.json",
      ),
      root = path.dirname(manifest);
    const ordinaryManifest = local(
        ordinaryRoot,
        "node_modules/react-aria-components/package.json",
      ),
      originalRoot = path.dirname(ordinaryManifest);
    for (const file of descriptor.runtimeFiles) {
      const profiled = path.join(root, file.path),
        original = path.join(originalRoot, file.path);
      demand(
        digest(regular(state.target, path.relative(state.target, profiled))) ===
          file.after &&
          digest(
            regular(ordinaryRoot, path.relative(ordinaryRoot, original)),
          ) === file.before,
        "E_PROFILE_RUNTIME_BYTES",
      );
      const a = fs.statSync(profiled),
        b = fs.statSync(original);
      demand(
        a.ino !== b.ino || a.dev !== b.dev,
        "E_SHARED_MUTABLE_PROFILE_FILE",
      );
    }
    execute(ctx, "rac-verifier");
  } else {
    demand(ctx.family === "start", "E_SDK_PROFILE_FAMILY");
    const descriptor = json(
      ctx.producer,
      "tests/consumers/wp13/profiles/start-sdk-declarations.json",
    );
    for (const [file, expected] of Object.entries(descriptor.assets))
      demand(
        digest(regular(state.target, file)) === expected,
        "E_SDK_ASSET_BYTES",
      );
    demand(
      Object.keys(object(handoff.sdkRuntimeUnchanged)).length > 0,
      "E_SDK_RUNTIME_UNCHANGED_MAP_REQUIRED",
    );
    verifyMap(state.target, handoff.sdkRuntimeUnchanged);
    for (const [selector, declarations] of Object.entries(
      descriptor.selectors,
    )) {
      const split = selector.lastIndexOf("@"),
        name = selector.slice(0, split),
        version = selector.slice(split + 1),
        prefix = `${name.replace("/", "+")}@${version}`;
      const slots = fs
        .readdirSync(path.join(state.target, "node_modules/.pnpm"))
        .filter(
          (slot) =>
            slot === prefix ||
            slot.startsWith(`${prefix}_`) ||
            slot.startsWith(`${prefix}(`),
        );
      demand(slots.length > 0, "E_MISSING_EXACT_SDK_SLOT");
      for (const slot of slots) {
        const packageFile = local(
            state.target,
            `node_modules/.pnpm/${slot}/node_modules/${name}/package.json`,
          ),
          packageRoot = path.dirname(packageFile),
          pkg = JSON.parse(fs.readFileSync(packageFile));
        demand(
          pkg.name === name && pkg.version === version,
          "E_SDK_SLOT_VERSION",
        );
        for (const file of declarations)
          demand(
            Object.hasOwn(
              handoff.installedAfter,
              path.relative(state.target, path.join(packageRoot, file)),
            ),
            "E_SDK_DECLARATION_AFTER_MAP",
          );
        for (const file of Object.keys(tree(packageRoot)).filter((file) =>
          /\.(?:js|mjs|cjs)$/.test(file),
        ))
          demand(
            Object.hasOwn(
              handoff.sdkRuntimeUnchanged,
              path.relative(state.target, path.join(packageRoot, file)),
            ),
            "E_SDK_RUNTIME_MAP_INCOMPLETE",
          );
      }
    }
  }
  verifyMap(ordinaryRoot, handoff.independentOrdinaryBefore);
  record(ctx.run, `profile-verified-${ctx.key}.json`, {
    status: "explicit-profile-assets-and-selected-installed-bytes-only",
    profile: ctx.profile,
    groupedStrictBrowser: "UNRUN",
    ordinaryUnchanged: true,
  });
  return { status: "profile-byte-verification-not-runtime-acceptance" };
}
