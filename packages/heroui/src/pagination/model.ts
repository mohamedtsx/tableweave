/** At most five numbered targets, independent of the size of a known total. */
export function paginationTargets(
  index: number,
  count: number,
): readonly number[] {
  if (!Number.isSafeInteger(count) || count <= 0) return [];
  const center = Math.min(Math.max(0, index), count - 1);
  const start = Math.min(Math.max(0, center - 2), Math.max(0, count - 5));
  return Array.from(
    { length: Math.min(5, count) },
    (_, offset) => start + offset,
  );
}
