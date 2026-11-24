import { createRequire } from "node:module";
import { expect, type Page, type TestInfo } from "@playwright/test";
import { appPackage, confined } from "./roots.mjs";

// Adapted from Tableweave's own pinned WP-07/WP-08 test helper, not vendor code.
const vendor = createRequire(appPackage);
const installed: unknown = vendor(
  confined(vendor.resolve("storybook/package.json")),
);
if (
  !installed ||
  typeof installed !== "object" ||
  !("version" in installed) ||
  installed.version !== "9.1.21"
)
  throw new Error(
    "Re-review the observational host-completion hook for this Storybook version",
  );

/** READ ONLY: never emit, invoke play, modify globals or manufacture host success. */
export async function expectCompletedPlay(page: Page, info: TestInfo) {
  const storyId = new URL(page.url()).searchParams.get("id");
  if (!storyId) throw new Error("Expected a real story iframe URL");
  const handle = await page.waitForFunction((requestedId) => {
    const preview = (
      window as typeof window & {
        readonly __STORYBOOK_PREVIEW__?: {
          readonly channel?: { readonly last: (event: string) => unknown };
          readonly currentRender?: {
            readonly id?: string;
            readonly phase?: string;
            readonly renderOptions?: { readonly autoplay?: boolean };
            readonly story?: { readonly playFunction?: unknown };
          };
        };
      }
    ).__STORYBOOK_PREVIEW__;
    const args = preview?.channel?.last("storyFinished");
    if (!Array.isArray(args)) return false;
    const payload: unknown = args[0];
    if (
      !payload ||
      typeof payload !== "object" ||
      !("storyId" in payload) ||
      payload.storyId !== requestedId ||
      !("status" in payload) ||
      (payload.status !== "success" && payload.status !== "error") ||
      !("reporters" in payload) ||
      !Array.isArray(payload.reporters) ||
      preview?.currentRender?.id !== requestedId ||
      preview.currentRender.phase !== "finished"
    )
      return false;
    return {
      storyId: payload.storyId,
      renderStoryId: preview.currentRender.id,
      phase: preview.currentRender.phase,
      status: payload.status,
      autoplay: preview.currentRender.renderOptions?.autoplay === true,
      hasPlayFunction:
        typeof preview.currentRender.story?.playFunction === "function",
      reporterStatuses: payload.reporters.map((reporter: unknown) =>
        reporter &&
        typeof reporter === "object" &&
        "status" in reporter &&
        typeof reporter.status === "string"
          ? reporter.status
          : null,
      ),
      failureEvents: [
        "playFunctionThrewException",
        "storyThrewException",
        "storyErrored",
        "unhandledErrorsWhilePlaying",
      ].filter((event) => preview.channel?.last(event) !== undefined),
      ownMarker:
        document
          .querySelector('[data-testid="filter-controls-play"]')
          ?.getAttribute("data-play-state") ?? null,
    };
  }, storyId);
  const observed = await handle.jsonValue();
  await handle.dispose();
  if (!observed) throw new Error("Host completion observation is unavailable");
  await info.attach("real-filter-controls-host-completion", {
    body: JSON.stringify(observed, null, 2),
    contentType: "application/json",
  });
  expect(observed).toMatchObject({
    storyId,
    renderStoryId: storyId,
    phase: "finished",
    status: "success",
    autoplay: true,
    hasPlayFunction: true,
    ownMarker: "completed",
  });
  // A caught play error can still reach status=success/phase=finished in9.1.21.
  expect(observed.failureEvents).toEqual([]);
  expect(
    observed.reporterStatuses.filter(
      (status) => status !== "passed" && status !== "warning",
    ),
  ).toEqual([]);
}
