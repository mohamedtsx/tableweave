// Standalone negative feasibility evidence, not a library error suppressor.
// The synthetic application owns creation/poisoning; no observer repairs it.
const nativeThen = Promise.prototype.then;
const facts = {
  constructorReads: 0,
  handlerRuns: 0,
  attachmentError: null as string | null,
  constructorLocked: false,
  descriptorUnchanged: false,
};
const rejected = Promise.reject(
  new Error("SYNTHETIC FEASIBILITY ORIGINAL REJECTION"),
);
const getter = () => {
  facts.constructorReads++;
  throw new Error("SYNTHETIC FEASIBILITY CONSTRUCTOR");
};
Object.defineProperty(rejected, "constructor", {
  get: getter,
  configurable: false,
});
const before = Object.getOwnPropertyDescriptor(rejected, "constructor");
try {
  // This deliberate direct intrinsic experiment demonstrates SpeciesConstructor
  // runs BEFORE PerformPromiseThen, so its observer is never attached.
  if (new URLSearchParams(location.search).get("strategy") !== "none")
    Reflect.apply(nativeThen, rejected, [
      () => {
        facts.handlerRuns++;
      },
      () => {
        facts.handlerRuns++;
      },
    ]);
} catch (error) {
  facts.attachmentError =
    error instanceof Error ? error.message : "Unexpected synthetic failure";
}
const after = Object.getOwnPropertyDescriptor(rejected, "constructor");
facts.constructorLocked = before?.configurable === false;
facts.descriptorUnchanged =
  before?.get === after?.get && before?.configurable === after?.configurable;
declare global {
  interface Window {
    promiseFeasibility: typeof facts;
  }
}
window.promiseFeasibility = facts;

export {};
