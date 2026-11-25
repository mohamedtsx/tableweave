import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  checkedPlay,
  ReorderWorkbench,
  TransactionsWorkbench,
} from "./Workbench.js";
const meta = {
  id: "wp11-reordering",
  title: "Workbench/Reordering",
  component: ReorderWorkbench,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ReorderWorkbench>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DragBlocked: Story = {
  render: () => (
    <section aria-label="Drag capability unavailable">
      <h2>Dragging is user-blocked; WP-10/G-02 is incomplete.</h2>
      <p>
        No drag adapter or drag handle is registered. The table below has no
        move configuration.
      </p>
      <TransactionsWorkbench />
    </section>
  ),
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await expect(
        canvas.queryByRole("button", { name: /^Move row:/ }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByRole("button", { name: /^Move column:/ }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByRole("heading", {
          name: "Dragging is user-blocked; WP-10/G-02 is incomplete.",
        }),
      ).toBeVisible();
    }),
};
export const ReorderFailure: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      const move = await canvas.findByRole("button", {
        name: "Move row: Transfer note 01",
      });
      await waitFor(async () => expect(move).toBeEnabled());
      await userEvent.click(move);
      await userEvent.click(
        await body.findByRole("menuitem", { name: "Move down" }),
      );
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await expect(
        canvas.getByRole("button", { name: "Next page" }),
      ).toBeDisabled();
      await userEvent.click(
        canvas.getByRole("button", { name: "Report synthetic timeout" }),
      );
      await expect(
        canvas.getByLabelText("Row transport notice"),
      ).toHaveTextContent("status unknown");
      await userEvent.click(
        canvas.getByRole("button", { name: "Hide table UI" }),
      );
      await expect(
        canvas.getByRole("button", {
          name: "Publish authoritative synthetic input",
        }),
      ).toBeEnabled();
      await userEvent.click(
        canvas.getByRole("button", { name: "Show table UI" }),
      );
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Publish authoritative synthetic input",
        }),
      );
      await waitFor(async () =>
        expect(canvas.getByRole("button", { name: "Next page" })).toBeEnabled(),
      );
      const headers = canvas.getAllByRole("rowheader");
      await expect(headers[0]).toHaveTextContent("Transfer note 02");
      await expect(headers[1]).toHaveTextContent("Transfer note 01");
    }),
};
