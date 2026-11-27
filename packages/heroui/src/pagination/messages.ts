import type { PaginationMessages, PaginationNumberFormatter } from "./types.js";

export const paginationMessages: PaginationMessages = Object.freeze({
  navigation: "Pagination",
  rowsPerPage: "Rows per page",
  previous: "Previous page",
  next: "Next page",
  retry: "Retry",
  noPages: "No pages",
  unavailable: "Pagination details are not available yet.",
  unknownRange: "No range is available for the displayed page.",
  updating: "Updating results.",
  retained: "Showing previous results for the displayed page.",
  stale: "The displayed results may be out of date.",
  navigationUnavailable:
    "Navigation is unavailable until current results are ready.",
  firstPage: "There is no previous page.",
  lastPage: "There is no next page.",
  page: (page: string) => `Page ${page}`,
  knownPage: (page: string, count: string) => `Page ${page} of ${count}`,
  outOfRange: (page: string, count: string) =>
    `Displayed page ${page} is outside the current ${count} pages.`,
  knownRange: (from: string, to: string, total: string) =>
    `${from}–${to} of ${total} records`,
  unknownTotalRange: (from: string, to: string) => `${from}–${to} records`,
  unknownRangeKnownTotal: (total: string) =>
    `No range is available for the displayed page. ${total} records in total.`,
});

export const formatPaginationNumber: PaginationNumberFormatter = (
  value,
  locale,
) => new Intl.NumberFormat(locale).format(value);
