import type {
  CriteriaFrames,
  CriteriaSourceAuthority,
  CriteriaSourceInput,
  CriteriaSourceMetadata,
} from "../../packages/react/src/presentation/criteria-frame.js";
import { requireCriteriaSource } from "../../packages/react/src/presentation/criteria-frame.js";
import {
  type CriteriaFrameReactResult,
  useCriteriaFrame,
} from "../../packages/react/src/presentation/criteria-frame-react.js";
import type { Item, Schema } from "./fixtures.js";

export function positive(
  frames: CriteriaFrames<Schema, Item>,
  input: CriteriaSourceInput<Schema, Item>,
) {
  const authority: CriteriaSourceAuthority<Schema> = frames.commitSource(input);
  const metadata: CriteriaSourceMetadata<Schema> = requireCriteriaSource(
    authority,
    frames,
  );
  return metadata;
}
export function usePositive(
  frames: CriteriaFrames<Schema, Item>,
  input: CriteriaSourceInput<Schema, Item>,
): CriteriaFrameReactResult<Schema, Item> {
  return useCriteriaFrame(frames, input);
}
