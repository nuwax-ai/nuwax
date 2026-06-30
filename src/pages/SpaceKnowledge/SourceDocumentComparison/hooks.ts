/**
 * 自定义 Hooks - 文档预览和原文对照相关
 */

import { message } from 'antd';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { useState } from 'react';
import { getDocumentType, matchSegmentInDocument } from './PositionMatcher';
import type { DocumentContent, HighlightRange, MatchResult } from './types';

// 配置PDF.js worker - 优先使用本地文件，CDN作为备份
if (typeof window !== 'undefined') {
  // 检测是否是Safari浏览器
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // 优先使用本地 public 目录中的 worker 文件
  // Safari需要使用.js文件而不是.mjs文件
  pdfjsLib.GlobalWorkerOptions.workerSrc = isSafari
    ? '/libs/pdf.worker.min.js'
    : '/libs/pdf.worker.min.mjs';

  console.log('PDF.js worker配置完成:', {
    version: pdfjsLib.version,
    workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc,
    source: 'local',
    isSafari,
  });
}

/**
 * 文档预览 Hook
 */
export const useDocumentPreview = () => {
  const [documentContent, setDocumentContent] =
    useState<DocumentContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 加载纯文本文档
  const loadTextDocument = async (url: string): Promise<DocumentContent> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();

      return {
        text,
        metadata: {
          wordCount: text.length,
        },
      };
    } catch (err) {
      throw new Error('加载文本文档失败');
    }
  };

  // 加载PDF文档并提取文本内容用于匹配和定位
  const loadPdfDocument = async (url: string): Promise<DocumentContent> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Safari兼容性处理：使用blob而不是直接使用arrayBuffer
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const fileSize = arrayBuffer.byteLength;

      console.log('开始使用PDF.js提取PDF文本内容');

      // 使用PDF.js加载PDF文档
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      const numPages = pdf.numPages;

      console.log(`PDF文档总页数: ${numPages}`);

      // 逐页提取文本内容
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // 提取文本项并拼接
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n';

        console.log(`第${i}页提取文本长度: ${pageText.length}`);
      }

      console.log('PDF文本提取完成:', {
        totalPages: numPages,
        totalTextLength: fullText.length,
        fileSize: fileSize,
      });

      // 如果提取的文本太少，可能是图片PDF
      if (fullText.trim().length < 50) {
        console.warn('PDF提取文本过少，可能是扫描版或图片PDF');
      }

      // 保持原始文本，不进行标准化处理
      // 标准化将在匹配阶段统一处理，避免双重标准化导致的位置偏差
      console.log('PDF原始文本保存完成，将延迟到匹配时标准化');

      return {
        text: fullText, // 保存原始文本
        html: fullText, // 保存原始文本用于调试
        metadata: {
          wordCount: fullText.length,
          fileSize: fileSize,
          type: 'pdf',
          pageCount: numPages,
        },
      };
    } catch (err: any) {
      console.error('PDF文本提取失败:', err);

      // 检查是否是worker相关的错误
      if (err.message && err.message.includes('worker')) {
        throw new Error(`PDF.js worker配置失败，请尝试刷新页面或检查网络连接`);
      }

      // 检查是否是文件格式错误
      if (err.name === 'PasswordException') {
        throw new Error('PDF文件受密码保护，无法提取文本');
      }

      // 检查是否是文件损坏错误
      if (err.name === 'InvalidPDFException') {
        throw new Error('PDF文件损坏或格式不正确');
      }

      // 通用错误处理
      throw new Error(`加载PDF文档失败: ${err.message || '未知错误，请重试'}`);
    }
  };

  // 加载Word文档并提取文本内容
  const loadWordDocument = async (url: string): Promise<DocumentContent> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileSize = arrayBuffer.byteLength;

      console.log('开始使用mammoth提取Word文档文本内容');

      // 使用mammoth提取Word文档的纯文本内容
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      console.log('Word文档文本提取完成:', {
        textLength: text.length,
        fileSize: fileSize,
        messages: result.messages,
      });

      // 检查是否有提取警告
      if (result.messages.length > 0) {
        console.warn('Word文档提取警告:', result.messages);
      }

      return {
        text: text,
        metadata: {
          wordCount: text.length,
          fileSize: fileSize,
          type: 'docx',
        },
      };
    } catch (err: any) {
      console.error('Word文档文本提取失败:', err);
      throw new Error(`加载Word文档失败: ${err.message || '未知错误'}`);
    }
  };

  // 加载文档内容
  const loadDocument = async (documentUrl: string, fileType?: string) => {
    if (!documentUrl) {
      setError('文档URL为空');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 检测文档类型
      const docType = fileType || getDocumentType(documentUrl);

      if (!docType) {
        throw new Error('不支持的文档类型');
      }

      // 根据文档类型提取文本内容
      let content: DocumentContent | null = null;

      switch (docType) {
        case 'txt':
          content = await loadTextDocument(documentUrl);
          break;
        case 'md':
          content = await loadTextDocument(documentUrl);
          break;
        case 'pdf':
          // PDF文档：尝试获取基本信息，实际文本由组件处理
          content = await loadPdfDocument(documentUrl);
          break;
        case 'docx':
          // Word文档：尝试获取基本信息，实际文本由组件处理
          content = await loadWordDocument(documentUrl);
          break;
        default:
          throw new Error(`不支持的文档类型: ${docType}`);
      }

      setDocumentContent(content);
      return content;
    } catch (err: any) {
      const errorMsg = err.message || '加载文档失败';
      setError(errorMsg);
      message.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 重置状态
  const reset = () => {
    setDocumentContent(null);
    setLoading(false);
    setError(null);
  };

  return {
    documentContent,
    loading,
    error,
    loadDocument,
    reset,
  };
};

/**
 * 文本高亮 Hook
 */
export const useTextHighlight = () => {
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [currentSegmentId, setCurrentSegmentId] = useState<
    string | number | null
  >(null);

  // 根据分段添加高亮
  const addHighlight = (
    matchResult: MatchResult,
    segmentId: string | number,
  ) => {
    const newHighlight: HighlightRange = {
      start: matchResult.startOffset,
      end: matchResult.endOffset,
      segmentId,
      text: matchResult.matchedText,
    };

    // 清除之前的高亮，只显示当前选中的分段
    setHighlights([newHighlight]);
    setCurrentSegmentId(segmentId);
  };

  // 清除所有高亮
  const clearHighlights = () => {
    setHighlights([]);
    setCurrentSegmentId(null);
  };

  // 更新高亮
  const updateHighlights = (newHighlights: HighlightRange[]) => {
    setHighlights(newHighlights);
  };

  return {
    highlights,
    currentSegmentId,
    addHighlight,
    clearHighlights,
    updateHighlights,
  };
};

/**
 * 分段匹配 Hook
 */
export const useSegmentMatch = () => {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isMatching, setIsMatching] = useState<boolean>(false);

  // 匹配分段
  const matchSegment = async (
    documentContent: string,
    segmentText: string,
    options?: any,
  ) => {
    setIsMatching(true);
    setMatchResult(null);

    try {
      const result = matchSegmentInDocument(
        documentContent,
        segmentText,
        options,
      );
      setMatchResult(result);
      return result;
    } catch (err) {
      console.error('匹配分段失败:', err);
      return null;
    } finally {
      setIsMatching(false);
    }
  };

  return {
    matchResult,
    isMatching,
    matchSegment,
  };
};
