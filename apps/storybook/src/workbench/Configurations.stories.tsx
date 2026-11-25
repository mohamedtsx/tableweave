import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  checkedPlay,
  ControlledWorkbench,
  GroupedWorkbench,
  IndependentWorkbench,
  MinimalWorkbench,
  OwnerConflict,
  RecoveryWorkbench,
  TransactionsWorkbench,
} from "./Workbench.js";

const meta = {
  id: "wp11-configurations",
  title: "Workbench/Configurations",
  component: TransactionsWorkbench,
  parameters: { layout: "fullscreen" },
  argTypes: { scenario: { control: false } },
} satisfies Meta<typeof TransactionsWorkbench>;
export default meta;
type Story = StoryObj<typeof meta>;
async function controls(element: HTMLElement) {
  await userEvent.click(
    within(element).getByText("Synthetic application controls", {
      selector: "summary",
    }),
  );
}
async function select(element: HTMLElement, name: string) {
  const checkbox = within(element).getByRole("checkbox", { name });
  const label = checkbox.closest("label");
  if (!label) throw new Error("Actual checkbox label required");
  await userEvent.click(label);
}
export const Default: Story = {
  render: () => <MinimalWorkbench />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await expect(
        canvas.getByRole("button", { name: "Add filter rule: Filters" }),
      ).toBeVisible();
      await expect(canvas.queryByRole("searchbox")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("tablist")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("checkbox")).not.toBeInTheDocument();
    }),
};
export const FullyConfigured: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await expect(
        canvas.getByRole("searchbox", { name: "Search descriptions" }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("tab", { name: "All records" }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Filter by date" }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Columns" }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "View details tx-001" }),
      ).toBeVisible();
      await expect(
        canvas.getByText(/dragging\/G-02 is incomplete/),
      ).toBeVisible();
    }),
};
export const SelectedAcrossPages: Story = {
  render: () => <RecoveryWorkbench scenario="ready" />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await select(canvasElement, "Select Transfer note 01");
      await expect(canvas.queryByRole("searchbox")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
      await controls(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Deliver known page" }),
      );
      await canvas.findByRole("rowheader", { name: "Transfer note 11" });
      await select(canvasElement, "Select Transfer note 11");
      await expect(canvas.getByLabelText("Selected IDs")).toHaveTextContent(
        "tx-001, tx-011",
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Queue synthetic review" }),
      );
      await expect(
        canvas.getByLabelText("Application notice"),
      ).toHaveTextContent("2 IDs; 1 loaded records");
      const before = canvas.getByLabelText("Accepted query").textContent;
      await userEvent.click(
        canvas.getByRole("button", { name: /Clear row selection/ }),
      );
      await expect(canvas.getByLabelText("Selected IDs")).toHaveTextContent(
        "none",
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        before ?? "missing query",
      );
    }),
};
export const SelectionLifetime: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await select(canvasElement, "Select Transfer note 01");
      await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
      await controls(canvasElement);
      await expect(canvas.getByLabelText("Selected IDs")).toHaveTextContent(
        "tx-001",
      );
      await userEvent.click(canvas.getByRole("tab", { name: "Draft" }));
      await waitFor(async () =>
        expect(canvas.getByLabelText("Selected IDs")).toHaveTextContent("none"),
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"tabId":"draft"',
      );
    }),
};
export const Sorting: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await userEvent.click(
        canvas.getByRole("button", { name: /^Sort Description,/ }),
      );
      await userEvent.click(
        await body.findByRole("button", { name: "Ascending: Description" }),
      );
      await userEvent.keyboard("{Escape}");
      await controls(canvasElement);
      await waitFor(async () =>
        expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
          '"sorting":[{"desc":false,"id":"description"}]',
        ),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: /^Sort Amount,/ }),
      );
      await userEvent.click(
        await body.findByRole("button", { name: "Add descending: Amount" }),
      );
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"desc":true,"id":"amount"',
      );
    }),
};
export const RequiredColumns: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await userEvent.click(canvas.getByRole("button", { name: "Columns" }));
      await expect(
        await body.findByRole("checkbox", { name: /Description/ }),
      ).toBeDisabled();
      const reference = body.getByRole("checkbox", { name: /Reference/ });
      const label = reference.closest("label");
      if (!label) throw new Error("Actual chooser label required");
      await userEvent.click(label);
      await userEvent.keyboard("{Escape}");
      await expect(
        canvas.getByRole("columnheader", { name: "Reference" }),
      ).toBeVisible();
    }),
};
export const GroupedColumns: Story = {
  render: () => <GroupedWorkbench />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await canvas.findByRole("columnheader", { name: "Values" });
      await userEvent.click(
        canvas.getByRole("button", { name: "Move column: Amount" }),
      );
      await userEvent.click(
        await body.findByRole("menuitem", { name: "Move after" }),
      );
      await expect(
        canvas.getByRole("columnheader", { name: "Values" }),
      ).toBeVisible();
      await expect(
        canvas.queryByRole("button", { name: "Move column: Details" }),
      ).not.toBeInTheDocument();
    }),
};
export const Pagination: Story = {
  render: () => <RecoveryWorkbench scenario="unknown-total" />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await expect(canvas.queryByText(/of 24 records/)).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
      await controls(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Deliver unknown page" }),
      );
      await canvas.findByRole("rowheader", { name: "Transfer note 11" });
    }),
};
export const Dark: Story = {
  args: { dark: true },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      await within(canvasElement).findByRole("rowheader", {
        name: "Transfer note 01",
      });
      await expect(within(canvasElement).getByRole("main")).toHaveAttribute(
        "data-theme",
        "dark",
      );
    }),
};
export const RTL: Story = {
  args: { rtl: true },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      await within(canvasElement).findByRole("rowheader", {
        name: "Transfer note 01",
      });
      await expect(within(canvasElement).getByRole("main")).toHaveAttribute(
        "dir",
        "rtl",
      );
    }),
};
export const Narrow: Story = {
  args: { width: 390 },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      await within(canvasElement).findByRole("rowheader", {
        name: "Transfer note 01",
      });
      await expect(within(canvasElement).getByRole("table")).toBeVisible();
    }),
};
export const IndependentTables: Story = {
  render: () => <IndependentWorkbench />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        first = within(
          canvas.getByRole("main", { name: "Synthetic transactions" }),
        ),
        second = within(
          canvas.getByRole("main", { name: "Synthetic inventory" }),
        );
      await first.findByRole("rowheader", { name: "Transfer note 01" });
      await second.findByRole("rowheader", { name: "Desk stand" });
      await userEvent.type(
        first.getByRole("searchbox", { name: "Search descriptions" }),
        "Transfer note 01{Enter}",
      );
      await waitFor(async () =>
        expect(
          first.queryByRole("rowheader", { name: "Transfer note 03" }),
        ).not.toBeInTheDocument(),
      );
      await expect(
        second.getByRole("rowheader", { name: "Desk stand" }),
      ).toBeVisible();
    }),
};
export const AccessLoss: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await select(canvasElement, "Select Transfer note 01");
      await controls(canvasElement);
      await userEvent.click(
        canvas.getByRole("button", { name: "Revoke application access" }),
      );
      await waitFor(async () =>
        expect(
          canvas.queryByRole("rowheader", { name: "Transfer note 01" }),
        ).not.toBeInTheDocument(),
      );
      await expect(canvas.getByLabelText("Selected IDs")).toHaveTextContent(
        "none",
      );
      await expect(
        canvas.getByRole("button", { name: "Revoke application access" }),
      ).toBeDisabled();
    }),
};
export const ControlledAcceptance: Story = {
  render: () => <ControlledWorkbench />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await controls(canvasElement);
      await select(canvasElement, "Select Transfer note 01");
      await expect(canvas.getByLabelText("Selected IDs")).toHaveTextContent(
        "none",
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Reject proposed change" }),
      );
      await select(canvasElement, "Select Transfer note 01");
      await userEvent.click(
        canvas.getByRole("button", { name: "Accept proposed change" }),
      );
      await expect(canvas.getByLabelText("Selected IDs")).toHaveTextContent(
        "tx-001",
      );
    }),
};
export const OwnerConflictDiagnostic: Story = {
  render: () => <OwnerConflict />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      await expect(within(canvasElement).getByRole("alert")).toHaveTextContent(
        "Configuration rejected: a tabs predicate cannot claim a builder-owned field.",
      );
    }),
};
