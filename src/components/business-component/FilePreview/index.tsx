import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import {
  CloudDownloadOutlined,
  CodeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileWordOutlined,
  Html5Outlined,
  LeftOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Alert, Button, Spin, Tooltip } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

// @ts-ignore
import jsPreviewDocx from '@js-preview/docx';
import '@js-preview/docx/lib/index.css';
// @ts-ignore
import jsPreviewExcel from '@js-preview/excel';
import '@js-preview/excel/lib/index.css';
// @ts-ignore
import jsPreviewPdf from '@js-preview/pdf';
// @ts-ignore
import { SANDBOX } from '@/constants/common.constants';
import { init as pptxInit } from 'pptx-preview';

// File type categories
export type DocumentType = 'docx' | 'xlsx' | 'pptx' | 'pdf';
export type ImageType = 'image';
export type AudioType = 'audio';
export type VideoType = 'video';
export type HtmlType = 'html';
export type MarkdownType = 'markdown';
export type TextType = 'text';
export type UnsupportedType = 'unsupported';

export type FileType =
  | DocumentType
  | ImageType
  | AudioType
  | VideoType
  | HtmlType
  | MarkdownType
  | TextType
  | UnsupportedType;

export interface FilePreviewProps {
  /** File source: URL string, ArrayBuffer, Blob, or File object */
  src?: string | ArrayBuffer | Blob | File;
  /** For multiple images: array of image sources */
  srcList?: Array<string | File>;
  /** File type (auto-detected if not provided) */
  fileType?: FileType;
  /** Show refresh button @default false */
  showRefresh?: boolean;
  /** Container height @default '100%' */
  height?: number | string;
  /** Container width @default '100%' */
  width?: number | string;
  /** Show download button @default false */
  showDownload?: boolean;
  /** Custom download filename */
  downloadFileName?: string;
  /** Callback when preview is rendered */
  onRendered?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

type PreviewStatus = 'idle' | 'loading' | 'success' | 'error' | 'unsupported';

// Extension to file type mapping
const EXTENSION_MAP: Record<string, FileType> = {
  // Documents
  docx: 'docx',
  doc: 'docx',
  xlsx: 'xlsx',
  xls: 'xlsx',
  pptx: 'pptx',
  ppt: 'pptx',
  pdf: 'pdf',
  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  ico: 'image',
  // Audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  aac: 'audio',
  flac: 'audio',
  // Video
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  // HTML
  html: 'html',
  htm: 'html',
  // Markdown
  md: 'markdown',
  markdown: 'markdown',
  // Text/Code
  txt: 'text',
  json: 'text',
  xml: 'text',
  js: 'text',
  jsx: 'text',
  ts: 'text',
  tsx: 'text',
  css: 'text',
  less: 'text',
  scss: 'text',
  sass: 'text',
  yaml: 'text',
  yml: 'text',
  ini: 'text',
  conf: 'text',
  sh: 'text',
  bash: 'text',
  py: 'text',
  java: 'text',
  c: 'text',
  cpp: 'text',
  h: 'text',
  go: 'text',
  rs: 'text',
  rb: 'text',
  php: 'text',
  sql: 'text',
  log: 'text',
  csv: 'text',
};

// Content-Type to FileType mapping
const CONTENT_TYPE_MAP: Record<string, FileType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'image/bmp': 'image',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/mp4': 'audio',
  'audio/aac': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'text/html': 'html',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'text/plain': 'text',
  'text/markdown': 'markdown',
  'application/json': 'text',
  'application/xml': 'text',
};

const getFileTypeFromName = (name: string): FileType => {
  const cleanName = name.split('?')[0].split('#')[0];
  const ext = cleanName.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_MAP[ext] || 'unsupported';
};

const getExtension = (name: string): string => {
  const cleanName = name.split('?')[0].split('#')[0];
  return cleanName.split('.').pop()?.toLowerCase() || '';
};

const getFileTypeFromContentType = (contentType: string): FileType => {
  const baseType = contentType.split(';')[0].trim().toLowerCase();
  return CONTENT_TYPE_MAP[baseType] || 'unsupported';
};

const getFileIcon = (type: FileType, size = 48) => {
  const iconStyle = { fontSize: size, marginBottom: 16 };
  switch (type) {
    case 'docx':
      return <FileWordOutlined style={{ ...iconStyle, color: '#2b579a' }} />;
    case 'xlsx':
      return <FileExcelOutlined style={{ ...iconStyle, color: '#217346' }} />;
    case 'pptx':
      return <FilePptOutlined style={{ ...iconStyle, color: '#d24726' }} />;
    case 'pdf':
      return <FilePdfOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
    case 'image':
      return <FileImageOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
    case 'audio':
      return <SoundOutlined style={{ ...iconStyle, color: '#722ed1' }} />;
    case 'video':
      return <PlayCircleOutlined style={{ ...iconStyle, color: '#eb2f96' }} />;
    case 'html':
      return <Html5Outlined style={{ ...iconStyle, color: '#e34c26' }} />;
    case 'markdown':
      return <FileTextOutlined style={{ ...iconStyle, color: '#083fa1' }} />;
    case 'text':
      return <CodeOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
    default:
      return <FileOutlined style={{ ...iconStyle, color: '#bfbfbf' }} />;
  }
};

const getSourceUrl = (src: string | ArrayBuffer | Blob | File): string => {
  if (typeof src === 'string') return src;
  if (src instanceof File || src instanceof Blob)
    return URL.createObjectURL(src);
  return URL.createObjectURL(new Blob([src]));
};

/**
 * 将技术性错误信息转换为用户友好的中文提示
 * @param error 原始错误信息
 * @param fileType 文件类型
 * @returns 用户友好的中文错误信息
 */
const getLocalizedErrorMessage = (
  error: string | undefined,
  fileType?: string,
): string => {
  const errorStr = error?.toLowerCase() || '';

  // PPTX 相关错误
  if (
    errorStr.includes('central directory') ||
    errorStr.includes('zip file') ||
    errorStr.includes('jszip')
  ) {
    return '文件格式无效或已损坏，请确认是否为有效的 PPTX 文件';
  }

  // 网络相关错误
  if (
    errorStr.includes('network') ||
    errorStr.includes('fetch') ||
    errorStr.includes('failed to fetch')
  ) {
    return '网络请求失败，请检查网络连接后重试';
  }

  // 文件加载错误
  if (errorStr.includes('load') || errorStr.includes('loading')) {
    return '文件加载失败，请重试';
  }

  // 解析错误
  if (errorStr.includes('parse') || errorStr.includes('parsing')) {
    return '文件解析失败，文件可能已损坏或格式不支持';
  }

  // 根据文件类型返回默认错误
  switch (fileType) {
    case 'docx':
      return '文档预览失败，请确认文件格式正确';
    case 'xlsx':
      return '表格预览失败，请确认文件格式正确';
    case 'pdf':
      return 'PDF 预览失败，请确认文件格式正确';
    case 'pptx':
      return '演示文稿预览失败，请确认文件格式正确';
    case 'image':
      return '图片加载失败';
    default:
      return '文件预览失败，请重试';
  }
};

const FilePreview: React.FC<FilePreviewProps> = ({
  src,
  srcList,
  fileType,
  height = '100%',
  width = '100%',
  showDownload = false,
  showRefresh = false,
  downloadFileName,
  onRendered,
  onError,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<any>(null);
  const pptxRafIdRef = useRef<number | null>(null); // PPTX zoom 计算的 RAF ID
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectedType, setDetectedType] = useState<FileType | undefined>();
  const [textContent, setTextContent] = useState<string>('');
  const [htmlUrl, setHtmlUrl] = useState<string | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(false);
  const [isMarkdownLoading, setIsMarkdownLoading] = useState<boolean>(false);
  const prevSrcRef = useRef<string | null>(null);
  const prevTypeRef = useRef<FileType | undefined>(undefined);
  // 用于在类型切换时保持旧内容显示
  const [prevHtmlUrl, setPrevHtmlUrl] = useState<string | null>(null);
  const [prevTextContent, setPrevTextContent] = useState<string>('');
  const [isTypeSwitching, setIsTypeSwitching] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  // 用于在类型切换期间保持稳定的 HTML URL，避免 iframe 重新加载
  // 使用 state 而不是 ref，确保更新时触发重新渲染
  const [stableHtmlUrl, setStableHtmlUrl] = useState<string | null>(null);

  const resolvedType = fileType || detectedType;

  // HTML 和 Markdown 统一容器 - 始终渲染，避免 DOM 结构变化导致布局重排
  // 关键：始终渲染 HTML 和 Markdown 容器，通过 CSS 控制显示，而不是条件渲染
  const htmlMarkdownContent = useMemo(() => {
    if (resolvedType !== 'html' && resolvedType !== 'markdown') {
      return null;
    }

    // 检测类型切换：通过比较当前类型和之前记录的类型
    // 使用 fileType prop（同步）和 prevTypeRef（在 useEffect 中更新）来判断
    const detectedTypeSwitch =
      prevTypeRef.current !== undefined &&
      prevTypeRef.current !== resolvedType &&
      ((prevTypeRef.current === 'html' && resolvedType === 'markdown') ||
        (prevTypeRef.current === 'markdown' && resolvedType === 'html'));

    // 如果检测到类型切换，使用检测到的状态；否则使用 isTypeSwitching 状态
    // 这样可以避免状态更新的时序问题
    const actualTypeSwitching = detectedTypeSwitch || isTypeSwitching;

    // 计算显示状态
    const isHtmlVisible =
      resolvedType === 'html' && !isIframeLoading && htmlUrl;
    const isMarkdownVisible =
      resolvedType === 'markdown' && !isMarkdownLoading && textContent;

    // 简化逻辑：如果正在从 HTML 切换到 Markdown，使用 htmlUrl 或 prevHtmlUrl 作为旧内容
    // 关键：优先使用 prevHtmlUrl，如果还没设置，则使用 htmlUrl（因为状态更新可能有延迟）
    // const prevHtmlUrlToShow =
    //   actualTypeSwitching && resolvedType === 'markdown'
    //     ? (prevHtmlUrl || htmlUrl || null)
    //     : null;
    const prevTextContentToShow =
      actualTypeSwitching && resolvedType === 'html'
        ? prevTextContent || textContent || ''
        : '';

    // 如果是从 HTML 切换到 Markdown，显示旧的 HTML 内容
    // 关键修复：在类型切换期间，只要检测到类型切换且 htmlUrl 或 prevHtmlUrl 存在，就应该显示旧 HTML
    // 直到 Markdown 内容完全加载、渲染并可见
    // 使用更严格的条件：只有当 Markdown 完全准备好（内容已加载、已渲染、已可见）时，才隐藏旧 HTML
    const showPrevHtml =
      actualTypeSwitching &&
      resolvedType === 'markdown' &&
      (prevHtmlUrl || htmlUrl || stableHtmlUrl) && // htmlUrl 或 prevHtmlUrl 或 stableHtmlUrl 存在
      (!isMarkdownVisible || isMarkdownLoading || !textContent); // Markdown 还没完全可见、还在加载、或没有内容时，继续显示旧 HTML

    // 如果是从 Markdown 切换到 HTML，显示旧的 Markdown 内容
    const showPrevMarkdown =
      actualTypeSwitching &&
      resolvedType === 'html' &&
      prevTextContentToShow && // prevTextContent 或 textContent 存在
      !isHtmlVisible; // 只要 HTML 还没完全显示，就显示旧 Markdown

    return (
      <div
        className={`${styles.htmlPreview} ${styles.markdownPreview}`}
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          // 确保容器尺寸固定，避免切换时影响父布局
          minHeight: 0,
          maxHeight: '100%',
          overflow: 'hidden',
          // 使用 CSS containment 限制布局影响范围，防止影响父布局导致整页重排
          contain: 'layout style paint',
          // 确保容器不会因为内容变化而导致高度变化
          boxSizing: 'border-box',
          // 使用 transform 来优化渲染性能（GPU 加速），避免布局重排
          transform: 'translateZ(0)',
          // 防止容器尺寸变化导致父布局重排
          flexShrink: 0,
        }}
      >
        {/* HTML 容器 - 始终渲染，通过 CSS 控制显示，避免 DOM 结构变化导致闪动 */}
        {/* 关键修复：在类型切换期间，保持 HTML iframe 始终挂载，确保旧内容始终可见 */}
        {/* 方案：容器始终渲染，通过 opacity 和 visibility 控制显示，不卸载 iframe */}
        {/* 条件：有 htmlUrl 或 prevHtmlUrl 或 stableHtmlUrl 时渲染 */}
        {(htmlUrl || prevHtmlUrl || stableHtmlUrl) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              // 显示逻辑：
              // 1. 正常显示 HTML 时：显示
              // 2. 类型切换期间（从 HTML 切换到 Markdown）且有稳定的 URL：显示
              opacity:
                (resolvedType === 'html' && isHtmlVisible) ||
                (actualTypeSwitching &&
                  resolvedType === 'markdown' &&
                  (stableHtmlUrl || prevHtmlUrl || htmlUrl) &&
                  showPrevHtml)
                  ? 1
                  : 0,
              transition: 'opacity 0.3s ease-in-out', // 稍微延长过渡时间，使过渡更平滑
              willChange: 'opacity',
              zIndex:
                actualTypeSwitching &&
                resolvedType === 'markdown' &&
                showPrevHtml
                  ? isMarkdownVisible
                    ? 1
                    : 2
                  : resolvedType === 'html'
                  ? 2
                  : 0,
              pointerEvents:
                (resolvedType === 'html' && isHtmlVisible) ||
                (actualTypeSwitching &&
                  resolvedType === 'markdown' &&
                  showPrevHtml)
                  ? 'auto'
                  : 'none',
              visibility:
                (resolvedType === 'html' && (isHtmlVisible || htmlUrl)) ||
                (actualTypeSwitching &&
                  resolvedType === 'markdown' &&
                  (stableHtmlUrl || prevHtmlUrl || htmlUrl) &&
                  showPrevHtml)
                  ? 'visible'
                  : 'hidden',
              minHeight: 0,
              maxHeight: '100%',
              contain: 'layout style paint',
              // 防止容器尺寸变化导致父布局重排
              flexShrink: 0,
            }}
          >
            {/* 关键修复：使用稳定的 key 和 src，确保 iframe 在类型切换期间不会被重新加载 */}
            {/* 方案：在类型切换期间，使用 stableHtmlUrl 作为 src，确保完全不变 */}
            {/* 正常显示时，使用 htmlUrl；类型切换期间，使用 stableHtmlUrl（如果已设置）或 htmlUrl */}
            <iframe
              key="html-iframe-stable"
              src={
                // 关键：在类型切换期间，优先使用 stableHtmlUrl（如果已设置），确保 src 完全不变
                // 如果 stableHtmlUrl 还没设置，使用 htmlUrl（此时应该还是旧的 HTML URL）
                actualTypeSwitching &&
                resolvedType === 'markdown' &&
                stableHtmlUrl
                  ? stableHtmlUrl
                  : actualTypeSwitching && resolvedType === 'markdown'
                  ? prevHtmlUrl || htmlUrl || ''
                  : htmlUrl || ''
              }
              sandbox={SANDBOX}
              className={styles.htmlFrame}
              title="HTML Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                minHeight: 0,
                maxHeight: '100%',
              }}
              onLoad={() => {
                requestAnimationFrame(() => {
                  setIsIframeLoading(false);
                  if (isTypeSwitching && resolvedType === 'html') {
                    requestAnimationFrame(() => {
                      setTimeout(() => {
                        setIsTypeSwitching(false);
                        setPrevTextContent('');
                      }, 300); // 稍微延长等待时间，确保过渡完成
                    });
                  }
                });
              }}
              onError={() => {
                setIsIframeLoading(false);
                if (isTypeSwitching && resolvedType === 'html') {
                  setIsTypeSwitching(false);
                  setPrevTextContent('');
                }
              }}
            />
          </div>
        )}

        {/* Markdown 容器 - 始终渲染，通过 CSS 控制显示 */}
        {/* 关键：确保容器尺寸与 HTML iframe 完全一致，避免高度变化导致抖动 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // 关键修复：在类型切换期间，只有当旧 HTML 不再显示时，才显示 Markdown
            // 这样可以避免两个内容同时显示，导致布局变化
            opacity:
              isMarkdownVisible && (!actualTypeSwitching || !showPrevHtml)
                ? 1
                : 0,
            // 使用不会导致重排的过渡属性，避免抖动
            transition: 'opacity 0.3s ease-in-out', // 延长过渡时间，使过渡更平滑
            zIndex:
              isMarkdownVisible && (!actualTypeSwitching || !showPrevHtml)
                ? 2
                : showPrevHtml
                ? 1
                : 0,
            pointerEvents:
              isMarkdownVisible && (!actualTypeSwitching || !showPrevHtml)
                ? 'auto'
                : 'none',
            // 确保过渡不会导致布局重排
            willChange:
              isMarkdownVisible && (!actualTypeSwitching || !showPrevHtml)
                ? 'opacity'
                : 'auto',
            visibility:
              // 关键修复：只有当 resolvedType 是 'markdown' 时才可能显示
              // 如果 resolvedType 是 'html'，无论其他条件如何，都应该隐藏
              resolvedType === 'markdown' &&
              ((isMarkdownVisible && (!actualTypeSwitching || !showPrevHtml)) ||
                (textContent && !actualTypeSwitching))
                ? 'visible'
                : 'hidden',
            overflow: 'auto',
            padding: '24px',
            boxSizing: 'border-box',
            // 确保容器尺寸固定，不会因为内容变化而改变
            minHeight: 0,
            maxHeight: '100%',
            // 使用 contain 限制布局影响
            contain: 'layout style paint',
            // 防止内容渲染导致布局重排
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* 关键修复：在类型切换期间，延迟渲染 Markdown 内容，直到旧 HTML 不再显示，避免布局变化 */}
          {textContent &&
            resolvedType === 'markdown' &&
            (!actualTypeSwitching || !showPrevHtml) && (
              <PureMarkdownRenderer id="file-preview-md" disableTyping={true}>
                {textContent}
              </PureMarkdownRenderer>
            )}
        </div>

        {/* 类型切换时显示旧 Markdown 内容 - Markdown 切换到 HTML */}
        {showPrevMarkdown && prevTextContentToShow && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 1,
              transition: 'opacity 0.2s ease-in-out',
              zIndex: 1,
              pointerEvents: 'auto',
              padding: '24px',
              overflow: 'auto',
              background: '#fff',
              boxSizing: 'border-box',
            }}
          >
            <PureMarkdownRenderer id="file-preview-md-old" disableTyping={true}>
              {prevTextContentToShow}
            </PureMarkdownRenderer>
          </div>
        )}
      </div>
    );
  }, [
    resolvedType,
    fileType, // 添加 fileType 作为依赖，确保类型变化时重新计算
    htmlUrl,
    textContent,
    isTypeSwitching,
    prevHtmlUrl,
    prevTextContent,
    isIframeLoading,
    isMarkdownLoading,
    stableHtmlUrl, // 添加 stableHtmlUrl 作为依赖，确保更新时重新计算
  ]);

  const fileName = useMemo(() => {
    if (downloadFileName) return downloadFileName;
    if (typeof src === 'string') {
      const parts = src.split('/');
      return parts[parts.length - 1].split('?')[0] || 'download';
    }
    if (src instanceof File) return src.name;
    return 'download';
  }, [src, downloadFileName]);

  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);

  const imageSources = useMemo(() => {
    if (srcList && srcList.length > 0) {
      return srcList.map((item) => {
        if (typeof item === 'string') return item;
        const url = URL.createObjectURL(item);
        setObjectUrls((prev) => [...prev, url]);
        return url;
      });
    }
    if (src && resolvedType === 'image') return [getSourceUrl(src)];
    return [];
  }, [srcList, src, resolvedType]);

  const handleDownload = useCallback(() => {
    if (!src) return;
    const url = getSourceUrl(src);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof src !== 'string') URL.revokeObjectURL(url);
  }, [src, fileName]);

  const initPreview = async () => {
    if (!containerRef.current || (!src && !srcList?.length)) return;

    // Handle srcList for image gallery
    if (srcList && srcList.length > 0) {
      setDetectedType('image');
      setStatus('success');
      onRendered?.();
      return;
    }

    if (!src) return;

    // Detect file type
    let type: FileType = fileType || 'unsupported';
    if (!fileType) {
      if (typeof src === 'string') {
        type = getFileTypeFromName(src);
        // Try Content-Type for URLs without extension
        if (type === 'unsupported') {
          try {
            const response = await fetch(src, { method: 'HEAD' });
            const contentType = response.headers.get('Content-Type');
            if (contentType) type = getFileTypeFromContentType(contentType);
          } catch (e) {
            console.warn('Failed to detect Content-Type:', e);
          }
        }
      } else if (src instanceof File) {
        type = getFileTypeFromName(src.name);
        if (type === 'unsupported' && src.type)
          type = getFileTypeFromContentType(src.type);
      } else if (src instanceof Blob && src.type) {
        type = getFileTypeFromContentType(src.type);
      }
    }

    setDetectedType(type);

    if (type === 'unsupported') {
      setStatus('unsupported');
      return;
    }

    // Native browser types
    if (['image', 'audio', 'video'].includes(type)) {
      setStatus('success');
      onRendered?.();
      return;
    }

    // Text-based types
    if (['markdown', 'text'].includes(type)) {
      // 检测是否是类型切换（从 HTML 切换到 Markdown）
      const isTypeSwitch =
        prevTypeRef.current !== undefined &&
        prevTypeRef.current !== type &&
        prevTypeRef.current === 'html';

      // 如果是类型切换，保存旧内容并设置切换状态
      if (isTypeSwitch && htmlUrl) {
        // 关键修复：先保存 htmlUrl 到 prevHtmlUrl 和 stableHtmlUrl，确保 iframe src 稳定
        setPrevHtmlUrl(htmlUrl);
        setStableHtmlUrl(htmlUrl); // 保存稳定的 HTML URL，避免 iframe 重新加载
        setIsTypeSwitching(true);
        setIsMarkdownLoading(true);
        // 不清除 htmlUrl，保持为旧的 HTML URL，直到 Markdown 内容完全准备好
      } else {
        // 如果不是类型切换，清除 htmlUrl（如果是 Markdown 文件的话）
        // 但只有当它不是类型切换时才清除，避免在切换过程中清除旧的 HTML URL
        if (type === 'markdown' && !isTypeSwitch) {
          setHtmlUrl(null);
        }
      }

      // 如果内容发生变化，设置加载状态以平滑过渡
      if (type === 'markdown' && typeof src === 'string') {
        // 检查是否是新的 URL（通过比较 src 和之前记录的 src）
        // 如果 src 变化且 textContent 已存在，说明是切换文件，需要显示加载状态
        if (
          prevSrcRef.current !== null &&
          prevSrcRef.current !== src &&
          textContent &&
          textContent.trim() !== '' &&
          !isTypeSwitch
        ) {
          setIsMarkdownLoading(true);
        }
        prevSrcRef.current = src;
      }

      // 如果是类型切换，保持 success 状态，不显示 loading 覆盖层
      // 这样旧内容会继续显示，直到新内容加载完成
      if (!isTypeSwitch) {
        setStatus('loading');
      }

      try {
        let content: string;
        if (typeof src === 'string') {
          const response = await fetch(src);
          content = await response.text();
        } else if (src instanceof File || src instanceof Blob) {
          content = await src.text();
        } else {
          content = new TextDecoder().decode(src);
        }
        setTextContent(content);
        setStatus('success');
        // 使用 requestAnimationFrame 确保 DOM 更新后再显示内容，避免布局重排
        if (isTypeSwitch) {
          // 类型切换时，延迟显示 Markdown 内容，确保旧 HTML 始终可见，避免闪动和抖动
          // 使用多重延迟确保 Markdown 内容完全渲染且高度稳定后再显示
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // 等待 Markdown 内容开始渲染
              setTimeout(() => {
                // 再等待一段时间，确保 Markdown 内容的高度已经稳定
                setTimeout(() => {
                  setIsMarkdownLoading(false);
                  // 再等待过渡动画时间，确保旧内容平滑消失
                  setTimeout(() => {
                    setIsTypeSwitching(false);
                    // 在切换完成后清除旧的 htmlUrl，避免它继续影响渲染
                    setPrevHtmlUrl(null);
                    setHtmlUrl(null);
                    setStableHtmlUrl(null); // 清除稳定的 HTML URL
                  }, 300); // 等待过渡动画完成
                }, 150); // 等待 Markdown 高度稳定
              }, 100); // 等待 Markdown 开始渲染
            });
          });
        } else {
          // 非类型切换，正常显示
          requestAnimationFrame(() => {
            setIsMarkdownLoading(false);
          });
        }
        onRendered?.();
      } catch (error: any) {
        setStatus('error');
        setIsMarkdownLoading(false);
        setIsTypeSwitching(false);
        setPrevHtmlUrl(null);
        setHtmlUrl(null);
        setStableHtmlUrl(null); // 清除稳定的 HTML URL
        setErrorMessage('文件内容加载失败，请重试');
        onError?.(error);
      }

      // 更新类型记录
      prevTypeRef.current = type;
      return;
    }

    // HTML handling
    if (type === 'html') {
      // 检测是否是类型切换（从 Markdown 切换到 HTML）
      const isTypeSwitch =
        prevTypeRef.current !== undefined &&
        prevTypeRef.current !== type &&
        prevTypeRef.current === 'markdown';

      // 如果是类型切换，保存旧内容并设置切换状态
      if (isTypeSwitch && textContent && textContent.trim() !== '') {
        setPrevTextContent(textContent);
        setIsTypeSwitching(true);
        setIsIframeLoading(true);
      }

      if (typeof src === 'string') {
        // 如果 URL 发生变化，设置加载状态以平滑过渡
        // 或者如果是类型切换（从 Markdown 到 HTML），也需要显示加载状态
        if (htmlUrl !== src || isTypeSwitch) {
          setIsIframeLoading(true);
        }
        setHtmlUrl(src);
        setTextContent('');
        // 如果是类型切换，保持 success 状态，不显示 loading 覆盖层
        // 这样旧的 Markdown 内容会继续显示，直到新的 HTML iframe 加载完成
        // 如果不是类型切换，设置 success 状态
        // 使用 requestAnimationFrame 确保状态更新顺序正确，避免布局重排
        if (!isTypeSwitch) {
          requestAnimationFrame(() => {
            setStatus('success');
          });
        }
        onRendered?.();
      } else {
        setStatus('loading');
        setHtmlUrl(null);
        try {
          let content: string;
          if (src instanceof File || src instanceof Blob) {
            content = await src.text();
          } else {
            content = new TextDecoder().decode(src as ArrayBuffer);
          }
          setTextContent(content);
          setStatus('success');
          onRendered?.();
        } catch (error: any) {
          setStatus('error');
          setErrorMessage('HTML 内容加载失败，请重试');
          onError?.(error);
        }
      }
      // 更新类型记录
      prevTypeRef.current = type;
      return;
    }

    // Document types with library preview
    setStatus('loading');
    setErrorMessage('');

    if (previewerRef.current) {
      try {
        previewerRef.current.destroy?.();
      } catch (e) {
        /* ignore */
      }
      previewerRef.current = null;
    }

    containerRef.current.innerHTML = '';

    try {
      let previewer: any;
      let previewSrc: any = src;

      if (src instanceof File) {
        previewSrc = await src.arrayBuffer();
      }

      switch (type) {
        case 'docx':
          previewer = jsPreviewDocx.init(containerRef.current);
          await previewer.preview(previewSrc);
          break;
        case 'xlsx':
          // @js-preview/excel 不支持 height 参数，高度通过 CSS 控制
          previewer = jsPreviewExcel.init(containerRef.current);
          await previewer.preview(previewSrc);
          break;
        case 'pdf':
          previewer = jsPreviewPdf.init(containerRef.current, {
            width: containerRef.current.clientWidth || undefined,
            onError: (e: any) => {
              setStatus('error');
              setErrorMessage(getLocalizedErrorMessage(e?.message, 'pdf'));
              onError?.(e);
            },
            onRendered: () => {
              setStatus('success');
              onRendered?.();
            },
          });
          await previewer.preview(previewSrc);
          break;
        case 'pptx': {
          // 由于初始化时容器 display: none，clientHeight 可能为 0
          // 尝试从父容器获取尺寸，或使用传入的 height/width 属性
          const parentEl = containerRef.current.parentElement;
          const containerWidth =
            containerRef.current.clientWidth ||
            parentEl?.clientWidth ||
            (typeof width === 'number' ? width : 800);
          const containerHeight =
            containerRef.current.clientHeight ||
            parentEl?.clientHeight ||
            (typeof height === 'number' ? height : 600);

          previewer = pptxInit(containerRef.current, {
            width: containerWidth,
            height: containerHeight,
          });
          if (typeof previewSrc === 'string') {
            const response = await fetch(previewSrc);
            previewSrc = await response.arrayBuffer();
          }
          await previewer.preview(previewSrc);

          // 动态计算 zoom 缩放比例，确保幻灯片完全显示在容器内
          // 等待 DOM 更新后计算
          pptxRafIdRef.current = requestAnimationFrame(() => {
            const wrapper = containerRef.current?.querySelector(
              '.pptx-preview-wrapper',
            ) as HTMLElement;
            if (!wrapper) return;

            const slideWrappers = wrapper.querySelectorAll(
              '.pptx-preview-slide-wrapper',
            ) as NodeListOf<HTMLElement>;
            if (slideWrappers.length === 0) return;

            // 获取容器可用宽度（减去 padding）
            const availableWidth = wrapper.clientWidth - 40; // 40px for margin

            slideWrappers.forEach((slideWrapper) => {
              // 获取幻灯片实际渲染宽度
              const slideScrollWidth = slideWrapper.scrollWidth;
              if (slideScrollWidth > availableWidth) {
                // 计算需要的缩放比例
                const zoomRatio = availableWidth / slideScrollWidth;
                slideWrapper.style.zoom = String(zoomRatio);
              }
            });
          });
          break;
        }
      }

      previewerRef.current = previewer;
      if (type !== 'pdf') {
        setStatus('success');
        onRendered?.();
      }
    } catch (error: any) {
      console.error('File preview error:', error);
      setStatus('error');
      // 使用用户友好的中文错误信息
      const friendlyMessage = getLocalizedErrorMessage(error?.message, type);
      setErrorMessage(friendlyMessage);
      onError?.(error);
    }
  };

  useEffect(() => {
    if (src || srcList?.length) {
      // 在调用 initPreview 之前，先检测并处理类型切换（如果有 fileType prop）
      // 这样可以确保在 htmlMarkdownContent 重新计算时，切换状态已经设置好
      // 如果提供了 fileType prop，使用它来检测类型切换；否则在 initPreview 中检测
      if (fileType) {
        const isTypeSwitch =
          prevTypeRef.current !== undefined &&
          prevTypeRef.current !== fileType &&
          ((prevTypeRef.current === 'html' && fileType === 'markdown') ||
            (prevTypeRef.current === 'markdown' && fileType === 'html'));

        // 如果是从 HTML 切换到 Markdown，先保存旧的 htmlUrl
        if (
          isTypeSwitch &&
          prevTypeRef.current === 'html' &&
          fileType === 'markdown' &&
          htmlUrl
        ) {
          // 关键修复：立即同步设置稳定的 HTML URL，避免 iframe 重新加载
          setStableHtmlUrl(htmlUrl);
          setPrevHtmlUrl(htmlUrl);
          setIsTypeSwitching(true);
          setIsMarkdownLoading(true);
        }
        // 如果是从 Markdown 切换到 HTML，先保存旧的 textContent
        else if (
          isTypeSwitch &&
          prevTypeRef.current === 'markdown' &&
          fileType === 'html' &&
          textContent &&
          textContent.trim() !== ''
        ) {
          setPrevTextContent(textContent);
          setIsTypeSwitching(true);
          setIsIframeLoading(true);
        }

        // 关键修复：当 fileType 为 'html' 时，立即清空 textContent，确保 markdown 容器不显示
        if (fileType === 'html' && textContent) {
          setTextContent('');
          setIsMarkdownLoading(false);
        }
        // 当 fileType 为 'markdown' 时，立即清空 htmlUrl，确保 html 容器不显示
        if (fileType === 'markdown' && htmlUrl) {
          setHtmlUrl(null);
          setIsIframeLoading(false);
        }
      }

      // 然后调用 initPreview 处理新的内容
      // initPreview 中也会处理类型切换，但如果 fileType prop 已经处理了，这里就是双重保险
      initPreview();
    } else {
      setStatus('idle');
      setIsIframeLoading(false);
      setIsMarkdownLoading(false);
      prevSrcRef.current = null;
      prevTypeRef.current = undefined;
    }
    return () => {
      // 取消未执行的 PPTX zoom 计算 RAF
      if (pptxRafIdRef.current) {
        cancelAnimationFrame(pptxRafIdRef.current);
        pptxRafIdRef.current = null;
      }
      if (previewerRef.current) {
        try {
          previewerRef.current.destroy?.();
        } catch (e) {
          /* ignore */
        }
        previewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, srcList, fileType]);

  // ResizeObserver 监听容器尺寸变化
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      // 检查尺寸是否有显著变化（阈值 10px），避免重复初始化
      const lastSize = lastSizeRef.current;
      if (
        lastSize &&
        Math.abs(lastSize.width - width) < 10 &&
        Math.abs(lastSize.height - height) < 10
      ) {
        return;
      }

      // 使用 debounce 避免频繁触发
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // 只有在已成功渲染且是需要尺寸的类型时才重新初始化
        if (
          status === 'success' &&
          resolvedType &&
          ['pptx', 'xlsx'].includes(resolvedType)
        ) {
          lastSizeRef.current = { width, height };
          initPreview();
        }
      }, 500);
    });

    // 监听父容器而非自身（因为自身可能 display: none）
    const parentEl = containerRef.current.parentElement;
    if (parentEl) {
      // 初始化时记录尺寸
      lastSizeRef.current = {
        width: parentEl.clientWidth,
        height: parentEl.clientHeight,
      };
      resizeObserver.observe(parentEl);
    }

    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, resolvedType]);

  const handleRetry = () => {
    initPreview();
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : imageSources.length - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev < imageSources.length - 1 ? prev + 1 : 0,
    );
  };

  const renderPreviewContent = () => {
    if (!resolvedType) return null;

    switch (resolvedType) {
      case 'image':
        return (
          <div className={styles.imagePreview}>
            {imageSources.length > 1 && (
              <Button
                className={styles.imageNavBtn}
                icon={<LeftOutlined />}
                onClick={handlePrevImage}
              />
            )}
            <img
              src={imageSources[currentImageIndex]}
              alt="preview"
              className={styles.previewImage}
              onError={() => {
                setStatus('error');
                setErrorMessage('图片加载失败，请检查文件是否有效');
              }}
            />
            {imageSources.length > 1 && (
              <>
                <Button
                  className={`${styles.imageNavBtn} ${styles.imageNavRight}`}
                  icon={<RightOutlined />}
                  onClick={handleNextImage}
                />
                <div className={styles.imageCounter}>
                  {currentImageIndex + 1} / {imageSources.length}
                </div>
              </>
            )}
          </div>
        );
      case 'audio':
        return (
          <div className={styles.audioPreview}>
            {getFileIcon('audio', 64)}
            <audio controls className={styles.audioPlayer}>
              <source src={getSourceUrl(src!)} />
            </audio>
          </div>
        );
      case 'video':
        return (
          <div className={styles.videoPreview}>
            <video controls className={styles.videoPlayer}>
              <source src={getSourceUrl(src!)} />
            </video>
          </div>
        );
      case 'html':
      case 'markdown':
        // HTML 和 Markdown 使用统一的容器结构，避免 DOM 替换导致布局重排
        // 直接返回缓存的 HTML/Markdown 内容
        return htmlMarkdownContent;
      case 'text':
        return (
          <div className={styles.textPreview}>
            <pre className={styles.codeBlock}>
              <code>{textContent}</code>
            </pre>
          </div>
        );
      default:
        return null;
    }
  };

  // 判断是否需要滚动支持（文档类型需要滚动，Excel 除外，它有自己的滚动条）
  const needsScroll = ['docx', 'pdf', 'pptx'].includes(resolvedType || '');

  // 是否应该显示内容（占据布局空间）
  const shouldShowContent = ['docx', 'xlsx', 'pdf', 'pptx'].includes(
    resolvedType || '',
  );

  return (
    <div
      className={`${styles.filePreviewContainer} ${
        needsScroll ? styles.scrollable : ''
      } ${className || ''}`}
      style={{ width, height, ...style }}
    >
      {/* 工具栏 */}
      {(showRefresh || showDownload) && src && status === 'success' && (
        <div className={styles.toolbar}>
          {showRefresh && (
            <Tooltip title="刷新">
              <Button
                className={styles.toolbarBtn}
                icon={<ReloadOutlined />}
                onClick={handleRetry}
                type="text"
              />
            </Tooltip>
          )}
          {showDownload && (
            <Tooltip title="下载">
              <Button
                className={styles.toolbarBtn}
                icon={<CloudDownloadOutlined />}
                onClick={handleDownload}
                type="text"
              />
            </Tooltip>
          )}
        </div>
      )}

      {status === 'idle' && !src && !srcList?.length && (
        <div className={styles.placeholder}>
          <FileOutlined
            style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }}
          />
          <p>暂无文件可预览</p>
        </div>
      )}

      {status === 'loading' && !isMarkdownLoading && !isIframeLoading && (
        <div className={styles.loadingOverlay}>
          {resolvedType && getFileIcon(resolvedType)}
          <Spin size="large" />
          <span className={styles.loadingText}>正在加载预览...</span>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.errorOverlay}>
          <Alert
            message="预览失败"
            description={errorMessage || '无法预览此文件'}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRetry}
              >
                重试
              </Button>
            }
          />
        </div>
      )}

      {status === 'unsupported' && (
        <div className={styles.unsupportedOverlay}>
          {getFileIcon('unsupported', 64)}
          <p className={styles.unsupportedText}>暂不支持预览此文件类型</p>
          <p className={styles.unsupportedHint}>
            文件类型: .{getExtension(fileName)}
          </p>
          {showDownload && (
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={handleDownload}
            >
              下载文件
            </Button>
          )}
        </div>
      )}

      {status === 'success' &&
        ['image', 'audio', 'video', 'html', 'markdown', 'text'].includes(
          resolvedType || '',
        ) &&
        renderPreviewContent()}

      <div
        ref={containerRef}
        className={styles.previewContent}
        style={{
          height,
          width,
          // 使用 visibility 控制显示，确保初始化时容器有尺寸
          visibility: status === 'success' ? 'visible' : 'hidden',
          // 只有在是文档类型时才占据空间（display block），否则隐藏不占据空间
          display: shouldShowContent ? 'block' : 'none',
          // Excel 不需要 overflow，因为它自己处理
          overflow: resolvedType === 'xlsx' ? 'hidden' : 'auto',
        }}
      />
    </div>
  );
};

export default FilePreview;
