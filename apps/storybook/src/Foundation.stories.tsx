import { Button } from "@heroui/react/button";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

function VendorSmoke() {
  const [presses, setPresses] = useState(0);

  return (
    <main className="max-w-md space-y-4 p-6 text-foreground">
      <div className="space-y-2">
        <h1 className="text-base font-semibold">Workspace foundation</h1>
        <p className="text-sm text-muted">
          Synthetic vendor smoke only. Tableweave feature states are reviewed
          separately; this scene is not final design acceptance.
        </p>
      </div>
      <Button
        variant="secondary"
        onPress={() => setPresses((value) => value + 1)}
      >
        Check interaction
      </Button>
      <p role="status" aria-live="polite" className="text-sm">
        Checks completed: {presses}
      </p>
    </main>
  );
}

const meta = {
  title: "Foundation/Workspace",
  component: VendorSmoke,
} satisfies Meta<typeof VendorSmoke>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Smoke: Story = {};
