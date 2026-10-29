/** 只在展示层识别授权过期，不改变底层校验或文件来源。 */
export function isExpiredLocalFileError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'expired'
  );
}

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

/** 文件缺失和来源失效使用可恢复的提示，其余错误保留具体原因。 */
export function localFileReadErrorMessage(
  error: unknown,
  translate: (key: string) => string,
): string {
  if (isExpiredLocalFileError(error)) {
    return translate('PC.Components.FilePreview.localSourceChanged');
  }
  return localFileActionErrorKey(error) ===
    'PC.Components.FilePreview.localFileMissing'
    ? translate('PC.Components.FilePreview.localFileMissing')
    : error instanceof Error
    ? error.message
    : String(error);
}
