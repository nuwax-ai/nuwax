const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;
// Windows 设备名带扩展名仍保留，例如 CON.txt.zip 也不能直接使用。
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
// 60个码点最多240个UTF-8字节，为扩展名和设备名前缀保留空间。
const FILE_BASE_NAME_MAX_LEN = 60;

/** 资源展示名转为下载基础名；不可用的名字交给调用方回退。 */
export const sanitizeDownloadBaseName = (
  raw: string,
  maxLen = FILE_BASE_NAME_MAX_LEN,
): string => {
  const stripEdges = (value: string) => value.replace(/^[-.\s]+|[-.\s]+$/g, '');
  const replaced = stripEdges(
    (raw || '').replace(UNSAFE_FILENAME_CHARS, ' ').replace(/\s+/g, '-'),
  );
  const truncated = stripEdges(Array.from(replaced).slice(0, maxLen).join(''));
  if (!truncated) return '';
  return WINDOWS_RESERVED_NAMES.test(truncated) ? `_${truncated}` : truncated;
};

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
