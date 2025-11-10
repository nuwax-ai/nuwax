/**
 * MentionSelector 工具函数
 * 包含文件扁平化、数据源分组、最近使用管理等工具函数
 */

import type { FileNode } from '@/types/interfaces/appDev';
import type {
  DataResource,
  DataResourceType,
} from '@/types/interfaces/dataResource';
import React from 'react';
import type { MentionPosition } from './types';

/**
 * 扁平化文件列表（只显示文件，不显示文件夹）
 */
export const flattenFiles = (
  nodes: FileNode[],
  searchText?: string,
): FileNode[] => {
  const result: FileNode[] = [];
  const searchLower = searchText?.toLowerCase() || '';

  const traverse = (nodeList: FileNode[]) => {
    nodeList.forEach((node) => {
      if (node.type === 'file') {
        // 只添加文件节点
        if (
          !searchText ||
          node.name.toLowerCase().includes(searchLower) ||
          node.path?.toLowerCase().includes(searchLower) ||
          node.id.toLowerCase().includes(searchLower)
        ) {
          result.push(node);
        }
      }
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return result;
};

/**
 * 扁平化文件树，提取所有目录节点
 * @param nodes 文件树节点数组
 * @param searchText 搜索文本（可选）
 * @returns 扁平化后的目录节点数组
 */
export const flattenFolders = (
  nodes: FileNode[],
  searchText?: string,
): FileNode[] => {
  const result: FileNode[] = [];
  const searchLower = searchText?.toLowerCase() || '';

  const traverse = (nodeList: FileNode[]) => {
    nodeList.forEach((node) => {
      if (node.type === 'folder') {
        // 只添加目录节点
        if (
          !searchText ||
          node.name.toLowerCase().includes(searchLower) ||
          node.path?.toLowerCase().includes(searchLower) ||
          node.id.toLowerCase().includes(searchLower)
        ) {
          result.push(node);
        }
      }
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return result;
};

/**
 * 获取数据源类型显示名称
 */
export const getDataSourceTypeName = (
  type: DataResourceType | string,
): string => {
  const typeMap: Record<string, string> = {
    workflow: '工作流',
    plugin: '插件',
    reverse_proxy: '反向代理',
  };
  return typeMap[type] || type;
};

/**
 * 获取资源类型的默认描述
 * @param type 资源类型
 * @returns 默认描述文本
 */
export const getDefaultDescription = (
  type: DataResourceType | string,
): string => {
  switch (type) {
    case 'plugin':
      return '插件资源，提供特定功能和服务';
    case 'workflow':
      return '工作流资源，支持复杂的业务流程编排';
    case 'reverse_proxy':
      return '反向代理资源，提供网络代理服务';
    default:
      return '数据资源';
  }
};

/**
 * 按类型分组数据源
 */
export const groupDataSourcesByType = (
  dataSources: DataResource[],
): Record<string, DataResource[]> => {
  const grouped: Record<string, DataResource[]> = {};
  dataSources.forEach((ds) => {
    const type = ds.type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(ds);
  });
  return grouped;
};

/**
 * 最近使用的文件/数据源存储键名
 */
const RECENT_FILES_KEY = 'mention_recent_files';
const RECENT_DATA_SOURCES_KEY = 'mention_recent_data_sources';
const MAX_RECENT_ITEMS = 7;

/**
 * 最近使用的文件项
 */
interface RecentFileItem {
  id: string;
  name: string;
  path: string;
  timestamp: number;
}

/**
 * 最近使用的数据源项
 */
interface RecentDataSourceItem {
  id: number | string;
  name: string;
  timestamp: number;
}

/**
 * 获取最近使用的文件
 */
export const getRecentFiles = (): RecentFileItem[] => {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (!stored) return [];
    const items: RecentFileItem[] = JSON.parse(stored);
    // 按时间戳倒序排序，取前7个
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
};

/**
 * 保存最近使用的文件
 */
export const saveRecentFile = (file: FileNode): void => {
  try {
    const items = getRecentFiles();
    // 移除已存在的相同文件
    const filtered = items.filter((item) => item.id !== file.id);
    // 添加新文件到开头
    const newItem: RecentFileItem = {
      id: file.id,
      name: file.name,
      path: file.path || file.id,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('保存最近使用的文件失败:', error);
  }
};

/**
 * 获取最近使用的数据源
 */
export const getRecentDataSources = (): RecentDataSourceItem[] => {
  try {
    const stored = localStorage.getItem(RECENT_DATA_SOURCES_KEY);
    if (!stored) return [];
    const items: RecentDataSourceItem[] = JSON.parse(stored);
    // 按时间戳倒序排序，取前7个
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
};

/**
 * 保存最近使用的数据源
 */
export const saveRecentDataSource = (dataSource: DataResource): void => {
  try {
    const items = getRecentDataSources();
    // 移除已存在的相同数据源
    const filtered = items.filter((item) => item.id !== dataSource.id);
    // 添加新数据源到开头
    const newItem: RecentDataSourceItem = {
      id: dataSource.id,
      name: dataSource.name,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_DATA_SOURCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('保存最近使用的数据源失败:', error);
  }
};

/**
 * 计算下拉菜单位置（参考 Ant Design Mentions 的智能定位）
 * 使用镜像元素精确计算光标位置
 * 支持 TextArea 和 contentEditable div
 * @param editorRef TextArea 或 contentEditable div 的 ref 引用
 * @returns 下拉菜单的位置信息
 */
export const calculateMentionPosition = (
  editorRef: React.RefObject<any>,
): MentionPosition => {
  if (!editorRef.current) {
    return { left: 0, top: 0, visible: false };
  }

  // 支持 TextArea 和 contentEditable div
  const editor =
    editorRef.current.resizableTextArea?.textArea || editorRef.current;
  if (!editor) {
    return { left: 0, top: 0, visible: false };
  }

  const rect = editor.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(editor);

  // 获取光标位置
  let selectionStart = 0;
  let textBeforeCursor = '';
  let textAfterCursor = '';

  if (editor instanceof HTMLTextAreaElement) {
    // TextArea 情况
    selectionStart = editor.selectionStart;
    textBeforeCursor = editor.value.slice(0, selectionStart);
    textAfterCursor = editor.value.slice(selectionStart);
  } else if (editor instanceof HTMLDivElement && editor.isContentEditable) {
    // contentEditable div 情况
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE) {
        textBeforeCursor =
          textNode.textContent?.slice(0, range.startOffset) || '';
        textAfterCursor = textNode.textContent?.slice(range.startOffset) || '';
        // 计算光标前的文本长度（需要遍历所有文本节点）
        const walker = document.createTreeWalker(
          editor,
          NodeFilter.SHOW_TEXT,
          null,
        );
        let node;
        let offset = 0;
        while ((node = walker.nextNode())) {
          if (node === textNode) {
            offset += range.startOffset;
            break;
          }
          offset += node.textContent?.length || 0;
        }
        selectionStart = offset;
      } else {
        // 如果不是文本节点，使用纯文本内容
        const plainText = editor.textContent || '';
        textBeforeCursor = plainText;
        textAfterCursor = '';
        selectionStart = plainText.length;
      }
    }
  } else {
    return { left: 0, top: 0, visible: false };
  }

  // 创建镜像元素，完全模拟 editor 的样式
  const mirror = document.createElement('div');
  const mirrorStyles: Record<string, string> = {
    position: 'fixed', // 使用 fixed 定位，确保相对于视口定位
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    font: computedStyle.font,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily,
    fontWeight: computedStyle.fontWeight,
    fontStyle: computedStyle.fontStyle,
    letterSpacing: computedStyle.letterSpacing,
    textTransform: computedStyle.textTransform,
    padding: computedStyle.padding,
    border: computedStyle.border,
    boxSizing: computedStyle.boxSizing,
    width: `${editor.clientWidth}px`,
    minHeight: '1px',
    top: `${rect.top}px`, // 设置 editor 的 top 位置
    left: `${rect.left}px`, // 设置 editor 的 left 位置
    zIndex: '-1',
  };
  Object.assign(mirror.style, mirrorStyles);

  // 获取行高（用于计算行底部位置）
  const lineHeight =
    parseFloat(computedStyle.lineHeight) ||
    parseFloat(computedStyle.fontSize) * 1.5;

  // 创建文本节点，在光标位置插入标记
  // 使用更简单的方法：在文本中插入一个零宽度的标记元素
  const textNode1 = document.createTextNode(textBeforeCursor);
  const marker = document.createElement('span');
  // 创建一个零宽度的标记，高度等于行高，确保底部对齐到行底部
  marker.style.display = 'inline-block';
  marker.style.width = '1px';
  marker.style.height = `${lineHeight}px`; // 使用行高作为高度
  marker.style.verticalAlign = 'top';
  marker.style.position = 'relative';
  marker.style.overflow = 'hidden';
  // 使用零宽空格作为内容，确保标记在文本流中
  marker.textContent = '\u200B'; // 零宽空格
  const textNode2 = document.createTextNode(textAfterCursor);

  mirror.appendChild(textNode1);
  mirror.appendChild(marker);
  mirror.appendChild(textNode2);

  // 将镜像元素添加到 body，使用 fixed 定位确保位置准确
  document.body.appendChild(mirror);

  // 强制浏览器重新计算布局，确保镜像元素位置正确
  // 通过访问 offsetHeight 触发重排
  void mirror.offsetHeight;

  // 获取标记的位置（这就是光标位置）
  // 使用 getBoundingClientRect 获取相对于视口的位置
  const markerRect = marker.getBoundingClientRect();

  // 计算光标位置
  // 标记的位置就是光标位置（相对于视口）
  // marker 的 top 是光标所在行的顶部，bottom 是光标所在行的底部
  let cursorX = markerRect.left;
  let cursorY = markerRect.bottom; // 使用 bottom 作为光标所在行的底部位置

  // 如果标记位置无效（可能是因为标记没有正确渲染），使用备用方法
  // 检查标记是否在视口外或尺寸异常
  if (
    markerRect.width === 0 ||
    markerRect.height === 0 ||
    markerRect.left < 0 ||
    markerRect.top < 0 ||
    markerRect.right > window.innerWidth ||
    markerRect.bottom > window.innerHeight
  ) {
    // 备用方法：计算文本宽度
    const textWidth = mirror.offsetWidth;

    // 计算最后一行的宽度
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    let cursorXInLine = textWidth;

    if (lastNewlineIndex !== -1) {
      const lastLineText = textBeforeCursor.slice(lastNewlineIndex + 1);
      const lastLineDiv = document.createElement('div');
      Object.assign(lastLineDiv.style, mirrorStyles);
      lastLineDiv.textContent = lastLineText;
      document.body.appendChild(lastLineDiv);
      cursorXInLine = lastLineDiv.offsetWidth;
      document.body.removeChild(lastLineDiv);
    }

    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const scrollLeft = (editor as HTMLElement).scrollLeft || 0;
    const scrollTop = (editor as HTMLElement).scrollTop || 0;

    cursorX = rect.left + borderLeft + paddingLeft + cursorXInLine - scrollLeft;

    // 计算光标所在行的底部位置
    // 需要计算光标所在行数，然后计算该行的底部位置
    const lines = textBeforeCursor.split('\n');
    const lineCount = lines.length;
    const currentLineIndex = lineCount - 1; // 当前行索引（从0开始）

    // 计算光标所在行的顶部位置
    const currentLineTop =
      rect.top +
      borderTop +
      paddingTop +
      currentLineIndex * lineHeight -
      scrollTop;
    // 计算光标所在行的底部位置
    cursorY = currentLineTop + lineHeight;
  }

  // 清理临时元素
  document.body.removeChild(mirror);

  // 弹层尺寸（参考 Ant Design Mentions）
  const dropdownWidth = 260;
  const dropdownHeight = 332;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const minMargin = 8; // 最小边距
  const horizontalOffset = 8; // 水平偏移量，让下拉菜单稍微靠右一点
  const verticalOffset = -16; // 垂直偏移量，让下拉菜单稍微靠下一点

  // 计算弹层位置（参考 Ant Design Mentions 的智能定位）
  // X 轴：弹层左侧对齐光标位置右侧
  let left = cursorX + horizontalOffset;

  // Y 轴：下拉菜单底部对齐光标所在行的底部
  // 使用光标所在行的底部位置作为下拉菜单的底部
  let top = cursorY - dropdownHeight + verticalOffset;

  // 水平定位：优先在光标右侧，如果右侧空间不够，调整到左侧
  if (cursorX + dropdownWidth + horizontalOffset > viewportWidth - minMargin) {
    // 右侧空间不够，尝试将弹层左边缘对齐光标位置
    if (cursorX - dropdownWidth >= minMargin) {
      // 左侧有足够空间，将弹层放在光标左侧
      left = cursorX - dropdownWidth - horizontalOffset;
    } else {
      // 左右都不够，则右对齐到视口右边缘
      left = viewportWidth - dropdownWidth - minMargin;
    }
  }

  // 垂直定位：下拉菜单底部对齐光标所在行的底部
  // 如果上方空间不够（top < minMargin），调整下拉菜单位置
  if (top < minMargin) {
    // 上方空间不够，将下拉菜单放在光标下方（顶部对齐光标所在行底部）
    top = cursorY;
  }

  // 如果下拉菜单超出视口底部，向上调整
  if (top + dropdownHeight > viewportHeight - minMargin) {
    // 下拉菜单底部对齐到视口底部
    top = viewportHeight - dropdownHeight - minMargin;
  }

  // 确保位置在视口范围内
  left = Math.max(
    minMargin,
    Math.min(left, viewportWidth - dropdownWidth - minMargin),
  );
  top = Math.max(
    minMargin,
    Math.min(top, viewportHeight - dropdownHeight - minMargin),
  );

  // 下拉菜单使用 fixed 定位
  return {
    left,
    top,
    visible: true,
  };
};
