export function plForm(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) return few;
  return many;
}

export function formatDatePl(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", options);
}
