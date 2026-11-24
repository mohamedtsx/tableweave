import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";
import { reduceTableState } from "../../../packages/react/src/controller/reducer.js";
import { ControllerError } from "../../../packages/react/src/controller/validation.js";
import { actions, commandFor, fixture, NOW } from "./fixtures.js";
import { own } from "./guard.mjs";

const observations: unknown[] = [];
for (const lane of ["dispatch", "controlled", "reducer"] as const)
  for (const action of actions)
    test(`false policy denies ${lane}/${action} before callbacks`, () => {
      const f = fixture(false, lane === "controlled"),
        before = f.store.getSnapshot();
      const command = commandFor(f, action);
      let outcome: unknown, code: unknown;
      try {
        outcome =
          lane === "reducer"
            ? reduceTableState(f.store.getDefinition(), before, command, {
                now: NOW,
              })
            : f.store.dispatch(command);
      } catch (error) {
        outcome =
          error instanceof ControllerError ? "ControllerError" : "unexpected";
        code = error instanceof ControllerError ? error.code : undefined;
      }
      observations.push({
        lane,
        action,
        outcome,
        code,
        counts: { ...f.counts },
        snapshotSame: f.store.getSnapshot() === before,
        expected: "state.capability; zero callbacks",
        actualPassed:
          code === "state.capability" &&
          Object.values(f.counts).every((count) => count === 0),
      });
      expect(code).toBe("state.capability");
      expect(f.counts).toEqual({
        clock: 0,
        command: 0,
        state: 0,
        request: 0,
        commit: 0,
        query: 0,
        subscriber: 0,
        updater: 0,
      });
      expect(f.store.getSnapshot()).toBe(before);
    });
afterAll(() => {
  writeFileSync(
    join(own, ".artifacts", process.env.U1_RUN ?? "units", "denials.json"),
    JSON.stringify(observations, null, 2),
  );
});
