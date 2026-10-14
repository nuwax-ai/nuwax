/** Split native tool paths without relying on the browser's host OS. */
export function splitLocalToolFilePath(target: string, workspaceRoot?: string) {
  if (!/^(?:[a-z]:[\\/]|\\\\|\/)/i.test(target)) {
    return { targetDir: workspaceRoot, relativePath: target };
  }
  const index = Math.max(target.lastIndexOf('/'), target.lastIndexOf('\\'));
  // C:\file and C:/file must retain the separator: C: alone is drive-relative.
  const end =
    index === 0 || (index === 2 && /^[a-z]:/i.test(target)) ? index + 1 : index;
  return {
    targetDir: target.slice(0, end),
    relativePath: target.slice(index + 1),
  };
}
