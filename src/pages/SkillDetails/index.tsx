import FileTreeView from '@/components/FileTreeView';
import PublishComponentModal from '@/components/PublishComponentModal';
import { apiSkillDetail, apiSkillImport } from '@/services/skill';
import type { FileNode } from '@/types/interfaces/appDev';
import { transformFlatListToTree } from '@/utils/appDevUtils';
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
  const [skillInfo, setSkillInfo] = useState<any>(null);
  // 文件树数据
  const [files, setFiles] = useState<FileNode[]>([]);
  // 发布技能弹窗是否打开
  const [open, setOpen] = useState<boolean>(false);

  // 查询技能信息
  const { run: runSkillInfo } = useRequest(apiSkillDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: any) => {
      setSkillInfo(result);
      const { files } = result || {};

      let treeData: FileNode[] = [];

      // 检查是否是新的扁平格式
      if (Array.isArray(files) && files.length > 0 && files[0].name) {
        treeData = transformFlatListToTree(files);
      } else if (Array.isArray(files)) {
        // 如果是原有的树形格式，直接使用
        treeData = files as FileNode[];
      }

      setFiles(treeData);
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
  };

  /**
   * 处理上传单个文件回调
   */
  const handleUploadSingleFile = async (node: FileNode | null) => {
    console.log('node', node);
    if (!skillId) {
      message.error('技能ID不能为空');
      return;
    }
    //两种情况 第一个是文件夹，第二个是文件
    // let relativePath = '';
    // if (node) {
    //   if (node.type === 'file') {
    //     relativePath = node.path.replace(new RegExp(node.name + '$'), ''); //只替换以node.name结尾的部分
    //   } else if (node.type === 'folder') {
    //     relativePath = node.path + '/';
    //   }
    // } else {
    //   relativePath = '';
    // }
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

        console.log('file', file);

        // 直接调用上传接口，使用文件名作为路径
        const result = await apiSkillImport({
          file,
          targetSkillId: skillId,
          targetSpaceId: spaceId,
        });

        if (result) {
          message.success('上传成功');
          // 与弹窗上传成功后逻辑保持一致
          // 刷新项目详情(刷新版本列表)
          // projectInfo.refreshProjectInfo();
        }
      } catch (error) {
        console.error('上传失败', error);
      } finally {
        // 清理加载状态和DOM
        // setSingleFileUploadLoading(false);
        // document.body.removeChild(input);
        // setIsFileOperating(false);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
      // setIsFileOperating(false);
    };
  };

  return (
    <div
      className={cx('skill-details-container', 'flex', 'h-full', 'flex-col')}
    >
      {/* 技能头部 */}
      <SkillHeader
        skillInfo={skillInfo}
        onEditAgent={() => {}}
        onPublish={() => setOpen(true)}
      />
      {/* 文件树视图 */}
      <FileTreeView files={files} onUploadSingleFile={handleUploadSingleFile} />

      {/*发布技能弹窗*/}
      <PublishComponentModal
        // mode={AgentComponentTypeEnum.Skill}
        targetId={skillId}
        open={open}
        spaceId={spaceId}
        // category={agentConfigInfo?.category}
        // 取消发布
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmPublish}
      />
    </div>
  );
};

export default SkillDetails;
