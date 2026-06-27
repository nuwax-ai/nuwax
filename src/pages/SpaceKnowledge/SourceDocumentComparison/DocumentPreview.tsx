/**
 * 文档预览组件 - 支持PDF、Word、Markdown、Text的预览和高亮
 */

import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { getDocumentType } from './PositionMatcher';
import styles from './index.less';
import type { DocumentPreviewProps } from './types';
import { DocumentTypeEnum } from './types';

const cx = classNames.bind(styles);

/**
 * PDF文档预览组件 - 显示提取的文本内容并支持分段高亮
 * 使用文本提取方式实现PDF内容匹配和定位
 */
const PdfPreview: React.FC<{
  url: string;
  content: string;
  highlights: any[];
  onHighlightClick?: (range: any) => void;
}> = ({ url, content, highlights }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentHighlightId, setCurrentHighlightId] = useState<
    string | number | null
  >(null);

  // 滚动到高亮位置的方法
  const scrollToHighlight = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const highlightElements = container.querySelectorAll('.highlight-segment');

    if (highlightElements.length > 0) {
      const highlightElement = highlightElements[0] as HTMLElement;

      // 计算滚动位置，使高亮元素位于容器中心
      const containerRect = container.getBoundingClientRect();
      const highlightRect = highlightElement.getBoundingClientRect();

      const scrollTop =
        container.scrollTop +
        (highlightRect.top - containerRect.top) -
        containerRect.height / 2 +
        highlightRect.height / 2;

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });

      console.log('PDF滚动到高亮位置完成');
    }
  };

  // 设置PDF文本内容
  useEffect(() => {
    console.log('PdfPreview组件参数:', { url, hasContent: !!content });

    if (!url) {
      setError('PDF URL为空');
      setLoading(false);
      return;
    }

    setDisplayText(content);
    setLoading(false);
  }, [url, content]);

  // 当高亮变化时，自动滚动到高亮位置
  useEffect(() => {
    if (highlights.length > 0 && containerRef.current) {
      console.log('PDF高亮分段:', highlights[0]);
      setCurrentHighlightId(highlights[0].segmentId);

      // 滚动到高亮位置
      scrollToHighlight();
    } else {
      setCurrentHighlightId(null);
    }
  }, [highlights]);

  // 应用高亮的渲染方法
  const renderContent = () => {
    if (!displayText) {
      return (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px',
          }}
        >
          <Empty description="PDF文档内容为空或无法提取文本" />
        </div>
      );
    }

    // 如果有高亮，分段渲染文本
    if (highlights.length > 0) {
      const highlight = highlights[0];
      const { start, end } = highlight;

      // 验证边界
      if (start >= 0 && end <= displayText.length && start < end) {
        const before = displayText.substring(0, start);
        const highlighted = displayText.substring(start, end);
        const after = displayText.substring(end);

        return (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#333',
              margin: 0,
              padding: '16px',
            }}
          >
            {before}
            <mark
              className={cx(
                'highlight-segment',
                currentHighlightId === highlight.segmentId && 'active',
              )}
              style={{
                backgroundColor: '#e6f7ff',
                border: '2px solid #1890ff',
                borderRadius: '3px',
                padding: '2px 4px',
                fontWeight: 'bold',
              }}
            >
              {highlighted}
            </mark>
            {after}
          </pre>
        );
      }
    }

    // 没有高亮时，正常显示文本
    return (
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#333',
          margin: 0,
          padding: '16px',
        }}
      >
        {displayText}
      </pre>
    );
  };

  if (error) {
    return (
      <div className={cx('preview-container', 'pdf-preview', 'error-state')}>
        <Empty description={error} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cx('preview-container', 'pdf-preview', 'loading-state')}>
        <Spin tip="加载PDF文档中..." />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cx('preview-container', 'pdf-preview')}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        scrollBehavior: 'smooth',
        background: '#fff',
        padding: '16px',
      }}
    >
      {renderContent()}
    </div>
  );
};

/**
 * Word文档预览组件 - 显示提取的文本内容并支持分段高亮
 */
const DocxPreview: React.FC<{
  url: string;
  content: string;
  highlights: any[];
  onHighlightClick?: (range: any) => void;
}> = ({ url, content, highlights }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentHighlightId, setCurrentHighlightId] = useState<
    string | number | null
  >(null);

  // 滚动到高亮位置的方法
  const scrollToHighlight = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const highlightElements = container.querySelectorAll('.highlight-segment');

    if (highlightElements.length > 0) {
      const highlightElement = highlightElements[0] as HTMLElement;

      // 计算滚动位置，使高亮元素位于容器中心
      const containerRect = container.getBoundingClientRect();
      const highlightRect = highlightElement.getBoundingClientRect();

      const scrollTop =
        container.scrollTop +
        (highlightRect.top - containerRect.top) -
        containerRect.height / 2 +
        highlightRect.height / 2;

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });

      console.log('Word文档滚动到高亮位置完成');
    }
  };

  // 设置Word文档文本内容
  useEffect(() => {
    console.log('DocxPreview组件参数:', { url, hasContent: !!content });

    if (!url) {
      setError('Word文档URL为空');
      setLoading(false);
      return;
    }

    setDisplayText(content);
    setLoading(false);
  }, [url, content]);

  // 当高亮变化时，自动滚动到高亮位置
  useEffect(() => {
    if (highlights.length > 0 && containerRef.current) {
      console.log('Word文档高亮分段:', highlights[0]);
      setCurrentHighlightId(highlights[0].segmentId);

      // 滚动到高亮位置
      scrollToHighlight();
    } else {
      setCurrentHighlightId(null);
    }
  }, [highlights]);

  // 应用高亮的渲染方法
  const renderContent = () => {
    if (!displayText) {
      return (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px',
          }}
        >
          <Empty description="Word文档内容为空或无法提取文本" />
        </div>
      );
    }

    // 如果有高亮，分段渲染文本
    if (highlights.length > 0) {
      const highlight = highlights[0];
      const { start, end } = highlight;

      // 验证边界
      if (start >= 0 && end <= displayText.length && start < end) {
        const before = displayText.substring(0, start);
        const highlighted = displayText.substring(start, end);
        const after = displayText.substring(end);

        return (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#333',
              margin: 0,
              padding: '16px',
            }}
          >
            {before}
            <mark
              className={cx(
                'highlight-segment',
                currentHighlightId === highlight.segmentId && 'active',
              )}
              style={{
                backgroundColor: '#e6f7ff',
                border: '2px solid #1890ff',
                borderRadius: '3px',
                padding: '2px 4px',
                fontWeight: 'bold',
              }}
            >
              {highlighted}
            </mark>
            {after}
          </pre>
        );
      }
    }

    // 没有高亮时，正常显示文本
    return (
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#333',
          margin: 0,
          padding: '16px',
        }}
      >
        {displayText}
      </pre>
    );
  };

  if (error) {
    return (
      <div className={cx('preview-container', 'docx-preview', 'error-state')}>
        <Empty description={error} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cx('preview-container', 'docx-preview', 'loading-state')}>
        <Spin tip="加载Word文档中..." />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cx('preview-container', 'docx-preview')}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        scrollBehavior: 'smooth',
        background: '#fff',
        padding: '16px',
      }}
    >
      {renderContent()}
    </div>
  );
};

/**
 * 文本文档预览组件（支持Markdown和纯文本）- 带高亮和自动定位功能
 */
const TextPreview: React.FC<{
  url: string;
  content: string;
  highlights: any[];
}> = ({ url, content, highlights }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const [currentHighlightId, setCurrentHighlightId] = useState<
    string | number | null
  >(null);

  // 滚动到高亮位置的方法
  const scrollToHighlight = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const highlightElements = container.querySelectorAll('.highlight-segment');

    if (highlightElements.length > 0) {
      const highlightElement = highlightElements[0] as HTMLElement;

      // 计算滚动位置，使高亮元素位于容器中心
      const containerRect = container.getBoundingClientRect();
      const highlightRect = highlightElement.getBoundingClientRect();

      const scrollTop =
        container.scrollTop +
        (highlightRect.top - containerRect.top) -
        containerRect.height / 2 +
        highlightRect.height / 2;

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });

      console.log('滚动到高亮位置完成');
    }
  };

  useEffect(() => {
    setDisplayText(content);
  }, [url, content]);

  // 当高亮变化时，自动滚动到高亮位置
  useEffect(() => {
    if (highlights.length > 0 && containerRef.current) {
      console.log('高亮分段:', highlights[0]);

      // 滚动到高亮位置
      scrollToHighlight();
      setCurrentHighlightId(highlights[0].segmentId);
    } else {
      setCurrentHighlightId(null);
    }
  }, [highlights]);

  // 应用高亮的渲染方法
  const renderContent = () => {
    if (!displayText) {
      return (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {displayText}
        </pre>
      );
    }

    // 如果有高亮，分段渲染文本
    if (highlights.length > 0) {
      const highlight = highlights[0];
      const { start, end } = highlight;

      // 验证边界
      if (start >= 0 && end <= displayText.length && start < end) {
        const before = displayText.substring(0, start);
        const highlighted = displayText.substring(start, end);
        const after = displayText.substring(end);

        return (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#333',
            }}
          >
            {before}
            <mark
              className={cx(
                'highlight-segment',
                currentHighlightId === highlight.segmentId && 'active',
              )}
              style={{
                backgroundColor: '#e6f7ff',
                border: '2px solid #1890ff',
                borderRadius: '3px',
                padding: '2px 4px',
                fontWeight: 'bold',
              }}
            >
              {highlighted}
            </mark>
            {after}
          </pre>
        );
      }
    }

    // 没有高亮时，正常显示文本
    return (
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#333',
        }}
      >
        {displayText}
      </pre>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cx('preview-container', 'text-preview')}
      style={{
        overflowY: 'auto',
        scrollBehavior: 'smooth',
      }}
    >
      {renderContent()}
    </div>
  );
};

/**
 * 文档预览主组件
 */
const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentInfo,
  documentContent,
  highlights = [],
  onHighlightClick,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentTypeEnum | null>(null);

  useEffect(() => {
    if (documentInfo?.docUrl) {
      console.log('DocumentPreview主组件参数:', {
        documentInfo,
        docUrl: documentInfo.docUrl,
        fileType: documentInfo.fileType,
        hasContent: !!documentContent,
        highlightsCount: highlights.length,
      });

      // 检测文档类型
      const type = getDocumentType(documentInfo.docUrl);
      console.log('检测到文档类型:', type);
      setDocType(type);

      if (!type) {
        setError('不支持的文档类型');
        setLoading(false);
      } else {
        setLoading(false);
        setError(null);
      }
    }
  }, [documentInfo?.docUrl]);

  if (!documentInfo?.docUrl) {
    return (
      <div className={cx('document-preview', 'empty-state')}>
        <Empty description="请选择文档进行预览" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx('document-preview', 'error-state')}>
        <Empty description={`预览失败: ${error}`} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cx('document-preview', 'loading-state')}>
        <Spin tip="加载文档中..." />
      </div>
    );
  }

  // 根据文档类型渲染对应的预览组件
  const renderPreview = () => {
    switch (docType) {
      case DocumentTypeEnum.PDF:
        return (
          <PdfPreview
            url={documentInfo.docUrl}
            content={documentContent?.text || ''}
            highlights={highlights}
            onHighlightClick={onHighlightClick}
          />
        );

      case DocumentTypeEnum.DOCX:
        return (
          <DocxPreview
            url={documentInfo.docUrl}
            content={documentContent?.text || ''}
            highlights={highlights}
          />
        );

      case DocumentTypeEnum.MD:
      case DocumentTypeEnum.TXT:
        return (
          <TextPreview
            url={documentInfo.docUrl}
            content={documentContent?.text || ''}
            highlights={highlights}
          />
        );

      default:
        return <Empty description="不支持的文档类型" />;
    }
  };

  return (
    <div className={cx('document-preview')}>
      <div className={cx('preview-header')}>
        <h3 className={cx('preview-title')}>原文对照</h3>
      </div>
      <div className={cx('preview-content')}>{renderPreview()}</div>
    </div>
  );
};

export default DocumentPreview;
