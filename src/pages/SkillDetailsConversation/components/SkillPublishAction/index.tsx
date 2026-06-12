import PublishComponentModal from '@/components/PublishComponentModal';
import { dict } from '@/services/i18nRuntime';
import { apiSkillDetail } from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import { SkillDetailInfo } from '@/types/interfaces/skill';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SkillPublishActionProps {
  spaceId: number;
  skillId: number;
}

/**
 * 技能发布动作组件（供右上角插槽使用）
 */
const SkillPublishAction: React.FC<SkillPublishActionProps> = ({
  spaceId,
  skillId,
}) => {
  const [skillInfo, setSkillInfo] = useState<SkillDetailInfo | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);

  // 会话文件树刷新逻辑
  const conversationModel = useModel('conversationInfo');
  const conversationId = conversationModel?.conversationInfo?.id;

  const refreshFiles = () => {
    if (conversationId && conversationModel?.refreshFileListImmediately) {
      conversationModel.refreshFileListImmediately(conversationId);
    }
  };

  // 请求技能详情
  const { run: runSkillInfo } = useRequest(apiSkillDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: any) => {
      const data = result?.data !== undefined ? result.data : result;
      setSkillInfo(data);
    },
  });

  useEffect(() => {
    if (skillId) {
      runSkillInfo(skillId);
    }
  }, [skillId]);

  // 当外部会话列表刷新时，我们也重新同步一下技能信息（以便检测是否有未发布的更新）
  useEffect(() => {
    if (skillId && conversationModel?.fileTreeData) {
      runSkillInfo(skillId);
    }
  }, [conversationModel?.fileTreeData]);

  // 发布技能
  const handlePublishSkill = () => {
    setPublishModalOpen(true);
  };

  const handleConfirmPublish = () => {
    setPublishModalOpen(false);
    const time = dayjs().toString();
    if (skillInfo) {
      setSkillInfo({
        ...skillInfo,
        publishDate: time,
        modified: time,
        publishStatus: PublishStatusEnum.Published,
      } as SkillDetailInfo);
    }
    runSkillInfo(skillId);
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
