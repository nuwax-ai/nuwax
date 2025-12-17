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
  } else if (name.endsWith('.md')) {
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
  files: any[],
  fileNode: FileNode,
  newName: string,
  operation: 'create' | 'delete' | 'rename' | 'modify',
): FileNode[] => {
  const oldPath = fileNode.path;
  const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
  const newPath = parentPath
    ? `${parentPath}/${newName.trim()}`
    : newName.trim();

  // 更新原始文件列表中的文件名（包含完整路径+文件名+后缀）
  return files?.map((file: any) => {
    // 如果是文件夹，需要更新文件夹本身以及所有子文件
    if (fileNode.type === 'folder') {
      // 检查是否是文件夹本身（虽然扁平列表中文件夹可能不存在）
      if (file.name === oldPath) {
        return {
          ...file,
          name: newPath, // 更新为新的完整路径
          renameFrom: oldPath, // 记录重命名前的名字
          operation, // 操作类型
        };
      }

      // 检查是否是文件夹的子文件
      if (file.name.startsWith(oldPath + '/')) {
        // 计算新路径：将 oldPath 前缀替换为 newPath
        const relativePath = file.name.substring(oldPath.length);
        const newFilePath = newPath + relativePath;

        return {
          ...file,
          name: newFilePath, // 更新为新的完整路径
          renameFrom: file.name, // 记录重命名前的名字
          operation, // 操作类型
        };
      }
    } else {
      // 如果是文件，直接更新匹配的文件
      if (file.name === oldPath) {
        return {
          ...file,
          name: newPath, // 更新为新的完整路径
          renameFrom: oldPath, // 记录重命名前的名字
          operation, // 操作类型
        };
      }
    }

    return file;
  });
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
