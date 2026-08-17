/**
 * Case-insensitive substring match against a list of fields. An empty query matches everything.
 */
export function matchesSearch(fields: Array<string | undefined>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") return true;

  return fields.some((field) => field?.toLowerCase().includes(normalizedQuery));
}
