/**
 * 位置匹配算法 - 根据分段内容在文档中定位对应位置
 */

import type { MatchOptions, MatchResult } from './types';

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
    // 移除PDF页码标记 (如 "-1-", "-2-", "-26-" 等)
    normalized = normalized.replace(/-\d+-/g, '');

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
  options: MatchOptions = {},
): MatchResult | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('开始匹配分段:', {
    docLength: documentContent.length,
    segmentLength: segmentText.length,
    options: opts,
  });

  // 如果分段文本为空，直接返回null
  if (!segmentText || segmentText.length === 0) {
    console.log('分段文本为空，匹配失败');
    return null;
  }

  // 如果分段比文档长，直接返回null
  if (segmentText.length > documentContent.length) {
    console.log('分段文本比文档长，匹配失败');
    return null;
  }

  // 方法1: 在原始文档中精确匹配整个分段
  let exactIndex = documentContent.indexOf(segmentText);
  if (exactIndex !== -1) {
    console.log('精确匹配成功:', {
      startIndex: exactIndex,
      matchedLength: segmentText.length,
    });
    return {
      startOffset: exactIndex,
      endOffset: exactIndex + segmentText.length,
      confidence: 1.0,
      matchedText: segmentText,
    };
  }

  // 方法2: 标准化后进行精确匹配
  const normalizedDoc = normalizeText(documentContent, opts);
  const normalizedSegment = normalizeText(segmentText, opts);

  let normalizedIndex = normalizedDoc.indexOf(normalizedSegment);
  if (normalizedIndex !== -1) {
    console.log('标准化后精确匹配成功:', { startIndex: normalizedIndex });
    // 需要将标准化后的位置映射回原始文档
    // 这里简化处理，直接使用标准化后的位置（可能略有偏差）
    return {
      startOffset: normalizedIndex,
      endOffset: normalizedIndex + segmentText.length,
      confidence: 0.95,
      matchedText: segmentText,
    };
  }

  // 方法3: 使用分段开头和结尾进行匹配（在原始文档中）
  const segmentLength = segmentText.length;
  const prefixLength = Math.min(100, Math.floor(segmentLength / 3)); // 取前1/3，最多100字符
  const suffixLength = Math.min(100, Math.floor(segmentLength / 3)); // 取后1/3，最多100字符

  const prefix = segmentText.substring(0, prefixLength);
  const suffix = segmentText.substring(segmentLength - suffixLength);

  console.log('尝试前缀+后缀匹配:', {
    prefixLength,
    suffixLength,
    prefix: prefix.substring(0, 30) + '...',
    suffix: suffix.substring(0, 30) + '...',
  });

  // 在原始文档中查找前缀
  const prefixMatches: number[] = [];
  let searchStart = 0;
  while (true) {
    const foundIndex = documentContent.indexOf(prefix, searchStart);
    if (foundIndex === -1) break;
    prefixMatches.push(foundIndex);
    searchStart = foundIndex + 1;
    if (prefixMatches.length > 10) break; // 最多查找10个匹配
  }

  console.log(`找到${prefixMatches.length}个前缀匹配位置`);

  // 对每个前缀匹配位置，验证是否能找到对应的后缀
  for (const prefixIndex of prefixMatches) {
    const searchStartForSuffix = prefixIndex + prefixLength;
    const maxSearchDistance = segmentLength * 1.5; // 允许1.5倍的距离来查找后缀
    const suffixIndex = documentContent.indexOf(suffix, searchStartForSuffix);

    if (suffixIndex !== -1 && suffixIndex - prefixIndex <= maxSearchDistance) {
      // 找到了前缀和后缀，计算完整范围
      const estimatedStart = prefixIndex;
      const estimatedEnd = suffixIndex + suffix.length;
      const matchedLength = estimatedEnd - estimatedStart;

      console.log('前缀+后缀匹配成功:', {
        prefixIndex,
        suffixIndex,
        estimatedStart,
        estimatedEnd,
        matchedLength,
      });

      return {
        startOffset: estimatedStart,
        endOffset: estimatedEnd,
        confidence: 0.85, // 使用前缀+后缀匹配，置信度略低
        matchedText: segmentText,
      };
    }
  }

  // 方法4: 使用分段的前150个字符进行匹配（在原始文档中）
  if (segmentLength >= 150) {
    const longPrefix = segmentText.substring(0, 150);
    const longPrefixIndex = documentContent.indexOf(longPrefix);
    if (longPrefixIndex !== -1) {
      console.log('长前缀匹配成功:', { startIndex: longPrefixIndex });
      return {
        startOffset: longPrefixIndex,
        endOffset: longPrefixIndex + segmentLength,
        confidence: 0.75,
        matchedText: segmentText,
      };
    }
  }

  // 方法5: 使用分段的前80个字符进行匹配（在原始文档中）
  if (segmentLength >= 80) {
    const mediumPrefix = segmentText.substring(0, 80);
    const mediumPrefixIndex = documentContent.indexOf(mediumPrefix);
    if (mediumPrefixIndex !== -1) {
      console.log('中前缀匹配成功:', { startIndex: mediumPrefixIndex });
      return {
        startOffset: mediumPrefixIndex,
        endOffset: mediumPrefixIndex + segmentLength,
        confidence: 0.65,
        matchedText: segmentText,
      };
    }
  }

  // 方法6: 使用分段的前50个字符进行匹配（在原始文档中）
  if (segmentLength >= 50) {
    const shortPrefix = segmentText.substring(0, 50);
    const shortPrefixIndex = documentContent.indexOf(shortPrefix);
    if (shortPrefixIndex !== -1) {
      console.log('短前缀匹配成功:', { startIndex: shortPrefixIndex });
      return {
        startOffset: shortPrefixIndex,
        endOffset: shortPrefixIndex + segmentLength,
        confidence: 0.55,
        matchedText: segmentText,
      };
    }
  }

  // 方法7: 模糊匹配 - 分段为多个小段进行匹配（在原始文档中）
  if (opts.fuzzyMatch && segmentLength > 200) {
    // 将分段分成多个50字符的小段
    const chunkSize = 50;
    const chunks: string[] = [];

    for (let i = 0; i < segmentLength; i += chunkSize) {
      const chunk = segmentText.substring(
        i,
        Math.min(i + chunkSize, segmentLength),
      );
      chunks.push(chunk);
    }

    console.log(`将分段分成${chunks.length}个小段进行模糊匹配`);

    // 查找每个小段在文档中的位置
    const chunkPositions: Array<{ chunk: string; index: number }> = [];
    for (const chunk of chunks) {
      const chunkIndex = documentContent.indexOf(chunk);
      if (chunkIndex !== -1) {
        chunkPositions.push({ chunk, index: chunkIndex });
      }
    }

    console.log(`找到${chunkPositions.length}/${chunks.length}个小段匹配`);

    if (chunkPositions.length >= chunks.length * 0.6) {
      // 如果60%以上的小段都匹配了，认为是找到了
      const minIndex = Math.min(...chunkPositions.map((p) => p.index));
      const maxIndex = Math.max(...chunkPositions.map((p) => p.index));

      console.log('模糊匹配成功:', {
        minIndex,
        maxIndex,
        matchedChunks: chunkPositions.length,
      });

      return {
        startOffset: minIndex,
        endOffset: maxIndex + chunks[chunks.length - 1].length,
        confidence: 0.45, // 模糊匹配，置信度最低
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
export function getDocumentType(
  url: string,
): 'pdf' | 'docx' | 'md' | 'txt' | null {
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
