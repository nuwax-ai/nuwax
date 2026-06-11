import type { FileTreeViewRef } from '@/components/FileTreeView/type';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import {
  apiSkillImport,
  apiSkillUpdate,
  apiSkillUploadFiles,
} from '@/services/skill';
import { PublishStatusEnum } from '@/types/enums/common';
import type { FileNode } from '@/types/interfaces/appDev';
import type {
  SkillDetailInfo,
  SkillFileInfo,
  SkillUpdateParams,
} from '@/types/interfaces/skill';
import { modalConfirm } from '@/utils/ant-custom';
import { exportFileViaBrowserDownload } from '@/utils/exportImportFile';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { message } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useRef, useState } from 'react';

// 技能项目文件大小限制
const SKILL_MAX_FILE_SIZE = 20 * 1024 * 1024; // 最大文件大小20MB

interface UseSkillFilesProps {
  skillId: number;
  spaceId: number;
  skillInfo: SkillDetailInfo | null;
  setSkillInfo: React.Dispatch<React.SetStateAction<SkillDetailInfo | null>>;
  runSkillInfo: (skillId: number) => any;
}

export const useSkillFiles = ({
  skillId,
  spaceId,
  skillInfo,
  setSkillInfo,
  runSkillInfo,
}: UseSkillFilesProps) => {
  const fileTreeViewRef = useRef<FileTreeViewRef>(null);

  // 文件树数据加载状态
  const [fileTreeDataLoading, setFileTreeDataLoading] =
    useState<boolean>(false);
  // 是否显示全屏预览
  const [isFullscreenPreview, setIsFullscreenPreview] =
    useState<boolean>(false);
  // 是否正在导入项目
  const [isImportingProject, setIsImportingProject] = useState<boolean>(false);
  // 重新导入项目触发标志，用于强制触发文件选择
  const [importProjectTrigger, setImportProjectTrigger] = useState<
    number | string
  >(0);
  // 导入技能项目弹窗
  const [openImportSkillProject, setOpenImportSkillProject] =
    useState<boolean>(false);
  // 导出项目加载状态
  const [loadingExportProject, setLoadingExportProject] =
    useState<boolean>(false);

  // 检查是否有未保存的文件修改
  const hasUnsavedChanges = useCallback(() => {
    const changeFiles = fileTreeViewRef.current?.changeFiles;
    return Array.isArray(changeFiles) && changeFiles.length > 0;
  }, []);

  /**
   * 如果有未保存的文件修改，则提示用户并返回
   * @param text 操作文本
   * @returns {boolean} true-可以继续执行，false-有未保存更改，需要阻止执行
   */
  const handleCheckUnsavedChanges = (
    text: string = t('PC.Pages.SkillDetails.actionPublish'),
  ): boolean => {
    const _hasUnsavedChanges = hasUnsavedChanges();
    if (_hasUnsavedChanges) {
      message.warning(t('PC.Pages.SkillDetails.saveBeforeAction', text));
      return false; // 有未保存更改，阻止执行
    }
    return true; // 没有未保存更改，可以继续执行
  };

  // 保存未保存的文件（用于离开保护）
  const saveUnsavedFiles = useCallback(async () => {
    const changeFiles = fileTreeViewRef.current?.changeFiles;
    if (changeFiles && changeFiles.length > 0) {
      // 更新文件列表(只更新修改过的文件)
      const updatedFilesList = updateFilesListContent(
        skillInfo?.files || [],
        changeFiles,
        'modify',
      );

      // 更新技能信息，用于提交更新
      const newSkillInfo: SkillUpdateParams = {
        id: skillInfo?.id || 0,
        files: updatedFilesList,
      };

      try {
        const { code } = await apiSkillUpdate(newSkillInfo);
        if (code === SUCCESS_CODE) {
          message.success(t('PC.Pages.SkillDetails.saveSuccess'));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to save files:', error);
        return false;
      }
    }
    return true;
  }, [skillInfo]);

  // 删除文件
  const handleDeleteFile = async (fileNode: FileNode): Promise<boolean> => {
    return new Promise((resolve) => {
      modalConfirm(
        t('PC.Pages.SkillDetails.confirmDeleteFile'),
        fileNode.name,
        async () => {
          try {
            let updatedFilesList: SkillFileInfo[] = [];
            if (fileNode.type === 'folder') {
              updatedFilesList = [
                {
                  contents: '',
                  name: fileNode.id,
                  operation: 'delete',
                  isDir: true,
                },
              ];
            } else {
              // 找到要删除的文件
              const currentFile = skillInfo?.files?.find(
                (item) => item.fileId === fileNode.id,
              );
              if (!currentFile) {
                message.error(t('PC.Pages.SkillDetails.fileNotFound'));
                resolve(false);
                return;
              }

              // 更新文件操作
              currentFile.operation = 'delete';
              // 删除时，设置文件内容为空，避免上传内容导致删除文件时长太久
              currentFile.contents = '';
              // 更新文件列表
              updatedFilesList = [currentFile];
            }

            // 更新技能信息
            const newSkillInfo: SkillUpdateParams = {
              id: skillInfo?.id || 0,
              files: updatedFilesList,
            };
            const { code } = await apiSkillUpdate(newSkillInfo);
            if (code === SUCCESS_CODE) {
              runSkillInfo(skillId);
              message.success(t('PC.Pages.SkillDetails.deleteSuccess'));
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

  // 新建文件（空内容）、文件夹
  const handleCreateFileNode = async (
    fileNode: FileNode,
    newName: string,
  ): Promise<boolean> => {
    if (!skillInfo) {
      message.error(t('PC.Pages.SkillDetails.skillInfoMissing'));
      return false;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
      return false;
    }

    // 计算新文件的完整路径：父路径 + 新文件名
    const parentPath = fileNode.parentPath || '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    const newFile: SkillFileInfo = {
      fileId: newPath,
      name: newPath,
      contents: '',
      operation: 'create',
      isDir: fileNode.type === 'folder',
    };

    const updatedFilesList: SkillFileInfo[] = [newFile];

    const newSkillInfo: SkillUpdateParams = {
      id: skillInfo.id,
      files: updatedFilesList,
    };

    const { code } = await apiSkillUpdate(newSkillInfo);
    if (code === SUCCESS_CODE && skillId) {
      setFileTreeDataLoading(true);
      runSkillInfo(skillId);
      return true;
    }

    return false;
  };

  // 确认重命名文件
  const handleConfirmRenameFile = async (
    fileNode: FileNode,
    newName: string,
  ) => {
    // 更新原始文件列表中的文件名（用于提交更新）
    const updatedFilesList = updateFilesListName(
      skillInfo?.files || [],
      fileNode,
      newName,
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: SkillUpdateParams = {
      id: skillInfo?.id || 0,
      files: updatedFilesList as unknown as SkillFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiSkillUpdate(newSkillInfo);
    if (code === SUCCESS_CODE) {
      setFileTreeDataLoading(true);
      runSkillInfo(skillId);
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
      skillInfo?.files || [],
      data,
      'modify',
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: SkillUpdateParams = {
      id: skillInfo?.id || 0,
      files: updatedFilesList,
    };

    // 使用文件全量更新逻辑
    const { code } = await apiSkillUpdate(newSkillInfo);
    if (code === SUCCESS_CODE && skillId) {
      // 重新查询技能信息，刷新文件树和文件列表
      setFileTreeDataLoading(true);
      runSkillInfo(skillId);

      // 已发布的技能，修改时需要更新修改时间
      if (
        skillInfo &&
        skillInfo.publishStatus === PublishStatusEnum.Published
      ) {
        setSkillInfo({
          ...skillInfo,
          modified: dayjs().toString(),
        } as SkillDetailInfo);
      }
    }
    return code === SUCCESS_CODE;
  };

  // 批量文件上传回调
  const handleUploadMultipleFiles = async (
    files: File[],
    filePaths: string[],
  ) => {
    if (!skillId) {
      message.error(t('PC.Pages.SkillDetails.skillIdRequired'));
      return;
    }

    const totalSize = files?.reduce((acc, file) => acc + file.size, 0);

    if (totalSize > SKILL_MAX_FILE_SIZE) {
      message.error(t('PC.Pages.SkillDetails.uploadSizeLimitExceeded'));
      return;
    }

    try {
      const { code } = await apiSkillUploadFiles({
        files,
        skillId,
        filePaths,
      });

      if (code === SUCCESS_CODE) {
        message.success(t('PC.Pages.SkillDetails.uploadSuccess'));
        runSkillInfo(skillId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // 导出项目
  const handleExportProject = async () => {
    if (!skillId) {
      message.warning(t('PC.Pages.SkillDetails.invalidSkillIdForExport'));
      return;
    }

    try {
      setLoadingExportProject(true);
      const linkUrl = `${process.env.BASE_URL}/api/skill/export/${skillId}`;
      exportFileViaBrowserDownload(linkUrl);
      message.success(t('PC.Pages.SkillDetails.exportSuccess'));
    } catch (error) {
      console.error('Failed to export project:', error);
    } finally {
      setLoadingExportProject(false);
    }
  };

  // 导入项目
  const handleImportProject = async () => {
    if (!skillId) {
      message.error(t('PC.Pages.SkillDetails.skillIdRequired'));
      return;
    }

    if (!spaceId) {
      message.error(t('PC.Pages.SkillDetails.spaceIdRequired'));
      return;
    }

    setOpenImportSkillProject(true);
  };

  // 确认导入技能项目
  const handleImportSkillProjectConfirm = async (file: File) => {
    try {
      setIsImportingProject(true);
      const { code } = await apiSkillImport({
        file,
        targetSkillId: skillId,
        targetSpaceId: spaceId,
      });

      setIsImportingProject(false);
      if (code === SUCCESS_CODE) {
        message.success(t('PC.Pages.SkillDetails.importSuccess'));
        setOpenImportSkillProject(false);
        runSkillInfo(skillId);
        setImportProjectTrigger(Date.now());
      }
    } catch (error) {
      setIsImportingProject(false);
      console.error('Import failed:', error);
    }
  };

  return {
    fileTreeViewRef,
    fileTreeDataLoading,
    setFileTreeDataLoading,
    isFullscreenPreview,
    setIsFullscreenPreview,
    isImportingProject,
    importProjectTrigger,
    openImportSkillProject,
    setOpenImportSkillProject,
    loadingExportProject,
    handleCheckUnsavedChanges,
    saveUnsavedFiles,
    handleDeleteFile,
    handleCreateFileNode,
    handleConfirmRenameFile,
    handleSaveFiles,
    handleUploadMultipleFiles,
    handleExportProject,
    handleImportProject,
    handleImportSkillProjectConfirm,
    hasUnsavedChanges,
  };
};
