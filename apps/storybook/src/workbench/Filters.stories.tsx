import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { checkedPlay, TransactionsWorkbench } from "./Workbench.js";

const meta = {
  id: "wp11-filters",
  title: "Workbench/Filters",
  component: TransactionsWorkbench,
  parameters: { layout: "fullscreen" },
  argTypes: { scenario: { control: false } },
} satisfies Meta<typeof TransactionsWorkbench>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FieldOwnership: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await userEvent.click(
        canvas.getByRole("button", { name: "Add filter rule: Filters" }),
      );
      // Aria mounts its collection before the animated popover is visible.
      const reference = await body.findByRole("option", {
        name: "Reference (hidden column)",
      });
      await waitFor(() => expect(reference).toBeVisible());
      for (const name of ["description", "status", "occurred"])
        await expect(
          body.queryByRole("option", { name }),
        ).not.toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
    }),
};
export const BuilderAllAny: Story = {
  args: { scenario: "rules" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("button", { name: "Clear filter-builder rules" });
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"join":"or"',
      );
      await userEvent.click(canvas.getByRole("button", { name: "All" }));
      await waitFor(async () =>
        expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
          '"join":"and"',
        ),
      );
      await userEvent.click(canvas.getByRole("button", { name: "Any" }));
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"join":"or"',
      );
    }),
};
export const OperatorFamilies: Story = {
  args: { scenario: "families" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("button", { name: "Clear filter-builder rules" });
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"operator":"set.anyOf"',
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"operator":"boolean.isFalse"',
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"field":"bookingDay"',
      );
    }),
};
export const InvalidDraft: Story = {
  args: { scenario: "rules" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await canvas.findByRole("button", { name: "Clear filter-builder rules" });
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      const before = canvas.getByLabelText("Accepted query").textContent;
      await userEvent.click(
        canvas.getByRole("button", { name: /^Value: Amount:/ }),
      );
      const input = await body.findByRole("textbox", {
        name: "Custom numeric value",
      });
      await userEvent.clear(input);
      await userEvent.type(input, "1e999");
      await userEvent.click(body.getByRole("button", { name: "Apply filter" }));
      await expect(await body.findByRole("alert")).toBeVisible();
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        before ?? "missing query",
      );
      await userEvent.click(
        body.getByRole("button", { name: "Cancel filter edit" }),
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        before ?? "missing query",
      );
    }),
};
export const AsyncOptions: Story = {
  args: { scenario: "entities" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement),
        body = within(canvasElement.ownerDocument.body);
      await userEvent.click(
        await canvas.findByRole("button", { name: /^Value: Account:/ }),
      );
      await userEvent.click(
        await body.findByRole("button", { name: "Retry options" }),
      );
      await expect(
        await body.findByRole("option", { name: "Account zero" }),
      ).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await expect(canvas.getByLabelText("Accepted query")).toHaveTextContent(
        '"value":0',
      );
    }),
};
export const BuilderClear: Story = {
  args: { scenario: "independent" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("button", { name: "Clear filter-builder rules" });
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      const query = JSON.parse(
        canvas.getByLabelText("Accepted query").textContent ?? "null",
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Clear filter-builder rules" }),
      );
      await waitFor(async () => {
        const after = JSON.parse(
          canvas.getByLabelText("Accepted query").textContent ?? "null",
        );
        await expect(after.builder).toEqual({ join: "or", rules: [] });
        await expect(after.search).toBe(query.search);
        await expect(after.tabId).toBe(query.tabId);
        await expect(after.date).toEqual(query.date);
      });
    }),
};
