import * as entry from "@tableweave/react/criteria";
import { expect, test } from "vitest";
import * as authority from "../../packages/react/src/controller/criteria.js";
import * as publication from "../../packages/react/src/controller/criteria-publication.js";

test("bare source alias exposes exactly the seven actual producer values by identity", () => {
  expect(Object.keys(entry).sort()).toEqual(
    [
      "CriteriaAuthorityError",
      "CriteriaPublicationError",
      "createCriteriaAuthority",
      "createCriteriaPublication",
      "getCriteriaAuthorityOrigin",
      "getCriteriaPublicationBinding",
      "requireCriteriaAuthority",
    ].sort(),
  );
  expect(entry.createCriteriaAuthority).toBe(authority.createCriteriaAuthority);
  expect(entry.CriteriaAuthorityError).toBe(authority.CriteriaAuthorityError);
  expect(entry.getCriteriaAuthorityOrigin).toBe(
    authority.getCriteriaAuthorityOrigin,
  );
  expect(entry.requireCriteriaAuthority).toBe(
    authority.requireCriteriaAuthority,
  );
  expect(entry.createCriteriaPublication).toBe(
    publication.createCriteriaPublication,
  );
  expect(entry.CriteriaPublicationError).toBe(
    publication.CriteriaPublicationError,
  );
  expect(entry.getCriteriaPublicationBinding).toBe(
    publication.getCriteriaPublicationBinding,
  );
});
