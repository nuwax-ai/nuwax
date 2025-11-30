/**
 * AppDev 文件管理相关 Hook
 */

import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UI_CONSTANTS,
} from '@/constants/appDevConstants';
import {
  getFileContent,
  getProjectContent,
  keepAlive,
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
  isFileModified as isContentModified,
  isPreviewableFile,
  // smartReplaceInSource,
  transformFlatListToTree,
  treeToFlatList,
} from '@/utils/appDevUtils';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAppDevFileManagementProps {
  projectId: string;
  onFileSelect?: (fileId: string) => void;
  onFileContentChange?: (fileId: string, content: string) => void;
  isChatLoading?: boolean; // 新增：是否正在AI聊天加载中
  hasPermission?: boolean; // 新增：是否有权限访问项目
}

export const useAppDevFileManagement = ({
  projectId,
  onFileSelect,
  onFileContentChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isChatLoading = false,
  hasPermission = true,
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

  // 文件树初始化 loading 状态（只在第一次加载时显示）
  const [isFileTreeInitializing, setIsFileTreeInitializing] = useState(false);

  // 跟踪已经尝试加载内容的文件（避免重复调用API）
  const [loadedFiles, setLoadedFiles] = useState<Set<string>>(new Set());

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
   * @param preserveState 是否保持当前状态（选中文件、展开文件夹等）
   * @param forceRefresh 是否强制刷新（忽略重复加载检查）
   */
  const loadFileTree = useCallback(
    async (preserveState = true, forceRefresh = false) => {
      if (!projectId) {
        return;
      }

      // 保存当前状态
      const currentSelectedFile = preserveState
        ? fileContentState.selectedFile
        : '';
      const currentExpandedFolders = preserveState
        ? new Set<string>(fileTreeState.expandedFolders)
        : new Set<string>();

      // 检查是否已经加载过相同项目的文件树，避免重复调用
      // 只有在保持状态且不是强制刷新时才跳过
      if (
        !forceRefresh &&
        lastLoadedProjectIdRef.current === projectId &&
        fileTreeState.data.length > 0 &&
        preserveState
      ) {
        return;
      }

      // 只在第一次加载时显示初始化 loading 状态
      const isFirstLoad = lastLoadedProjectIdRef.current !== projectId;
      if (isFirstLoad) {
        setIsFileTreeInitializing(true);
      }

      try {
        const response = await getProjectContent(projectId);

        if (response && response.code === '0000' && response.data) {
          const files = response.data.files || response.data;

          let treeData: FileNode[] = [];

          // 检查是否是新的扁平格式
          if (Array.isArray(files) && files.length > 0 && files[0].name) {
            treeData = transformFlatListToTree(files);
          } else if (Array.isArray(files)) {
            // 如果是原有的树形格式，直接使用
            treeData = files as FileNode[];
          }

          setFileTreeState((prev) => ({
            ...prev,
            data: treeData,
            expandedFolders: currentExpandedFolders, // 恢复展开状态
            lastLoadedProjectId: projectId,
          }));

          // 清空已加载文件的记录，因为项目内容可能已更新
          setLoadedFiles(new Set());

          lastLoadedProjectIdRef.current = projectId;

          // 自动展开第一层文件夹（仅在非保持状态时）
          if (!preserveState) {
            const rootFolders = treeData
              .filter((node) => node.type === 'folder')
              .map((node) => node.id);
            if (rootFolders.length > 0) {
              setFileTreeState((prev) => ({
                ...prev,
                expandedFolders: new Set(rootFolders),
              }));
            }
          }

          // 验证并恢复选中文件
          if (currentSelectedFile && preserveState) {
            const fileExists = findFileNode(currentSelectedFile, treeData);
            if (fileExists) {
              // 文件存在，保持选中
              setFileContentState((prev) => ({
                ...prev,
                selectedFile: currentSelectedFile,
              }));
            } else {
              // 文件不存在，清空选中
              setFileContentState((prev) => ({
                ...prev,
                selectedFile: '',
                fileContent: '',
                originalFileContent: '',
              }));
            }
          }
        } else {
          throw new Error('API返回数据格式异常');
        }
      } catch (error) {
        // fallback到空项目结构
        const emptyTreeData: FileNode[] = [];
        setFileTreeState((prev) => ({
          ...prev,
          data: emptyTreeData,
          lastLoadedProjectId: projectId,
          expandedFolders: preserveState ? currentExpandedFolders : new Set(),
        }));

        lastLoadedProjectIdRef.current = projectId;

        // 如果是保持状态模式且当前有选中文件，清空选中（因为项目为空）
        if (preserveState && currentSelectedFile) {
          setFileContentState((prev) => ({
            ...prev,
            selectedFile: '',
            fileContent: '',
            originalFileContent: '',
          }));
        } else if (!preserveState) {
          setFileContentState((prev) => ({ ...prev, selectedFile: '' }));
        }
      } finally {
        // 只在第一次加载时清除初始化 loading 状态
        if (isFirstLoad) {
          setIsFileTreeInitializing(false);
        }
      }
    },
    [projectId, fileTreeState.data.length, fileContentState.selectedFile],
  );

  /**
   * 根据文件的 id、行号和列号更新指定元素的 class 属性
   * @param fileId - 文件 ID
   * @param className - 要设置的 class 属性值
   * @param row - 行号（从 0 开始）
   * @param column - 列号（从 0 开始）
   */
  const updateFileClassName = useCallback(
    async (
      fileName: string,
      className: string,
      lineNumber: number,
      columnNumber: number,
    ) => {
      console.log(
        'updateFileClassName11111111111111111',
        fileName,
        className,
        lineNumber,
        columnNumber,
      );
      // const fileNode = findFileNodeByName(fileName, fileTreeState.data);
      // if (!fileNode || !fileNode.content) {
      //   return;
      // }
      // const fileContent = fileNode.content;

      // const updatedContent = await smartReplaceInSource(
      //   fileContent,
      //   {
      //     lineNumber: lineNumber,
      //     columnNumber: columnNumber,
      //     newValue: className,
      //     originalValue: '',
      //     type: 'style',
      //   },
      // );

      // const files = updateFileClassNameInTree(fileName, className, lineNumber, columnNumber, fileTreeState.data);
      // const files = fileTreeState.data
      // // 将项目数据转换为扁平列表格式
      // let filesList: any[] = [];

      // if (Array.isArray(files) && files.length > 0 && files[0].name) {
      //   // 如果是扁平格式，直接使用
      //   filesList = [...files];
      // } else if (Array.isArray(files)) {
      //   // 如果是树形格式，转换为扁平列表
      //   filesList = treeToFlatList(files as FileNode[]);
      // }

      // // 更新要保存的文件内容
      // const updatedFilesList = filesList.map((file) => {
      //   if (file.name === fileName) {
      //     return {
      //       ...file,
      //       contents: updatedContent,
      //       binary: false,
      //       sizeExceeded: false,
      //     }
      //   }
      //   return file;
      // });

      // // 保存文件
      // const response = submitFilesUpdate(projectId, filesList);
      // // 查找文件节点
      // const fileNode = findFileNode(fileId, fileTreeState.data);
      // if (!fileNode || !fileNode.content) {
      //   console.warn(`文件 ${fileId} 不存在或内容为空`);
      //   return;
      // }

      // // 使用工具函数根据行列号更新元素的 class 属性
      // const updatedContent = updateElementClassNameByPosition(
      //   fileNode.content,
      //   className,
      //   row,
      //   column,
      // );

      // // 如果内容没有变化，直接返回
      // if (updatedContent === fileNode.content) {
      //   return;
      // }

      // // 更新文件树中对应文件的内容
      // setFileTreeState((prev) => {
      //   const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
      //     return nodes.map((node) => {
      //       if (node.id === fileId) {
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

      //   return {
      //     ...prev,
      //     data: updateFileInTree(prev.data),
      //   };
      // });

      // // 如果当前文件是选中的文件，同时更新文件内容状态
      // if (fileContentState.selectedFile === fileId) {
      //   setFileContentState((prev) => ({
      //     ...prev,
      //     fileContent: updatedContent,
      //     isFileModified: isContentModified(
      //       updatedContent,
      //       prev.originalFileContent,
      //     ),
      //   }));

      //   // 触发文件内容变更回调
      //   onFileContentChange?.(fileId, updatedContent);
      // }
    },
    [
      fileTreeState.data,
      fileContentState.selectedFile,
      fileContentState.originalFileContent,
      onFileContentChange,
    ],
  );

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

      console.log('switchToFile222222', fileTreeState.data);

      // 检查文件是否已经有content数据，如果有则不需要调用API
      const fileNode = findFileNode(fileId, fileTreeState.data);

      // 检查文件是否已经有内容数据
      const hasContent =
        fileNode &&
        fileNode.content !== undefined &&
        fileNode.content !== null &&
        fileNode.content.trim() !== '';
      const hasTriedLoading = loadedFiles.has(fileId);

      // 如果文件有内容，直接使用
      if (hasContent) {
        setFileContentState((prev) => ({
          ...prev,
          fileContent: fileNode?.content || '',
          originalFileContent: fileNode?.content || '',
          isFileModified: false,
          fileContentError: null,
        }));
        return;
      }

      // 如果文件没有内容但已经尝试过加载，说明文件确实是空的，不需要再次调用API
      if (fileNode && hasTriedLoading && !hasContent) {
        setFileContentState((prev) => ({
          ...prev,
          fileContent: '',
          originalFileContent: '',
          isFileModified: false,
          fileContentError: null,
        }));
        return;
      }

      // 检查文件是否支持预览，如果不支持则不调用API
      if (!isPreviewableFile(fileId) && !hasContent) {
        setFileContentState((prev) => ({
          ...prev,
          fileContent: '',
          originalFileContent: '',
          isFileModified: false,
          fileContentError: null,
          isLoadingFileContent: false,
        }));
        return;
      }

      // 如果文件节点存在但没有内容且未尝试过加载，需要调用API获取内容
      if (fileNode && !hasContent && !hasTriedLoading) {
        // 文件节点存在但无内容，需要调用API获取
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

        // 标记文件已尝试加载
        setLoadedFiles((prev) => new Set(prev).add(fileId));

        onFileContentChange?.(fileId, content);
      } catch (error) {
        const errorMessage = `加载文件 ${fileId} 失败: ${
          error instanceof Error ? error.message : '未知错误'
        }`;

        setFileContentState((prev) => ({
          ...prev,
          fileContentError: errorMessage,
          isLoadingFileContent: false,
        }));

        // 即使失败也要标记文件已尝试加载，避免重复调用
        setLoadedFiles((prev) => new Set(prev).add(fileId));

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
        isFileModified: isContentModified(content, prev.originalFileContent),
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
  const saveFile = useCallback(async (): Promise<boolean> => {
    const { selectedFile, fileContent } = fileContentState;

    if (!selectedFile || !projectId) return false;

    try {
      setFileContentState((prev) => ({ ...prev, isSavingFile: true }));

      // 首先获取最新的项目内容
      const projectResponse = await getProjectContent(projectId);

      if (
        !projectResponse ||
        projectResponse.code !== '0000' ||
        !projectResponse.data
      ) {
        return false;
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

      // 保存文件
      const response = await submitFilesUpdate(projectId, updatedFilesList);

      if (response.success && response.code === '0000') {
        keepAlive(projectId);
        // 保存成功后更新状态
        setFileContentState((prev) => ({
          ...prev,
          originalFileContent: fileContent,
          isFileModified: false,
          isSavingFile: false,
        }));

        message.success(SUCCESS_MESSAGES.FILE_SAVED);
        // 文件保存成功
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // 保存文件失败
      // message.error(
      //   `保存文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
      // );
      console.error('保存文件失败', error);
      setFileContentState((prev) => ({ ...prev, isSavingFile: false }));
      return false;
    }
  }, [fileContentState, projectId]);

  /**
   * 取消编辑
   */
  const cancelEdit = useCallback(
    (silent: boolean = false) => {
      const { selectedFile, originalFileContent } = fileContentState;

      if (!selectedFile) return;

      setFileContentState((prev) => ({
        ...prev,
        fileContent: originalFileContent,
        isFileModified: false,
      }));

      if (!silent) {
        message.info('已取消编辑');
      }
    },
    [fileContentState],
  );

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
        // 上传文件

        const result = await uploadSingleFile({
          file,
          projectId,
          filePath: filePath.trim(),
        });

        if (result?.success) {
          // message.success(`上传成功到 ${filePath.trim()}`);

          // 上传成功后重新加载文件树（与删除文件逻辑保持一致）
          await loadFileTree(true, true);

          // 文件上传成功后不自动选中，让用户自己选择要查看的文件
          // 文件上传成功，文件树已更新

          return true;
        } else {
          console.error('上传失败', result);
          return false;
        }
      } catch (error) {
        // 上传单个文件失败
        console.error('上传失败', error);
        return false;
      }
    },
    [projectId, loadFileTree],
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
      // 切换文件树状态
      return { ...prev, isCollapsed: !prev.isCollapsed };
    });
  }, []);

  // 防抖的文件内容更新函数
  const debouncedUpdateFileContent = useCallback(
    debounce(updateFileContent, UI_CONSTANTS.DEBOUNCE_DELAY),
    [updateFileContent],
  );

  /**
   * 删除文件或文件夹（通过全量更新方式）
   */
  const deleteFileItem = useCallback(
    async (fileId: string): Promise<boolean> => {
      if (!projectId) {
        // 删除文件失败：缺少项目ID
        return false;
      }

      try {
        const fileNode = findFileNode(fileId, fileTreeState.data);
        if (!fileNode) {
          // 删除文件失败：找不到文件节点
          return false;
        }

        // 删除文件

        // 获取当前完整文件列表
        const flatFileList = treeToFlatList(fileTreeState.data);

        // 过滤掉要删除的文件及其所有子文件（如果是文件夹）
        const filteredList = flatFileList.filter((file) => {
          // 如果是文件本身，直接删除
          if (file.name === fileId) {
            // 从列表中移除文件
            return false;
          }
          // 如果是文件夹，删除其所有子文件
          if (fileNode.type === 'folder') {
            const shouldRemove = file.name.startsWith(fileNode.path + '/');
            if (shouldRemove) {
              // 从列表中移除子文件
            }
            return !shouldRemove;
          }
          return true;
        });

        // 提交更新后的文件列表
        const result = await submitFilesUpdate(projectId, filteredList);

        if (result?.success) {
          // 文件删除成功
          // 删除成功后重新加载文件树
          await loadFileTree(true, true);
          keepAlive(projectId);

          // 如果删除的是当前选中的文件，清空选择
          if (fileContentState.selectedFile === fileId) {
            setSelectedFile('');
          }

          return true;
        } else {
          // 删除文件失败
          return false;
        }
      } catch (error) {
        // 删除文件异常
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
   * 更新文件树中的显示名字（用于即时反馈）
   */
  const updateFileTreeName = useCallback(
    (fileTree: FileNode[], fileId: string, newName: string): FileNode[] => {
      return fileTree.map((node) => {
        if (node.id === fileId) {
          return {
            ...node,
            name: newName,
            path:
              node.path.substring(0, node.path.lastIndexOf('/')) +
              '/' +
              newName,
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
    },
    [],
  );

  /**
   * 重命名文件或文件夹
   */
  const renameFileItem = useCallback(
    async (fileId: string, newName: string): Promise<boolean> => {
      if (!projectId) {
        // 重命名文件失败：缺少项目ID
        return false;
      }

      if (!newName.trim()) {
        // 重命名文件失败：新文件名为空
        return false;
      }

      try {
        const fileNode = findFileNode(fileId, fileTreeState.data);
        if (!fileNode) {
          // 重命名文件失败：找不到文件节点
          return false;
        }

        const oldPath = fileNode.path;
        const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
        const newPath = parentPath
          ? `${parentPath}/${newName.trim()}`
          : newName.trim();

        // 先立即更新文件树中的显示名字，提供即时反馈
        const updatedFileTree = updateFileTreeName(
          fileTreeState.data,
          fileId,
          newName.trim(),
        );
        setFileTreeState((prev) => ({
          ...prev,
          data: updatedFileTree,
        }));

        // 获取当前的文件列表（扁平格式）
        const projectResponse = await getProjectContent(projectId);
        if (
          !projectResponse ||
          projectResponse.code !== '0000' ||
          !projectResponse.data
        ) {
          return false;
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

        // 更新文件列表中的文件名（包含完整路径+文件名+后缀）
        const updatedFilesList = filesList.map((file) => {
          // 如果是文件夹，需要更新文件夹本身以及所有子文件
          if (fileNode.type === 'folder') {
            // 检查是否是文件夹本身（虽然扁平列表中文件夹可能不存在）
            if (file.name === oldPath) {
              return {
                ...file,
                name: newPath, // 更新为新的完整路径
                renameFrom: oldPath, // 记录重命名前的名字
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
              };
            }
          } else {
            // 如果是文件，直接更新匹配的文件
            if (file.name === oldPath) {
              return {
                ...file,
                name: newPath, // 更新为新的完整路径
                renameFrom: oldPath, // 记录重命名前的名字
              };
            }
          }

          return file;
        });

        // 使用文件全量更新逻辑
        const response = await submitFilesUpdate(projectId, updatedFilesList);

        if (response.success && response.code === '0000') {
          // 重命名成功后重新加载文件树
          await loadFileTree(true, true);

          keepAlive(projectId);

          // 如果重命名的是当前选中的文件，更新选中状态
          if (fileContentState.selectedFile === fileId) {
            // 重新查找文件节点（ID可能会改变）
            const newFileNode = findFileNodeByPath(newPath, fileTreeState.data);
            if (newFileNode) {
              setSelectedFile(newFileNode.id);
            }
          }

          // message.success(`重命名成功: ${fileNode.name} → ${newName.trim()}`);
          return true;
        } else {
          // 重命名文件失败，重新加载文件树以恢复原状态
          await loadFileTree(true, true);
          message.error('重命名失败');
          return false;
        }
      } catch (error) {
        // 重命名文件异常，重新加载文件树以恢复原状态
        await loadFileTree(true, true);
        message.error(
          `重命名失败: ${error instanceof Error ? error.message : '未知错误'}`,
        );
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
    if (projectId && hasPermission) {
      // 项目ID变化且有权限时，加载文件树
      loadFileTree(false, true);
    }
  }, [projectId, hasPermission]); // 移除 loadFileTree 依赖，避免重复执行

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
    updateFileClassName,

    // 文件上传相关
    uploadSingleFileToServer,

    // 文件操作相关
    deleteFileItem,
    renameFileItem,

    // 文件树初始化 loading 状态
    isFileTreeInitializing,

    // 工具函数
    findFileNode: (fileId: string) => findFileNode(fileId, fileTreeState.data),
    findFileNodeByPath: (path: string) =>
      findFileNodeByPath(path, fileTreeState.data),
  };
};
