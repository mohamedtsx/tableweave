import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  ControlsExample,
  type ControlsExampleProps,
} from "./ControlsExample.js";

function StoryExample(props: ControlsExampleProps) {
  return (
    <div data-testid="controls-play" data-play-state="idle">
      <ControlsExample {...props} />
    </div>
  );
}

async function checkedPlay(
  canvas: HTMLElement,
  play: (queries: ReturnType<typeof within>) => Promise<void>,
) {
  const marker = canvas.querySelector<HTMLElement>(
    '[data-testid="controls-play"]',
  );
  if (!marker) throw new Error("Missing play completion marker");
  marker.dataset.playState = "running";
  try {
    await play(within(canvas));
    marker.dataset.playState = "completed";
  } catch (error) {
    marker.dataset.playState = "exception";
    throw error;
  }
}

function labelFor(input: HTMLElement) {
  const label = input.closest("label");
  if (!label) throw new Error("Missing real checkbox label");
  return label;
}

const meta = {
  title: "Controls/Public composition",
  component: StoryExample,
  args: { id: "orders", mode: "server" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof StoryExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NormalAndSelection: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      await canvas.findByRole("rowheader", { name: "Alpha", exact: true });
      const criteria = canvas.getByTestId("criteria").textContent;
      await userEvent.click(
        canvas.getByRole("button", { name: "Open scratch note", exact: true }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await userEvent.type(
        await body.findByRole("textbox", { name: "Scratch note draft" }),
        "discard this local draft",
      );
      await userEvent.click(
        labelFor(
          canvas.getByRole("checkbox", { name: "Select Alpha", exact: true }),
        ),
      );
      await waitFor(async () => {
        await expect(
          body.queryByRole("dialog", { name: "orders scratch note" }),
        ).not.toBeInTheDocument();
        await expect(canvas.getByTestId("criteria").textContent).toBe(criteria);
      });
      await userEvent.click(
        canvas.getByRole("button", { name: "Queue review", exact: true }),
      );
      await expect(canvas.getByLabelText("Review queue")).toHaveTextContent(
        "1 IDs",
      );
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Cancel — Clear row selection",
          exact: true,
        }),
      );
      await userEvent.click(
        await canvas.findByRole("button", {
          name: "Open scratch note",
          exact: true,
        }),
      );
      await expect(
        await body.findByRole("textbox", { name: "Scratch note draft" }),
      ).toHaveValue("");
      await userEvent.click(body.getByRole("button", { name: "Discard note" }));
    }),
};

export const RetainedRequest: Story = {
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      await canvas.findByRole("rowheader", { name: "Alpha", exact: true });
      await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
      await waitFor(async () => {
        await expect(
          canvas.getByText("1–3 of 12 records · Page 1 of 4"),
        ).toBeVisible();
        await expect(
          canvas.getByRole("button", { name: "Next page", exact: true }),
        ).toBeDisabled();
      });
      await userEvent.click(
        canvas.getByRole("button", { name: "Fail request", exact: true }),
      );
      await userEvent.click(
        await canvas.findByRole("button", { name: "Retry", exact: true }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Settle known", exact: true }),
      );
      await canvas.findByRole("rowheader", { name: "Delta", exact: true });
      await expect(
        canvas.getByText("4–6 of 12 records · Page 2 of 4"),
      ).toBeVisible();
    }),
};

export const ControlledRejection: Story = {
  args: { controlled: true },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      const row = await canvas.findByRole("checkbox", {
        name: "Select Alpha",
        exact: true,
      });
      await userEvent.click(labelFor(row));
      await expect(row).not.toBeChecked();
      await userEvent.click(
        canvas.getByRole("button", { name: "Reject proposal", exact: true }),
      );
      await expect(row).not.toBeChecked();
      await userEvent.click(labelFor(row));
      await userEvent.click(
        canvas.getByRole("button", { name: "Accept proposal", exact: true }),
      );
      await waitFor(async () => expect(row).toBeChecked());
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Cancel — Clear row selection",
          exact: true,
        }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Reject proposal", exact: true }),
      );
      await expect(row).toBeChecked();
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Cancel — Clear row selection",
          exact: true,
        }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Accept proposal", exact: true }),
      );
      await canvas.findByRole("button", {
        name: "Open scratch note",
        exact: true,
      });
    }),
};

export const SingleRtl: Story = {
  args: { single: true, locale: "ar-EG", dark: true },
  play: async ({ canvasElement }) =>
    checkedPlay(canvasElement, async (canvas) => {
      const row = await canvas.findByRole("checkbox", {
        name: "اختيار Alpha",
        exact: true,
      });
      await expect(
        canvas.queryByRole("checkbox", {
          name: "اختيار الصفوف المؤهلة في الصفحة",
          exact: true,
        }),
      ).not.toBeInTheDocument();
      await userEvent.click(labelFor(row));
      await waitFor(async () => expect(row).toBeChecked());
      row.focus();
      await userEvent.keyboard("{Control>}a{/Control}");
      await expect(
        canvas.getByRole("checkbox", { name: "اختيار Gamma", exact: true }),
      ).not.toBeChecked();
      await expect(row).toBeChecked();
    }),
};
