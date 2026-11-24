import { Button } from "@heroui/react/button";
import { Drawer } from "@heroui/react/drawer";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { NoSwipeDialog } from "../../packages/heroui/src/details/no-swipe-dialog.js";
import "./styles.css";

function Proof() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState(0);
  const [presses, setPresses] = useState(0);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Open proof</Button>
      <output data-requests>{requests}</output>
      <Drawer.Backdrop
        isOpen={open}
        onOpenChange={() => setRequests((n) => n + 1)}
      >
        <Drawer.Content placement="right">
          <NoSwipeDialog>
            <Drawer.Header>
              <Drawer.Heading>Drag proof</Drawer.Heading>
              <span data-drag-header>Selectable header words</span>
            </Drawer.Header>
            <Drawer.Body>
              <input aria-label="Draft" defaultValue="retained" />
              <Button onPress={() => setPresses((n) => n + 1)}>
                Child press {presses}
              </Button>
              <div style={{ height: 1800 }}>Scrollable body</div>
            </Drawer.Body>
            <Drawer.Footer>
              <span data-drag-footer>Footer drag area</span>
              <Drawer.CloseTrigger aria-label="Close proof" />
            </Drawer.Footer>
          </NoSwipeDialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Proof />);
