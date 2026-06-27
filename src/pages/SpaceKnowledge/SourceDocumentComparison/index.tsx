/**
 * 原文对照主组件 - 集成文档预览和高亮定位功能
 */

import { Empty, Spin, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import DocumentPreview from './DocumentPreview';
import { useDocumentPreview, useTextHighlight } from './hooks';
import styles from './index.less';
import { matchSegmentInDocument } from './PositionMatcher';
import type { SourceDocumentComparisonProps } from './types';

const cx = classNames.bind(styles);

/**
 * 测试文档URL映射（用于开发调试，避免认证问题）
 */
const TEST_DOCUMENT_URLS = {
  pdf: 'https://weapp.tfswufe.edu.cn/itfer-cjczzdy/public/s1.pdf',
  md: 'https://weapp.tfswufe.edu.cn/itfer-cjczzdy/public/s2.md',
  docx: 'https://weapp.tfswufe.edu.cn/itfer-cjczzdy/public/s3.docx',
  txt: 'https://weapp.tfswufe.edu.cn/itfer-cjczzdy/public/s4.txt',
};

/**
 * 根据文件扩展名获取测试URL
 */
const getTestDocumentUrl = (originalUrl: string): string => {
  const extension = originalUrl.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return TEST_DOCUMENT_URLS.pdf;
    case 'md':
    case 'markdown':
      return TEST_DOCUMENT_URLS.md;
    case 'docx':
    case 'doc':
      return TEST_DOCUMENT_URLS.docx;
    case 'txt':
    case 'text':
      return TEST_DOCUMENT_URLS.txt;
    default:
      return originalUrl; // 如果不匹配，返回原URL
  }
};

/**
 * 原文对照组件
 */
const SourceDocumentComparison: React.FC<SourceDocumentComparisonProps> = ({
  documentInfo,
  selectedSegment,
  visible = true,
}) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // 使用自定义hooks
  const { documentContent, loading, error, loadDocument, reset } =
    useDocumentPreview();
  const { highlights, addHighlight, clearHighlights } = useTextHighlight();

  // 添加布局尺寸监控
  useEffect(() => {
    const checkLayoutSize = () => {
      if (previewContainerRef.current) {
        const rect = previewContainerRef.current.getBoundingClientRect();
        console.log('原文对照区域尺寸:', {
          width: rect.width,
          height: rect.height,
          availWidth: window.innerWidth,
          availHeight: window.innerHeight,
        });
      }
    };

    checkLayoutSize();
    window.addEventListener('resize', checkLayoutSize);
    return () => window.removeEventListener('resize', checkLayoutSize);
  }, [visible]);

  // 当文档信息改变时，加载文档内容
  useEffect(() => {
    if (documentInfo?.docUrl && visible) {
      // 使用测试URL替换原URL，避免认证问题
      const testUrl = getTestDocumentUrl(documentInfo.docUrl);
      console.log('文档URL映射:', {
        original: documentInfo.docUrl,
        test: testUrl,
        fileType: documentInfo.fileType,
      });
      loadDocument(testUrl, documentInfo.fileType);
    } else {
      reset();
    }
  }, [documentInfo?.docUrl, documentInfo?.fileType, visible]);

  // 滚动到高亮位置
  const scrollToHighlight = (offset: number) => {
    if (!previewContainerRef.current) {
      return;
    }

    const container = previewContainerRef.current;

    // 对于文本文档，使用基于文本长度的滚动
    if (documentContent?.text) {
      const scrollableElement = container.querySelector('.text-preview');

      if (scrollableElement) {
        const textLength = documentContent.text.length;
        const scrollRatio = offset / textLength;
        const scrollPosition = scrollRatio * scrollableElement.scrollHeight;

        scrollableElement.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      }
    } else {
      // 对于PDF/Word文档，滚动到文本内容显示区域
      const textContentArea = container.querySelector(
        '[style*="overflowY: auto"]',
      );
      if (textContentArea) {
        textContentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // 匹配分段并添加高亮
  const handleSegmentMatch = async (segment: any) => {
    if (!segment?.rawTxt) {
      return;
    }

    try {
      console.log('开始匹配分段:', {
        hasDocumentContent: !!documentContent,
        hasText: !!documentContent?.text,
        segmentTextLength: segment.rawTxt?.length,
        fileType: documentInfo?.fileType,
      });

      // 判断文档类型
      const isPdfDocument =
        documentInfo?.fileType === 'pdf' ||
        documentInfo?.docUrl?.endsWith('.pdf');
      const isTextDocument =
        documentContent?.text && documentContent.text.length > 0;

      if (isTextDocument) {
        // 文本文档：进行精确文本匹配
        const result = matchSegmentInDocument(
          documentContent.text,
          segment.rawTxt,
          {
            fuzzyMatch: true,
            trimWhitespace: true,
            ignoreCase: false,
          },
        );

        if (result) {
          console.log('文本文档匹配成功:', result);
          // 匹配成功，添加高亮
          addHighlight(result, segment.id || segment.rawSegmentId);
          // 滚动到高亮位置
          scrollToHighlight(result.startOffset);
        } else {
          // 匹配失败，但仍显示分段内容
          message.info('未在文档中找到精确匹配，显示分段内容');
          const virtualHighlight = {
            startOffset: 0,
            endOffset: segment.rawTxt.length,
            matchedText: segment.rawTxt,
            confidence: 0,
          };
          addHighlight(virtualHighlight, segment.id || segment.rawSegmentId);
        }
      } else if (isPdfDocument) {
        // PDF文档：也使用精确文本匹配
        console.log('PDF文档，使用文本匹配');

        // 使用与文本文档相同的匹配逻辑
        const result = matchSegmentInDocument(
          documentContent.text,
          segment.rawTxt,
          {
            fuzzyMatch: true,
            trimWhitespace: true,
            ignoreCase: false,
          },
        );

        if (result) {
          console.log('PDF文档匹配成功:', result);
          // 匹配成功，添加高亮
          addHighlight(result, segment.id || segment.rawSegmentId);
          // 滚动到高亮位置
          scrollToHighlight(result.startOffset);
        } else {
          // 匹配失败，但仍显示分段内容
          message.info('未在PDF文档中找到精确匹配，显示分段内容');
          const virtualHighlight = {
            startOffset: 0,
            endOffset: segment.rawTxt.length,
            matchedText: segment.rawTxt,
            confidence: 0,
          };
          addHighlight(virtualHighlight, segment.id || segment.rawSegmentId);
        }
      } else {
        // Word或其他文档：也使用精确文本匹配
        console.log('Word/其他文档，使用文本匹配');

        const result = matchSegmentInDocument(
          documentContent.text,
          segment.rawTxt,
          {
            fuzzyMatch: true,
            trimWhitespace: true,
            ignoreCase: false,
          },
        );

        if (result) {
          console.log('Word/其他文档匹配成功:', result);
          // 匹配成功，添加高亮
          addHighlight(result, segment.id || segment.rawSegmentId);
          // 滚动到高亮位置
          scrollToHighlight(result.startOffset);
        } else {
          // 匹配失败，但仍显示分段内容
          message.info('未在文档中找到精确匹配，显示分段内容');
          const fallbackHighlight = {
            startOffset: 0,
            endOffset: segment.rawTxt.length,
            matchedText: segment.rawTxt,
            confidence: 0,
          };
          addHighlight(fallbackHighlight, segment.id || segment.rawSegmentId);
        }
      }
    } catch (err) {
      console.error('分段匹配失败:', err);
      // 即使匹配失败，也尝试显示分段内容
      if (segment?.rawTxt) {
        const fallbackHighlight = {
          startOffset: 0,
          endOffset: segment.rawTxt.length,
          matchedText: segment.rawTxt,
          confidence: 0,
        };
        addHighlight(fallbackHighlight, segment.id || segment.rawSegmentId);
      }
    }
  };

  // 当选中的分段改变时，进行匹配和高亮
  useEffect(() => {
    if (selectedSegment && visible) {
      // 对于PDF文档，即使没有文本内容也要触发匹配过程
      const isPdfDocument =
        documentInfo?.fileType === 'pdf' ||
        documentInfo?.docUrl?.endsWith('.pdf');
      const hasTextContent =
        documentContent?.text && documentContent.text.length > 0;

      if (hasTextContent || isPdfDocument) {
        console.log('触发分段匹配:', {
          hasSegment: !!selectedSegment,
          isPdfDocument,
          hasTextContent,
          fileType: documentInfo?.fileType,
        });
        handleSegmentMatch(selectedSegment);
      }
    } else if (!selectedSegment) {
      // 清除高亮
      clearHighlights();
    }
  }, [selectedSegment, documentContent, visible]);

  // 如果不可见，不渲染
  if (!visible) {
    return null;
  }

  // 加载状态
  if (loading) {
    return (
      <div className={cx('source-document-comparison', 'loading')}>
        <Spin tip="加载文档中..." />
      </div>
    );
  }

  // 错误状态
  if (error || !documentInfo) {
    return (
      <div className={cx('source-document-comparison', 'error')}>
        <Empty description={error || '请选择文档进行预览'} />
      </div>
    );
  }

  return (
    <div
      ref={previewContainerRef}
      className={cx('source-document-comparison')}
      style={{ width: '52%', minWidth: '500px', flex: '1 1 0%' }}
    >
      <DocumentPreview
        documentInfo={
          documentInfo
            ? {
                ...documentInfo,
                docUrl: getTestDocumentUrl(documentInfo.docUrl),
              }
            : null
        }
        documentContent={documentContent}
        highlights={highlights}
        onDocumentLoad={(content) => {
          console.log('文档加载完成:', content);
        }}
        onHighlightClick={(range) => {
          console.log('点击高亮:', range);
        }}
      />
    </div>
  );
};

export default SourceDocumentComparison;
