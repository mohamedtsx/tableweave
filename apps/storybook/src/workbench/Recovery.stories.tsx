import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { checkedPlay, RecoveryWorkbench } from "./Workbench.js";

const meta = {
  id: "wp11-recovery",
  title: "Workbench/Recovery",
  component: RecoveryWorkbench,
  parameters: { layout: "fullscreen" },
  argTypes: {
    scenario: {
      control: { type: "select" },
      options: [
        "ready",
        "loading",
        "refreshing",
        "initial-error",
        "refresh-error",
        "empty",
        "no-results",
        "unknown-empty",
        "unknown-total",
      ],
    },
  },
} satisfies Meta<typeof RecoveryWorkbench>;
export default meta;
type Story = StoryObj<typeof meta>;
export const InitialLoading: Story = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await expect(
        await canvas.findByText("Loading records…", { exact: true }),
      ).toBeVisible();
      await expect(
        canvas.queryByRole("rowheader", { name: "Transfer note 01" }),
      ).not.toBeInTheDocument();
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Deliver known page" }),
      );
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
    }),
};
export const Refreshing: Story = {
  args: { scenario: "refreshing" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      await expect(
        await canvas.findByText("Updating records…", { exact: true }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("checkbox", { name: "Select Transfer note 01" }),
      ).toBeDisabled();
    }),
};
export const InitialError: Story = {
  args: { scenario: "initial-error" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await userEvent.click(
        await canvas.findByRole("button", { name: "Retry" }),
      );
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Deliver known page" }),
      );
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
    }),
};
export const RefreshError: Story = {
  args: { scenario: "refresh-error" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
      const notice = await canvas.findByText(
        "Records could not be updated. Showing the last available data.",
        { exact: true },
      );
      await expect(notice).toBeVisible();
      const recovery = notice.parentElement;
      if (!recovery) throw new Error("Missing failed-refresh notice container");
      await userEvent.click(
        within(recovery).getByRole("button", { name: /^Retry$/ }),
      );
      await expect(
        await canvas.findByText("Updating records…", { exact: true }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("rowheader", { name: "Transfer note 01" }),
      ).toBeVisible();
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Deliver known page" }),
      );
      await waitFor(async () =>
        expect(
          canvas.queryByText(
            "Records could not be updated. Showing the last available data.",
          ),
        ).not.toBeInTheDocument(),
      );
      await waitFor(async () =>
        expect(
          canvas.queryByText("Updating records…", { exact: true }),
        ).not.toBeInTheDocument(),
      );
      await expect(
        canvas.getByRole("rowheader", { name: "Transfer note 01" }),
      ).toBeVisible();
    }),
};
export const Empty: Story = {
  args: { scenario: "empty" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      await expect(
        await within(canvasElement).findByText("There are no records.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        within(canvasElement).queryByRole("rowheader"),
      ).not.toBeInTheDocument();
    }),
};
export const NoResults: Story = {
  args: { scenario: "no-results" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await expect(
        await canvas.findByText("No records match.", { exact: true }),
      ).toBeVisible();
      await userEvent.click(
        canvas.getByRole("button", { name: "Clear search" }),
      );
      await userEvent.click(
        canvas.getByText("Synthetic application controls", {
          selector: "summary",
        }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Deliver known page" }),
      );
      await canvas.findByRole("rowheader", { name: "Transfer note 01" });
    }),
};
export const UnknownEmpty: Story = {
  args: { scenario: "unknown-empty" },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async () => {
      const canvas = within(canvasElement);
      await expect(
        await canvas.findByText("There are no records to display.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        canvas.queryByText("No records match.", { exact: true }),
      ).not.toBeInTheDocument();
    }),
};
