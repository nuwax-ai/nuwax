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

    // 调试日志：检查文件数据结构（仅在开发环境）
    if (isFile && process.env.NODE_ENV === 'development') {
      console.log('🔍 [Transform] 处理文件:', {
        name: file.name,
        hasContents: !!file.contents,
        contentsLength: file.contents?.length || 0,
        contentsPreview: file.contents?.substring(0, 50) || 'empty',
        binary: file.binary,
        size: file.size,
      });
    }

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
 * 判断文件是否为图片类型
 */
export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return FILE_CONSTANTS.IMAGE_EXTENSIONS.includes(ext as any);
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
