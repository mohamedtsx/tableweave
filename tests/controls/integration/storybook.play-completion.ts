import { createRequire } from "node:module";
import type { Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

const vendor = createRequire(
  new URL("../../../apps/storybook/package.json", import.meta.url),
);
const installed: unknown = vendor("storybook/package.json");
if (
  !installed ||
  typeof installed !== "object" ||
  !("version" in installed) ||
  installed.version !== "9.1.21"
)
  throw new Error(
    "Re-review the observational Storybook completion hook for this installed version.",
  );

/**
 * Adapted from Tableweave's own filter-tools/browser/storybook.play-completion.ts.
 * Pinned 9.1.21 observational harness, not an application API:
 * - StoryRender emits {storyId, status, reporters} after play/afterEach. Both its
 *   successful and exception paths end at phase:"finished".
 * - A caught play assertion can still reach status:"success" when
 *   throwPlayFunctionExceptions:false. Independently reject failure events.
 * - Channel.last retains emitted args, avoiding a late-listener race.
 * Only READ the preview/channel/currentRender. Never emit events, invoke play,
 * assign preview state or manufacture a global host-completion success flag.
 */
export async function expectCompletedPlay(page: Page, info: TestInfo) {
  const storyId = new URL(page.url()).searchParams.get("id");
  if (!storyId)
    throw new Error("Expected an actual Storybook story iframe URL");
  const handle = await page.waitForFunction((requestedStoryId) => {
    const preview = (
      window as typeof window & {
        readonly __STORYBOOK_PREVIEW__?: {
          readonly channel?: { readonly last: (name: string) => unknown };
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
      payload.storyId !== requestedStoryId ||
      !("status" in payload) ||
      (payload.status !== "success" && payload.status !== "error") ||
      !("reporters" in payload) ||
      !Array.isArray(payload.reporters) ||
      preview?.currentRender?.id !== requestedStoryId ||
      preview.currentRender.phase !== "finished"
    )
      return false;
    return {
      storyId: payload.storyId,
      status: payload.status,
      reporterStatuses: payload.reporters.map((reporter: unknown) =>
        reporter &&
        typeof reporter === "object" &&
        "status" in reporter &&
        typeof reporter.status === "string"
          ? reporter.status
          : null,
      ),
      renderStoryId: preview.currentRender.id,
      phase: preview.currentRender.phase,
      autoplay: preview.currentRender.renderOptions?.autoplay === true,
      hasPlayFunction:
        typeof preview.currentRender.story?.playFunction === "function",
      failureEvents: [
        "playFunctionThrewException",
        "storyThrewException",
        "storyErrored",
        "unhandledErrorsWhilePlaying",
      ].filter((name) => preview.channel?.last(name) !== undefined),
      checkedPlayState:
        document
          .querySelector('[data-testid="controls-play"]')
          ?.getAttribute("data-play-state") ?? null,
    };
  }, storyId);
  // Use the actual 60s Storybook test budget, not a successful intermediate DOM.
  const observed = await handle.jsonValue();
  await handle.dispose();
  if (!observed)
    throw new Error("Storybook terminal completion evidence is unavailable");
  await info.attach("storybook-play-completion", {
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
    checkedPlayState: "completed",
  });
  expect(
    observed.failureEvents,
    "Storybook must not have caught a play/preview error before finishing",
  ).toEqual([]);
  // The pinned Report status vocabulary is failed | passed | warning.
  expect(
    observed.reporterStatuses.filter(
      (status) => status !== "passed" && status !== "warning",
    ),
    "Storybook reporters must not report failures or malformed statuses",
  ).toEqual([]);
}
