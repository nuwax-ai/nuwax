/**
 * MCP Ask resume 展示层 — 各文件/图片类型 Mock 数据
 * 使用公开可访问 URL，无需登录即可在 Demo 中验证缩略图渲染。
 */

/** 支持的图片扩展名（与 mcpAskResumeMessage REMOTE_IMAGE_URL_RE 一致） */
export const SUPPORTED_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
  'avif',
] as const;

/** 不支持内联缩略图渲染的常见非图片扩展名 */
export const UNSUPPORTED_FILE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'zip',
  'txt',
] as const;

/** 公开示例资源（pathname 带扩展名，便于 isRemoteImageUrl 识别） */
export const PUBLIC_SAMPLE_URLS = {
  png: 'https://www.w3.org/Graphics/PNG/nurbcup2si.png',
  jpg: 'https://upload.wikimedia.org/wikipedia/commons/b/be/JPEG_example_flower.jpg',
  jpeg: 'https://upload.wikimedia.org/wikipedia/commons/b/be/JPEG_example_flower.jpg',
  gif: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif',
  webp: 'https://www.gstatic.com/webp/gallery/1.webp',
  bmp: 'https://filesamples.com/samples/image/bmp/sample_640×426.bmp',
  svg: 'https://upload.wikimedia.org/wikipedia/commons/0/02/SVG_logo.svg',
  avif: 'https://www.gstatic.com/webp/gallery3/1.avif',
  pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  docx: 'https://filesamples.com/samples/document/docx/sample1.docx',
  zip: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-zip-file.zip',
  txt: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/plaintext/plaintext.txt',
} as const;

export type ResumeDisplayCaseKind = 'image' | 'document';

export interface ResumeDisplayCase {
  id: string;
  /** 表单字段标题，会出现在 resume 行首 */
  fieldLabel: string;
  extension: string;
  url: string;
  /** 期望展示层行为 */
  expectedKind: ResumeDisplayCaseKind;
  note?: string;
}

function buildResumeFieldLine(label: string, value: string): string {
  return `${label}：${value}`;
}

function buildResumeMessage(title: string, fieldLines: string[]): string {
  const body = [`我已填写「${title}」，表单内容如下：`, ...fieldLines];
  return body.join('\n');
}

/** 单类型用例：每种扩展名一条 resume 消息 */
export function buildSingleTypeCases(): ResumeDisplayCase[] {
  const imageCases: ResumeDisplayCase[] = SUPPORTED_IMAGE_EXTENSIONS.map(
    (ext) => ({
      id: `image-${ext}`,
      fieldLabel: `${ext.toUpperCase()} 图片`,
      extension: ext,
      url: PUBLIC_SAMPLE_URLS[ext as keyof typeof PUBLIC_SAMPLE_URLS],
      expectedKind: 'image' as const,
      note: ext === 'jpeg' ? '与 jpg 共用示例 URL' : undefined,
    }),
  );

  const fileCases: ResumeDisplayCase[] = UNSUPPORTED_FILE_EXTENSIONS.map(
    (ext) => {
      const urlKey = ext as keyof typeof PUBLIC_SAMPLE_URLS;
      return {
        id: `file-${ext}`,
        fieldLabel: `${ext.toUpperCase()} 文件`,
        extension: ext,
        url:
          PUBLIC_SAMPLE_URLS[urlKey] ??
          `https://example.com/sample/demo-file.${ext}`,
        expectedKind: 'document' as const,
        note: '附件卡片展示，点击打开/下载',
      };
    },
  );

  return [...imageCases, ...fileCases];
}

/** 无后缀 URL 用例：走兜底未知附件卡片 */
export function buildExtensionlessCases(): ResumeDisplayCase[] {
  return [
    {
      id: 'extensionless-s3',
      fieldLabel: '无后缀 S3 文件',
      extension: '(none)',
      url: 'https://testagent.xspaceagi.com/api/f/s3/default/20260703/abc123',
      expectedKind: 'document',
      note: 'pathname 无扩展名，兜底为未知附件卡片（FileOutlined）',
    },
  ];
}

/** 综合用例：单条 resume 含多图、混排与非图片 */
export const COMBINED_RESUME_MESSAGE = buildResumeMessage('文件类型综合', [
  buildResumeFieldLine('PNG 图片', PUBLIC_SAMPLE_URLS.png),
  buildResumeFieldLine('JPEG 图片', PUBLIC_SAMPLE_URLS.jpg),
  buildResumeFieldLine('GIF 图片', PUBLIC_SAMPLE_URLS.gif),
  buildResumeFieldLine('WebP 图片', PUBLIC_SAMPLE_URLS.webp),
  buildResumeFieldLine(
    '多图附件',
    `${PUBLIC_SAMPLE_URLS.png}、${PUBLIC_SAMPLE_URLS.webp}`,
  ),
  buildResumeFieldLine('PDF 文档', PUBLIC_SAMPLE_URLS.pdf),
  buildResumeFieldLine('补充说明', '非 URL 的普通文本字段'),
]);

/** 为每个单类型用例生成独立 resume 文本 */
export function buildResumeMessageForCase(caseItem: ResumeDisplayCase): string {
  return buildResumeMessage(`${caseItem.extension.toUpperCase()} 类型`, [
    buildResumeFieldLine(caseItem.fieldLabel, caseItem.url),
  ]);
}

export const SINGLE_TYPE_CASES = buildSingleTypeCases();
export const EXTENSIONLESS_CASES = buildExtensionlessCases();
