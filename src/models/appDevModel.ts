import { useState } from 'react';

/**
 * 文件节点接口
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
 * 默认工作区配置
 */
const initialWorkspace: AppDevWorkspace = {
  id: 'default',
  name: 'Web IDE Project',
  projectId: '',
  files: [],
  settings: {
    theme: 'light',
    fontSize: 14,
    tabSize: 2,
  },
};

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
    updateDevServerUrl,
    updateProjectId,
  };
};
