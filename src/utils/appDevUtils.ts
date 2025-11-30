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

// /**
//  * 根据行号和列号更新 HTML/JSX 内容中元素的 class 属性
//  * @param content - 文件内容（HTML 或 JSX 字符串）
//  * @param className - 要设置的 class 属性值
//  * @param row - 行号（从 0 开始，对应文件中的实际行号）
//  * @param column - 列号（从 0 开始，对应该行中的字符位置）
//  * @returns 更新后的文件内容
//  */
// export const updateElementClassNameByPosition = (
//   content: string,
//   className: string,
//   row: number,
//   column: number,
// ): string => {
//   if (!content || typeof content !== 'string') {
//     console.warn('文件内容为空，无法更新元素的 class 属性');
//     return content;
//   }

//   // 按行分割内容（考虑不同操作系统的换行符）
//   const lines = content.split(/\r\n|\n|\r/);

//   // 检查行号是否有效（row 从 0 开始，对应第 row+1 行）
//   if (row < 0 || row >= lines.length) {
//     console.warn(`行号 ${row} 超出范围，总行数: ${lines.length}`);
//     return content;
//   }

//   // 获取目标行内容
//   const targetLine = lines[row];

//   // 检查列号是否在行内有效
//   if (column < 0 || column > targetLine.length) {
//     console.warn(
//       `列号 ${column} 超出范围，第 ${row + 1} 行的长度为: ${targetLine.length}`,
//     );
//     return content;
//   }

//   // 匹配该行中的所有 HTML/JSX 元素标签
//   // 支持格式：
//   // 1. <tag>...</tag> （普通标签）
//   // 2. <tag ... /> （自闭合标签）
//   // 3. <Component prop={value} /> （JSX 组件，支持大写开头的标签名）
//   // 4. 支持属性中包含 > 的情况（通过更智能的解析）
//   const elementRegex = /<([\w-]+)([^>]*?)(?:\/>|>)/g;

//   const elementMatches: Array<{
//     fullMatch: string;
//     tag: string;
//     attributes: string;
//     startIndex: number;
//     endIndex: number;
//     isSelfClosing: boolean;
//   }> = [];

//   let match;
//   let lastIndex = 0;

//   while ((match = elementRegex.exec(targetLine)) !== null) {
//     // 避免重复匹配
//     if (match.index < lastIndex) {
//       continue;
//     }

//     const fullMatch = match[0];
//     const tag = match[1];
//     const attributes = (match[2] || '').trim();
//     const isSelfClosing = fullMatch.trim().endsWith('/>');

//     // 如果不是自闭合标签，需要找到对应的结束标签
//     let endIndex = match.index + fullMatch.length;
//     if (!isSelfClosing) {
//       // 查找结束标签 </tag>
//       const endTagRegex = new RegExp(`</${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'gi');
//       endTagRegex.lastIndex = endIndex;
//       const endMatch = endTagRegex.exec(targetLine);
//       if (endMatch) {
//         endIndex = endMatch.index + endMatch[0].length;
//         const fullElement = targetLine.substring(match.index, endIndex);
//         elementMatches.push({
//           fullMatch: fullElement,
//           tag,
//           attributes,
//           startIndex: match.index,
//           endIndex,
//           isSelfClosing: false,
//         });
//       } else {
//         // 如果找不到结束标签，只记录开始标签
//         elementMatches.push({
//           fullMatch,
//           tag,
//           attributes,
//           startIndex: match.index,
//           endIndex: match.index + fullMatch.length,
//           isSelfClosing: true, // 当作自闭合处理
//         });
//       }
//     } else {
//       elementMatches.push({
//         fullMatch,
//         tag,
//         attributes,
//         startIndex: match.index,
//         endIndex,
//         isSelfClosing: true,
//       });
//     }

//     lastIndex = endIndex;
//   }

//   // 根据列号（字符位置）找到包含该位置或最接近的元素
//   let targetElement: typeof elementMatches[0] | null = null;

//   // 首先尝试找到包含该列号位置的元素
//   for (const element of elementMatches) {
//     if (column >= element.startIndex && column < element.endIndex) {
//       targetElement = element;
//       break;
//     }
//   }

//   // 如果没找到包含该位置的元素，找最接近的元素（最近的开始位置）
//   if (!targetElement && elementMatches.length > 0) {
//     // 按距离排序，选择最近的元素
//     targetElement = elementMatches.reduce((closest, current) => {
//       const closestDistance = Math.abs(closest.startIndex - column);
//       const currentDistance = Math.abs(current.startIndex - column);
//       return currentDistance < closestDistance ? current : closest;
//     });
//   }

//   if (!targetElement) {
//     console.warn(
//       `第 ${row + 1} 行第 ${column + 1} 列位置附近未找到 HTML 元素。行内容: ${targetLine.substring(0, 100)}...`,
//     );
//     return content;
//   }

//   // 更新 class 属性
//   // 处理 class 属性的正则表达式（支持单引号和双引号，以及 className）
//   const classAttrRegex = /\s+(?:class|className)\s*=\s*(["'])([^"']*)\1/i;
//   const classAttrMatch = targetElement.attributes.match(classAttrRegex);

//   let updatedAttributes = targetElement.attributes.trim();

//   if (classAttrMatch) {
//     // 如果已存在 class 或 className 属性，替换它
//     if (className.trim()) {
//       updatedAttributes = updatedAttributes.replace(
//         classAttrRegex,
//         ` class="${className}"`,
//       );
//     } else {
//       // 移除 class/className 属性
//       updatedAttributes = updatedAttributes.replace(classAttrRegex, '').trim();
//     }
//   } else {
//     // 如果不存在 class 属性，添加它
//     if (className.trim()) {
//       // 在标签名后添加 class 属性（如果有其他属性，在属性前添加；如果没有属性，在 > 或 /> 前添加）
//       if (updatedAttributes) {
//         updatedAttributes = `${updatedAttributes} class="${className}"`;
//       } else {
//         updatedAttributes = `class="${className}"`;
//       }
//     }
//   }

//   // 构建更新后的元素标签
//   const attributesStr = updatedAttributes ? ` ${updatedAttributes}` : '';

//   // 提取元素的原始内容（如果存在）
//   let elementContent = '';
//   if (!targetElement.isSelfClosing) {
//     // 从完整匹配中提取标签之间的内容
//     const contentMatch = targetElement.fullMatch.match(
//       new RegExp(`<${targetElement.tag}[^>]*>([\\s\\S]*?)</${targetElement.tag}>`, 'i'),
//     );
//     if (contentMatch) {
//       elementContent = contentMatch[1];
//     }
//   }

//   const updatedElement = targetElement.isSelfClosing
//     ? `<${targetElement.tag}${attributesStr} />`
//     : `<${targetElement.tag}${attributesStr}>${elementContent}</${targetElement.tag}>`;

//   // 替换目标行中的目标元素
//   const updatedLine =
//     targetLine.substring(0, targetElement.startIndex) +
//     updatedElement +
//     targetLine.substring(targetElement.endIndex);

//   // 替换原始内容中的目标行
//   // 检测换行符类型（\r\n, \n, 或 \r）
//   const lineBreakMatch = content.match(/\r\n|\n|\r/);
//   const lineBreak = lineBreakMatch ? lineBreakMatch[0] : '\n';

//   // 重新拼接所有行（使用检测到的换行符）
//   const updatedLines = [...lines];
//   updatedLines[row] = updatedLine;

//   return updatedLines.join(lineBreak);
// };

/**
 * 在文件树中查找文件节点
 */
export const findFileNodeByName = (
  fileName: string,
  treeData: FileNode[],
): FileNode | null => {
  for (const node of treeData) {
    if (node.name === fileName) {
      return node;
    }
    if (node.children) {
      const found = findFileNode(fileName, node.children);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// /**
//  * 根据文件名、className、行号和列号更新文件树中对应文件的 content 属性
//  * @param fileName - 文件名（文件ID，完整路径）
//  * @param className - 要设置的 class 属性值
//  * @param row - 行号（从 0 开始，对应 tr 标签）
//  * @param column - 列号（从 0 开始，对应 td 或 th 标签）
//  * @param fileTreeData - 文件树数据
//  * @returns 更新后的文件树数据
//  */
// export const updateFileClassNameInTree = (
//   fileName: string,
//   className: string,
//   row: number,
//   column: number,
//   fileTreeData: FileNode[],
// ): FileNode[] => {
//   // 查找文件节点
//   const fileNode = findFileNodeByName(fileName, fileTreeData);

//   console.log(' 根据文件名、className、行号和列号更新文件树中对应文件的 content 属性', fileNode);

//   if (!fileNode || !fileNode.content) {
//     console.warn(`文件 ${fileName} 不存在或内容为空`);
//     return fileTreeData;
//   }

//   // 使用工具函数根据行列号更新元素的 class 属性
//   const updatedContent = updateElementClassNameByPosition(
//     fileNode.content,
//     className,
//     row,
//     column,
//   );

//   // 如果内容没有变化，直接返回原始数据
//   if (updatedContent === fileNode.content) {
//     return fileTreeData;
//   }

//   // 递归更新文件树中对应文件的内容
//   const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
//     return nodes.map((node) => {
//       if (node.id === fileName) {
//         return {
//           ...node,
//           content: updatedContent,
//           lastModified: Date.now(),
//         };
//       }
//       if (node.children) {
//         return { ...node, children: updateFileInTree(node.children) };
//       }
//       return node;
//     });
//   };

//   return updateFileInTree(fileTreeData);
// };

// 转义正则表达式
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 智能样式替换
async function smartReplaceStyle(line: string, options: any): Promise<string> {
  // 这里可以实现更复杂的样式替换逻辑
  // 比如使用AST解析或者正则表达式匹配
  if (options.originalValue && line.includes(options.originalValue)) {
    return line.replace(
      new RegExp(escapeRegExp(options.originalValue), 'g'),
      options.newValue,
    );
  }

  // 如果没有原始值，使用列号信息进行更精确的替换
  const parts = line.split('=');
  if (parts.length >= 2) {
    const attributeName = parts[0].trim();
    // const attributeValue = parts.slice(1).join('=').trim();
    const newAttributeValue = options.newValue;

    if (attributeName === 'className') {
      return `${attributeName}={${newAttributeValue}}`;
    }
  }

  return options.newValue;
}

// 智能内容替换
async function smartReplaceContent(
  line: string,
  options: any,
): Promise<string> {
  // 对于React JSX内容，可以使用更精确的替换
  if (options.originalValue && line.includes(options.originalValue)) {
    return line.replace(
      new RegExp(escapeRegExp(options.originalValue), 'g'),
      options.newValue,
    );
  }

  // 如果在标签内容中，尝试替换标签内容部分
  const contentMatch = line.match(/>([^<]*)</);
  if (contentMatch && contentMatch[1] === options.originalValue) {
    return line.replace(contentMatch[0], `>${options.newValue}<`);
  }

  return options.newValue;
}

// 智能属性替换
async function smartReplaceAttribute(
  line: string,
  options: any,
): Promise<string> {
  // 实现属性替换逻辑
  return line.replace(
    new RegExp(`${options.attributeName}="[^"]*"`),
    `${options.attributeName}="${options.newValue}"`,
  );
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
  },
  // rootDir: string
): Promise<string> {
  const lines = content.split('\n');
  const targetLine = Math.max(0, options.lineNumber - 1);

  if (targetLine >= lines.length) {
    throw new Error(`Line ${options.lineNumber} exceeds file length`);
  }

  const line = lines[targetLine];
  let newLine = line;

  try {
    switch (options.type) {
      case 'style':
        // 处理样式更新
        newLine = await smartReplaceStyle(line, options);
        break;
      case 'content':
        // 处理内容更新
        newLine = await smartReplaceContent(line, options);
        break;
      case 'attribute':
        // 处理属性更新
        newLine = await smartReplaceAttribute(line, options);
        break;
    }

    lines[targetLine] = newLine;
    return lines.join('\n');
  } catch (error) {
    throw new Error(
      `Smart replacement failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
