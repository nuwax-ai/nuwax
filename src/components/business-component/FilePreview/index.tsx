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
import ReactMarkdown from 'react-markdown';
import styles from './index.less';

// 样式静态导入（确保样式提前加载）
import '@js-preview/docx/lib/index.css';
import '@js-preview/excel/lib/index.css';

// 预览库动态加载函数
const loadDocxPreview = () => import('@js-preview/docx');
const loadExcelPreview = () => import('@js-preview/excel');
const loadPdfPreview = () => import('@js-preview/pdf');
const loadPptxPreview = () => import('pptx-preview');

// 导入 PPTX 降级渲染工具
import { parsePPTX, renderFallback } from '@/utils/pptxFallbackRenderer';

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
        case 'docx': {
          // 动态加载 docx 预览库
          const docxModule = await loadDocxPreview();
          const jsPreviewDocx = docxModule.default;
          previewer = jsPreviewDocx.init(containerRef.current);
          await previewer.preview(previewSrc);
          break;
        }
        case 'xlsx': {
          // 动态加载 excel 预览库
          const excelModule = await loadExcelPreview();
          const jsPreviewExcel = excelModule.default;
          previewer = jsPreviewExcel.init(containerRef.current);
          await previewer.preview(previewSrc);
          break;
        }
        case 'pdf': {
          // 动态加载 pdf 预览库
          const pdfModule = await loadPdfPreview();
          const jsPreviewPdf = pdfModule.default;
          // 设置 PDF 预览器，使用容器宽度自适应
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
        }
        case 'pptx': {
          // 动态加载 pptx 预览库
          const pptxModule = await loadPptxPreview();
          const pptxInit = pptxModule.init;

          // 等待容器渲染完成
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });

          // 获取容器宽度，用于计算幻灯片尺寸
          const containerWidth = containerRef.current?.clientWidth || 0;
          const containerHeight = containerRef.current?.clientHeight || 0;

          // 计算幻灯片尺寸：使用容器宽度的 90% 或默认 800px
          // 幻灯片按 16:9 比例（标准 PPT 比例）
          const slideWidth =
            containerWidth > 100 ? Math.min(containerWidth * 0.9, 960) : 800;
          const slideHeight = Math.round(slideWidth * (9 / 16));

          console.log('[PPTX Debug] Container size:', {
            containerWidth,
            containerHeight,
          });
          console.log('[PPTX Debug] Slide size:', { slideWidth, slideHeight });

          // 使用 list 模式显示所有幻灯片
          previewer = pptxInit(containerRef.current, {
            width: slideWidth,
            height: slideHeight,
            mode: 'list', // 列表模式，显示所有幻灯片
          });

          if (typeof previewSrc === 'string') {
            console.log('[PPTX Debug] Fetching file:', previewSrc);
            const response = await fetch(previewSrc);
            if (!response.ok) {
              throw new Error('文件加载失败，请检查文件路径');
            }
            previewSrc = await response.arrayBuffer();
            console.log(
              '[PPTX Debug] File loaded, size:',
              previewSrc.byteLength,
            );
          }

          // 检查文件是否有效（PPTX 文件至少应该有一定大小）
          if (
            previewSrc instanceof ArrayBuffer &&
            previewSrc.byteLength < 100
          ) {
            throw new Error('文件内容无效或为空');
          }

          try {
            console.log('[PPTX Debug] Starting load...');
            // 先使用 load 方法加载文件，获取更多信息
            const pptxData = await previewer.load(previewSrc);
            console.log('[PPTX Debug] PPTX data loaded:', pptxData);
            console.log('[PPTX Debug] Slide count:', previewer.slideCount);

            // 检查是否有幻灯片
            if (previewer.slideCount === 0) {
              console.warn(
                '[PPTX Debug] No slides found, attempting fallback rendering...',
              );

              // 使用降级渲染器
              try {
                console.log('[PPTX Debug] Loading PPTX fallback renderer...');
                // 直接使用 pptx-preview 已加载的数据
                const parsedResult = await parsePPTX(pptxData);
                console.log(
                  '[PPTX Debug] Fallback parser result:',
                  parsedResult,
                );

                if (containerRef.current) {
                  renderFallback(containerRef.current, parsedResult);
                }
                console.log('[PPTX Debug] Fallback rendering completed');
                break; // 降级渲染成功，退出
              } catch (fallbackError: any) {
                console.error(
                  '[PPTX Debug] Fallback rendering error:',
                  fallbackError,
                );
                // 降级渲染也失败了
                throw new Error('该 PPTX 文件格式暂不支持预览');
              }
            }

            // 尝试渲染所有幻灯片
            console.log('[PPTX Debug] Rendering slides...');
            for (let i = 0; i < previewer.slideCount; i++) {
              console.log('[PPTX Debug] Rendering slide:', i);
              previewer.renderSingleSlide(i);
            }
            console.log('[PPTX Debug] All slides rendered');
          } catch (pptxError: any) {
            console.error('[PPTX Debug] Preview error:', pptxError);
            console.error('[PPTX Debug] Error stack:', pptxError?.stack);
            // 如果渲染失败，提供用户友好的中文错误提示
            throw new Error(
              getLocalizedErrorMessage(pptxError?.message, 'pptx'),
            );
          }
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
              sandbox="allow-scripts allow-same-origin allow-forms"
              className={styles.htmlFrame}
              title="HTML Preview"
            />
          </div>
        );
      case 'markdown':
        return (
          <div className={styles.markdownPreview}>
            <ReactMarkdown>{textContent}</ReactMarkdown>
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

  // 判断是否需要滚动支持（文档类型需要滚动）
  const needsScroll = ['docx', 'xlsx', 'pdf', 'pptx'].includes(
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
          display:
            status === 'success' &&
            ['docx', 'xlsx', 'pdf', 'pptx'].includes(resolvedType || '')
              ? 'block'
              : 'none',
        }}
      />
    </div>
  );
};

export default FilePreview;
