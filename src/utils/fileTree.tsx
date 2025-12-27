import {
  ICON_CSS,
  ICON_DEFAULT,
  ICON_HTML,
  ICON_JS,
  ICON_JSON,
  ICON_MD,
  ICON_PNG,
  ICON_SQL,
  ICON_SVG,
  ICON_TS,
  ICON_TSX,
} from '@/constants/fileTreeImages.constants';
import type { FileNode } from '@/types/interfaces/appDev';
import { SkillFileInfo } from '@/types/interfaces/skill';
import { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { message } from 'antd';
import { isMarkdownFile } from './common';

// 获取文件图标
export const getFileIcon = (name: string) => {
  if (name.startsWith('.')) {
    return <ICON_DEFAULT />;
  }

  // 代码文件
  if (name.endsWith('.ts')) {
    return <ICON_TS />;
  } else if (name.endsWith('.tsx') || name.endsWith('.jsx')) {
    return <ICON_TSX />;
  } else if (name.endsWith('.css')) {
    return <ICON_CSS />;
  } else if (
    name.endsWith('.json') ||
    name.endsWith('.yml') ||
    name.endsWith('.yaml')
  ) {
    return <ICON_JSON />;
  } else if (isMarkdownFile(name)) {
    return <ICON_MD />;
  } else if (name.endsWith('.html') || name.endsWith('.htm')) {
    return <ICON_HTML />;
  } else if (name.endsWith('.js')) {
    return <ICON_JS />;
  } else if (
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.gif') ||
    name.endsWith('.bmp') ||
    name.endsWith('.webp') ||
    name.endsWith('.ico') ||
    name.endsWith('.tiff')
  ) {
    return <ICON_PNG />;
  } else if (name.endsWith('.svg')) {
    return <ICON_SVG />;
  } else if (name.endsWith('.sql')) {
    return <ICON_SQL />;
  } else {
    return <ICON_DEFAULT />;
  }
};

/**
 * 更新文件树中的文件名、路径（用于即时反馈），用于文件树视图
 */
export const updateFileTreeName = (
  fileTree: FileNode[],
  fileId: string,
  newName: string,
): FileNode[] => {
  return fileTree.map((node) => {
    if (node.id === fileId) {
      return {
        ...node,
        name: newName,
        path:
          node.path.substring(0, node.path.lastIndexOf('/')) + '/' + newName,
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateFileTreeName(node.children, fileId, newName),
      };
    }
    return node;
  });
};

/**
 * 更新技能原始文件列表中的文件名（用于提交更新）
 * @param files 更新原始文件列表中的文件名（用于提交更新）
 * @param fileNode 当前重命名的文件节点
 * @param newName 新的文件名
 * @returns 更新后的文件列表
 */
export const updateFilesListName = (
  files: SkillFileInfo[] | StaticFileInfo[],
  fileNode: FileNode,
  newName: string,
): SkillFileInfo[] | StaticFileInfo[] => {
  // 获取旧路径和新路径
  const oldPath = fileNode.path;
  const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
  const newPath = parentPath
    ? `${parentPath}/${newName.trim()}`
    : newName.trim();

  // 如果是文件，则更新文件名
  if (fileNode.type === 'file') {
    const currentFile = files?.find((file: SkillFileInfo | StaticFileInfo) => {
      return file.fileId === fileNode.id;
    });
    // 如果文件存在，则更新文件名
    if (currentFile) {
      return [
        {
          ...currentFile,
          name: newPath, // 更新为新的完整路径
          renameFrom: oldPath, // 记录重命名前的路径
          operation: 'rename', // 操作类型
        },
      ];
    }
    return [];
  }
  // 如果是文件夹，则更新文件夹中的文件名
  else {
    // 更新文件夹本身（同后端商量后，直接将此文件夹更新为新的文件夹，不传入子文件信息，达到直接修改文件夹名称的效果）
    return [
      {
        contents: '',
        name: newPath, // 更新为新的完整路径
        renameFrom: oldPath, // 记录重命名前的名字
        operation: 'rename', // 操作类型
        isDir: true,
      },
    ];
  }
};

/**
 * 更新文件内容
 * @param fileId 文件ID
 * @param content 文件内容
 * @param fileTree 当前文件树列表
 * @returns 更新后的文件列表
 */
export const updateFileTreeContent = (
  fileId: string,
  content: string,
  fileTree: FileNode[],
): FileNode[] => {
  const updateFileInTree = (files: FileNode[]): FileNode[] => {
    return files.map((file) => {
      if (file.id === fileId) {
        return { ...file, content, lastModified: Date.now() };
      }
      if (file.children) {
        return { ...file, children: updateFileInTree(file.children) };
      }
      return file;
    });
  };

  return updateFileInTree(fileTree);
};

/**
 * 更新技能原始文件列表中的文件名（用于提交更新）
 * @param files 更新原始文件列表中的文件名（用于提交更新）
 * @param fileNode 当前重命名的文件节点
 * @param newName 新的文件名
 * @returns 更新后的文件列表
 */
export const updateFilesListContent = (
  files: SkillFileInfo[],
  changeFiles: {
    fileId: string;
    fileContent: string;
    originalFileContent: string;
  }[],
  operation: 'create' | 'delete' | 'rename' | 'modify',
): SkillFileInfo[] => {
  // 先将变更列表转换为 Map，避免在循环中多次 find，提升性能到 O(n + m)
  const changeMap = new Map(
    changeFiles.map((item) => [item.fileId, item] as const),
  );

  // 只返回那些在 changeFiles 中有对应记录的文件，并更新其内容和 operation
  return files.reduce<SkillFileInfo[]>((result, file) => {
    if (!file.fileId) {
      return result;
    }
    const changeFile = changeMap.get(file.fileId);
    if (changeFile) {
      result.push({
        ...file,
        contents: changeFile.fileContent,
        operation,
      });
    }
    return result;
  }, []);
};

/**
 * 处理下载单个文件操作
 * @param targetNode 文件节点
 * @returns 下载文件
 */
export const downloadFileByUrl = async (targetNode: FileNode) => {
  const fileProxyUrl = targetNode.fileProxyUrl;
  if (!fileProxyUrl) return;

  const fileName = targetNode.name || 'download';

  try {
    // 构建完整的 URL
    const fullUrl = fileProxyUrl.startsWith('http')
      ? fileProxyUrl
      : `${process.env.BASE_URL || ''}${fileProxyUrl}`;

    // 使用 fetch 获取文件内容
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    // 将响应转换为 Blob
    const blob = await response.blob();

    // 创建临时 URL
    const objectURL = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = objectURL;
    link.download = fileName;
    link.style.display = 'none';

    // 添加到 DOM 并触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    // 释放 URL 对象
    setTimeout(() => {
      URL.revokeObjectURL(objectURL);
    }, 100);
  } catch (error) {
    console.error('下载文件失败:', error);
    message.error('下载文件失败，请重试');
  }
};
