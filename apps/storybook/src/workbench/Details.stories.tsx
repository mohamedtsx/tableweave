import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  checkedPlay,
  CustomerWorkbench,
  InventoryWorkbench,
  TransactionsWorkbench,
} from "./Workbench.js";
const meta = {
  id: "wp11-details",
  title: "Workbench/Details",
  component: TransactionsWorkbench,
  parameters: { layout: "fullscreen" },
  argTypes: { scenario: { control: false } },
} satisfies Meta<typeof TransactionsWorkbench>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CustomDetails: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await userEvent.click(
        await canvas.findByRole("button", { name: "View details tx-001" }),
      );
      const draft = await body.findByRole("textbox", {
        name: "Reference draft",
      });
      await userEvent.type(draft, "local working reference");
      await userEvent.click(
        body.getByRole("button", { name: "Refresh detail" }),
      );
      await userEvent.click(
        body.getByRole("button", { name: "Deliver detail" }),
      );
      await expect(draft).toHaveValue("local working reference");
      await userEvent.click(
        body.getByRole("button", { name: "Close record details" }),
      );
      await userEvent.click(
        await body.findByRole("button", { name: "Keep editing" }),
      );
      await expect(draft).toHaveValue("local working reference");
      await userEvent.click(
        body.getByRole("button", { name: "Save synthetic reference" }),
      );
      await userEvent.click(
        body.getByRole("button", { name: "Close record details" }),
      );
      await expect(
        canvas.getByRole("button", { name: "View details tx-001" }),
      ).toBeVisible();
    }),
};
export const CustomerDetails: Story = {
  render: () => <CustomerWorkbench />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await userEvent.click(
        await canvas.findByRole("button", { name: "View details cu-001" }),
      );
      const note = await body.findByRole("textbox", { name: "Working note" });
      await userEvent.type(note, "Review with the synthetic team");
      await userEvent.selectOptions(
        body.getByRole("combobox", { name: "Local report view" }),
        "teams",
      );
      await userEvent.click(
        body.getByRole("button", { name: "Save synthetic note" }),
      );
      await userEvent.click(
        body.getByRole("button", { name: "Close record details" }),
      );
      await expect(
        canvas.getByRole("rowheader", { name: "Customer 01" }),
      ).toBeVisible();
    }),
};
export const InventoryDetails: Story = {
  render: () => <InventoryWorkbench />,
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await userEvent.click(
        await canvas.findByRole("button", { name: "View details it-001" }),
      );
      const count = await body.findByRole("textbox", { name: "Count draft" });
      await userEvent.clear(count);
      await userEvent.type(count, "-1");
      await expect(
        body.getByRole("button", { name: "Apply synthetic count" }),
      ).toBeDisabled();
      await userEvent.clear(count);
      await userEvent.type(count, "8");
      await userEvent.click(
        body.getByRole("button", { name: "Apply synthetic count" }),
      );
      await userEvent.click(
        body.getByRole("button", { name: "Refresh detail" }),
      );
      await userEvent.click(
        body.getByRole("button", { name: "Report missing detail" }),
      );
      await expect(
        await body.findByText("This record is not available.", { exact: true }),
      ).toBeVisible();
    }),
};
