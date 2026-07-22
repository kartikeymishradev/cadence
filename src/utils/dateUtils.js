/**
 * Returns the Monday (start) of the week containing the given date.
 */
export function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for the given date.
 */
export function dateKey(d) {
  return d.toISOString().slice(0, 10);
}
