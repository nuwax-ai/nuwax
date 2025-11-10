/**
 * 聊天输入框内容解析和渲染工具函数
 * 用于处理 @提及文本的解析、渲染和纯文本提取
 */

import type { FileNode } from '@/types/interfaces/appDev';
import type { MentionItem } from './index';

/**
 * 转义 HTML 特殊字符
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * 提取文件名（不包含路径）
 */
export const getFileName = (filePath: string): string => {
  return filePath.split('/').pop() || filePath;
};

/**
 * 判断文件节点是否为目录
 */
export const isDirectory = (file: FileNode): boolean => {
  return file.type === 'folder' || file.children !== undefined;
};

/**
 * 根据提及项类型获取显示名称（缩短名称）
 */
export const getMentionDisplayName = (mention: MentionItem): string => {
  if (mention.type === 'file' || mention.type === 'folder') {
    // 文件或文件夹：显示文件名/文件夹名
    return getFileName(mention.data.path);
  } else {
    // 数据源：显示数据源名称
    return mention.data.name;
  }
};

/**
 * 根据提及项类型获取完整路径（用于 tooltip）
 */
export const getMentionFullPath = (mention: MentionItem): string => {
  if (mention.type === 'file' || mention.type === 'folder') {
    // 文件或文件夹：显示完整路径
    return mention.data.path;
  } else {
    // 数据源：显示名称和描述
    const description = mention.data.description || '';
    return description
      ? `${mention.data.name} - ${description}`
      : mention.data.name;
  }
};

/**
 * 在文本中查找 @提及文本，返回匹配的提及项信息
 * 支持匹配完整路径（如 @src/components/ui/avatar.tsx）和显示名称（如 avatar.tsx）
 */
export const findMentionInText = (
  text: string,
  selectedMentions: MentionItem[],
): Array<{
  mention: MentionItem;
  startIndex: number;
  endIndex: number;
  fullText: string; // 包含 @ 的完整文本，如 @文件路径
}> => {
  const results: Array<{
    mention: MentionItem;
    startIndex: number;
    endIndex: number;
    fullText: string;
  }> = [];

  selectedMentions.forEach((mention) => {
    // 构建完整路径匹配文本（包含 @ 符号）
    const fullMentionText =
      mention.type === 'file' || mention.type === 'folder'
        ? `@${mention.data.path}`
        : `@${mention.data.name}`;

    // 构建显示名称匹配文本（不包含 @ 符号）
    const displayName = getMentionDisplayName(mention);

    // 首先尝试匹配完整路径（优先级更高）
    const fullRegex = new RegExp(
      fullMentionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'g',
    );
    let match;
    const matchedIndices = new Set<number>(); // 记录已匹配的位置，避免重复

    while ((match = fullRegex.exec(text)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      matchedIndices.add(startIndex);
      results.push({
        mention,
        startIndex,
        endIndex,
        fullText: match[0],
      });
    }

    // 如果完整路径没有匹配到，尝试匹配显示名称
    // 注意：匹配显示名称时，需要处理以下几种情况：
    // 1. @显示名称（如 @avatar.tsx）
    // 2. 空格显示名称（如  avatar.tsx，从 HTML 提取的）
    // 3. 行首显示名称（如 avatar.tsx，行首）
    // 4. 普通显示名称（如 avatar.tsx，前后有空格或标点）
    const escapedDisplayName = displayName.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
    // 匹配显示名称，前面可以是 @、空格、行首，后面可以是空格、行尾、标点符号
    const displayRegex = new RegExp(
      `(?:^|\\s|@)(${escapedDisplayName})(?:\\s|$|[^\\w/.-])`,
      'g',
    );
    while ((match = displayRegex.exec(text)) !== null) {
      const matchText = match[0]; // 完整匹配，如 " avatar.tsx " 或 "@avatar.tsx "
      const displayNameMatch = match[1]; // 捕获组，只包含显示名称，如 "avatar.tsx"
      const prefix = matchText[0]; // 前缀，可能是 @、空格或行首（空字符串）

      let startIndex = match.index;
      let endIndex = startIndex + matchText.length;
      let fullText = matchText;

      if (prefix === '@') {
        // @显示名称 格式，如 "@avatar.tsx "
        // 需要找到 @ 的位置和显示名称的结束位置
        startIndex = match.index; // @ 的位置
        // 找到显示名称的结束位置（排除后面的空格或标点）
        const displayNameEndIndex = startIndex + 1 + displayNameMatch.length; // @ + 显示名称
        endIndex = displayNameEndIndex;
        fullText = `@${displayNameMatch}`;
      } else if (prefix === ' ') {
        // 空格显示名称 格式，如 " avatar.tsx "
        // 跳过空格，只匹配显示名称
        startIndex = match.index + 1; // 跳过空格
        endIndex = startIndex + displayNameMatch.length;
        fullText = `@${displayNameMatch}`;
      } else {
        // 行首显示名称 格式，如 "avatar.tsx "
        startIndex = match.index;
        endIndex = startIndex + displayNameMatch.length;
        fullText = `@${displayNameMatch}`;
      }

      // 检查这个位置是否已经被完整路径匹配过
      let isOverlapping = false;
      for (const existingResult of results) {
        if (
          startIndex >= existingResult.startIndex &&
          startIndex < existingResult.endIndex
        ) {
          isOverlapping = true;
          break;
        }
        // 也检查反向重叠
        if (
          existingResult.startIndex >= startIndex &&
          existingResult.startIndex < endIndex
        ) {
          isOverlapping = true;
          break;
        }
      }

      // 如果没有重叠，且这个位置没有被匹配过，添加结果
      if (!isOverlapping && !matchedIndices.has(startIndex)) {
        matchedIndices.add(startIndex);
        results.push({
          mention,
          startIndex,
          endIndex,
          fullText,
        });
      }
    }
  });

  // 按位置排序
  return results.sort((a, b) => a.startIndex - b.startIndex);
};

/**
 * 从 HTML 内容中提取纯文本（用于发送消息）
 */
export const getPlainText = (html: string): string => {
  // 创建临时 DOM 元素
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 提取纯文本
  return temp.textContent || temp.innerText || '';
};

/**
 * 将纯文本转换为带 HTML 标记的字符串，@提及文本包装为 <span> 元素
 * @param text 纯文本内容
 * @param selectedMentions 已选择的提及项列表
 * @returns HTML 字符串
 */
export const renderMentionHTML = (
  text: string,
  selectedMentions: MentionItem[],
): string => {
  if (!text || selectedMentions.length === 0) {
    // 如果没有文本或没有提及项，直接返回转义后的文本
    return escapeHtml(text || '');
  }

  // 查找所有 @提及文本
  const mentions = findMentionInText(text, selectedMentions);

  if (mentions.length === 0) {
    // 如果没有找到提及项，直接返回转义后的文本
    return escapeHtml(text);
  }

  // 调试日志：查看找到的所有提及项
  console.log('[renderMentionHTML] Found mentions:', mentions);
  console.log('[renderMentionHTML] Text:', text);
  console.log('[renderMentionHTML] Selected mentions:', selectedMentions);

  // 处理重叠的提及项：按位置排序，并过滤掉重叠的部分
  // 如果两个提及项重叠，保留第一个
  const processedMentions: Array<{
    mention: MentionItem;
    startIndex: number;
    endIndex: number;
    fullText: string;
  }> = [];

  if (mentions.length > 0) {
    let lastEndIndex = 0;

    mentions.forEach((mentionInfo) => {
      // 如果当前提及项的开始位置大于等于上一个提及项的结束位置，说明没有重叠
      if (mentionInfo.startIndex >= lastEndIndex) {
        processedMentions.push(mentionInfo);
        lastEndIndex = mentionInfo.endIndex;
      }
      // 如果有重叠，跳过这个提及项（保留第一个）
    });
  }

  // 调试日志：查看处理后的提及项
  console.log('[renderMentionHTML] Processed mentions:', processedMentions);

  // 构建 HTML 字符串
  let html = '';
  let lastIndex = 0;

  processedMentions.forEach(({ mention, startIndex, endIndex }, index) => {
    // 确保 startIndex >= lastIndex，避免重复渲染
    if (startIndex < lastIndex) {
      // 如果重叠，跳过这个提及项
      console.warn(
        `[renderMentionHTML] Skipping overlapping mention at index ${index}`,
      );
      return;
    }

    // 添加提及项之前的文本（转义 HTML）
    html += escapeHtml(text.slice(lastIndex, startIndex));

    // 获取显示名称和完整路径
    const displayName = getMentionDisplayName(mention);
    const fullPath = getMentionFullPath(mention);
    const mentionType =
      mention.type === 'file'
        ? 'file'
        : mention.type === 'folder'
        ? 'directory'
        : 'datasource';
    const mentionId =
      mention.type === 'file' || mention.type === 'folder'
        ? mention.data.id
        : mention.data.id;

    // 构建提及项的 HTML
    // 注意：显示文本不包含 @ 符号，只显示缩短名称
    // 添加删除按钮和 tooltip 支持
    const mentionHTML = `<span class="mention-highlight" data-mention-type="${mentionType}" data-mention-id="${mentionId}" data-mention-fullpath="${escapeHtml(
      fullPath,
    )}" contenteditable="false" title="${escapeHtml(fullPath)}">${escapeHtml(
      displayName,
    )}<button class="mention-delete-btn" type="button" aria-label="删除"></button></span>`;

    html += mentionHTML;

    // 调试日志：查看每个提及项的渲染
    console.log(`[renderMentionHTML] Rendering mention ${index}:`, {
      displayName,
      startIndex,
      endIndex,
      mentionHTML,
    });

    lastIndex = Math.max(lastIndex, endIndex);
  });

  // 添加剩余的文本
  html += escapeHtml(text.slice(lastIndex));

  // 调试日志：查看最终的 HTML
  console.log('[renderMentionHTML] Final HTML:', html);

  return html;
};

/**
 * 解析文本，识别 @提及文本（格式：@文件路径 或 @数据源名称）
 * 返回匹配的提及项信息
 */
export const parseMentionText = (
  text: string,
  selectedMentions: MentionItem[],
): Array<{
  mention: MentionItem;
  startIndex: number;
  endIndex: number;
  fullText: string;
}> => {
  return findMentionInText(text, selectedMentions);
};
