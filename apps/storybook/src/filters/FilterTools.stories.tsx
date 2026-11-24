import type { Meta, StoryObj } from "@storybook/react-vite";
import { fireEvent, waitFor, within } from "@testing-library/dom";
import { expect, userEvent } from "storybook/test";
import { CombinedWorkbench } from "../../../../tests/filter-tools/fixtures/combined.js";

const meta = {
  title: "Filters/Tools",
  component: CombinedWorkbench,
  parameters: { layout: "fullscreen" },
  args: { initialBuilder: "none", asyncOptions: false },
  // These construct per-instance owners once. Use the real application controls
  // below the table rather than pretending an args rerender replaces an owner.
  argTypes: {
    controlled: { control: false },
    embedded: { control: false },
    initialBuilder: { control: false },
    initialIndependent: { control: false },
    initialScope: { control: false },
    locale: { control: false },
    optionTransport: { control: false },
    onReady: { control: false },
  },
} satisfies Meta<typeof CombinedWorkbench>;
export default meta;
type Story = StoryObj<typeof meta>;

function acceptedQuery(
  canvasElement: HTMLElement,
): Readonly<Record<string, unknown>> {
  const value: unknown = JSON.parse(
    within(canvasElement).getByTestId("accepted-query").textContent ?? "null",
  );
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error("Serialized accepted fixture query is unavailable");
  return value as Readonly<Record<string, unknown>>;
}

/** F-02: schema ownership is unchanged by neutral search/tab/date state. */
export const FieldOwnership: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    fireEvent.click(
      canvas.getByRole("button", { name: "Add filter rule: Filters" }),
    );
    await waitFor(() =>
      body.getByRole("option", { name: "Note (hidden column)" }),
    );
    for (const name of ["description", "category", "happened", "internalCode"])
      if (body.queryByRole("option", { name }))
        throw new Error(`Non-builder field exposed: ${name}`);
  },
};
/** F-03: same native model processes Any and independent tool AND criteria. */
export const BuilderAllAny: Story = {
  args: { initialBuilder: "crossAny" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByTestId("native-ids")).toHaveTextContent(
      /^b,d,e,f,g,h$/,
    );
    await userEvent.click(canvas.getByRole("button", { name: "All" }));
    await waitFor(() =>
      expect(canvas.getByTestId("native-ids")).toHaveTextContent(/^none$/),
    );
    await expect(canvas.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Any" }));
    await waitFor(() =>
      expect(canvas.getByTestId("native-ids")).toHaveTextContent(
        /^b,d,e,f,g,h$/,
      ),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Rule options: Amount" }),
    );
    await userEvent.click(await body.findByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(acceptedQuery(canvasElement).builder).toEqual({
        join: "or",
        rules: [
          {
            id: "note-rule",
            field: "note",
            operator: "text.contains",
            value: "alpha",
          },
        ],
      }),
    );
    await expect(canvas.getByTestId("native-ids")).toHaveTextContent(/^b$/);
  },
};
/** F-04: text/number/enum/set/nullable boolean/date and a custom numeric editor. */
export const OperatorFamilies: Story = { args: { initialBuilder: "families" } };
/** F-05: a real invalid draft stays open over unchanged accepted results. */
export const InvalidDraft: Story = {
  args: { initialBuilder: "repeated" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const [edit] = canvas.getAllByRole("button", {
      name: /^Value: Amount: .+$/,
    });
    if (!edit) throw new Error("Accepted amount editor missing");
    fireEvent.click(edit);
    await waitFor(() => body.getByRole("textbox", { name: "Value" }));
    fireEvent.change(body.getByRole("textbox", { name: "Value" }), {
      target: { value: "1e999" },
    });
    fireEvent.click(body.getByRole("button", { name: "Apply filter" }));
    await waitFor(() => body.getByRole("alert"));
    if (canvas.getByTestId("native-ids").textContent !== "b,c,d")
      throw new Error("Invalid draft changed the accepted native results");
  },
};
/** F-06: first explicit application response fails; real Retry settles new token. */
export const AsyncOptions: Story = {
  args: {
    asyncOptions: true,
    initialBuilder: "entities",
    optionTransport: "fail-once",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    fireEvent.click(
      canvas.getByRole("button", { name: /^Value: Numeric entity: .+$/ }),
    );
    await waitFor(() => body.getByRole("button", { name: "Retry options" }));
    if (canvas.getByTestId("native-ids").textContent !== "a,g")
      throw new Error("Local option failure replaced native results");
  },
};
/** F-07: Clear removes builder rules only, retaining search/tab/date/sort/columns. */
export const BuilderClear: Story = {
  args: { initialBuilder: "crossAny", initialIndependent: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = acceptedQuery(canvasElement);
    const columnsBefore = canvas.getByTestId("accepted-columns").textContent;
    await expect(canvas.getByTestId("native-ids")).toHaveTextContent(/^g,b$/);
    await userEvent.click(
      canvas.getByRole("button", { name: "Clear filter-builder rules" }),
    );
    await waitFor(() =>
      expect(acceptedQuery(canvasElement).builder).toEqual({
        join: "or",
        rules: [],
      }),
    );
    const after = acceptedQuery(canvasElement);
    await expect({ ...after, builder: null }).toEqual({
      ...before,
      builder: null,
    });
    await expect(canvas.getByTestId("accepted-columns").textContent).toBe(
      columnsBefore,
    );
    await expect(canvas.getByTestId("native-ids")).toHaveTextContent(/^g,b,a$/);
    await expect(
      canvas.queryByRole("button", { name: "Clear filter-builder rules" }),
    ).not.toBeInTheDocument();
  },
};
export const Controlled: Story = { args: { controlled: true } };
export const Narrow: Story = {
  args: { narrow: true, initialBuilder: "repeated" },
};
export const RTL: Story = {
  args: { locale: "ar-EG", initialBuilder: "repeated" },
};
export const SelectionSlot: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      canvas.getByRole("button", { name: "Select visible records" }),
    );
    fireEvent.click(
      canvas.getByRole("button", { name: "Select visible records" }),
    );
  },
};
export const IndependentTables: Story = {
  render: () => (
    <main aria-label="Independent synthetic tables">
      <CombinedWorkbench
        label="First synthetic table"
        embedded
        initialBuilder="repeated"
      />
      <CombinedWorkbench
        label="Second synthetic table"
        embedded
        initialScope="scope-b"
        initialBuilder="entities"
      />
    </main>
  ),
};
