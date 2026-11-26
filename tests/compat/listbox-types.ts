import type { ListBox } from "@heroui/react/list-box";
import type { ListBoxItemRootProps } from "@heroui/react/list-box-item";

type Item = Parameters<typeof ListBox.Item>[0];
export const item: Item = {
  id: "synthetic-option",
  textValue: "Synthetic option",
  children: "Synthetic option",
  isDisabled: false,
};
export const scoped: ListBoxItemRootProps = item;
export const restored: Item = scoped;
// @ts-expect-error Scoped item IDs do not become arbitrary object values.
export const invalidId: Item = { id: {} };
// @ts-expect-error Genuine item disabled state remains boolean.
export const invalidDisabled: Item = { isDisabled: "false" };
