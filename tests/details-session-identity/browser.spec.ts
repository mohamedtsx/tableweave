import { expect, test } from "@playwright/test";

test("genuine raw hook issuance, Strict replay, two mounts, controller swap and remount", async ({
  page,
}) => {
  await page.goto("/tests/details-session-identity/browser.html");
  const result = await page.evaluate(() => window.detailsIdentity.run());
  expect(result.lookupResults).toEqual({
    exactDescriptor: true,
    copyDenied: true,
    transparentDenied: true,
    hostileDenied: true,
    traps: 0,
    privateCallsUnchanged: true,
    ownerFrozen: true,
    mountFrozen: true,
    sessionNotFrozen: true,
    exactController: true,
    exactRecord: true,
    noFabricatedRow: true,
    exactFieldArrays: true,
    keys: [
      "contentKey",
      "isOpen",
      "canRetry",
      "requestClose",
      "requestOpen",
      "context",
      "retry",
    ],
    mode: "legacy",
  });
  expect(result.history).toEqual({
    freshViewOnRerender: true,
    sameMount: true,
    strictStable: true,
    twinDistinct: true,
    swap: {
      currentController: true,
      oldControllerPinned: true,
      sameMount: true,
    },
    oldStillIssued: true,
    remountDistinct: true,
    methodsNotReplacedByLookup: true,
    everyReturnedViewIssued: true,
  });
});
