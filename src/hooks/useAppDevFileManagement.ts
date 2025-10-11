/**
 * AppDev 文件管理相关 Hook
 */

import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UI_CONSTANTS,
} from '@/constants/appDevConstants';
import {
  deleteFile,
  getFileContent,
  getProjectContent,
  renameFile,
  submitFilesUpdate,
  uploadSingleFile,
} from '@/services/appDev';
import type {
  FileContentState,
  FileNode,
  FileTreeState,
} from '@/types/interfaces/appDev';
import {
  debounce,
  findFileNode,
  findFirstFile,
  isFileModified,
  transformFlatListToTree,
  treeToFlatList,
} from '@/utils/appDevUtils';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAppDevFileManagementProps {
  projectId: string;
  onFileSelect?: (fileId: string) => void;
  onFileContentChange?: (fileId: string, content: string) => void;
}

export const useAppDevFileManagement = ({
  projectId,
  onFileSelect,
  onFileContentChange,
}: UseAppDevFileManagementProps) => {
  // 文件树状态
  const [fileTreeState, setFileTreeState] = useState<FileTreeState>({
    data: [],
    expandedFolders: new Set(),
    isCollapsed: false,
    lastLoadedProjectId: null,
  });

  // 文件内容状态
  const [fileContentState, setFileContentState] = useState<FileContentState>({
    selectedFile: '',
    fileContent: '',
    originalFileContent: '',
    isLoadingFileContent: false,
    fileContentError: null,
    isFileModified: false,
    isSavingFile: false,
  });

  // 跟踪文件树是否已经加载过，避免重复加载
  const lastLoadedProjectIdRef = useRef<string | null>(null);

  /**
   * 设置选中的文件
   */
  const setSelectedFile = useCallback((fileId: string) => {
    setFileContentState((prev) => ({ ...prev, selectedFile: fileId }));
  }, []);

  /**
   * 加载文件树数据
   */
  const loadFileTree = useCallback(async () => {
    if (!projectId) {
      console.log('⚠️ [FileManagement] 没有项目ID，跳过文件树加载');
      return;
    }

    // 检查是否已经加载过相同项目的文件树，避免重复调用
    if (
      lastLoadedProjectIdRef.current === projectId &&
      fileTreeState.data.length > 0
    ) {
      console.log(
        '🔄 [FileManagement] 项目ID未变化且文件树已存在，跳过重复加载:',
        projectId,
      );
      return;
    }

    try {
      console.log('🌲 [FileManagement] 正在加载文件树数据...', { projectId });

      const response = await getProjectContent(projectId);

      if (response && response.code === '0000' && response.data) {
        const files = response.data.files || response.data;
        console.log('✅ [FileManagement] 项目内容加载成功:', files);

        let treeData: FileNode[] = [];

        // 检查是否是新的扁平格式
        if (Array.isArray(files) && files.length > 0 && files[0].name) {
          console.log('🔄 [FileManagement] 检测到新的扁平格式，正在转换...');
          treeData = transformFlatListToTree(files);
        } else if (Array.isArray(files)) {
          // 如果是原有的树形格式，直接使用
          treeData = files as FileNode[];
        }

        setFileTreeState((prev) => ({
          ...prev,
          data: treeData,
          lastLoadedProjectId: projectId,
        }));

        lastLoadedProjectIdRef.current = projectId;

        // 自动展开第一层文件夹
        const rootFolders = treeData
          .filter((node) => node.type === 'folder')
          .map((node) => node.id);
        if (rootFolders.length > 0) {
          setFileTreeState((prev) => ({
            ...prev,
            expandedFolders: new Set(rootFolders),
          }));
        }

        // 自动选择第一个文件
        if (!fileContentState.selectedFile) {
          const firstFile = findFirstFile(treeData);
          if (firstFile) {
            setFileContentState((prev) => ({
              ...prev,
              selectedFile: firstFile,
            }));
            console.log('📁 [FileManagement] 自动选择第一个文件:', firstFile);
          }
        }

        console.log(
          '✅ [FileManagement] 文件树加载完成，共',
          treeData.length,
          '个根节点',
        );
      } else {
        throw new Error('API返回数据格式异常');
      }
    } catch (error) {
      console.error('❌ [FileManagement] 加载文件树失败:', error);
      console.log('🔄 [FileManagement] 使用空项目结构作为fallback');

      // fallback到空项目结构
      const emptyTreeData: FileNode[] = [];
      setFileTreeState((prev) => ({
        ...prev,
        data: emptyTreeData,
        lastLoadedProjectId: projectId,
        expandedFolders: new Set(),
      }));

      lastLoadedProjectIdRef.current = projectId;
      setFileContentState((prev) => ({ ...prev, selectedFile: '' }));
    }
  }, [projectId, fileTreeState.data.length, fileContentState.selectedFile]);

  /**
   * 切换到指定文件
   */
  const switchToFile = useCallback(
    async (fileId: string) => {
      setFileContentState((prev) => ({ ...prev, selectedFile: fileId }));
      onFileSelect?.(fileId);

      if (!projectId) {
        message.warning(ERROR_MESSAGES.NO_PROJECT_ID);
        return;
      }

      // 检查文件是否已经有content数据，如果有则不需要调用API
      const fileNode = findFileNode(fileId, fileTreeState.data);
      if (fileNode && fileNode.content && fileNode.content.trim() !== '') {
        console.log(
          '📄 [FileManagement] 文件已有content数据，跳过API调用:',
          fileId,
        );
        setFileContentState((prev) => ({
          ...prev,
          fileContent: fileNode.content || '',
          originalFileContent: fileNode.content || '',
          isFileModified: false,
          fileContentError: null,
        }));
        return;
      }

      // 清空当前文件内容，准备加载新文件
      setFileContentState((prev) => ({
        ...prev,
        fileContent: '',
        originalFileContent: '',
        isFileModified: false,
        fileContentError: null,
        isLoadingFileContent: true,
      }));

      try {
        console.log('📄 [FileManagement] 调用API获取文件内容:', fileId);
        const response = await getFileContent(projectId, fileId);
        let content = '';

        if (response && typeof response === 'object' && 'data' in response) {
          content = (response as any).data as string;
        } else if (typeof response === 'string') {
          content = response;
        } else {
          throw new Error('文件内容为空');
        }

        setFileContentState((prev) => ({
          ...prev,
          fileContent: content,
          originalFileContent: content,
          isFileModified: false,
          fileContentError: null,
          isLoadingFileContent: false,
        }));

        onFileContentChange?.(fileId, content);
      } catch (error) {
        console.error('❌ [FileManagement] 加载文件内容失败:', error);
        const errorMessage = `加载文件 ${fileId} 失败: ${
          error instanceof Error ? error.message : '未知错误'
        }`;

        setFileContentState((prev) => ({
          ...prev,
          fileContentError: errorMessage,
          isLoadingFileContent: false,
        }));

        message.error(`加载文件 ${fileId} 失败`);
      }
    },
    [projectId, fileTreeState.data, onFileSelect, onFileContentChange],
  );

  /**
   * 更新文件内容
   */
  const updateFileContent = useCallback(
    (fileId: string, content: string) => {
      setFileContentState((prev) => ({
        ...prev,
        fileContent: content,
        isFileModified: isFileModified(content, prev.originalFileContent),
      }));

      // 更新文件树中对应文件的内容
      setFileTreeState((prev) => {
        const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.id === fileId) {
              return { ...node, content: content, lastModified: Date.now() };
            }
            if (node.children) {
              return { ...node, children: updateFileInTree(node.children) };
            }
            return node;
          });
        };

        return {
          ...prev,
          data: updateFileInTree(prev.data),
        };
      });

      onFileContentChange?.(fileId, content);
    },
    [onFileContentChange],
  );

  /**
   * 保存文件
   */
  const saveFile = useCallback(async () => {
    const { selectedFile, fileContent } = fileContentState;

    if (!selectedFile || !projectId) return;

    try {
      setFileContentState((prev) => ({ ...prev, isSavingFile: true }));

      // 首先获取最新的项目内容
      console.log('🔄 [FileManagement] 获取最新项目内容以便保存...');
      const projectResponse = await getProjectContent(projectId);

      if (
        !projectResponse ||
        projectResponse.code !== '0000' ||
        !projectResponse.data
      ) {
        throw new Error('获取项目内容失败');
      }

      // 将项目数据转换为扁平列表格式
      let filesList: any[] = [];
      const files = projectResponse.data.files || projectResponse.data;

      if (Array.isArray(files) && files.length > 0 && files[0].name) {
        // 如果是扁平格式，直接使用
        filesList = [...files];
      } else if (Array.isArray(files)) {
        // 如果是树形格式，转换为扁平列表
        filesList = treeToFlatList(files as FileNode[]);
      }

      // 更新要保存的文件内容
      const updatedFilesList = filesList.map((file) => {
        if (file.name === selectedFile) {
          return {
            ...file,
            contents: fileContent,
            binary: false,
            sizeExceeded: false,
          };
        }
        return file;
      });

      console.log('💾 [FileManagement] 保存文件:', selectedFile);
      console.log('📁 [FileManagement] 总文件数:', updatedFilesList.length);

      const response = await submitFilesUpdate(projectId, updatedFilesList);

      if (response.success && response.code === '0000') {
        // 保存成功后更新状态
        setFileContentState((prev) => ({
          ...prev,
          originalFileContent: fileContent,
          isFileModified: false,
          isSavingFile: false,
        }));

        message.success(SUCCESS_MESSAGES.FILE_SAVED);
        console.log('✅ [FileManagement] 文件保存成功');
      } else {
        throw new Error(response.message || '保存文件失败');
      }
    } catch (error) {
      console.error('❌ [FileManagement] 保存文件失败:', error);
      message.error(
        `保存文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
      setFileContentState((prev) => ({ ...prev, isSavingFile: false }));
    }
  }, [fileContentState, projectId]);

  /**
   * 取消编辑
   */
  const cancelEdit = useCallback(() => {
    const { selectedFile, originalFileContent } = fileContentState;

    if (!selectedFile) return;

    setFileContentState((prev) => ({
      ...prev,
      fileContent: originalFileContent,
      isFileModified: false,
    }));

    message.info('已取消编辑');
  }, [fileContentState]);

  /**
   * 上传单个文件
   */
  const uploadSingleFileToServer = useCallback(
    async (file: File, filePath: string): Promise<boolean> => {
      if (!projectId) {
        message.error(ERROR_MESSAGES.NO_PROJECT_ID);
        return false;
      }

      if (!filePath.trim()) {
        message.error(ERROR_MESSAGES.EMPTY_FILE_PATH);
        return false;
      }

      try {
        console.log(
          '📤 [FileManagement] 正在上传单个文件:',
          file.name,
          '路径:',
          filePath,
        );

        const result = await uploadSingleFile({
          file,
          projectId,
          filePath: filePath.trim(),
        });

        if (result?.success) {
          message.success(`文件 ${file.name} 上传成功到 ${filePath.trim()}`);

          // 重新加载文件树
          setTimeout(() => {
            loadFileTree().then(() => {
              if (filePath.trim()) {
                setSelectedFile(filePath.trim());
                switchToFile(filePath.trim());
              }
            });
          }, UI_CONSTANTS.PRELOAD_DELAY);

          return true;
        } else {
          message.warning('文件上传成功，但返回数据格式异常');
          return false;
        }
      } catch (error) {
        console.error('❌ [FileManagement] 上传单个文件失败:', error);
        message.error(
          error instanceof Error ? error.message : '上传单个文件失败',
        );
        return false;
      }
    },
    [projectId, loadFileTree, switchToFile, setSelectedFile],
  );

  /**
   * 切换文件夹展开状态
   */
  const toggleFolder = useCallback((folderId: string) => {
    setFileTreeState((prev) => {
      const newExpanded = new Set(prev.expandedFolders);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return { ...prev, expandedFolders: newExpanded };
    });
  }, []);

  /**
   * 切换文件树折叠状态
   */
  const toggleFileTreeCollapse = useCallback(() => {
    setFileTreeState((prev) => {
      console.log(
        '🔄 [FileManagement] 切换文件树状态:',
        !prev.isCollapsed ? '折叠' : '展开',
      );
      return { ...prev, isCollapsed: !prev.isCollapsed };
    });
  }, []);

  // 防抖的文件内容更新函数
  const debouncedUpdateFileContent = useCallback(
    debounce(updateFileContent, UI_CONSTANTS.DEBOUNCE_DELAY),
    [updateFileContent],
  );

  /**
   * 删除文件或文件夹
   */
  const deleteFileItem = useCallback(
    async (fileId: string): Promise<boolean> => {
      if (!projectId) {
        console.error('❌ [FileManagement] 删除文件失败: 缺少项目ID');
        return false;
      }

      try {
        const fileNode = findFileNode(fileId, fileTreeState.data);
        if (!fileNode) {
          console.error('❌ [FileManagement] 删除文件失败: 找不到文件节点');
          return false;
        }

        console.log('🗑️ [FileManagement] 删除文件:', fileNode.path);
        const result = await deleteFile(projectId, fileNode.path);

        if (result?.success) {
          console.log('✅ [FileManagement] 文件删除成功:', fileNode.path);
          // 删除成功后重新加载文件树
          await loadFileTree();

          // 如果删除的是当前选中的文件，清空选择
          if (fileContentState.selectedFile === fileId) {
            setSelectedFile('');
          }

          return true;
        } else {
          console.error('❌ [FileManagement] 删除文件失败:', result?.message);
          return false;
        }
      } catch (error) {
        console.error('❌ [FileManagement] 删除文件异常:', error);
        return false;
      }
    },
    [
      projectId,
      fileTreeState.data,
      fileContentState.selectedFile,
      loadFileTree,
      setSelectedFile,
    ],
  );

  /**
   * 根据路径查找文件节点
   */
  const findFileNodeByPath = useCallback(
    (path: string, files: FileNode[]): FileNode | null => {
      for (const file of files) {
        if (file.path === path) {
          return file;
        }
        if (file.children) {
          const found = findFileNodeByPath(path, file.children);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  /**
   * 重命名文件或文件夹
   */
  const renameFileItem = useCallback(
    async (fileId: string, newName: string): Promise<boolean> => {
      if (!projectId) {
        console.error('❌ [FileManagement] 重命名文件失败: 缺少项目ID');
        return false;
      }

      if (!newName.trim()) {
        console.error('❌ [FileManagement] 重命名文件失败: 新文件名为空');
        return false;
      }

      try {
        const fileNode = findFileNode(fileId, fileTreeState.data);
        if (!fileNode) {
          console.error('❌ [FileManagement] 重命名文件失败: 找不到文件节点');
          return false;
        }

        const oldPath = fileNode.path;
        const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
        const newPath = parentPath
          ? `${parentPath}/${newName.trim()}`
          : newName.trim();

        console.log('✏️ [FileManagement] 重命名文件:', oldPath, '->', newPath);
        const result = await renameFile(projectId, oldPath, newPath);

        if (result?.success) {
          console.log('✅ [FileManagement] 文件重命名成功:', newPath);
          // 重命名成功后重新加载文件树
          await loadFileTree();

          // 如果重命名的是当前选中的文件，更新选中状态
          if (fileContentState.selectedFile === fileId) {
            // 重新查找文件节点（ID可能会改变）
            const newFileNode = findFileNodeByPath(newPath, fileTreeState.data);
            if (newFileNode) {
              setSelectedFile(newFileNode.id);
            }
          }

          return true;
        } else {
          console.error('❌ [FileManagement] 重命名文件失败:', result?.message);
          return false;
        }
      } catch (error) {
        console.error('❌ [FileManagement] 重命名文件异常:', error);
        return false;
      }
    },
    [
      projectId,
      fileTreeState.data,
      fileContentState.selectedFile,
      loadFileTree,
      setSelectedFile,
    ],
  );

  // 在项目ID变化时加载文件树
  useEffect(() => {
    if (projectId) {
      loadFileTree();
    }
  }, [projectId, loadFileTree]);

  return {
    // 文件树相关
    fileTreeState,
    loadFileTree,
    toggleFolder,
    toggleFileTreeCollapse,

    // 文件内容相关
    fileContentState,
    setSelectedFile,
    updateFileContent: debouncedUpdateFileContent,
    switchToFile,
    saveFile,
    cancelEdit,

    // 文件上传相关
    uploadSingleFileToServer,

    // 文件操作相关
    deleteFileItem,
    renameFileItem,

    // 工具函数
    findFileNode: (fileId: string) => findFileNode(fileId, fileTreeState.data),
    findFileNodeByPath: (path: string) =>
      findFileNodeByPath(path, fileTreeState.data),
  };
};
