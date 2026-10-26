/** 系统操作错误不直接展示 IPC/上下文内部代码。 */
export function localFileActionErrorKey(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? error.code
      : undefined;
  return ['expired', 'unavailable', 'not-local'].includes(String(code))
    ? 'PC.Components.FilePreview.localSourceChanged'
    : 'PC.Components.FilePreview.localActionFailed';
}
