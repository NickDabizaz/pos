export function matchesSearch(fields: Array<string | undefined>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") return true;

  return fields.some((field) => field?.toLowerCase().includes(normalizedQuery));
}
