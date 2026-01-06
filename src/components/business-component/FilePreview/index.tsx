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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  const resolvedType = fileType || detectedType;

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
      setStatus('loading');
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
        onRendered?.();
      } catch (error: any) {
        setStatus('error');
        setErrorMessage('文件内容加载失败，请重试');
        onError?.(error);
      }
      return;
    }

    // HTML handling
    if (type === 'html') {
      if (typeof src === 'string') {
        setHtmlUrl(src);
        setTextContent('');
        setStatus('success');
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
      initPreview();
    } else {
      setStatus('idle');
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
        return (
          <div className={styles.htmlPreview}>
            <iframe
              src={htmlUrl || undefined}
              srcDoc={htmlUrl ? undefined : textContent}
              sandbox={SANDBOX}
              className={styles.htmlFrame}
              title="HTML Preview"
            />
          </div>
        );
      case 'markdown':
        return (
          <div className={styles.markdownPreview}>
            <PureMarkdownRenderer id="file-preview-md" disableTyping={true}>
              {textContent}
            </PureMarkdownRenderer>
          </div>
        );
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

      {status === 'loading' && (
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
