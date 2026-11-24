import type {
  ControlsAuthority,
  ControlsPresentation,
  NativeDefinition,
  NativeTableView,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";

/** An observation of a command, not a claim that a controlled proposal was accepted. */
export type ControlMutationNotice =
  | "submitted"
  | "committed"
  | "noop"
  | "rejected"
  | "unavailable";

export interface ColumnControlsTarget<S extends QuerySchema, T extends object> {
  readonly definition: NativeDefinition<S, T>;
  /** Current subscribed render view, not a separately maintained state copy. */
  readonly view: NativeTableView<S, T>;
  readonly authority: ControlsAuthority<S, T>;
  /** Current projectControls render facts. Never read an event authority during render. */
  readonly presentation: ControlsPresentation<S, T>;
}

export interface ColumnControlOptions {
  /** Labels for public data-leaf IDs. Complex headers otherwise fall back to the ID. */
  readonly labels?: Readonly<Record<string, string>>;
  readonly isDisabled?: boolean;
  readonly disabledReason?: string;
  readonly id?: string;
  readonly className?: string;
  /** Observer failures cannot change the submitted command or escape an event. */
  readonly onResult?: (notice: ControlMutationNotice) => void;
}

/** Complete dictionary replacement: partial translations never mix with English. */
export interface ColumnChooserMessages {
  readonly trigger: string;
  readonly title: string;
  readonly required: string;
  readonly finalVisible: string;
  readonly unavailable: string;
  readonly disabled: string;
}

export interface ColumnChooserProps<S extends QuerySchema, T extends object>
  extends ColumnControlsTarget<S, T>,
    ColumnControlOptions {
  readonly messages?: ColumnChooserMessages;
}
