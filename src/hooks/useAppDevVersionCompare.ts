import {
  getProjectContentByVersion,
  submitFilesUpdate,
} from '@/services/appDev';
import type {
  FileChangeInfo,
  FileNode,
  PageFileInfo,
} from '@/types/interfaces/appDev';
import { getLanguageFromFile } from '@/utils/appDevUtils';
import { message } from 'antd';
import { useCallback, useState } from 'react';

export interface UseAppDevVersionCompareReturn {
  /** 是否处于版本对比模式 */
  isComparing: boolean;
  /** 目标版本号 */
  targetVersion: number | null;
  /** 开始版本对比 */
  startVersionCompare: (version: number) => Promise<void>;
  /** 取消对比 */
  cancelCompare: () => void;
  /** 确认切换版本 */
  confirmVersionSwitch: () => Promise<void>;
  /** 变更文件列表 */
  changedFilesList: FileChangeInfo[];
  /** 当前选中的文件 */
  selectedCompareFile: string | null;
  /** 选择对比文件 */
  selectCompareFile: (filePath: string) => void;
  /** 获取文件diff内容 */
  getFileDiffContent: (filePath: string) => {
    original: string;
    modified: string;
    language: string;
  } | null;
  /** 获取文件的变更统计信息 */
  getFileChangeStat: (filePath: string) => {
    changeType: 'added' | 'modified' | 'deleted';
    addedLines: number;
    deletedLines: number;
  } | null;
  /** 加载状态 */
  isLoadingVersion: boolean;
  /** 切换状态 */
  isSwitching: boolean;
}

interface UseAppDevVersionCompareParams {
  /** 项目ID */
  projectId: string;
  /** 当前文件列表 */
  currentFiles: FileNode[];
  /** 版本切换成功回调 */
  onVersionSwitchSuccess?: () => void;
}

/**
 * AppDev 版本对比 Hook
 * 管理版本对比相关的状态和逻辑
 */
export const useAppDevVersionCompare = ({
  projectId,
  currentFiles,
  onVersionSwitchSuccess,
}: UseAppDevVersionCompareParams): UseAppDevVersionCompareReturn => {
  // 版本对比状态
  const [isComparing, setIsComparing] = useState(false);
  const [targetVersion, setTargetVersion] = useState<number | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // 文件数据
  const [changedFilesList, setChangedFilesList] = useState<FileChangeInfo[]>(
    [],
  );
  const [selectedCompareFile, setSelectedCompareFile] = useState<string | null>(
    null,
  );

  /**
   * 将文件树转换为扁平的文件映射
   */
  const flattenFiles = useCallback(
    (files: FileNode[]): Record<string, string> => {
      const result: Record<string, string> = {};

      const traverse = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
          if (node.type === 'file' && node.content) {
            result[node.path] = node.content;
          }
          if (node.children) {
            traverse(node.children);
          }
        });
      };

      traverse(files);
      return result;
    },
    [],
  );

  /**
   * 计算两个文本内容的行差异
   */
  const calculateLineDiff = useCallback(
    (
      oldContent: string,
      newContent: string,
    ): { added: number; deleted: number } => {
      const oldLines = oldContent.split('\n');
      const newLines = newContent.split('\n');

      // 简单的行比较算法
      const oldLineSet = new Set(oldLines);
      const newLineSet = new Set(newLines);

      let addedLines = 0;
      let deletedLines = 0;

      // 计算新增行
      newLines.forEach((line) => {
        if (!oldLineSet.has(line)) {
          addedLines++;
        }
      });

      // 计算删除行
      oldLines.forEach((line) => {
        if (!newLineSet.has(line)) {
          deletedLines++;
        }
      });

      return { added: addedLines, deleted: deletedLines };
    },
    [],
  );

  /**
   * 比较两个版本的文件差异
   */
  const compareFiles = useCallback(
    (
      currentFiles: Record<string, string>,
      targetFiles: Record<string, string>,
    ): FileChangeInfo[] => {
      const changes: FileChangeInfo[] = [];
      const allPaths = new Set([
        ...Object.keys(currentFiles),
        ...Object.keys(targetFiles),
      ]);

      allPaths.forEach((path) => {
        // 确保内容是字符串类型
        const currentContent = String(currentFiles[path] || '');
        const targetContent = String(targetFiles[path] || '');
        const fileName = path.split('/').pop() || path;
        const language = getLanguageFromFile(fileName);

        if (!currentFiles[path] && targetFiles[path]) {
          // 新增文件
          const lineCount = targetContent.split('\n').length;
          changes.push({
            path,
            name: fileName,
            changeType: 'added',
            targetContent,
            language,
            addedLines: lineCount,
            deletedLines: 0,
          });
        } else if (currentFiles[path] && !targetFiles[path]) {
          // 删除文件
          const lineCount = currentContent.split('\n').length;
          changes.push({
            path,
            name: fileName,
            changeType: 'deleted',
            currentContent,
            language,
            addedLines: 0,
            deletedLines: lineCount,
          });
        } else if (currentContent !== targetContent) {
          // 修改文件
          const lineDiff = calculateLineDiff(currentContent, targetContent);
          changes.push({
            path,
            name: fileName,
            changeType: 'modified',
            currentContent,
            targetContent,
            language,
            addedLines: lineDiff.added,
            deletedLines: lineDiff.deleted,
          });
        }
      });

      return changes.sort((a, b) => {
        // 按变更类型排序：新增 -> 修改 -> 删除
        const typeOrder = { added: 0, modified: 1, deleted: 2 };
        return typeOrder[a.changeType] - typeOrder[b.changeType];
      });
    },
    [calculateLineDiff],
  );

  /**
   * 开始版本对比
   */
  const startVersionCompare = useCallback(
    async (version: number) => {
      if (!projectId) {
        message.error('项目ID不存在');
        return;
      }

      try {
        setIsLoadingVersion(true);
        setTargetVersion(version);

        console.log('🔄 [useAppDevVersionCompare] 开始版本对比:', {
          projectId,
          targetVersion: version,
        });

        // 获取目标版本文件内容
        const response = await getProjectContentByVersion(projectId, version);

        console.log('📥 [useAppDevVersionCompare] API 响应:', {
          code: response?.code,
          hasFiles: !!response?.data?.files,
          filesType: Array.isArray(response?.data?.files)
            ? 'array'
            : typeof response?.data?.files,
          filesKeys: response?.data?.files
            ? Object.keys(response.data.files).slice(0, 5)
            : [],
        });

        if (response?.code === '0000' && response?.data?.files) {
          // 处理 API 返回的文件数据，确保是 Record<string, string> 格式
          let targetFiles: Record<string, string> = {};

          if (Array.isArray(response.data.files)) {
            // 如果是数组格式 ProjectFileInfo[]
            response.data.files.forEach((file: any) => {
              if (file.name && file.contents !== undefined) {
                targetFiles[file.name] = String(file.contents || '');
              }
            });
          } else if (typeof response.data.files === 'object') {
            // 如果是对象格式 Record<string, any>
            Object.entries(response.data.files).forEach(([path, content]) => {
              targetFiles[path] = String(content || '');
            });
          }

          console.log('📦 [useAppDevVersionCompare] 处理后的文件数据:', {
            fileCount: Object.keys(targetFiles).length,
            files: Object.keys(targetFiles),
          });

          // 获取当前版本文件内容
          const currentFilesMap = flattenFiles(currentFiles);

          // 比较文件差异
          const changes = compareFiles(currentFilesMap, targetFiles);
          setChangedFilesList(changes);

          // 进入对比模式
          setIsComparing(true);

          // 默认选择第一个变更文件
          if (changes.length > 0) {
            setSelectedCompareFile(changes[0].path);
          }

          console.log('✅ [useAppDevVersionCompare] 版本对比完成:', {
            targetVersion: version,
            changesCount: changes.length,
            changes: changes.map((c) => ({ path: c.path, type: c.changeType })),
          });

          message.success(`版本对比完成，发现 ${changes.length} 个文件变更`);
        } else {
          throw new Error(response?.message || '获取版本文件失败');
        }
      } catch (error: any) {
        console.error('❌ [useAppDevVersionCompare] 版本对比失败:', error);
        message.error(`版本对比失败: ${error.message || '未知错误'}`);
      } finally {
        setIsLoadingVersion(false);
      }
    },
    [projectId, currentFiles, flattenFiles, compareFiles],
  );

  /**
   * 取消对比
   */
  const cancelCompare = useCallback(() => {
    setIsComparing(false);
    setTargetVersion(null);
    setChangedFilesList([]);
    setSelectedCompareFile(null);

    console.log('🚫 [useAppDevVersionCompare] 取消版本对比');
  }, []);

  /**
   * 确认切换版本
   */
  const confirmVersionSwitch = useCallback(async () => {
    if (!projectId || !targetVersion) {
      message.error('项目ID或目标版本不存在');
      return;
    }

    try {
      setIsSwitching(true);

      console.log('🔄 [useAppDevVersionCompare] 开始切换版本:', {
        projectId,
        targetVersion,
        changesCount: changedFilesList.length,
      });

      // 准备要更新的文件
      const filesToUpdate: PageFileInfo[] = changedFilesList
        .filter((file) => file.changeType !== 'deleted') // 排除删除的文件
        .map((file) => ({
          name: file.path,
          contents: file.targetContent || '',
          binary: false,
        }));

      // 调用更新接口
      const response = await submitFilesUpdate(projectId, filesToUpdate);

      if (response?.code === '0000') {
        console.log('✅ [useAppDevVersionCompare] 版本切换成功');

        // 退出对比模式
        cancelCompare();

        // 调用成功回调
        onVersionSwitchSuccess?.();

        message.success('版本切换成功');
      } else {
        throw new Error(response?.message || '版本切换失败');
      }
    } catch (error: any) {
      console.error('❌ [useAppDevVersionCompare] 版本切换失败:', error);
      message.error(`版本切换失败: ${error.message || '未知错误'}`);
    } finally {
      setIsSwitching(false);
    }
  }, [
    projectId,
    targetVersion,
    changedFilesList,
    cancelCompare,
    onVersionSwitchSuccess,
  ]);

  /**
   * 选择对比文件
   */
  const selectCompareFile = useCallback((filePath: string) => {
    setSelectedCompareFile(filePath);
    console.log('📁 [useAppDevVersionCompare] 选择文件:', filePath);
  }, []);

  /**
   * 获取文件diff内容
   */
  const getFileDiffContent = useCallback(
    (filePath: string) => {
      const changedFile = changedFilesList.find(
        (file) => file.path === filePath,
      );

      if (!changedFile) {
        return null;
      }

      return {
        original: changedFile.targetContent || '',
        modified: changedFile.currentContent || '',
        language: changedFile.language || 'plaintext',
      };
    },
    [changedFilesList],
  );

  /**
   * 获取文件的变更统计信息
   */
  const getFileChangeStat = useCallback(
    (filePath: string) => {
      const changedFile = changedFilesList.find(
        (file) => file.path === filePath,
      );

      if (!changedFile) {
        return null;
      }

      return {
        changeType: changedFile.changeType,
        addedLines: changedFile.addedLines || 0,
        deletedLines: changedFile.deletedLines || 0,
      };
    },
    [changedFilesList],
  );

  return {
    isComparing,
    targetVersion,
    startVersionCompare,
    cancelCompare,
    confirmVersionSwitch,
    changedFilesList,
    selectedCompareFile,
    selectCompareFile,
    getFileDiffContent,
    getFileChangeStat,
    isLoadingVersion,
    isSwitching,
  };
};

export default useAppDevVersionCompare;
