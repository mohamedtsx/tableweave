// FINAL-only standalone consumer runner. Imports are inert; no authored outcome is
// accepted without executing its observation callback and checking actual values.
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const origin = "http://127.0.0.1:6575";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function demand(value, code) {
  if (!value) throw Error(code);
}
export async function deadline(promise, ms, code) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error(code)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export async function refuseOccupiedPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", () => reject(Error("E_PORT_6575_OCCUPIED")));
    server.listen({ host: "127.0.0.1", port: 6575, exclusive: true }, resolve);
  });
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
export async function stopOwned(child) {
  if (child.exitCode !== null || child.signalCode !== null)
    return { code: child.exitCode, signal: child.signalCode, forced: false };
  const closed = new Promise((resolve) =>
    child.once("close", (code, signal) => resolve({ code, signal })),
  );
  child.kill("SIGTERM");
  try {
    return {
      ...(await deadline(closed, 5000, "E_CHILD_TERM_TIMEOUT")),
      forced: false,
    };
  } catch {
    child.kill("SIGKILL");
    return {
      ...(await deadline(closed, 5000, "E_CHILD_CLEANUP_DEBT")),
      forced: true,
    };
  }
}
function checkedFile(root, file, expected) {
  demand(
    typeof file === "string" &&
      !file.startsWith("/") &&
      !file.includes("\\") &&
      file.split("/").every((part) => part && part !== "." && part !== ".."),
    "E_RUNNER_INPUT_PATH",
  );
  const full = path.join(root, file);
  demand(
    fs.realpathSync(full) === full && fs.statSync(full).isFile(),
    "E_RUNNER_INPUT_LINK",
  );
  const bytes = fs.readFileSync(full),
    stat = fs.statSync(full);
  demand(
    bytes.length === expected.size &&
      sha(bytes) === expected.sha256 &&
      (stat.mode & 0o777) === expected.mode,
    "E_RUNNER_INPUT_DRIFT",
  );
  return bytes;
}
function verifyInputs(root, input) {
  for (const map of [
    input.buildFiles,
    input.preparedFiles,
    input.installedFiles,
    input.nativeFiles,
    input.browserFiles,
  ]) {
    demand(map && Object.keys(map).length > 0, "E_EMPTY_RUNNER_MAP");
    for (const [file, expected] of Object.entries(map))
      checkedFile(root, file, expected);
  }
}
function sanitize(text) {
  return text
    .split(/\r?\n/)
    .map((line) =>
      /authorization|cookie|bearer\s|token[=:]/i.test(line)
        ? "[redacted header-shaped server line]"
        : line,
    )
    .join("\n");
}
export function genuineRsc(status, log) {
  const message =
    /Event handlers cannot be passed|Functions cannot be passed|cannot be passed directly to Client Components/;
  const roots = log
    .split(/\r?\n/)
    .filter((line) => /^\s*(?:⨯\s*)?Error:/.test(line));
  return (
    status === 500 &&
    roots.length === 1 &&
    roots.every((line) => message.test(line)) &&
    message.test(log) &&
    log.includes("onUnexpectedAction") &&
    !/TypeError:|ReferenceError:|SyntaxError:|Unhandled/.test(log)
  );
}
export async function run() {
  demand(process.env.WP13_RUNTIME_FINAL === "1", "E_RUNTIME_FINAL_REQUIRED");
  const root = path.dirname(fileURLToPath(import.meta.url)),
    output = path.join(root, "wp13-runtime");
  demand(
    fs.realpathSync(root) === root && fs.realpathSync(output) === output,
    "E_RUNTIME_ROOT_LINK",
  );
  demand(
    JSON.stringify(fs.readdirSync(output).sort()) ===
      JSON.stringify(["attempt.json"]),
    "E_RUNTIME_OUTPUT_NOT_FRESH",
  );
  const bytes = fs.readFileSync(path.join(output, "attempt.json")),
    input = JSON.parse(bytes);
  demand(
    input.schema === "wp13-family-attempt-v1" &&
      ["next", "start", "vite-headless", "vite-styled"].includes(
        input.family,
      ) &&
      ["ordinary", "rsc-negative"].includes(input.variant),
    "E_RUNNER_ATTEMPT",
  );
  verifyInputs(root, input);
  const report = {
    schema: "wp13-family-observations-v1",
    inputSHA256: sha(bytes),
    ...Object.fromEntries(
      [
        "run",
        "key",
        "candidate",
        "family",
        "profile",
        "variant",
        "attempt",
        "buildSHA256",
        "installedSHA256",
        "browserSHA256",
        "planSHA256",
      ].map((key) => [key, input[key]]),
    ),
    status: "failed",
    completed: false,
    cases: [],
    serverStarted: false,
    serverExited: false,
    primaryFailure: null,
    cleanupDebt: null,
    truncated: false,
    unexpectedErrors: 0,
    unexpectedNetwork: 0,
    intentionalErrors: 0,
    serverLogs: { stdoutBytes: 0, stderrBytes: 0 },
    limits: [
      "fresh-cache read count not proved",
      "no full stream/abort/late-ABA or authorization/security proof",
      "no Safari/mobile/AT/manual/performance proof",
      "drag/G02 blocked",
    ],
  };
  let server,
    browser,
    expect,
    stopSignal = false,
    stopping = false;
  const contexts = [],
    errors = [],
    logs = { stdout: "", stderr: "" },
    expectedStderr = [];
  const interrupt = () => {
    stopSignal = true;
  };
  process.once("SIGTERM", interrupt);
  process.once("SIGINT", interrupt);
  function browserError(message) {
    if (errors.length >= 128 || message.length > 4096) {
      report.truncated = true;
      stopSignal = true;
    } else errors.push(message);
  }
  async function observe(id, callback) {
    demand(
      !stopSignal &&
        !report.truncated &&
        server.exitCode === null &&
        server.signalCode === null,
      "E_RUNTIME_SERVER_DIED",
    );
    const started = Date.now();
    try {
      const observed = await deadline(
        callback(),
        45000,
        "E_OBSERVATION_TIMEOUT",
      );
      demand(
        observed && Object.keys(observed).length > 0,
        "E_EMPTY_OBSERVATION",
      );
      report.cases.push({
        id,
        status: "observed",
        durationMs: Date.now() - started,
        observed,
      });
    } catch (error) {
      report.cases.push({
        id,
        status: "failed",
        durationMs: Date.now() - started,
        errorCode:
          error instanceof Error && /^E_[A-Z0-9_]+$/.test(error.message)
            ? error.message
            : "E_ACTUAL_ASSERTION_FAILED",
      });
      throw error;
    }
  }
  async function context(options = {}) {
    const value = await deadline(
      browser.newContext({
        locale: "en-US",
        timezoneId: "UTC",
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: false,
        serviceWorkers: "block",
        ...options,
      }),
      15000,
      "E_CONTEXT_TIMEOUT",
    );
    contexts.push(value);
    await value.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) {
        report.unexpectedNetwork++;
        await route.abort();
      } else await route.continue();
    });
    await value.routeWebSocket("**/*", (socket) => {
      report.unexpectedNetwork++;
      socket.close();
    });
    value.on("page", (page) => {
      page.setDefaultTimeout(15000);
      page.on("pageerror", (error) => browserError(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserError(message.text());
      });
    });
    return value;
  }
  async function response(context, pathValue, options = {}) {
    const result = await context.request.get(`${origin}${pathValue}`, {
      timeout: 30000,
      maxRedirects: 0,
      ...options,
    });
    const text = await result.text();
    demand(
      text.length > 0 && text.length < 4 * 1024 * 1024,
      "E_HTTP_EMPTY_OR_OVERSIZE",
    );
    return { status: result.status(), headers: result.headers(), text };
  }
  try {
    await refuseOccupiedPort();
    fs.mkdirSync(path.join(output, "tmp"));
    const args =
      input.family === "next"
        ? [
            path.join(root, "node_modules/next/dist/bin/next"),
            "start",
            "--hostname",
            "127.0.0.1",
            "--port",
            "6575",
          ]
        : [path.join(root, "wp13-start-host.mjs")];
    server = spawn(process.execPath, args, {
      cwd: root,
      env: {
        ...process.env,
        WP13_HOST_FINAL: "1",
        TMPDIR: path.join(output, "tmp"),
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let spawnFailure = false;
    server.once("error", () => {
      spawnFailure = true;
    });
    server.once("close", (code, signal) => {
      report.serverExit = { code, signal };
      if (!stopping) report.primaryFailure ??= "E_SERVER_UNEXPECTED_EXIT";
    });
    for (const stream of ["stdout", "stderr"])
      server[stream].on("data", (chunk) => {
        report.serverLogs[`${stream}Bytes`] += chunk.length;
        if (report.serverLogs[`${stream}Bytes`] > 262144) {
          report.truncated = true;
          stopSignal = true;
          server.kill("SIGTERM");
        } else logs[stream] += chunk.toString("utf8");
      });
    const started = Date.now();
    let ready = false;
    while (Date.now() - started < 30000) {
      demand(
        !spawnFailure &&
          !stopSignal &&
          server.exitCode === null &&
          server.signalCode === null,
        "E_SERVER_START_FAILURE",
      );
      try {
        const result = await fetch(`${origin}/`, {
          redirect: "manual",
          signal: AbortSignal.timeout(1000),
        });
        await result.arrayBuffer();
        if (result.status === 200) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    demand(ready, "E_SERVER_READY_TIMEOUT");
    report.serverStarted = true;
    const moduleURL = import.meta.resolve("@playwright/test");
    demand(
      moduleURL.startsWith("file:") &&
        fs.realpathSync(fileURLToPath(moduleURL)).startsWith(`${root}/`),
      "E_PLAYWRIGHT_BORROWED_RUNTIME",
    );
    const playwright = await import("@playwright/test");
    expect = playwright.expect;
    const executablePath = path.join(root, input.browserExecutable);
    demand(
      input.browserExecutable.startsWith("node_modules/.wp13-browser/") &&
        Object.hasOwn(input.browserFiles, input.browserExecutable),
      "E_BROWSER_UNSELECTED_EXECUTABLE",
    );
    browser = await playwright.chromium.launch({
      executablePath,
      headless: true,
      timeout: 30000,
      env: {
        ...process.env,
        TMPDIR: path.join(output, "tmp"),
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
        PLAYWRIGHT_BROWSERS_PATH: path.join(output, "unused-browser-cache"),
      },
    });
    report.browserVersion = browser.version();
    const regular = await context();
    if (input.family.startsWith("vite-")) {
      const page = await regular.newPage();
      let sourceRequests = 0;
      page.on("request", (request) => {
        if (
          /\/(?:src|packages|@fs|@vite)\//.test(new URL(request.url()).pathname)
        )
          sourceRequests++;
      });
      await observe("vite-dom-transition", async () => {
        demand(
          (
            await page.goto(
              `${origin}/${input.family === "vite-headless" ? "headless.html" : "index.html"}`,
            )
          ).status() === 200,
          "E_VITE_HTTP",
        );
        await expect(
          page.getByRole("rowheader", {
            name: "Transfer note 01",
            exact: true,
          }),
        ).toBeVisible();
        const beforeRows = await page.locator("tbody tr").count();
        if (input.family === "vite-headless") {
          await page
            .getByRole("textbox", { name: "Search descriptions", exact: true })
            .fill("Transfer note 11");
          await page
            .getByRole("button", { name: "Apply search", exact: true })
            .click();
        } else {
          await page
            .getByRole("searchbox", {
              name: "Search descriptions",
              exact: true,
            })
            .fill("Transfer note 11");
          await page
            .getByRole("searchbox", {
              name: "Search descriptions",
              exact: true,
            })
            .press("Enter");
          await expect(
            page.getByRole("button", {
              name: "Deliver known page",
              exact: true,
            }),
          ).toBeEnabled();
          await page
            .getByRole("button", { name: "Deliver known page", exact: true })
            .click();
        }
        const target = page.getByRole("rowheader", {
          name: "Transfer note 11",
          exact: true,
        });
        await expect(target).toBeVisible();
        await expect(
          page.getByRole("rowheader", {
            name: "Transfer note 01",
            exact: true,
          }),
        ).toHaveCount(0);
        return {
          beforeRows,
          afterRows: await page.locator("tbody tr").count(),
          firstGone:
            (await page
              .getByRole("rowheader", { name: "Transfer note 01", exact: true })
              .count()) === 0,
          targetVisible: await target.isVisible(),
        };
      });
      if (input.family === "vite-headless")
        await observe("vite-headless-isolation", async () => ({
          styleSheets: await page.evaluate(() => document.styleSheets.length),
          styleNodes: await page
            .locator('link[rel="stylesheet"],style')
            .count(),
          sourceRequests,
        }));
      else
        await observe("vite-computed-style", async () => {
          const css = await page
            .locator(".tw-data-table")
            .evaluate((element) => {
              const style = getComputedStyle(element);
              return {
                display: style.display,
                columnGapPx: parseFloat(style.columnGap),
                styleSheets: document.styleSheets.length,
              };
            });
          demand(
            css.display === "grid" &&
              css.columnGapPx > 0 &&
              css.styleSheets > 0,
            "E_COMPUTED_TABLE_STYLE",
          );
          return { ...css, sourceRequests };
        });
    } else if (input.family === "next") {
      await observe("next-neutral-flight", async () => {
        const html = await response(regular, "/?compare=1"),
          flight = await response(regular, "/?compare=1", {
            headers: { RSC: "1" },
          });
        demand(
          html.status === 200 &&
            !/<table(?:\s|>)/.test(html.text) &&
            html.text.includes('data-instance="primary"') &&
            html.text.includes('data-instance="comparison"'),
          "E_NEXT_NOT_NEUTRAL",
        );
        const component =
          flight.headers["content-type"]?.includes("text/x-component") === true;
        demand(
          flight.status === 200 &&
            component &&
            flight.text.includes("public-synthetic-initial-input"),
          "E_NEXT_FLIGHT_RESPONSE",
        );
        return {
          htmlStatus: html.status,
          htmlTables: (html.text.match(/<table(?:\s|>)/g) ?? []).length,
          flightStatus: flight.status,
          flightComponentType: component,
          serializedInputs: flight.text.includes(
            "public-synthetic-initial-input",
          ),
        };
      });
      await observe("next-independent-reattach", async () => {
        const page = await regular.newPage();
        await page.goto(`${origin}/?compare=1`);
        const first = page.locator('[data-instance="primary"]'),
          second = page.locator('[data-instance="comparison"]');
        await expect(first.locator("tbody tr")).toHaveCount(10);
        await expect(second.locator("tbody tr")).toHaveCount(10);
        const primaryRows = await first.locator("tbody tr").count(),
          comparisonRows = await second.locator("tbody tr").count();
        await first
          .getByRole("button", { name: "Next page", exact: true })
          .click();
        await expect(first.getByText(/Accepted query page: 2\./)).toBeVisible();
        await expect(
          second.getByText(/Accepted query page: 1\./),
        ).toBeVisible();
        await first
          .getByRole("button", { name: "Hide table", exact: true })
          .click();
        await expect(first.getByRole("table")).toHaveCount(0);
        await first
          .getByRole("button", { name: "Show table", exact: true })
          .click();
        await expect(first.getByRole("table")).toBeVisible();
        await expect(first.getByText(/Accepted query page: 2\./)).toBeVisible();
        const primaryPage = Number(
            ((await first.textContent()) ?? "").match(
              /Accepted query page: (\d+)\./,
            )?.[1],
          ),
          comparisonPage = Number(
            ((await second.textContent()) ?? "").match(
              /Accepted query page: (\d+)\./,
            )?.[1],
          );
        return {
          primaryRows,
          comparisonRows,
          primaryPage,
          comparisonPage,
          reattachedRows: await first.locator("tbody tr").count(),
        };
      });
      await observe("next-headless", async () => {
        const [a, b] = await Promise.all([
          response(regular, "/headless?instance=primary"),
          response(regular, "/headless?instance=comparison"),
        ]);
        const aa = JSON.parse(a.text),
          bb = JSON.parse(b.text);
        demand(
          aa.kind === "public-synthetic-initial-input" &&
            bb.kind === aa.kind &&
            aa.instance === "primary" &&
            bb.instance === "comparison",
          "E_NEXT_HEADLESS_PAYLOAD",
        );
        return {
          primaryStatus: a.status,
          comparisonStatus: b.status,
          independentInstances: aa.instance !== bb.instance,
          noStore:
            a.headers["cache-control"]?.includes("no-store") === true &&
            b.headers["cache-control"]?.includes("no-store") === true,
        };
      });
      if (input.variant === "rsc-negative")
        await observe("next-rsc-rejection", async () => {
          const before = logs.stderr.length,
            result = await response(regular, "/wp13-nonserializable");
          await expect
            .poll(() => genuineRsc(result.status, logs.stderr.slice(before)), {
              timeout: 10000,
            })
            .toBe(true);
          const window = logs.stderr.slice(before);
          demand(genuineRsc(result.status, window), "E_NOT_RSC_SERIALIZATION");
          expectedStderr.push({ start: before, end: logs.stderr.length });
          return {
            httpStatus: result.status,
            frameworkMessage: "callback-client-boundary",
            callbackNamed: window.includes("onUnexpectedAction"),
            logWindowBytes: Buffer.byteLength(window),
          };
        });
    } else {
      const alpha = await context(),
        beta = await context();
      await alpha.addCookies([
        { name: "wp11-facade-dataset", value: "alpha", url: origin },
      ]);
      await beta.addCookies([
        { name: "wp11-facade-dataset", value: "beta", url: origin },
      ]);
      await observe("start-neutral-canaries", async () => {
        const [a, b] = await Promise.all([
          response(alpha, "/"),
          response(beta, "/"),
        ]);
        const aa = a.text.match(/public-canary:alpha:([0-9a-f-]{36})/),
          bb = b.text.match(/public-canary:beta:([0-9a-f-]{36})/);
        demand(
          a.status === 200 &&
            b.status === 200 &&
            aa &&
            bb &&
            aa[1] !== bb[1] &&
            !a.text.includes("public-canary:beta:") &&
            !b.text.includes("public-canary:alpha:") &&
            !a.text.includes("WP11_START_FACADE_READER_SERVER_ONLY") &&
            !b.text.includes("WP11_START_FACADE_READER_SERVER_ONLY"),
          "E_START_CANARY_ISOLATION",
        );
        const noScripts = await context({ javaScriptEnabled: false });
        const page = await noScripts.newPage();
        await page.goto(origin);
        await expect(page.getByRole("table")).toHaveCount(0);
        return {
          alphaStatus: a.status,
          betaStatus: b.status,
          alphaOnly: !a.text.includes("public-canary:beta:"),
          betaOnly: !b.text.includes("public-canary:alpha:"),
          distinctBootstrap: aa[1] !== bb[1],
          neutralTables: await page.getByRole("table").count(),
          responsesConsumed: true,
        };
      });
      await observe("start-hydrated-query", async () => {
        const a = await alpha.newPage(),
          b = await beta.newPage();
        await Promise.all([a.goto(origin), b.goto(origin)]);
        const tx = a.getByRole("region", {
            name: "Synthetic transactions",
            exact: true,
          }),
          inventory = a.getByRole("region", {
            name: "Synthetic inventory",
            exact: true,
          });
        await expect(
          tx.getByRole("rowheader", {
            name: "Alpha Transfer note 01",
            exact: true,
          }),
        ).toBeVisible({ timeout: 30000 });
        await expect(
          inventory.getByRole("rowheader", {
            name: "Alpha Desk stand",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          b.getByRole("rowheader", { name: "Beta Desk stand", exact: true }),
        ).toBeVisible();
        const alphaTables = await a.getByRole("table").count(),
          betaTables = await b.getByRole("table").count();
        await tx
          .getByRole("textbox", { name: "Search records", exact: true })
          .fill("Transfer note 11");
        await tx
          .getByRole("button", { name: "Apply search", exact: true })
          .click();
        const target = tx.getByRole("rowheader", {
          name: "Alpha Transfer note 11",
          exact: true,
        });
        await expect(target).toBeVisible();
        await expect(
          tx.getByRole("rowheader", {
            name: "Alpha Transfer note 01",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          inventory.getByRole("rowheader", {
            name: "Alpha Desk stand",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          b.getByRole("rowheader", {
            name: "Beta Transfer note 01",
            exact: true,
          }),
        ).toBeVisible();
        return {
          alphaTables,
          betaTables,
          queryTarget: await target.isVisible(),
          oldRowGone:
            (await tx
              .getByRole("rowheader", {
                name: "Alpha Transfer note 01",
                exact: true,
              })
              .count()) === 0,
          otherDomainRetained: await inventory
            .getByRole("rowheader", { name: "Alpha Desk stand", exact: true })
            .isVisible(),
          betaRetained: await b
            .getByRole("rowheader", {
              name: "Beta Transfer note 01",
              exact: true,
            })
            .isVisible(),
          freshReadCount: "not-proved",
        };
      });
    }
    demand(
      !stopSignal &&
        !report.truncated &&
        server.exitCode === null &&
        server.signalCode === null,
      "E_RUNTIME_PROCESS_FAILURE",
    );
    // APIRequestContext's negative response does not own any live page's errors.
    report.unexpectedErrors = errors.length;
    let unclassified = logs.stderr;
    for (const range of expectedStderr.toReversed())
      unclassified =
        unclassified.slice(0, range.start) + unclassified.slice(range.end);
    if (
      /(?:^|\n)(?:\s*Error:|\s*⨯|.*(?:Unhandled|TypeError:|ReferenceError:|SyntaxError:))/.test(
        unclassified,
      )
    )
      report.unexpectedErrors++;
    demand(
      report.unexpectedErrors === 0 && report.unexpectedNetwork === 0,
      "E_UNEXPECTED_BROWSER_ERROR",
    );
    verifyInputs(root, input);
    report.completed = true;
  } catch (error) {
    report.primaryFailure ??=
      error instanceof Error && /^E_[A-Z0-9_]+$/.test(error.message)
        ? error.message
        : "E_ACTUAL_RUNTIME_OBSERVATION_FAILED";
  } finally {
    for (const value of contexts)
      try {
        await deadline(value.close(), 5000, "E_CONTEXT_CLEANUP_DEBT");
      } catch {
        report.cleanupDebt ??= "E_CONTEXT_CLEANUP_DEBT";
      }
    if (browser)
      try {
        await deadline(browser.close(), 10000, "E_BROWSER_CLEANUP_DEBT");
      } catch {
        report.cleanupDebt ??= "E_BROWSER_CLEANUP_DEBT";
      }
    if (server)
      try {
        stopping = true;
        const exit = await stopOwned(server);
        report.serverExited =
          server.exitCode !== null || server.signalCode !== null;
        if (exit.forced) report.cleanupDebt ??= "E_SERVER_FORCED_CLEANUP";
      } catch {
        report.cleanupDebt ??= "E_SERVER_CLEANUP_DEBT";
      }
    let remainingStderr = logs.stderr;
    for (const range of expectedStderr.toReversed())
      remainingStderr =
        remainingStderr.slice(0, range.start) +
        remainingStderr.slice(range.end);
    report.unexpectedErrors =
      errors.length +
      Number(
        /(?:^|\n)(?:\s*Error:|\s*⨯|.*(?:Unhandled|TypeError:|ReferenceError:|SyntaxError:))/.test(
          remainingStderr,
        ),
      );
    report.intentionalErrors = expectedStderr.length;
    report.intentionalFrameworkEvents = expectedStderr.length;
    if (report.unexpectedErrors || report.unexpectedNetwork)
      report.primaryFailure ??= "E_UNEXPECTED_BROWSER_ERROR";
    process.removeListener("SIGTERM", interrupt);
    process.removeListener("SIGINT", interrupt);
    for (const stream of ["stdout", "stderr"])
      fs.writeFileSync(
        path.join(output, `server.${stream}.log`),
        sanitize(logs[stream]),
        { flag: "wx", mode: 0o600 },
      );
    report.status =
      report.completed &&
      !report.primaryFailure &&
      !report.cleanupDebt &&
      !report.truncated &&
      report.serverExited
        ? "observed"
        : "failed";
    fs.writeFileSync(
      path.join(output, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      { flag: "wx", mode: 0o600 },
    );
  }
  demand(report.status === "observed", "E_RUNTIME_REPORT_FAILED");
  return report;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  run()
    .then(() => process.stdout.write("WP13_ACTUAL_OBSERVATIONS_RECORDED\n"))
    .catch(() => {
      process.stderr.write("E_FAMILY_RUNTIME_FAILED\n");
      process.exitCode = 1;
    });
