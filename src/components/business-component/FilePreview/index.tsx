import {
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileWordOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
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

export type FileType = 'docx' | 'xlsx' | 'pptx' | 'pdf';

export interface FilePreviewProps {
  /**
   * File source: URL string, ArrayBuffer, Blob, or File object
   */
  src?: string | ArrayBuffer | Blob | File;
  /**
   * File type (auto-detected if not provided)
   */
  fileType?: FileType;
  /**
   * Container height
   * @default '100%'
   */
  height?: number | string;
  /**
   * Container width
   * @default '100%'
   */
  width?: number | string;
  /**
   * Callback when preview is rendered
   */
  onRendered?: () => void;
  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Custom styles
   */
  style?: React.CSSProperties;
}

type PreviewStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Get file type from URL or File name
 */
const getFileTypeFromName = (name: string): FileType | undefined => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'docx':
    case 'doc':
      return 'docx';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'pptx':
    case 'ppt':
      return 'pptx';
    case 'pdf':
      return 'pdf';
    default:
      return undefined;
  }
};

/**
 * Get icon component based on file type
 */
const getFileIcon = (type: FileType) => {
  const iconProps = { style: { fontSize: 48, marginBottom: 16 } };
  switch (type) {
    case 'docx':
      return (
        <FileWordOutlined
          {...iconProps}
          style={{ ...iconProps.style, color: '#2b579a' }}
        />
      );
    case 'xlsx':
      return (
        <FileExcelOutlined
          {...iconProps}
          style={{ ...iconProps.style, color: '#217346' }}
        />
      );
    case 'pptx':
      return (
        <FilePptOutlined
          {...iconProps}
          style={{ ...iconProps.style, color: '#d24726' }}
        />
      );
    case 'pdf':
      return (
        <FilePdfOutlined
          {...iconProps}
          style={{ ...iconProps.style, color: '#ff4d4f' }}
        />
      );
    default:
      return <FilePdfOutlined {...iconProps} />;
  }
};

const FilePreview: React.FC<FilePreviewProps> = ({
  src,
  fileType,
  height = '100%',
  width = '100%',
  onRendered,
  onError,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<any>(null);
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectedType, setDetectedType] = useState<FileType | undefined>(
    undefined,
  );

  // Detect file type
  const resolvedType = fileType || detectedType;

  /**
   * Initialize and render preview
   */
  const initPreview = async () => {
    if (!containerRef.current || !src) {
      return;
    }

    // Detect file type if not provided
    let type = fileType;
    if (!type) {
      if (typeof src === 'string') {
        type = getFileTypeFromName(src);
      } else if (src instanceof File) {
        type = getFileTypeFromName(src.name);
      }
    }

    if (!type) {
      setStatus('error');
      setErrorMessage(
        'Unable to detect file type. Please provide fileType prop.',
      );
      onError?.(new Error('Unable to detect file type'));
      return;
    }

    setDetectedType(type);
    setStatus('loading');
    setErrorMessage('');

    // Clean up previous previewer
    if (previewerRef.current) {
      try {
        previewerRef.current.destroy?.();
      } catch (e) {
        // Ignore cleanup errors
      }
      previewerRef.current = null;
    }

    // Clear container
    containerRef.current.innerHTML = '';

    try {
      let previewer: any;
      let previewSrc = src;

      // Convert File to ArrayBuffer if needed
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
          // For pptx, we need to fetch the file as ArrayBuffer if it's a URL
          if (typeof previewSrc === 'string') {
            const response = await fetch(previewSrc);
            previewSrc = await response.arrayBuffer();
          }
          await previewer.preview(previewSrc);
          break;
      }

      previewerRef.current = previewer;

      // For non-PDF types, mark as success immediately
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

  // Initialize preview when src changes
  useEffect(() => {
    if (src) {
      initPreview();
    } else {
      setStatus('idle');
    }

    return () => {
      // Cleanup on unmount
      if (previewerRef.current) {
        try {
          previewerRef.current.destroy?.();
        } catch (e) {
          // Ignore cleanup errors
        }
        previewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fileType]);

  const handleRetry = () => {
    initPreview();
  };

  return (
    <div
      className={`${styles.filePreviewContainer} ${className || ''}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {/* Idle State */}
      {status === 'idle' && !src && (
        <div className={styles.placeholder}>
          <FilePdfOutlined
            style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }}
          />
          <p>No file to preview</p>
        </div>
      )}

      {/* Loading State */}
      {status === 'loading' && (
        <div className={styles.loadingOverlay}>
          {resolvedType && getFileIcon(resolvedType)}
          <Spin size="large" />
          <span className={styles.loadingText}>Loading preview...</span>
        </div>
      )}

      {/* Error State */}
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

      {/* Preview Container */}
      <div
        ref={containerRef}
        className={styles.previewContent}
        style={{
          display: status === 'success' ? 'block' : 'none',
        }}
      />
    </div>
  );
};

export default FilePreview;
