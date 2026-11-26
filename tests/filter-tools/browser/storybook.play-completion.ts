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
 * Pinned 9.1.21 observational harness, not an application API:
 * - storybook/internal/core-events exports StoryFinishedPayload and
 *   STORY_FINISHED = "storyFinished".
 * - StoryRender emits {storyId, status, reporters} after play/afterEach;
 *   its exception path emits status:"error". BOTH paths end at phase:"finished".
 *   With throwPlayFunctionExceptions:false, a caught assertion can still reach
 *   terminal status:"success"; independently reject the exception/error events.
 * - Channel.last (storybook/internal/channels) retains the emitted args, avoiding
 *   a late-listener race. The preview exposes that channel/currentRender.
 * Only read these values. Never emit events, invoke play, assign preview state,
 * or manufacture a browser-global success flag. The runtime phase alone is NOT
 * proof of success, and pageerror alone misses Storybook-caught play assertions.
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
      !Array.isArray(payload.reporters)
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
      renderStoryId: preview?.currentRender?.id ?? null,
      phase: preview?.currentRender?.phase ?? null,
      autoplay: preview?.currentRender?.renderOptions?.autoplay === true,
      hasPlayFunction:
        typeof preview?.currentRender?.story?.playFunction === "function",
      failureEvents: [
        "playFunctionThrewException",
        "storyThrewException",
        "storyErrored",
        "unhandledErrorsWhilePlaying",
      ].filter((name) => preview?.channel?.last(name) !== undefined),
      acceptedQueryText:
        document.querySelector('[data-testid="accepted-query"]')?.textContent ??
        null,
      nativeIds:
        document.querySelector('[data-testid="native-ids"]')?.textContent ??
        null,
    };
  }, storyId);
  // No custom timeout/retry: use the existing 60s test budget for the actual
  // terminal event, rather than mistaking an intermediate DOM value for success.
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
  });
  expect(
    observed.failureEvents,
    "Storybook must not have caught a play/preview error before finishing",
  ).toEqual([]);
  expect(observed.reporterStatuses).not.toContain("failed");
  expect(observed.reporterStatuses).not.toContain(null);
}
