/* eslint-disable */
/**
 * AppDev 页面相关工具函数
 */

import { FILE_CONSTANTS } from '@/constants/appDevConstants';
import type { FileNode } from '@/types/interfaces/appDev';

/**
 * 将扁平的文件列表转换为树形结构
 */
export const transformFlatListToTree = (files: any[]): FileNode[] => {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // 过滤掉系统文件
  const filteredFiles = files.filter((file) => {
    const fileName = file.name.split('/').pop();
    return !FILE_CONSTANTS.IGNORED_FILE_PATTERNS.some((pattern) =>
      pattern.test(fileName || ''),
    );
  });

  // 创建所有文件节点和必要的文件夹节点
  filteredFiles.forEach((file) => {
    const pathParts = file.name.split('/').filter(Boolean);
    const fileName = pathParts[pathParts.length - 1];
    const isFile = fileName.includes('.');

    const node: FileNode = {
      id: file.name,
      name: fileName,
      type: isFile ? 'file' : 'folder',
      path: file.name,
      children: [],
      binary: file.binary || false,
      size:
        file.size || file.sizeExceeded
          ? FILE_CONSTANTS.FALLBACK_SIZE
          : file.contents?.length || FILE_CONSTANTS.FALLBACK_SIZE,
      status: file.status || null,
      fullPath: file.name,
      parentPath: pathParts.slice(0, -1).join('/') || null,
      content: file.contents || '',
      lastModified: Date.now(),
    };

    map.set(file.name, node);

    // 如果文件在子目录中，确保创建所有必要的父文件夹节点
    if (pathParts.length > 1) {
      for (let i = pathParts.length - 2; i >= 0; i--) {
        const parentPath = pathParts.slice(0, i + 1).join('/');
        const parentName = pathParts[i];

        if (!map.has(parentPath)) {
          const parentNode: FileNode = {
            id: parentPath,
            name: parentName,
            type: 'folder',
            path: parentPath,
            children: [],
            parentPath: i > 0 ? pathParts.slice(0, i).join('/') : null,
            lastModified: Date.now(),
          };
          map.set(parentPath, parentNode);
        }
      }
    }
  });

  // 构建层次结构
  map.forEach((node) => {
    if (node.parentPath && map.has(node.parentPath)) {
      const parentNode = map.get(node.parentPath)!;
      if (
        !parentNode.children?.find((child: FileNode) => child.id === node.id)
      ) {
        parentNode.children?.push(node);
      }
    } else if (!node.parentPath) {
      if (!root.find((item: FileNode) => item.id === node.id)) {
        root.push(node);
      }
    }
  });

  // 排序：文件夹在前，文件在后，同类型按名称排序
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  return sortNodes(root).map((node) => ({
    ...node,
    children: node.children ? sortNodes(node.children) : undefined,
  }));
};

/**
 * 将树形结构转换为扁平列表格式（用于保存）
 */
export const treeToFlatList = (treeData: FileNode[]): any[] => {
  const result: any[] = [];

  const traverse = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push({
          name: node.id,
          binary: node.binary || false,
          sizeExceeded: node.sizeExceeded || false,
          contents: node.content || '',
          size: node.size || FILE_CONSTANTS.FALLBACK_SIZE,
          status: node.status || null,
        });
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };

  traverse(treeData);
  return result;
};

/**
 * 在文件树中查找第一个可用的文件
 */
export const findFirstFile = (treeData: FileNode[]): string | null => {
  for (const node of treeData) {
    if (node.type === 'file') {
      // 跳过系统文件和隐藏文件
      const fileName = node.name || node.id || '';
      if (
        FILE_CONSTANTS.IGNORED_FILE_PATTERNS.some((pattern) =>
          pattern.test(fileName),
        ) ||
        fileName.startsWith('.') // 跳过以"."为前缀的隐藏文件
      ) {
        continue;
      }
      return node.id;
    }
    if (node.children && node.children.length > 0) {
      const fileInChildren = findFirstFile(node.children);
      if (fileInChildren) {
        return fileInChildren;
      }
    }
  }
  return null;
};

/**
 * 在文件树中查找文件节点
 */
export const findFileNode = (
  fileId: string,
  treeData: FileNode[],
): FileNode | null => {
  for (const node of treeData) {
    if (node.id === fileId) {
      return node;
    }
    if (node.children) {
      const found = findFileNode(fileId, node.children);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

/**
 * 根据文件ID构建完整的文件路径
 */
export const getFilePath = (
  fileId: string,
  treeData: FileNode[],
): string | null => {
  for (const node of treeData) {
    if (node.id === fileId) {
      return node.name;
    }
    if (node.children) {
      const childPath = getFilePath(fileId, node.children);
      if (childPath) {
        return `${node.name}/${childPath}`;
      }
    }
  }
  return null;
};

/**
 * 文件类型枚举
 */
export enum FileType {
  SUPPORTED = 'supported',
  UNSUPPORTED = 'unsupported',
}

/**
 * 判断文件是否为图片类型
 */
export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'svg',
    'ico',
    'tiff',
  ];
  return imageExtensions.includes(ext);
};

/**
 * 判断文件是否支持预览（白名单方案）
 */
export const isPreviewableFile = (fileName: string): boolean => {
  if (!fileName || typeof fileName !== 'string') {
    return false;
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return FILE_CONSTANTS.SUPPORTED_EXTENSIONS.includes(ext as any);
};

/**
 * 根据文件扩展名获取语言类型
 */
export const getLanguageFromFile = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    // TypeScript/JavaScript
    case 'tsx':
    case 'jsx':
      return 'TypeScript React';
    case 'ts':
      return 'TypeScript';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'JavaScript';

    // Stylesheets
    case 'css':
      return 'CSS';
    case 'less':
      return 'Less';
    case 'scss':
      return 'SCSS';
    case 'sass':
      return 'Sass';

    // Markup & Templates
    case 'html':
    case 'htm':
      return 'HTML';
    case 'vue':
      return 'Vue (HTML)';
    case 'xml':
      return 'XML';

    // Data & Configuration
    case 'json':
      return 'JSON';
    case 'jsonc':
      return 'JSON';
    case 'yaml':
    case 'yml':
      return 'YAML';
    case 'toml':
      return 'TOML';
    case 'ini':
      return 'INI';

    // Documentation
    case 'md':
    case 'markdown':
      return 'Markdown';
    case 'txt':
      return FILE_CONSTANTS.DEFAULT_FILE_LANGUAGE;

    // Server & Config
    case 'php':
      return 'PHP';
    case 'py':
      return 'Python';
    case 'java':
      return 'Java';
    case 'go':
      return 'Go';
    case 'rs':
      return 'Rust';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'C++';
    case 'c':
      return 'C';
    case 'cs':
      return 'C#';
    case 'vb':
      return 'VB';
    case 'swift':
      return 'Swift';
    case 'kt':
      return 'Kotlin';
    case 'scala':
      return 'Scala';
    case 'rb':
      return 'Ruby';
    case 'dart':
      return 'Dart';
    case 'lua':
      return 'Lua';
    case 'r':
      return 'R';

    // Web & Scripts
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'Shell';
    case 'ps1':
      return 'PowerShell';
    case 'bat':
    case 'cmd':
      return 'Batch';
    case 'sql':
      return 'SQL';

    // Build & Config
    case 'dockerfile':
      return 'Dockerfile';
    case 'makefile':
      return 'Makefile';
    case 'gitignore':
    case 'dockerignore':
      return FILE_CONSTANTS.DEFAULT_FILE_LANGUAGE;

    // Other common files
    case 'log':
      return 'Log';
    case 'csv':
      return 'CSV';

    default:
      return FILE_CONSTANTS.DEFAULT_FILE_LANGUAGE;
  }
};

/**
 * 生成随机请求ID
 */
export const generateRequestId = (): string => {
  return `${FILE_CONSTANTS.REQUEST_ID_PREFIX}${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
};

/**
 * 生成会话ID
 */
export const generateSessionId = (): string => {
  return `${FILE_CONSTANTS.SESSION_ID_PREFIX}${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 检查文件是否被修改
 */
export const isFileModified = (
  currentContent: string,
  originalContent: string,
): boolean => {
  return currentContent !== originalContent;
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 检测字符串是否为 base64 编码
 */
export const isBase64 = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;

  // 检查是否包含 base64 数据 URL 前缀
  if (str.startsWith('data:')) {
    return /^data:image\/[a-zA-Z0-9]+;base64,/.test(str);
  }

  // 检查是否为纯 base64 字符串（不包含 data URL 前缀）
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length > 0 && str.length % 4 === 0;
};

/**
 * 检测字符串是否为 base64 图片数据
 */
export const isBase64Image = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;

  // 检查是否为 data URL 格式的图片
  if (str.startsWith('data:image/')) {
    return /^data:image\/[a-zA-Z0-9]+;base64,/.test(str);
  }

  // 检查是否为纯 base64 图片数据（通过文件头判断）
  if (isBase64(str)) {
    // 检查常见的图片文件头
    const imageHeaders = [
      '/9j/', // JPEG
      'iVBORw0KGgo', // PNG
      'R0lGOD', // GIF
      'UklGR', // WebP
      'Qk0=', // BMP
    ];

    return imageHeaders.some((header) => str.startsWith(header));
  }

  return false;
};

/**
 * 将 base64 字符串转换为 data URL 格式
 */
export const base64ToDataUrl = (
  base64: string,
  mimeType: string = 'image/png',
): string => {
  if (!base64 || typeof base64 !== 'string') return '';

  // 如果已经是 data URL 格式，直接返回
  if (base64.startsWith('data:')) {
    return base64;
  }

  // 添加 data URL 前缀
  return `data:${mimeType};base64,${base64}`;
};

/**
 * 从 base64 字符串中提取 MIME 类型
 */
export const getMimeTypeFromBase64 = (base64: string): string => {
  if (!base64 || typeof base64 !== 'string') return 'image/png';

  // 如果已经是 data URL 格式，提取 MIME 类型
  if (base64.startsWith('data:')) {
    const match = base64.match(/^data:([^;]+);base64,/);
    return match ? match[1] : 'image/png';
  }

  // 根据文件头判断 MIME 类型
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('Qk0=')) return 'image/bmp';

  // 默认返回 PNG
  return 'image/png';
};

/**
 * 处理图片内容，支持 base64 和普通 URL
 */
export const processImageContent = (
  content: string,
  fallbackUrl?: string,
): string => {
  if (!content) return fallbackUrl || '';

  // 如果是 base64 图片数据，转换为 data URL
  if (isBase64Image(content)) {
    const mimeType = getMimeTypeFromBase64(content);
    return base64ToDataUrl(content, mimeType);
  }

  // 如果是普通 URL，直接返回
  return content;
};

// 转义正则表达式
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 智能样式替换 - 单行版本（被多行版本调用）
async function smartReplaceStyleSingleLine(
  line: string,
  newValue: string,
): Promise<{ found: boolean; newLine: string }> {
  // 1. 尝试匹配 className="..." 或 className='...'
  const classNameRegex = /className=(["'])(.*?)\1/;
  if (classNameRegex.test(line)) {
    return {
      found: true,
      newLine: line.replace(classNameRegex, `className=$1${newValue}$1`),
    };
  }

  // 2. 尝试匹配 className={...}
  const classNameExpressionRegex = /className=\{([^}]*)\}/;
  if (classNameExpressionRegex.test(line)) {
    return {
      found: true,
      newLine: line.replace(
        classNameExpressionRegex,
        `className="${newValue}"`,
      ),
    };
  }

  return { found: false, newLine: line };
}

// 智能样式替换 - 支持多行搜索
async function smartReplaceStyleMultiLine(
  lines: string[],
  startLine: number,
  options: any,
): Promise<{ found: boolean; lineIndex: number; newLine: string }> {
  const { newValue } = options;

  // 1. 首先在当前行尝试查找 className
  const currentLine = lines[startLine];
  const currentResult = await smartReplaceStyleSingleLine(
    currentLine,
    newValue,
  );
  if (currentResult.found) {
    return {
      found: true,
      lineIndex: startLine,
      newLine: currentResult.newLine,
    };
  }

  // 2. 向后搜索 className 属性（最多搜索15行，通常 JSX 属性不会太远）
  const maxSearchLines = Math.min(startLine + 15, lines.length);

  for (let i = startLine + 1; i < maxSearchLines; i++) {
    const searchLine = lines[i];

    // 尝试在这一行找 className
    const result = await smartReplaceStyleSingleLine(searchLine, newValue);
    if (result.found) {
      return {
        found: true,
        lineIndex: i,
        newLine: result.newLine,
      };
    }

    // 如果遇到 > 或 /> 或 </，说明已经过了属性区域
    const trimmed = searchLine.trim();
    if (trimmed === '>' || trimmed.endsWith('/>') || trimmed.startsWith('</')) {
      // 但如果当前行是 >，可能 className 不存在，需要在开始标签行插入
      break;
    }
  }

  // 3. 如果没找到 className，尝试在标签名后插入
  // 回到起始行检查是否有标签名
  const tagMatch = currentLine.match(/<([A-Z][a-zA-Z0-9.]*|[a-z][a-z0-9-]*)/);
  if (tagMatch) {
    const tagName = tagMatch[1];
    return {
      found: true,
      lineIndex: startLine,
      newLine: currentLine.replace(
        tagName,
        `${tagName} className="${newValue}"`,
      ),
    };
  }

  // 4. 如果都无法匹配，返回失败
  console.warn(
    '[DesignMode] Failed to match className or tag in lines starting from:',
    startLine,
  );
  return { found: false, lineIndex: startLine, newLine: currentLine };
}

// 智能属性替换
async function smartReplaceAttribute(
  line: string,
  options: any,
): Promise<string> {
  const regex = new RegExp(`${escapeRegExp(options.attributeName)}="[^"]*"`);
  if (regex.test(line)) {
    return line.replace(
      regex,
      `${options.attributeName}="${options.newValue}"`,
    );
  }

  // 如果无法匹配，返回原行
  console.warn(
    '[DesignMode] Failed to match attribute in line:',
    line,
    'attributeName:',
    options.attributeName,
  );
  return line;
}

// 智能替换源码
export async function smartReplaceInSource(
  content: string,
  options: {
    lineNumber: number;
    columnNumber: number;
    newValue: string;
    originalValue?: string;
    type: 'style' | 'content' | 'attribute';
    tagName?: string;
  },
  // rootDir: string
): Promise<string> {
  const lines = content.split('\n');
  const targetLine = Math.max(0, options.lineNumber - 1);

  if (targetLine >= lines.length) {
    throw new Error(`Line ${options.lineNumber} exceeds file length`);
  }

  const line = lines[targetLine];

  try {
    switch (options.type) {
      case 'style': {
        // 处理样式更新 - 可能需要向后搜索多行
        const styleResult = await smartReplaceStyleMultiLine(
          lines,
          targetLine,
          options,
        );
        if (styleResult.found) {
          lines[styleResult.lineIndex] = styleResult.newLine;
        } else {
          console.warn('[DesignMode] Style (className) not found in element');
        }
        break;
      }
      case 'content': {
        // 处理内容更新 - 可能需要向后搜索多行
        const contentResult = await smartReplaceContentMultiLineImpl(
          lines,
          targetLine,
          options,
        );
        if (contentResult.found) {
          // Handle multi-line replacement (splicing)
          const deleteCount =
            (contentResult.endLine || contentResult.startLine) -
            contentResult.startLine +
            1;
          lines.splice(
            contentResult.startLine,
            deleteCount,
            ...contentResult.newLines,
          );
        } else {
          console.warn(
            '[DesignMode] Content not found in element:',
            options.originalValue,
          );
        }
        break;
      }
      case 'attribute': {
        // 处理属性更新 - 只在目标行处理
        lines[targetLine] = await smartReplaceAttribute(line, options);
        break;
      }
    }

    return lines.join('\n');
  } catch (error) {
    console.error(
      `Smart replacement failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
    return content; // Return original content on error
  }
}

/**
 * Replace content safely by ignoring text inside <...> tags
 */
function safeReplaceContentInLine(
  line: string,
  originalValue: string,
  newValue: string,
): string {
  if (!originalValue) return line;

  // Split by tags: (<[^>]*>) captures the tags
  // This is a simple heuristic that works for most standard JSX/HTML
  const parts = line.split(/(<[^>]*>)/g);

  return parts
    .map((part) => {
      // If it starts with < and ends with >, treat it as a tag and don't replace
      if (part.startsWith('<') && part.endsWith('>')) {
        return part;
      } else {
        // It's text outside of tags. Perform replacement here.
        return part.replace(
          new RegExp(escapeRegExp(originalValue), 'g'),
          newValue,
        );
      }
    })
    .join('');
}

/**
 * 智能内容替换 - 支持多行搜索
 * 用例文档在：docs/ch/smart_replace_test_cases.md
 * @param lines
 * @param startLine
 * @param options
 * @returns
 */
async function smartReplaceContentMultiLineImpl(
  lines: string[],
  startLine: number,
  options: any,
): Promise<{
  found: boolean;
  startLine: number;
  endLine?: number;
  newLines: string[];
}> {
  const { originalValue, newValue, columnNumber } = options;

  // Legacy single line replacement helper wrapper
  const singleLineResult = (lineIndex: number, lineContent: string) => ({
    found: true,
    startLine: lineIndex,
    endLine: lineIndex,
    newLines: [lineContent],
  });

  // 1. First try exact match in current line
  const currentLine = lines[startLine];

  if (originalValue) {
    const safeReplaced = safeReplaceContentInLine(
      currentLine,
      originalValue,
      newValue,
    );
    if (safeReplaced !== currentLine) {
      return singleLineResult(startLine, safeReplaced);
    }
  }

  // 2. Search forward for exact match (up to 20 lines)
  const maxSearchLines = Math.min(startLine + 20, lines.length);

  for (let i = startLine + 1; i < maxSearchLines; i++) {
    const searchLine = lines[i];

    // If original value found inline (and not inside tag)
    if (originalValue) {
      const safeReplaced = safeReplaceContentInLine(
        searchLine,
        originalValue,
        newValue,
      );
      if (safeReplaced !== searchLine) {
        return singleLineResult(i, safeReplaced);
      }
    }

    // Check if trimmed line IS exactly the original value
    const trimmedSearchLine = searchLine.trim();
    if (originalValue && trimmedSearchLine === originalValue) {
      const leadingWhitespace = searchLine.match(/^(\s*)/)?.[1] || '';
      return singleLineResult(i, leadingWhitespace + newValue);
    }

    // 如果遇到当前元素的闭合标签，停止搜索
    // 注意：</开头的标签表示闭合，我们应该在找到闭合标签后停止
    if (searchLine.trim().startsWith('</') || searchLine.includes('/>')) {
      break;
    }
  }

  // 3. Fallback: Structural replacement using columnNumber OR tagName (Fuzzy Match)
  // If exact text match failed, we try to locate the element by column number or tag name
  if (columnNumber !== undefined || options.tagName) {
    let colIndex = -1;
    let targetLineIndex = startLine;

    // Strategy A: Try columnNumber (only valid if on startLine)
    if (columnNumber !== undefined) {
      colIndex = columnNumber - 1; // 1-based to 0-based
    }

    // Check if valid start of tag
    const isValidTagStart = (index: number, line: string) => {
      // Must start with < and not be </
      return line[index] === '<' && line[index + 1] !== '/';
    };

    // If columnNumber didn't point to a valid tag start, try Strategy B: Fuzzy Tag Match
    if (
      colIndex === -1 ||
      colIndex >= currentLine.length ||
      !isValidTagStart(colIndex, currentLine)
    ) {
      if (options.tagName) {
        // Search window: startLine to startLine + 300 (handle large source map inaccuracies)
        const searchLimit = Math.min(startLine + 300, lines.length);
        const escapedTagName = escapeRegExp(options.tagName);
        const tagRegex = new RegExp(`<${escapedTagName}(?=[\\s>/>])`);

        for (let i = startLine; i < searchLimit; i++) {
          const line = lines[i];
          const match = line.match(tagRegex);
          if (match && match.index !== undefined) {
            colIndex = match.index;
            targetLineIndex = i;
            console.log(
              `[DesignMode] Fuzzy match found for <${options.tagName}> at line ${i} index ${colIndex}`,
            );
            break;
          }
        }
      }
    }

    // If we have a valid index, proceed with structural replacement
    if (colIndex !== -1 && targetLineIndex < lines.length) {
      const targetLine = lines[targetLineIndex];
      // Re-verify start of tag in case we found it via fuzzy match
      if (isValidTagStart(colIndex, targetLine)) {
        // Extract the tag name at the column position
        const lineSuffix = targetLine.substring(colIndex);
        const tagMatch = lineSuffix.match(/^<([a-zA-Z0-9-.]+)/);

        if (tagMatch) {
          const tagName = tagMatch[1];
          const currentLineToReplace = targetLine;

          // Check if it's a self-closing tag in the current line
          let tagEndIndex = -1;
          let isSelfClosing = false;

          // Simple scan for '>' ignoring quotes
          let inQuote = null;
          for (let i = colIndex; i < currentLineToReplace.length; i++) {
            const char = currentLineToReplace[i];
            if (inQuote) {
              if (char === inQuote) inQuote = null;
            } else {
              if (char === '"' || char === "'") inQuote = char;
              else if (char === '>') {
                tagEndIndex = i;
                if (currentLineToReplace[i - 1] === '/') isSelfClosing = true;
                break;
              }
            }
          }

          if (tagEndIndex !== -1) {
            // We found the end of the opening tag

            // Remove dangerouslySetInnerHTML if present (since we are replacing content)
            let openTagContent = currentLineToReplace.substring(
              colIndex,
              tagEndIndex + 1,
            );

            if (openTagContent.includes('dangerouslySetInnerHTML')) {
              openTagContent = openTagContent.replace(
                /dangerouslySetInnerHTML=\{[^}]+\}/g,
                '',
              );
              openTagContent = openTagContent.replace(
                /dangerouslySetInnerHTML/g,
                '',
              );
              openTagContent = openTagContent
                .replace(/\s+/g, ' ')
                .replace(/\s+>/, '>')
                .replace(/\s+\/>/, '/>');
            }

            if (isSelfClosing) {
              const newOpenTag = openTagContent.replace(/\s*\/>$/, '>');
              const newContent = `${newOpenTag}${newValue}</${tagName}>`;

              const newLine =
                currentLineToReplace.substring(0, colIndex) +
                newContent +
                currentLineToReplace.substring(tagEndIndex + 1);
              return singleLineResult(targetLineIndex, newLine);
            } else {
              // Opening tag <Tag ...>
              const closingTag = `</${tagName}>`;
              const closingTagIndex = currentLineToReplace.indexOf(
                closingTag,
                tagEndIndex,
              );

              if (closingTagIndex !== -1) {
                const newLine =
                  currentLineToReplace.substring(0, colIndex) +
                  openTagContent +
                  newValue +
                  currentLineToReplace.substring(closingTagIndex);
                return singleLineResult(targetLineIndex, newLine);
              }

              // Multi-line replacement logic
              // 1. We found the opening tag at `targetLineIndex` (index `colIndex` to `tagEndIndex`)
              // 2. We need to find the closing tag `</tagName>` starting from this line onwards

              let foundClosing = false;
              let closingLineIndex = -1;
              let closingTagInLineIndex = -1;

              for (let j = targetLineIndex; j < lines.length; j++) {
                const checkLine = lines[j];
                // Search for closing tag
                // If same line, we already checked above (closingTagIndex == -1), so start search after tagEndIndex if j==targetLineIndex
                // But since indexOf returned -1, we know it's not on this line (or at least not after start)

                const searchStart = j === targetLineIndex ? tagEndIndex + 1 : 0;
                const closeIdx = checkLine.indexOf(closingTag, searchStart);

                if (closeIdx !== -1) {
                  foundClosing = true;
                  closingLineIndex = j;
                  closingTagInLineIndex = closeIdx;
                  break;
                }
              }

              if (foundClosing) {
                // We have the range! [targetLineIndex, closingLineIndex]

                // Construct new content lines
                // Line 1: BeforeOpenTag + OpenTag + NewValue + AfterClosingTag (if same line - handled above)

                // Multi-line case:
                // Line 1: BeforeOpenTag + OpenTag + NewValue (start) ... wait
                // Actually we want to replace the INNER content or the whole element?
                // Usually content replacement means replacing inner content.
                // But here we are stripping attributes (dangerouslySetInnerHTML), so we are reconstructing the element.

                // Reconstructed Block:
                // <TagName>New Content</TagName>
                // We want to put this where the old element was.

                // Opening Line: ...prefix... <TagName ...> ...
                // Closing Line: ... </TagName> ...suffix...

                // If we just blast it into one line:
                // ...prefix... <TagName>NewValue</TagName> ...suffix...

                const prefix = lines[targetLineIndex].substring(0, colIndex);
                const suffix = lines[closingLineIndex].substring(
                  closingTagInLineIndex + closingTag.length,
                );

                const combinedNewLine =
                  prefix + openTagContent + newValue + `</${tagName}>` + suffix;

                // We replace lines [targetLineIndex] to [closingLineIndex] with [combinedNewLine]
                return {
                  found: true,
                  startLine: targetLineIndex,
                  endLine: closingLineIndex,
                  newLines: [combinedNewLine],
                };
              }

              // Multi-line not supported, warning below
              console.warn(
                '[DesignMode] Structural replacement partial support: Closing tag not found for multi-line element.',
              );
            }
          }
        }
      }
    }
  }

  return { found: false, startLine: startLine, newLines: [] };
}
