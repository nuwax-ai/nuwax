import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import {
  apiDownloadAllFiles,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import { FileNode } from '@/types/interfaces/appDev';
import { UpdateFileInfo } from '@/types/interfaces/fileTree';
import {
  IUpdateStaticFileParams,
  StaticFileInfo,
} from '@/types/interfaces/vncDesktop';
import { modalConfirm } from '@/utils/ant-custom';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { checkFileSizeExceedLimit } from '@/utils/index';
import { message } from 'antd';
import debounce from 'lodash/debounce';
import { useMemo, useRef, type MutableRefObject } from 'react';

interface UseChatFilesProps {
  id?: number;
  fileTreeData: StaticFileInfo[] | null;
  handleRefreshFileList: (id: number) => Promise<void>;
  /** 单文件实时保存成功后的回调（如刷新 Git 状态），通过 ref 注入以避免循环依赖 */
  onSaveFileContentSuccessRef?: MutableRefObject<(() => void) | undefined>;
  /** 文件树写操作成功后的回调（如刷新 Git 状态），通过 ref 注入以避免循环依赖 */
  onFileMutationSuccessRef?: MutableRefObject<(() => void) | undefined>;
}

export const useChatFiles = ({
  id,
  fileTreeData,
  handleRefreshFileList,
  onSaveFileContentSuccessRef,
  onFileMutationSuccessRef,
}: UseChatFilesProps) => {
  const fileTreeDataRef = useRef(fileTreeData);
  fileTreeDataRef.current = fileTreeData;

  /** 文件树发生写操作后统一刷新 Git status */
  const notifyFileMutationSuccess = () => {
    const callback =
      onFileMutationSuccessRef?.current ?? onSaveFileContentSuccessRef?.current;
    void callback?.();
  };

  const handleCreateFileNode = async (
    fileNode: FileNode,
    newName: string,
  ): Promise<boolean> => {
    if (!id) {
      message.warning(t('PC.Pages.Chat.conversationIdMissingCreateFile'));
      return false;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
      return false;
    }

    // 计算新文件的完整路径：父路径 + 新文件名
    const parentPath = fileNode.parentPath || '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    const newFile: UpdateFileInfo = {
      name: newPath,
      binary: false,
      // 文件大小是否超过限制
      sizeExceeded: false,
      // 文件内容
      contents: '',
      // 重命名之前的文件名
      renameFrom: '',
      // 操作类型
      operation: 'create',
      // 是否为目录
      isDir: fileNode.type === 'folder',
    };

    const updatedFilesList: UpdateFileInfo[] = [newFile];

    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id,
      files: updatedFilesList,
    };

    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE && id) {
      // 新建成功后，重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
      await handleRefreshFileList(id);
      notifyFileMutationSuccess();
    }

    return code === SUCCESS_CODE;
  };

  // 删除文件
  const handleDeleteFile = async (fileNode: FileNode): Promise<boolean> => {
    return new Promise((resolve) => {
      modalConfirm(
        t('PC.Pages.Chat.confirmDeleteFile'),
        fileNode.name,
        async () => {
          try {
            // 更新文件列表
            let updatedFilesList: UpdateFileInfo[] = [];
            if (fileNode.type === 'folder') {
              updatedFilesList = [
                {
                  contents: '',
                  name: fileNode.id,
                  operation: 'delete', // 操作类型
                  isDir: true,
                },
              ];
            } else {
              // 找到要删除的文件
              const currentFile = fileTreeData?.find(
                (item: StaticFileInfo) => item.fileId === fileNode.id,
              );
              if (!currentFile) {
                message.error(t('PC.Pages.Chat.fileNotFoundDelete'));
                resolve(false);
                return;
              }

              // 构造更新文件操作
              const updateFile: UpdateFileInfo = {
                name: currentFile.name,
                binary: currentFile.binary,
                sizeExceeded: currentFile.sizeExceeded,
                isDir: currentFile.isDir,
                operation: 'delete',
                contents: '', // 删除时，设置文件内容为空，避免上传内容导致删除文件时长太久
              };

              // 更新文件列表
              updatedFilesList = [updateFile];
            }

            // 更新技能信息
            const newSkillInfo: IUpdateStaticFileParams = {
              cId: id!,
              files: updatedFilesList,
            };
            const { code } = await apiUpdateStaticFile(newSkillInfo);
            if (code === SUCCESS_CODE) {
              // 重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
              await handleRefreshFileList(id!);
              notifyFileMutationSuccess();
              message.success(t('PC.Pages.Chat.deleteSuccess'));
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            console.error('Failed to delete file:', error);
            resolve(false);
          }
        },
        () => {
          // 用户取消删除
          resolve(false);
        },
      );
    });
  };

  // 确认重命名文件
  const handleConfirmRenameFile = async (
    fileNode: FileNode,
    newName: string,
  ) => {
    // 更新原始文件列表中的文件名（用于提交更新）
    const updatedFilesList = updateFilesListName(
      fileTreeData || [],
      fileNode,
      newName,
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id!,
      files: updatedFilesList as UpdateFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE) {
      // 重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
      await handleRefreshFileList(id!);
      notifyFileMutationSuccess();
    }
    return code === SUCCESS_CODE;
  };

  // 保存文件
  const handleSaveFiles = async (
    data: {
      fileId: string;
      fileContent: string;
      originalFileContent: string;
    }[],
  ) => {
    // 更新文件列表(只更新修改过的文件)
    const updatedFilesList = updateFilesListContent(
      fileTreeData || [],
      data,
      'modify',
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id!,
      files: updatedFilesList as UpdateFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE) {
      notifyFileMutationSuccess();
    }
    return code === SUCCESS_CODE;
  };

  /** 编辑器内容变更：防抖实时保存单个文件到服务端 */
  const handleSaveFileContent = useMemo(
    () =>
      debounce(
        async (
          fileId: string,
          content: string,
          originalFileContent: string,
        ): Promise<boolean> => {
          if (!id) {
            return false;
          }
          const updatedFilesList = updateFilesListContent(
            fileTreeDataRef.current || [],
            [{ fileId, fileContent: content, originalFileContent }],
            'modify',
          );
          if (updatedFilesList.length === 0) {
            return false;
          }
          const { code } = await apiUpdateStaticFile({
            cId: id,
            files: updatedFilesList as UpdateFileInfo[],
          });
          if (code === SUCCESS_CODE) {
            notifyFileMutationSuccess();
          }
          return code === SUCCESS_CODE;
        },
        500,
      ),
    [id, onFileMutationSuccessRef, onSaveFileContentSuccessRef],
  );

  /**
   * 处理上传多个文件回调
   * @param files 文件列表
   * @param filePaths 文件路径列表
   * @returns Promise<void>
   */
  const handleUploadMultipleFiles = async (
    files: File[],
    filePaths: string[],
  ) => {
    if (!id) {
      message.warning(t('PC.Pages.Chat.conversationIdMissingUpload'));
      return;
    }

    // 检查文件大小是否超过最大上传文件大小
    const { isExceedLimitSize, maxFileSize } = checkFileSizeExceedLimit(
      files || [],
    );
    // 如果超过最大上传文件大小，则提示错误
    if (isExceedLimitSize) {
      message.warning(t('PC.Common.Global.uploadFileSizeExceed', maxFileSize));
      return;
    }

    try {
      // 直接调用上传接口，使用文件名作为路径
      const { code } = await apiUploadFiles({
        files,
        cId: id,
        filePaths,
      });

      if (code === SUCCESS_CODE) {
        message.success(t('PC.Pages.Chat.uploadSuccess'));
        // 刷新项目详情
        await handleRefreshFileList(id);
        notifyFileMutationSuccess();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // 导出项目
  const handleExportProject = async () => {
    // 检查项目ID是否有效
    if (!id) {
      message.warning(t('PC.Pages.Chat.invalidConversationIdExport'));
      return;
    }

    apiDownloadAllFiles(id);
  };

  return {
    handleCreateFileNode,
    handleDeleteFile,
    handleConfirmRenameFile,
    handleSaveFiles,
    handleSaveFileContent,
    handleUploadMultipleFiles,
    handleExportProject,
  };
};
