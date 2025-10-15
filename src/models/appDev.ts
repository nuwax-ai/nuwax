import { useState } from 'react';

/**
 * 文件节点接口
 * 表示文件树中的文件或文件夹
 */
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  language?: string;
  children?: FileNode[];
  lastModified: number;
}

/**
 * 工作区接口
 * 表示AppDev的工作区状态
 */
export interface AppDevWorkspace {
  id: string;
  name: string;
  projectId: string;
  devServerUrl?: string;
  files: FileNode[];
  activeFile?: string;
  settings: {
    theme: 'light' | 'dark';
    fontSize: number;
    tabSize: number;
  };
}

/**
 * 从URL参数中获取projectId
 */
export const getProjectIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('projectId');
};

/**
 * 默认工作区配置
 */
const initialWorkspace: AppDevWorkspace = {
  id: 'default',
  name: 'New Project',
  projectId: '',
  files: [],
  settings: {
    theme: 'light',
    fontSize: 14,
    tabSize: 2,
  },
};

/**
 * AppDev状态管理Model
 * 参考 conversationInfo.ts 的模式，提供 AppDev 状态管理功能
 */
export default () => {
  const [workspace, setWorkspace] = useState<AppDevWorkspace>(initialWorkspace);
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [isServiceRunning, setIsServiceRunning] = useState(false);

  /**
   * 设置工作区
   */
  const updateWorkspace = (newWorkspace: Partial<AppDevWorkspace>) => {
    setWorkspace((prev) => ({ ...prev, ...newWorkspace }));
  };

  /**
   * 设置活动文件
   */
  const setActiveFile = (fileId: string) => {
    console.log('📁 [AppDev] Setting active file:', fileId);

    const findFile = (files: FileNode[], targetId: string): FileNode | null => {
      for (const file of files) {
        if (file.id === targetId) return file;
        if (file.children) {
          const found = findFile(file.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(workspace.files, fileId);
    if (file) {
      console.log('✅ [AppDev] File found:', file.name);
      setCurrentFile(file);
      updateWorkspace({ activeFile: fileId });
    } else {
      // console.error('❌ [AppDev] File not found:', fileId);
    }
  };

  /**
   * 更新文件内容
   */
  const updateFileContent = (fileId: string, content: string) => {
    console.log('📝 [AppDev] Updating file content:', fileId);

    const updateFileInTree = (files: FileNode[]): FileNode[] => {
      return files.map((file) => {
        if (file.id === fileId) {
          console.log('✅ [AppDev] File found for update:', file.name);
          return { ...file, content, lastModified: Date.now() };
        }
        if (file.children) {
          return { ...file, children: updateFileInTree(file.children) };
        }
        return file;
      });
    };

    setWorkspace((prev) => ({
      ...prev,
      files: updateFileInTree(prev.files),
    }));
    console.log('✅ [AppDev] File content updated successfully');
  };

  /**
   * 创建文件
   */
  const createFile = (path: string, content: string) => {
    const fileName = path.split('/').pop() || 'untitled';
    const fileId = fileName.toLowerCase().replace(/\./g, '-');

    const newFile: FileNode = {
      id: fileId,
      name: fileName,
      type: 'file',
      path,
      content,
      language: fileName.split('.').pop(),
      lastModified: Date.now(),
    };

    setWorkspace((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }));
  };

  /**
   * 删除文件
   */
  const deleteFile = (fileId: string) => {
    const removeFileFromTree = (files: FileNode[]): FileNode[] => {
      return files
        .filter((file) => file.id !== fileId)
        .map((file) => ({
          ...file,
          children: file.children
            ? removeFileFromTree(file.children)
            : undefined,
        }));
    };

    setWorkspace((prev) => ({
      ...prev,
      files: removeFileFromTree(prev.files),
      activeFile: prev.activeFile === fileId ? undefined : prev.activeFile,
    }));

    if (currentFile?.id === fileId) {
      setCurrentFile(null);
    }
  };

  /**
   * 创建文件夹
   */
  const createFolder = (path: string) => {
    const folderName = path.split('/').pop() || 'New Folder';
    const folderId = folderName.toLowerCase().replace(/\s+/g, '-');

    const newFolder: FileNode = {
      id: folderId,
      name: folderName,
      type: 'folder',
      path,
      children: [],
      lastModified: Date.now(),
    };

    setWorkspace((prev) => ({
      ...prev,
      files: [...prev.files, newFolder],
    }));
  };

  /**
   * 更新设置
   */
  const updateSettings = (settings: Partial<AppDevWorkspace['settings']>) => {
    setWorkspace((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  /**
   * 更新开发服务器URL
   */
  const updateDevServerUrl = (devServerUrl: string) => {
    setWorkspace((prev) => ({
      ...prev,
      devServerUrl,
    }));
  };

  /**
   * 更新项目ID
   */
  const updateProjectId = (projectId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      projectId,
    }));
  };

  return {
    workspace,
    currentFile,
    isServiceRunning,
    setIsServiceRunning,
    updateWorkspace,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    createFolder,
    updateSettings,
    updateDevServerUrl,
    updateProjectId,
  };
};
