import type { Meta, StoryObj } from "@storybook/react-vite";
import { parseQuery } from "@tableweave/react/contracts";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  compositionSchema,
  FilterControlsComposition,
  type FilterControlsCompositionProps,
} from "./FilterControlsComposition.js";

function Example(props: FilterControlsCompositionProps) {
  return (
    <div data-testid="filter-controls-play" data-play-state="idle">
      <FilterControlsComposition {...props} />
    </div>
  );
}

const meta = {
  title: "Controls/Real filter composition",
  component: Example,
  parameters: { layout: "fullscreen" },
  argTypes: {
    id: { control: false },
    controlled: { control: false },
    initialRule: { control: false },
    locale: { control: false },
    onReady: { control: false },
  },
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;

async function checkedPlay(
  element: HTMLElement,
  body: (canvas: ReturnType<typeof within>) => Promise<void>,
) {
  const marker = element.querySelector<HTMLElement>(
    '[data-testid="filter-controls-play"]',
  );
  if (!marker) throw new Error("Missing own play marker");
  marker.dataset.playState = "running";
  try {
    await body(within(element));
    marker.dataset.playState = "completed";
  } catch (error) {
    marker.dataset.playState = "exception";
    throw error;
  }
}

function query(canvas: ReturnType<typeof within>) {
  const parsed = parseQuery(
    compositionSchema,
    JSON.parse(canvas.getByTestId("composition-query").textContent ?? "null"),
  );
  if (!parsed.success) throw new Error("Accepted query is unavailable");
  return parsed.data;
}

export const BuilderAndSelection: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      const body = within(canvasElement.ownerDocument.body);
      await canvas.findByRole("rowheader", { name: "Alpha", exact: true });
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Add filter rule: Filters",
          exact: true,
        }),
      );
      await userEvent.click(
        await body.findByRole("option", { name: "Amount" }),
      );
      await userEvent.click(
        await body.findByRole("option", { name: "is at least" }),
      );
      await userEvent.type(
        await body.findByRole("textbox", { name: "Value" }),
        "20",
      );
      await userEvent.click(body.getByRole("button", { name: "Apply filter" }));
      await waitFor(() => expect(query(canvas).builder.rules).toHaveLength(1));
      await expect(canvas.getByTestId("composition-ids")).toHaveTextContent(
        /^b,c,d$/,
      );
      const accepted = query(canvas);
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Select only unavailable ID",
          exact: true,
        }),
      );
      await expect(
        canvas.queryByTestId("composition-normal"),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByRole("tab", { name: "Ready", exact: true }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Filter by date", exact: true }),
      ).toBeVisible();
      await userEvent.click(
        canvas.getByRole("button", { name: "Queue selected IDs", exact: true }),
      );
      await expect(
        canvas.getByRole("status", { name: "Queue feedback" }),
      ).toHaveTextContent("0 loaded, 1 unavailable");
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Cancel — Clear row selection",
          exact: true,
        }),
      );
      await canvas.findByTestId("composition-normal");
      await expect(query(canvas)).toEqual(accepted);
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Clear filter-builder rules",
          exact: true,
        }),
      );
      await waitFor(() => expect(query(canvas).builder.rules).toHaveLength(0));
      await expect(canvas.getByTestId("composition-ids")).toHaveTextContent(
        /^a,b,c$/,
      );
    }),
};

export const TabsAndDate: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      await canvas.findByRole("rowheader", { name: "Alpha", exact: true });
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Results local state 0",
          exact: true,
        }),
      );
      await userEvent.click(
        canvas.getByRole("tab", { name: "Paused", exact: true }),
      );
      await waitFor(() => expect(query(canvas).tabId).toBe("paused"));
      await expect(canvas.getByTestId("composition-ids")).toHaveTextContent(
        /^c,d,g$/,
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Filter by date", exact: true }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "November 24 UTC", exact: true }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Cancel date edit", exact: true }),
      );
      await expect(query(canvas).date).toBeNull();
      await userEvent.click(
        canvas.getByRole("button", { name: "Filter by date", exact: true }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "November 24 UTC", exact: true }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Apply date filter", exact: true }),
      );
      await waitFor(() =>
        expect(canvas.getByTestId("composition-ids")).toHaveTextContent(
          /^d,g$/,
        ),
      );
      await userEvent.click(
        canvas.getByRole("tab", { name: "All records", exact: true }),
      );
      await waitFor(() => expect(query(canvas).tabId).toBeNull());
      await expect(
        canvas.getByRole("button", {
          name: "Results local state 1",
          exact: true,
        }),
      ).toBeVisible();
      await expect(query(canvas).date).toEqual({
        operator: "date.on",
        value: { kind: "day", value: "2026-11-24" },
      });
    }),
};

export const ControlledSearch: Story = {
  args: { controlled: true },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      await canvas.findByRole("rowheader", { name: "Alpha", exact: true });
      const search = canvas.getByRole("searchbox", { name: "Search records" });
      await userEvent.type(search, "Alpha{Enter}");
      await waitFor(() =>
        expect(canvas.getByTestId("composition-proposal")).toHaveTextContent(
          "search.commit",
        ),
      );
      await expect(query(canvas).search).toBe("");
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Reject proposed change",
          exact: true,
        }),
      );
      await expect(query(canvas).search).toBe("");
      await userEvent.clear(search);
      await userEvent.type(search, "Alpha{Enter}");
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Accept proposed change",
          exact: true,
        }),
      );
      await waitFor(() => expect(query(canvas).search).toBe("Alpha"));
      await expect(canvas.getByTestId("composition-ids")).toHaveTextContent(
        /^a,d,f$/,
      );
    }),
};

export const MembershipRtl: Story = {
  args: { locale: "ar-EG", dark: true },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      const body = within(canvasElement.ownerDocument.body);
      await canvas.findByRole("rowheader", { name: "Alpha", exact: true });
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Add filter rule: Filters",
          exact: true,
        }),
      );
      await userEvent.click(await body.findByRole("option", { name: "Team" }));
      await userEvent.click(
        await body.findByRole("option", { name: "is any of" }),
      );
      await userEvent.click(await body.findByRole("option", { name: "Red" }));
      await waitFor(() => expect(query(canvas).builder.rules).toHaveLength(1));
      const accepted = query(canvas).builder;
      await userEvent.keyboard("{Escape}");
      await expect(query(canvas).builder).toEqual(accepted);
      await expect(canvas.getByTestId("composition-ids")).toHaveTextContent(
        /^a,c,e$/,
      );
      await expect(canvas.getByTestId("provider-locale")).toHaveAttribute(
        "data-direction",
        "rtl",
      );
    }),
};
