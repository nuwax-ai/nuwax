import agentImage from '@/assets/images/agent_image.png';
import TooltipIcon from '@/components/custom/TooltipIcon';
import CreateSkill from '@/pages/SpaceSkillManage/CreateSkill';
import { dict } from '@/services/i18nRuntime';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import { SkillInfo } from '@/types/interfaces/library';
import { SkillDetailInfo } from '@/types/interfaces/skill';
import {
  CheckCircleFilled,
  FormOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SkillHeaderProps {
  spaceId: number;
  skillId: number;
  skillInfo: SkillDetailInfo | null;
  onRefresh: () => void;
}

/**
 * 技能详情会话左上角技能头部组件
 */
const SkillHeader: React.FC<SkillHeaderProps> = ({
  spaceId,
  skillInfo,
  onRefresh,
}) => {
  // 弹窗状态
  const [editSkillModalOpen, setEditSkillModalOpen] = useState<boolean>(false);

  // 会话文件树刷新逻辑
  const conversationModel = useModel('conversationInfo');
  const conversationId = conversationModel?.conversationInfo?.id;

  const refreshFiles = () => {
    if (conversationId && conversationModel?.refreshFileListImmediately) {
      conversationModel.refreshFileListImmediately(conversationId);
    }
  };

  // 编辑技能信息
  const handleEditSkill = () => {
    setEditSkillModalOpen(true);
  };

  const handleEditSkillConfirm = () => {
    setEditSkillModalOpen(false);
    onRefresh();
    refreshFiles();
  };

  return (
    <div className={cx(styles['skill-header-container'])}>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={() => {
          history.push(`/space/${spaceId}/skill-manage`);
        }}
        className={cx(styles['back-btn'])}
      />
      <img
        className={cx(styles['avatar'])}
        src={skillInfo?.icon || (agentImage as string)}
        alt=""
      />
      <div className={cx(styles['info-section'])}>
        {!!skillInfo && (
          <>
            <h3 className={cx(styles['title'], 'text-ellipsis')}>
              {skillInfo?.name}
            </h3>

            <Button
              type="text"
              icon={<FormOutlined />}
              className={cx(styles['edit-btn'])}
              onClick={handleEditSkill}
            />
          </>
        )}

        {skillInfo?.publishStatus === PublishStatusEnum.Published && (
          <TooltipIcon
            title={dict('PC.Pages.SkillDetailsHeader.published')}
            icon={
              <CheckCircleFilled className={cx(styles['published-icon'])} />
            }
          />
        )}
      </div>

      <CreateSkill
        spaceId={spaceId}
        open={editSkillModalOpen}
        type={CreateUpdateModeEnum.Update}
        skillInfo={skillInfo ? (skillInfo as SkillInfo) : undefined}
        onCancel={() => setEditSkillModalOpen(false)}
        onConfirm={handleEditSkillConfirm}
      />
    </div>
  );
};

export default SkillHeader;
