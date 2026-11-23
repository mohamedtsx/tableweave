import type { ContractIssue, IssueCode } from "./types.js";

export class ContractError extends Error {
  readonly issues: readonly ContractIssue[];
  constructor(issues: readonly ContractIssue[]) {
    super("Invalid Tableweave contract.");
    this.name = "ContractError";
    this.issues = Object.freeze(
      issues.map((issue) => Object.freeze({ ...issue })),
    );
  }
}
export function fail(code: IssueCode, field?: string, ruleId?: string): never {
  throw new ContractError([
    {
      code,
      ...(field === undefined ? {} : { field }),
      ...(ruleId === undefined ? {} : { ruleId }),
    },
  ]);
}
