import {
  getProjectContentByVersion,
  submitFilesUpdate,
} from '@/services/appDev';
import type { FileNode, PageFileInfo } from '@/types/interfaces/appDev';
import { message } from 'antd';
import { useCallback, useState } from 'react';

export interface UseAppDevVersionCompareReturn {
  /** 是否处于版本对比模式 */
  isComparing: boolean;
  /** 目标版本号 */
  targetVersion: number | null;
  /** 版本文件树 */
  versionFiles: FileNode[];
  /** 开始版本对比 */
  startVersionCompare: (version: number) => Promise<void>;
  /** 取消对比 */
  cancelCompare: () => void;
  /** 确认切换版本 */
  confirmVersionSwitch: () => Promise<void>;
  /** 加载状态 */
  isLoadingVersion: boolean;
  /** 切换状态 */
  isSwitching: boolean;
}

interface UseAppDevVersionCompareParams {
  /** 项目ID */
  projectId: string;
  /** 版本切换成功回调 */
  onVersionSwitchSuccess?: () => void;
}

/**
 * AppDev 版本对比 Hook
 * 管理版本对比相关的状态和逻辑
 */
export const useAppDevVersionCompare = ({
  projectId,
  onVersionSwitchSuccess,
}: UseAppDevVersionCompareParams): UseAppDevVersionCompareReturn => {
  // 版本对比状态
  const [isComparing, setIsComparing] = useState(false);
  const [targetVersion, setTargetVersion] = useState<number | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // 版本文件树
  const [versionFiles, setVersionFiles] = useState<FileNode[]>([]);

  /**
   * 将API返回的文件数据转换为FileNode树结构
   */
  const convertToFileTree = useCallback((files: any[]): FileNode[] => {
    const fileMap = new Map<string, FileNode>();
    const rootNodes: FileNode[] = [];

    // 首先创建所有文件节点
    files.forEach((file: any) => {
      const fileName = file.name.replace(
        '../../project_zips/1976620100358377472/his_temp/',
        '',
      );
      const pathParts = fileName.split('/');
      const node: FileNode = {
        id: fileName,
        name: pathParts[pathParts.length - 1],
        type: 'file',
        path: fileName,
        content: String(file.contents || ''),
        lastModified: Date.now(),
        children: [],
      };
      fileMap.set(fileName, node);
    });

    // 构建文件夹结构
    const folderMap = new Map<string, FileNode>();

    files.forEach((file: any) => {
      const fileName = file.name.replace(
        '../../project_zips/1976620100358377472/his_temp/',
        '',
      );
      const pathParts = fileName.split('/');

      // 构建文件夹路径
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i + 1).join('/');
        const folderName = pathParts[i];

        if (!folderMap.has(folderPath)) {
          const folderNode: FileNode = {
            id: folderPath,
            name: folderName,
            type: 'folder',
            path: folderPath,
            children: [],
          };
          folderMap.set(folderPath, folderNode);
        }
      }
    });

    // 将文件添加到对应的文件夹中
    fileMap.forEach((fileNode) => {
      const pathParts = fileNode.path.split('/');
      if (pathParts.length === 1) {
        // 根目录文件
        rootNodes.push(fileNode);
      } else {
        // 子目录文件
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentFolder = folderMap.get(parentPath);
        if (parentFolder && parentFolder.children) {
          parentFolder.children.push(fileNode);
        }
      }
    });

    // 将文件夹添加到父文件夹中
    folderMap.forEach((folderNode) => {
      const pathParts = folderNode.path.split('/');
      if (pathParts.length === 1) {
        // 根目录文件夹
        rootNodes.push(folderNode);
      } else {
        // 子目录文件夹
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentFolder = folderMap.get(parentPath);
        if (parentFolder && parentFolder.children) {
          parentFolder.children.push(folderNode);
        }
      }
    });

    return rootNodes;
  }, []);

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
        const files = response?.data?.files.map((file: any) => {
          return {
            ...file,
            name: file.name.replace(
              '../../project_zips/1976620100358377472/his_temp/',
              '',
            ),
          };
        });

        console.log('📥 [useAppDevVersionCompare] API 响应:', {
          code: response?.code,
          hasFiles: !!files,
          filesType: Array.isArray(files) ? 'array' : typeof files,
          filesKeys: files ? Object.keys(files).slice(0, 5) : [],
        });

        if (response?.code === '0000' && files) {
          // 转换为FileNode树结构
          const fileTree = convertToFileTree(files);
          setVersionFiles(fileTree);

          // 进入对比模式
          setIsComparing(true);

          console.log('✅ [useAppDevVersionCompare] 版本文件树加载完成:', {
            targetVersion: version,
            fileCount: files.length,
            treeNodes: fileTree.length,
          });

          message.success(`版本 v${version} 文件树加载完成`);
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
    [projectId, convertToFileTree],
  );

  /**
   * 取消对比
   */
  const cancelCompare = useCallback(() => {
    setIsComparing(false);
    setTargetVersion(null);
    setVersionFiles([]);

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
        fileCount: versionFiles.length,
      });

      // 准备要更新的文件 - 扁平化所有文件
      const filesToUpdate: PageFileInfo[] = [];

      const flattenFiles = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
          if (node.type === 'file' && node.content) {
            filesToUpdate.push({
              name: node.path,
              contents: node.content,
              binary: false,
            });
          }
          if (node.children) {
            flattenFiles(node.children);
          }
        });
      };

      flattenFiles(versionFiles);

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
    versionFiles,
    cancelCompare,
    onVersionSwitchSuccess,
  ]);

  return {
    isComparing,
    targetVersion,
    versionFiles,
    startVersionCompare,
    cancelCompare,
    confirmVersionSwitch,
    isLoadingVersion,
    isSwitching,
  };
};

export default useAppDevVersionCompare;
