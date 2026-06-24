import PublishComponentModal from '@/components/PublishComponentModal';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SkillDetailInfo } from '@/types/interfaces/skill';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SkillPublishActionProps {
  spaceId: number;
  skillId: number;
  skillInfo: SkillDetailInfo | null;
  onRefresh: () => void;
}

/**
 * 技能发布动作组件（供右上角插槽使用）
 */
const SkillPublishAction: React.FC<SkillPublishActionProps> = ({
  spaceId,
  skillId,
  skillInfo,
  onRefresh,
}) => {
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);

  // 会话文件树刷新逻辑
  const conversationModel = useModel('conversationInfo');
  const conversationId = conversationModel?.conversationInfo?.id;

  const refreshFiles = () => {
    if (conversationId && conversationModel?.refreshFileListImmediately) {
      conversationModel.refreshFileListImmediately(conversationId);
    }
  };

  // 发布技能
  const handlePublishSkill = () => {
    setPublishModalOpen(true);
  };

  const handleConfirmPublish = () => {
    setPublishModalOpen(false);
    onRefresh();
    refreshFiles();
  };

  return (
    <div className={cx(styles['skill-publish-action-container'])}>
      {skillInfo?.publishDate !== null &&
        dayjs(skillInfo?.publishDate).isBefore(skillInfo?.modified) && (
          <Tag
            bordered={false}
            color="volcano"
            className={cx(styles['volcano-tag'])}
          >
            {dict('PC.Pages.SkillDetailsHeader.updatesNotPublished')}
          </Tag>
        )}
      <Button
        type="primary"
        className={cx(styles['publish-btn'])}
        onClick={handlePublishSkill}
        disabled={!skillInfo}
      >
        {dict('PC.Pages.SkillDetailsHeader.publish')}
      </Button>

      <PublishComponentModal
        mode={AgentComponentTypeEnum.Skill}
        targetId={skillId}
        open={publishModalOpen}
        spaceId={spaceId}
        category={skillInfo?.category}
        onCancel={() => setPublishModalOpen(false)}
        onConfirm={handleConfirmPublish}
      />
    </div>
  );
};

export default SkillPublishAction;
