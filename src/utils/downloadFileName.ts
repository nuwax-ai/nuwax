/** 从 Content-Disposition 解析下载文件名，优先使用 UTF-8 filename*。 */
export const getDownloadFileName = (
  contentDisposition: string | undefined,
  fallback: string,
): string => {
  // 按完整参数匹配，保留引号内的分号和转义引号。
  const parameters =
    /(?:^|;)\s*([^=;\s]+)\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;]*))/g;
  let fileName = '';
  let match: RegExpExecArray | null;

  while ((match = parameters.exec(contentDisposition || '')) !== null) {
    const name = match[1].toLowerCase();
    const value =
      match[2] !== undefined
        ? match[2].replace(/\\(.)/g, '$1')
        : match[3].trim();

    if (name === 'filename*') {
      const encoded = /^utf-8'[^']*'(.*)$/i.exec(value);
      if (encoded) {
        try {
          const decoded = decodeURIComponent(encoded[1]);
          if (decoded) return decoded;
        } catch {
          // 无效的扩展参数回退到普通 filename 或默认文件名。
        }
      }
    } else if (name === 'filename' && value) {
      try {
        // 兼容已有后端对普通 filename 进行 URL 编码的行为。
        fileName = decodeURIComponent(value);
      } catch {
        fileName = value;
      }
    }
  }

  return fileName || fallback;
};
