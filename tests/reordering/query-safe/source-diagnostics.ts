import { expect, type Page, test } from "@playwright/test";

/** Same-origin synthetic fixtures only; never an error/egress acceptance waiver. */
export function registerSourceDiagnostics() {
  const records = new WeakMap<
    Page,
    {
      pageErrors: string[];
      consoleErrors: string[];
      requestErrors: string[];
      httpErrors: string[];
      blocked: string[];
    }
  >();
  test.beforeEach(async ({ page, context }) => {
    const record = {
      pageErrors: [] as string[],
      consoleErrors: [] as string[],
      requestErrors: [] as string[],
      httpErrors: [] as string[],
      blocked: [] as string[],
    };
    records.set(page, record);
    page.on("pageerror", (error) => record.pageErrors.push(error.message));
    page.on("console", (event) => {
      if (event.type() === "error") record.consoleErrors.push(event.text());
    });
    page.on("requestfailed", (request) =>
      record.requestErrors.push(
        `${request.url()} ${request.failure()?.errorText}`,
      ),
    );
    page.on("response", (response) => {
      if (response.status() >= 400)
        record.httpErrors.push(`${response.status()} ${response.url()}`);
    });
    await context.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin === "http://127.0.0.1:6570")
        await route.continue();
      else {
        record.blocked.push(route.request().url());
        await route.abort("blockedbyclient");
      }
    });
  });
  test.afterEach(async ({ page }, info) => {
    const record = records.get(page);
    await info.attach("source-page-diagnostics.json", {
      body: JSON.stringify({ url: page.url(), ...record }, null, 2),
      contentType: "application/json",
    });
    expect(record?.pageErrors).toEqual([]);
    expect(record?.consoleErrors).toEqual([]);
    expect(record?.requestErrors).toEqual([]);
    expect(record?.httpErrors).toEqual([]);
    expect(record?.blocked).toEqual([]);
  });
}
