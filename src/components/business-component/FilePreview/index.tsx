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

// @ts-ignore
import jsPreviewDocx from '@js-preview/docx';
import '@js-preview/docx/lib/index.css';
// @ts-ignore
import jsPreviewExcel from '@js-preview/excel';
import '@js-preview/excel/lib/index.css';
// @ts-ignore
import jsPreviewPdf from '@js-preview/pdf';
// @ts-ignore
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

const FilePreview: React.FC<FilePreviewProps> = ({
  src,
  srcList,
  fileType,
  height = '100%',
  width = '100%',
  showDownload = false,
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
        setErrorMessage(error?.message || 'Failed to load file content');
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
          setErrorMessage(error?.message || 'Failed to load HTML content');
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
          previewer = jsPreviewExcel.init(containerRef.current);
          await previewer.preview(previewSrc);
          break;
        case 'pdf':
          previewer = jsPreviewPdf.init(containerRef.current, {
            onError: (e: any) => {
              setStatus('error');
              setErrorMessage(e?.message || 'Failed to load PDF');
              onError?.(e);
            },
            onRendered: () => {
              setStatus('success');
              onRendered?.();
            },
          });
          await previewer.preview(previewSrc);
          break;
        case 'pptx':
          previewer = pptxInit(containerRef.current, {
            width: containerRef.current.clientWidth || 800,
            height: containerRef.current.clientHeight || 600,
          });
          if (typeof previewSrc === 'string') {
            const response = await fetch(previewSrc);
            previewSrc = await response.arrayBuffer();
          }
          await previewer.preview(previewSrc);
          break;
      }

      previewerRef.current = previewer;
      if (type !== 'pdf') {
        setStatus('success');
        onRendered?.();
      }
    } catch (error: any) {
      console.error('File preview error:', error);
      setStatus('error');
      setErrorMessage(error?.message || 'Failed to preview file');
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
                setErrorMessage('Failed to load image');
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

  return (
    <div
      className={`${styles.filePreviewContainer} ${className || ''}`}
      style={{ width, height, ...style }}
    >
      {showDownload && src && status === 'success' && (
        <Tooltip title="Download">
          <Button
            className={styles.downloadBtn}
            icon={<CloudDownloadOutlined />}
            onClick={handleDownload}
            type="text"
          />
        </Tooltip>
      )}

      {status === 'idle' && !src && !srcList?.length && (
        <div className={styles.placeholder}>
          <FileOutlined
            style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }}
          />
          <p>No file to preview</p>
        </div>
      )}

      {status === 'loading' && (
        <div className={styles.loadingOverlay}>
          {resolvedType && getFileIcon(resolvedType)}
          <Spin size="large" />
          <span className={styles.loadingText}>Loading preview...</span>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.errorOverlay}>
          <Alert
            message="Preview Error"
            description={errorMessage || 'Unable to preview this file.'}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRetry}
              >
                Retry
              </Button>
            }
          />
        </div>
      )}

      {status === 'unsupported' && (
        <div className={styles.unsupportedOverlay}>
          {getFileIcon('unsupported', 64)}
          <p className={styles.unsupportedText}>Preview not supported</p>
          <p className={styles.unsupportedHint}>
            File type: .{getExtension(fileName)}
          </p>
          {showDownload && (
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={handleDownload}
            >
              Download File
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
