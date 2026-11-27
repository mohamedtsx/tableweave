import { renderToString } from "react-dom/server";
import { SelectionToolbar } from "../../../packages/heroui/src/selection/index.js";
import {
  createControlsAuthority,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import { context, fixture } from "../core/fixtures.js";

export function renderSelection(selected: boolean): string {
  const f = fixture();
  if (selected)
    f.controller.dispatch({
      type: "selection.change",
      update: { offpage: true },
    });
  const input = f.client();
  const authority = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    queryIdentity: input.native.state.queryIdentity,
    context,
    mode: "client",
    readCommitted: f.readCommitted,
  });
  return renderToString(
    <SelectionToolbar
      presentation={projectControls(f.definition, input)}
      authority={authority}
      normal={<button type="button">Normal tools</button>}
      actions={[
        {
          id: "review",
          label: "Review selected",
          onAction: () => {
            throw new Error("SSR cannot call actions");
          },
        },
      ]}
    />,
  );
}

/** Genuine neutral projections must withhold the old private React subtree on
 * the first server render; effects cannot repair an HTML disclosure. */
export function auditPrivacyRender(kind: "access" | "context" | "definition") {
  const f = fixture();
  f.controller.dispatch({
    type: "builder.commit",
    rule: { id: "applied", field: "amount", operator: "number.gt", value: 0 },
  });
  f.controller.dispatch({ type: "selection.change", update: { a: true } });
  f.begin();
  f.succeed();
  const before = f.controller.getSnapshot();
  const initial = f.server();
  const authority = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    queryIdentity: initial.native.state.queryIdentity,
    context,
    mode: "server",
    resource: f.resource,
    readCommitted: f.readCommitted,
  });
  if (kind === "access") f.resource.setContext({ ...context, access: false });
  let input = f.server();
  if (kind === "context")
    input = { ...input, expected: { ...context, scopeKey: "other" } };
  if (kind === "definition") f.controller.dispose();
  f.setCommitted(input);
  const presentation = projectControls(f.definition, input);
  let normalRenders = 0;
  let actionMetadataReads = 0;
  let selectionMessageCalls = 0;
  function PrivateNormal() {
    normalRenders++;
    return <span>Amount greater than 0</span>;
  }
  const html = renderToString(
    <SelectionToolbar
      presentation={presentation}
      authority={authority}
      normal={<PrivateNormal />}
      actions={[
        {
          id: "private",
          get label() {
            actionMetadataReads++;
            return "Private record action";
          },
          onAction: () => {
            throw new Error("No SSR app action");
          },
        },
      ]}
      messages={{
        selectedCount: (count) => {
          selectionMessageCalls++;
          return `${count} private selected`;
        },
      }}
    />,
  );
  return {
    kind,
    html,
    blockedReason: presentation.blockedReason,
    requestedQuery: presentation.requestedQuery,
    selectedIds: presentation.selectedIds,
    acceptedSelection: f.controller.getSnapshot().selection,
    queryUnchanged: before.query === f.controller.getSnapshot().query,
    normalRenders,
    actionMetadataReads,
    selectionMessageCalls,
  };
}
