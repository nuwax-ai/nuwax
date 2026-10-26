/** 系统操作错误不直接展示 IPC/上下文内部代码。 */
export function localFileActionErrorKey(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? error.code
      : undefined;
  if (code === 'not-found') return 'PC.Components.FilePreview.localFileMissing';
  return ['expired', 'unavailable', 'not-local'].includes(String(code))
    ? 'PC.Components.FilePreview.localSourceChanged'
    : 'PC.Components.FilePreview.localActionFailed';
}

/** 缺文件给出可恢复的提示，其他读取错误保留原有具体原因。 */
export function localFileReadErrorMessage(
  error: unknown,
  translate: (key: string) => string,
): string {
  return localFileActionErrorKey(error) ===
    'PC.Components.FilePreview.localFileMissing'
    ? translate('PC.Components.FilePreview.localFileMissing')
    : error instanceof Error
    ? error.message
    : String(error);
}
