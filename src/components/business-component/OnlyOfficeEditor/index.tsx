/**
 * OnlyOffice Editor Component
 *
 * React wrapper for OnlyOffice Document Server integration
 * Supports preview and editing of Office documents (Word, Excel, PowerPoint, PDF)
 */

import {
  CloudDownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { Alert, Button, Spin, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

// OnlyOffice Document Server URL (configure based on your deployment)
const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || 'http://localhost:8080';

export interface OnlyOfficeConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions?: {
      edit?: boolean;
      download?: boolean;
      print?: boolean;
      review?: boolean;
      comment?: boolean;
    };
  };
  documentType: 'word' | 'cell' | 'slide';
  editorConfig: {
    callbackUrl?: string;
    lang?: string;
    mode?: 'view' | 'edit';
    customization?: {
      autosave?: boolean;
      chat?: boolean;
      comments?: boolean;
      help?: boolean;
      plugins?: boolean;
      forcesave?: boolean;
    };
    user?: {
      id: string;
      name: string;
    };
  };
  width?: string | number;
  height?: string | number;
  token?: string;
}

export interface OnlyOfficeEditorProps {
  /** OnlyOffice configuration object */
  config?: OnlyOfficeConfig;
  /** Backend API URL for getting config */
  configUrl?: string;
  /** Document ID for fetching config from backend */
  documentId?: string;
  /** Enable edit mode */
  editable?: boolean;
  /** Container height */
  height?: number | string;
  /** Container width */
  width?: number | string;
  /** Callback when editor is ready */
  onReady?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        containerId: string,
        config: OnlyOfficeConfig,
      ) => DocEditorInstance;
    };
  }
}

interface DocEditorInstance {
  destroyEditor: () => void;
  downloadAs: (format?: string) => void;
  requestClose: () => void;
}

type EditorStatus = 'idle' | 'loading' | 'ready' | 'error';

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
  config,
  configUrl,
  documentId,
  editable = false,
  height = '100%',
  width = '100%',
  onReady,
  onError,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<DocEditorInstance | null>(null);
  const editorIdRef = useRef<string>(
    `onlyoffice-editor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [status, setStatus] = useState<EditorStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedConfig, setResolvedConfig] = useState<OnlyOfficeConfig | null>(
    null,
  );

  // Load OnlyOffice API script
  const loadOnlyOfficeScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.DocsAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `${ONLYOFFICE_URL}/web-apps/apps/api/documents/api.js`;
      script.async = true;
      script.onload = () => {
        if (window.DocsAPI) {
          resolve();
        } else {
          reject(new Error('Failed to load OnlyOffice API'));
        }
      };
      script.onerror = () =>
        reject(new Error('Failed to load OnlyOffice API script'));
      document.head.appendChild(script);
    });
  }, []);

  // Fetch config from backend
  const fetchConfig = useCallback(async (): Promise<OnlyOfficeConfig> => {
    if (config) {
      return config;
    }

    if (!configUrl || !documentId) {
      throw new Error('Either config or configUrl + documentId is required');
    }

    const response = await fetch(`${configUrl}/${documentId}?edit=${editable}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get document config');
    }
    return data.config;
  }, [config, configUrl, documentId, editable]);

  // Initialize editor
  const initEditor = useCallback(async () => {
    if (!containerRef.current) return;

    setStatus('loading');
    setErrorMessage('');

    // Destroy existing editor
    if (editorRef.current) {
      try {
        editorRef.current.destroyEditor();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
      editorRef.current = null;
    }

    try {
      // Load OnlyOffice script
      await loadOnlyOfficeScript();

      // Get config
      const editorConfig = await fetchConfig();
      setResolvedConfig(editorConfig);

      // Wait for container to be ready
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });

      // Create editor container div
      const editorContainerId = editorIdRef.current;
      let editorContainer = document.getElementById(editorContainerId);
      if (!editorContainer && containerRef.current) {
        editorContainer = document.createElement('div');
        editorContainer.id = editorContainerId;
        editorContainer.style.width = '100%';
        editorContainer.style.height = '100%';
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(editorContainer);
      }

      // Initialize OnlyOffice editor
      if (!window.DocsAPI) {
        throw new Error('OnlyOffice API not available');
      }

      const finalConfig: OnlyOfficeConfig = {
        ...editorConfig,
        width: '100%',
        height: '100%',
        editorConfig: {
          ...editorConfig.editorConfig,
          customization: {
            ...editorConfig.editorConfig?.customization,
            forcesave: true,
          },
        },
      };

      editorRef.current = new window.DocsAPI.DocEditor(
        editorContainerId,
        finalConfig,
      );

      setStatus('ready');
      onReady?.();
    } catch (error: any) {
      console.error('OnlyOffice initialization error:', error);
      setStatus('error');
      setErrorMessage(error?.message || 'Failed to initialize editor');
      onError?.(error);
    }
  }, [loadOnlyOfficeScript, fetchConfig, onReady, onError]);

  // Initialize on mount or when dependencies change
  useEffect(() => {
    if (config || (configUrl && documentId)) {
      initEditor();
    }

    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor();
        } catch (e) {
          console.warn('Error destroying editor on unmount:', e);
        }
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, configUrl, documentId, editable]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Handle download
  const handleDownload = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.downloadAs();
    }
  }, []);

  // Get document type icon and color
  const getDocTypeInfo = () => {
    const docType = resolvedConfig?.documentType;
    switch (docType) {
      case 'word':
        return { label: 'Word', color: '#2b579a' };
      case 'cell':
        return { label: 'Excel', color: '#217346' };
      case 'slide':
        return { label: 'PowerPoint', color: '#d24726' };
      default:
        return { label: 'Document', color: '#666' };
    }
  };

  const docInfo = getDocTypeInfo();

  return (
    <div
      className={`${styles.onlyofficeContainer} ${
        isFullscreen ? styles.fullscreen : ''
      } ${className || ''}`}
      style={{ width, height, ...style }}
    >
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span
            className={styles.docType}
            style={{ backgroundColor: docInfo.color }}
          >
            {editable ? <EditOutlined /> : <EyeOutlined />}
            <span style={{ marginLeft: 4 }}>
              {editable ? '编辑模式' : '预览模式'}
            </span>
          </span>
          {resolvedConfig?.document?.title && (
            <span className={styles.docTitle}>
              {resolvedConfig.document.title}
            </span>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<CloudDownloadOutlined />}
              onClick={handleDownload}
              disabled={status !== 'ready'}
            />
          </Tooltip>
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              type="text"
              icon={
                isFullscreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={toggleFullscreen}
            />
          </Tooltip>
        </div>
      </div>

      {/* Loading state */}
      {status === 'loading' && (
        <div className={styles.loadingOverlay}>
          <Spin size="large" />
          <span className={styles.loadingText}>加载文档编辑器...</span>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className={styles.errorOverlay}>
          <Alert
            message="加载失败"
            description={
              errorMessage ||
              '无法加载文档编辑器，请检查 OnlyOffice 服务是否正常运行。'
            }
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" onClick={initEditor}>
                重试
              </Button>
            }
          />
        </div>
      )}

      {/* Editor container */}
      <div ref={containerRef} className={styles.editorContent} />
    </div>
  );
};

export default OnlyOfficeEditor;
