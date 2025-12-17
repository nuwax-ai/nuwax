import FileTreeView from '@/components/FileTreeView';
import PublishComponentModal from '@/components/PublishComponentModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiSkillDetail,
  apiSkillExport,
  apiSkillTemplate,
  apiSkillUpdate,
  apiSkillUploadFile,
} from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { FileNode } from '@/types/interfaces/appDev';
import {
  SkillDetailInfo,
  SkillFileInfo,
  SkillUpdateParams,
} from '@/types/interfaces/skill';
import { exportWholeProjectZip } from '@/utils/exportImportFile';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import styles from './index.less';
import SkillHeader from './SkillHeader';

const cx = classNames.bind(styles);
/**
 * 技能详情页面
 */
const SkillDetails: React.FC = () => {
  const { spaceId, skillId } = useParams();
  // 技能信息
  const [skillInfo, setSkillInfo] = useState<SkillDetailInfo | null>(null);
  // 发布技能弹窗是否打开
  const [open, setOpen] = useState<boolean>(false);
  // 编辑技能信息弹窗是否打开
  const [editSkillModalOpen, setEditSkillModalOpen] = useState<boolean>(false);

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
        const {
          data: templateInfo,
          code,
          message: errorMessage,
        } = await apiSkillTemplate();
        if (code === SUCCESS_CODE) {
          setSkillInfo(() => ({
            ...result,
            files: templateInfo?.files?.map((item) => ({
              ...item,
              fileId: item.name,
            })),
          }));
        } else {
          setSkillInfo(() => ({
            ...result,
            files: files?.map((item) => ({
              ...item,
              fileId: item.name,
            })),
          }));
          message.error(errorMessage || '获取技能模板失败');
        }
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
    console.log('handleConfirmPublish');
    setOpen(false);
    // // 同步发布时间和修改时间
    // const time = dayjs().toString();
    // // 更新技能配置信息
    // const _skillInfo = {
    //   ...skillInfo,
    //   publishDate: time,
    //   modified: time,
    // };
  };

  /**
   * 处理上传单个文件回调
   */
  const handleUploadSingleFile = async (node: FileNode | null) => {
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
        // 设置加载状态，与弹窗上传保持一致
        // setSingleFileUploadLoading(true);
        // setIsFileOperating(true);

        // 直接调用上传接口，使用文件名作为路径
        const result = await apiSkillUploadFile({
          file,
          skillId,
          filePath: relativePath + file.name,
        });

        if (result) {
          message.success('上传成功');
          // 刷新项目详情
          runSkillInfo(skillId);
        }
      } catch (error) {
        console.error('上传失败', error);
      } finally {
        // 清理加载状态和DOM
        // setSingleFileUploadLoading(false);
        document.body.removeChild(input);
        // setIsFileOperating(false);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
      // setIsFileOperating(false);
    };
  };

  // 下载技能文件
  const handleDownload = async () => {
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

  // 编辑技能信息
  const handleEditSkill = () => {
    console.log('handleEditSkill', editSkillModalOpen);
    setEditSkillModalOpen(true);
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
      'rename',
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
      const updatedFilesList =
        skillInfo?.files?.map((item) => {
          if (item.name === fileNode.name) {
            item.name = newName;
          }
          return item;
        }) || [];
      setSkillInfo({
        ...skillInfo,
        files: updatedFilesList,
      } as SkillDetailInfo);
    }
    return code === SUCCESS_CODE;
  };

  // console.log('skillInfo77777', skillInfo);

  // 保存文件
  const handleSaveFiles = async (
    data: {
      fileId: string;
      fileContent: string;
      originalFileContent: string;
    }[],
  ) => {
    console.log('handleSaveFiles', data, '2222', skillInfo);

    const updatedFilesList = updateFilesListContent(
      skillInfo?.files || [],
      data,
      'modify',
    );

    console.log('updatedFilesList77777', updatedFilesList);

    // 更新技能信息，用于提交更新
    const newSkillInfo: SkillUpdateParams = {
      id: skillInfo?.id || 0,
      files: updatedFilesList,
    };

    // 使用文件全量更新逻辑
    const { code } = await apiSkillUpdate(newSkillInfo);
    console.log('handleSaveFiles code44444444444444', code);
    return code === SUCCESS_CODE;
    // data.forEach(item => {
    //   const updatedFilesList = updateFilesListContent(
    //     skillInfo?.files || [],
    //     item.fileId,
    //     item.fileContent,
    //     'modify',
    //   );
    // });
    // 保存文件
    // const response = await apiSkillSaveFile(data);
    // if (response.code === SUCCESS_CODE) {
    //   message.success('保存成功');
    // } else {
    //   message.error('保存失败');
    // }
  };

  return (
    <div
      className={cx('skill-details-container', 'flex', 'h-full', 'flex-col')}
    >
      {/* 技能头部 */}
      <SkillHeader
        skillInfo={skillInfo}
        onEditAgent={handleEditSkill}
        onPublish={() => setOpen(true)}
      />
      {/* 文件树视图 */}
      <FileTreeView
        originalFiles={skillInfo?.files || []}
        onUploadSingleFile={handleUploadSingleFile}
        onDownload={handleDownload}
        onRenameFile={handleConfirmRenameFile}
        onSaveFiles={handleSaveFiles}
      />

      {/*发布技能弹窗*/}
      <PublishComponentModal
        mode={AgentComponentTypeEnum.Skill}
        targetId={skillId}
        open={open}
        spaceId={spaceId}
        // category={skillInfo?.category}
        // 取消发布
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmPublish}
      />
    </div>
  );
};

export default SkillDetails;
