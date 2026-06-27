/**
 * 位置匹配算法 - 根据分段内容在文档中定位对应位置
 */

import type { MatchResult, MatchOptions } from './types';

/**
 * 默认匹配选项
 */
const DEFAULT_OPTIONS: MatchOptions = {
  fuzzyMatch: false,
  ignoreCase: false,
  trimWhitespace: true,
};

/**
 * 标准化文本（处理空格、换行等）
 */
function normalizeText(text: string, options: MatchOptions): string {
  let normalized = text;

  if (options.trimWhitespace) {
    // 移除多余的空白字符，但保留基本结构
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }

  if (options.ignoreCase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

/**
 * 精确匹配分段文本在文档中的位置
 */
export function matchSegmentInDocument(
  documentContent: string,
  segmentText: string,
  options: MatchOptions = {}
): MatchResult | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('开始匹配分段:', {
    docLength: documentContent.length,
    segmentLength: segmentText.length,
    options: opts
  });

  // 标准化文档和分段文本
  const normalizedDoc = normalizeText(documentContent, opts);
  const normalizedSegment = normalizeText(segmentText, opts);

  console.log('文本标准化完成:', {
    normalizedDocLength: normalizedDoc.length,
    normalizedSegmentLength: normalizedSegment.length
  });

  // 如果分段文本为空或比文档长，直接返回null
  if (!normalizedSegment || normalizedSegment.length > normalizedDoc.length) {
    console.log('分段文本为空或比文档长，匹配失败');
    return null;
  }

  // 方法1: 精确匹配整个分段
  let startIndex = normalizedDoc.indexOf(normalizedSegment);
  if (startIndex !== -1) {
    console.log('精确匹配成功:', { startIndex, matchedLength: normalizedSegment.length });
    return {
      startOffset: startIndex,
      endOffset: startIndex + normalizedSegment.length,
      confidence: 1.0,
      matchedText: segmentText,
    };
  }

  // 方法2: 使用分段开头和结尾进行匹配（各取50个字符）
  const segmentLength = normalizedSegment.length;
  const prefixLength = Math.min(50, segmentLength);
  const suffixLength = Math.min(50, segmentLength - prefixLength);

  const prefix = normalizedSegment.substring(0, prefixLength);
  const suffix = normalizedSegment.substring(segmentLength - suffixLength);

  console.log('尝试前缀+后缀匹配:', {
    prefixLength,
    suffixLength,
    prefix: prefix.substring(0, 20) + '...',
    suffix: suffix.substring(0, 20) + '...'
  });

  // 在文档中查找前缀
  const prefixIndex = normalizedDoc.indexOf(prefix);
  if (prefixIndex !== -1) {
    // 从前缀位置向后查找后缀
    const remainingDoc = normalizedDoc.substring(prefixIndex + prefixLength);
    const suffixIndex = remainingDoc.indexOf(suffix);

    if (suffixIndex !== -1) {
      // 找到了前缀和后缀，计算完整范围
      const endOffset = prefixIndex + prefixLength + suffixIndex + suffix.length;
      console.log('前缀+后缀匹配成功:', { prefixIndex, endOffset });
      return {
        startOffset: prefixIndex,
        endOffset: endOffset,
        confidence: 0.9, // 使用前缀+后缀匹配，置信度略低
        matchedText: segmentText,
      };
    }
  }

  // 方法3: 尝试只使用分段的前100个字符进行匹配
  if (segmentLength >= 100) {
    const shortPrefix = normalizedSegment.substring(0, 100);
    const shortPrefixIndex = normalizedDoc.indexOf(shortPrefix);
    if (shortPrefixIndex !== -1) {
      return {
        startOffset: shortPrefixIndex,
        endOffset: shortPrefixIndex + 100,
        confidence: 0.7, // 只使用前缀，置信度更低
        matchedText: segmentText.substring(0, 100),
      };
    }
  }

  // 方法4: 模糊匹配 - 分段为多个小段进行匹配
  if (opts.fuzzyMatch && segmentLength > 200) {
    // 将分段分成多个50字符的小段
    const chunkSize = 50;
    let bestMatchIndex = -1;
    let bestMatchScore = 0;

    for (let i = 0; i < normalizedSegment.length - chunkSize; i += chunkSize) {
      const chunk = normalizedSegment.substring(i, i + chunkSize);
      const chunkIndex = normalizedDoc.indexOf(chunk);

      if (chunkIndex !== -1) {
        // 计算匹配分数（匹配的块数越多越好）
        const matchScore = 1;
        if (matchScore > bestMatchScore) {
          bestMatchIndex = chunkIndex;
          bestMatchScore = matchScore;
        }
      }
    }

    if (bestMatchIndex !== -1) {
      return {
        startOffset: bestMatchIndex,
        endOffset: bestMatchIndex + segmentLength,
        confidence: 0.5, // 模糊匹配，置信度最低
        matchedText: segmentText,
      };
    }
  }

  // 所有匹配方法都失败
  console.log('所有匹配方法都失败');
  return null;
}

/**
 * 从URL中提取文件扩展名
 */
export function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * 根据文件扩展名判断文档类型
 */
export function getDocumentType(url: string): 'pdf' | 'docx' | 'md' | 'txt' | null {
  const ext = getFileExtension(url);

  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'md':
    case 'markdown':
      return 'md';
    case 'txt':
    case 'text':
      return 'txt';
    default:
      return null;
  }
}
