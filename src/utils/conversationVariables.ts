export function hasRequiredConversationVariables(
  names: string[],
  values?: Record<string, unknown> | null,
): boolean {
  return names.every((name) => {
    const value = values?.[name];
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  });
}
