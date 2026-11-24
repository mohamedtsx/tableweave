import type { CriteriaAuthority, TableController } from "@tableweave/react";
import type {
  CriteriaActor,
  CriteriaMountLease,
  CriteriaPortsByKind,
  CriteriaToolTarget,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import { createCriteriaCommitCell } from "../../packages/heroui/src/filters/criteria-commit.js";
import type { S } from "./fixtures.js";
import type { Other } from "./types.js";

declare const controller: TableController<S>;
declare const target: CriteriaToolTarget<S>;
declare const plain: CriteriaAuthority<S>;
declare const wrongSchema: CriteriaActor<"builder", Other>;
declare const wrongKind: CriteriaActor<"date", S>;
declare const wrongLease: CriteriaMountLease<"date", S>;
declare const otherTarget: CriteriaToolTarget<Other>;
declare const ports: CriteriaPortsByKind<S>["builder"];
const cell = createCriteriaCommitCell("builder", controller),
  lease = cell.connect();
const actor = cell.commit(lease, target, {}),
  text = cell.createLocal("text");
// @ts-expect-error N01 real tool authority is not a plain P-issued authority
cell.commit(lease, { owner: target.owner, authority: plain }, {});
// @ts-expect-error N02 wrong schema actor
cell.require(wrongSchema);
// @ts-expect-error N03 wrong tool-kind actor
cell.require(wrongKind);
// @ts-expect-error N04 mount kind is invariant
cell.commit(wrongLease, target, {});
// @ts-expect-error N05 target schema is not widened by NoInfer
cell.commit(lease, otherTarget, {});
// @ts-expect-error N06 output fields are actual builder schema fields
ports.fields.only;
// @ts-expect-error N07 snapshots never carry private ports
cell.getSnapshot().ports;
// @ts-expect-error N08 text slot is not a generic mutable app state channel
text.write(actor, 123);
// @ts-expect-error N09 no caller-provided purge/reset registration
cell.registerPurge(() => undefined);
// @ts-expect-error N10 work callbacks are synchronous undefined acknowledgements
cell.timeout(actor, 1, async () => undefined);
// @ts-expect-error N11 mount leases are not structurally forgeable
cell.disconnect({});
// @ts-expect-error N12 actors cannot be relinked through readonly committed data
cell.require(actor).actor = actor;
