export function validContext(locale: string, timeZone: string): boolean {
  if (
    typeof locale !== "string" ||
    typeof timeZone !== "string" ||
    !locale ||
    !timeZone
  )
    return false;
  try {
    return (
      Intl.getCanonicalLocales(locale).length === 1 &&
      Boolean(
        new Intl.DateTimeFormat(locale, { timeZone }).resolvedOptions()
          .timeZone,
      )
    );
  } catch {
    return false;
  }
}
