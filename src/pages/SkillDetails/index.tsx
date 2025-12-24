import FileTreeView from '@/components/FileTreeView';
import type { FileTreeViewRef } from '@/components/FileTreeView/type';
import PublishComponentModal from '@/components/PublishComponentModal';
import VersionHistory from '@/components/VersionHistory';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiSkillDetail,
  apiSkillExport,
  apiSkillImport,
  apiSkillUpdate,
  apiSkillUploadFiles,
} from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import type { FileNode } from '@/types/interfaces/appDev';
import { SkillInfo } from '@/types/interfaces/library';
import {
  SkillDetailInfo,
  SkillFileInfo,
  SkillUpdateParams,
} from '@/types/interfaces/skill';
import { modalConfirm } from '@/utils/ant-custom';
import { exportWholeProjectZip } from '@/utils/exportImportFile';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRequest } from 'umi';
import CreateSkill from '../SpaceSkillManage/CreateSkill';
import styles from './index.less';
import SkillHeader from './SkillHeader';

const cx = classNames.bind(styles);
/**
 * 技能详情页面
 */
const SkillDetails: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const skillId = Number(params.skillId);
  // 技能信息
  const [skillInfo, setSkillInfo] = useState<SkillDetailInfo | null>(null);
  // 发布技能弹窗是否打开
  const [open, setOpen] = useState<boolean>(false);
  // 编辑技能信息弹窗是否打开
  const [editSkillModalOpen, setEditSkillModalOpen] = useState<boolean>(false);
  // 版本历史弹窗是否打开
  const [versionHistoryModal, setVersionHistoryModal] =
    useState<boolean>(false);
  // 文件树视图ref
  const fileTreeViewRef = useRef<FileTreeViewRef>(null);
  // 是否显示全屏预览
  const [isFullscreenPreview, setIsFullscreenPreview] =
    useState<boolean>(false);

  // 查询技能信息
  const { run: runSkillInfo } = useRequest(apiSkillDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: SkillDetailInfo) => {
      const { files } = result || {};
      if (Array.isArray(files) && files.length > 0) {
        setSkillInfo(() => ({
          ...result,
          files: files.map((item) => ({
            ...item,
            fileId: item.name,
          })),
        }));
      } else {
        setSkillInfo(result);
      }
    },
  });

  useEffect(() => {
    if (skillId) {
      runSkillInfo(skillId);
    }
  }, [skillId]);

  // 确认发布技能回调
  const handleConfirmPublish = () => {
    setOpen(false);

    // 同步发布时间和修改时间
    const time = dayjs().toString();
    // 更新智能体配置信息
    const _skillInfo = {
      ...skillInfo,
      publishDate: time,
      modified: time,
      publishStatus: PublishStatusEnum.Published,
    } as SkillDetailInfo;
    setSkillInfo(_skillInfo);
  };

  // 导入项目
  const handleImportProject = async () => {
    if (!skillId) {
      message.error('技能ID不能为空');
      return;
    }

    if (!spaceId) {
      message.error('空间ID不能为空');
      return;
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = '.zip'; // 只接受 zip 文件
    document.body.appendChild(input);

    // 等待用户选择文件
    input.click();

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      // 校验文件类型
      const isZip = file.name?.toLowerCase().endsWith('.zip');
      if (!isZip) {
        message.error('仅支持 .zip 压缩文件格式');
        document.body.removeChild(input);
        return;
      }

      try {
        // 调用导入接口
        const result = await apiSkillImport({
          file,
          targetSkillId: skillId,
          targetSpaceId: spaceId,
        });

        if (result.code === SUCCESS_CODE) {
          message.success('导入成功');
          // 刷新技能信息
          runSkillInfo(skillId);
        }
      } catch (error) {
        console.error('导入失败', error);
      } finally {
        // 清理DOM
        document.body.removeChild(input);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
    };
  };

  /**
   * 处理上传多个文件回调
   */
  const handleUploadMultipleFiles = async (node: FileNode | null) => {
    if (!skillId) {
      message.error('技能ID不能为空');
      return;
    }
    // 两种情况 第一个是文件夹，第二个是文件
    let relativePath = '';

    if (node) {
      if (node.type === 'file') {
        relativePath = node.path.replace(new RegExp(node.name + '$'), ''); //只替换以node.name结尾的部分
      } else if (node.type === 'folder') {
        relativePath = node.path + '/';
      }
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.multiple = true;
    document.body.appendChild(input);

    // 等待用户选择文件
    input.click();

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      try {
        // 获取上传的文件列表
        const files = Array.from((e.target as HTMLInputElement).files || []);
        // 获取上传的文件路径列表
        const filePaths = files.map((file) => relativePath + file.name);
        // 直接调用上传接口，使用文件名作为路径
        const { code } = await apiSkillUploadFiles({
          files,
          skillId,
          filePaths,
        });

        if (code === SUCCESS_CODE) {
          message.success('上传成功');
          // 刷新项目详情
          runSkillInfo(skillId);
        }
      } catch (error) {
        console.error('上传失败', error);
      } finally {
        document.body.removeChild(input);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
    };
  };

  // 导出项目
  const handleExportProject = async () => {
    // 检查项目ID是否有效
    if (!skillId) {
      message.error('技能ID不存在或无效，无法导出');
      return;
    }

    try {
      const result = await apiSkillExport(skillId);
      const filename = `skill-${skillId}.zip`;
      // 导出整个项目压缩包
      exportWholeProjectZip(result, filename);
      message.success('导出成功！');
    } catch (error) {
      // 改进错误处理，兼容不同的错误格式
      const errorMessage =
        (error as any)?.message ||
        (error as any)?.toString() ||
        '导出过程中发生未知错误';

      message.error(`导出失败: ${errorMessage}`);
    }
  };

  // 删除文件
  const handleDeleteFile = async (fileNode: FileNode) => {
    modalConfirm('您确定要删除此文件吗?', fileNode.name, async () => {
      // 找到要删除的文件
      const currentFile = skillInfo?.files?.find(
        (item) => item.fileId === fileNode.id,
      );
      if (!currentFile) {
        message.error('文件不存在，无法删除');
        return;
      }

      // 更新文件操作
      currentFile.operation = 'delete';
      // 更新文件列表
      const updatedFilesList = [currentFile] as SkillFileInfo[];

      // 更新技能信息
      const newSkillInfo: SkillUpdateParams = {
        id: skillInfo?.id || 0,
        files: updatedFilesList,
      };
      const { code } = await apiSkillUpdate(newSkillInfo);
      if (code === SUCCESS_CODE) {
        setSkillInfo(
          (prev) =>
            ({
              ...prev,
              files:
                prev?.files?.filter((item) => item.fileId !== fileNode.id) ||
                [],
            } as SkillDetailInfo),
        );
      }
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });
  };

  // 新建文件（空内容）、文件夹
  const handleCreateFileNode = async (
    fileNode: FileNode,
    newName: string,
  ): Promise<boolean> => {
    if (!skillInfo) {
      message.error('技能信息不存在，无法新建文件');
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
      // 新建成功后，重新拉取技能详情以刷新文件树和文件列表
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
      // 这里根据fileNode的name，找到skillInfo对象中files数组中对应的文件，然后更新文件名
      // const updatedFilesList =
      //   skillInfo?.files?.map((item) => {
      //     if (item.name === fileNode.name) {
      //       item.name = newName;
      //     }
      //     return item;
      //   }) || [];
      // setSkillInfo({
      //   ...skillInfo,
      //   files: updatedFilesList,
      // } as SkillDetailInfo);
      // 重新查询技能信息，因为更新了文件名或文件夹名称，需要刷新文件树
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
    return code === SUCCESS_CODE;
  };

  // 确认编辑技能信息
  const handleEditSkillConfirm = () => {
    setEditSkillModalOpen(false);
    // 重新查询技能信息，因为更新了技能信息，需要刷新文件树和文件列表
    runSkillInfo(skillId);
  };

  // 发布技能
  const handlePublishSkill = () => {
    const changeFiles = fileTreeViewRef.current?.changeFiles;
    if (changeFiles && changeFiles.length > 0) {
      message.warning('请先保存文件后再发布');
      return;
    }
    setOpen(true);
  };

  return (
    <div className={cx('flex', 'h-full', 'flex-col')}>
      {/* 技能头部 */}
      <SkillHeader
        spaceId={spaceId}
        skillInfo={skillInfo}
        // 编辑技能信息
        onEditAgent={() => setEditSkillModalOpen(true)}
        onPublish={handlePublishSkill}
        onToggleHistory={() => setVersionHistoryModal(!versionHistoryModal)}
        // 导入项目
        onImportProject={handleImportProject}
        // 导出项目
        onExportProject={handleExportProject}
        // 全屏
        onFullscreen={() => {
          setIsFullscreenPreview(true);
        }}
      />

      <div className={cx('flex', 'flex-1')}>
        {/* 文件树视图 */}
        <FileTreeView
          ref={fileTreeViewRef}
          // 技能文件列表
          originalFiles={skillInfo?.files || []}
          // 上传文件
          onUploadFiles={handleUploadMultipleFiles}
          // 导出项目
          onExportProject={handleExportProject}
          // 重命名文件
          onRenameFile={handleConfirmRenameFile}
          // 新建文件
          onCreateFileNode={handleCreateFileNode}
          // 保存文件
          onSaveFiles={handleSaveFiles}
          // 删除文件
          onDeleteFile={handleDeleteFile}
          // 导入项目
          onImportProject={handleImportProject}
          // 是否显示更多操作菜单
          showMoreActions={false}
          // 是否显示全屏预览
          isFullscreenPreview={isFullscreenPreview}
          onFullscreenPreview={setIsFullscreenPreview}
        />

        {/*版本历史*/}
        <VersionHistory
          headerClassName={cx(styles['version-history-header'])}
          targetId={skillId}
          targetName={skillInfo?.name}
          targetType={AgentComponentTypeEnum.Skill}
          permissions={skillInfo?.permissions || []}
          visible={versionHistoryModal}
          onClose={() => setVersionHistoryModal(false)}
        />
      </div>

      {/*发布技能弹窗*/}
      <PublishComponentModal
        mode={AgentComponentTypeEnum.Skill}
        targetId={skillId}
        open={open}
        spaceId={spaceId}
        category={skillInfo?.category}
        // 取消发布
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmPublish}
      />

      {/* 创建技能弹窗 */}
      <CreateSkill
        spaceId={spaceId}
        open={editSkillModalOpen}
        type={CreateUpdateModeEnum.Update}
        skillInfo={skillInfo as SkillInfo}
        onCancel={() => setEditSkillModalOpen(false)}
        onConfirm={handleEditSkillConfirm}
      />
    </div>
  );
};

export default SkillDetails;
