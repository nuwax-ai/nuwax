import FileTreeView from '@/components/FileTreeView';
import PublishComponentModal from '@/components/PublishComponentModal';
import { getProjectContent } from '@/services/appDev';
import type { FileNode } from '@/types/interfaces/appDev';
import { transformFlatListToTree } from '@/utils/appDevUtils';
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
  const { run: runSkillInfo } = useRequest(
    getProjectContent || 'apiSkillDetail',
    {
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
    },
  );

  useEffect(() => {
    if (skillId) {
      runSkillInfo('5022159017283584');
    }
  }, [skillId]);

  // 确认发布技能回调
  const handleConfirmPublish = () => {
    console.log('handleConfirmPublish');
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
      <FileTreeView files={files} />

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
