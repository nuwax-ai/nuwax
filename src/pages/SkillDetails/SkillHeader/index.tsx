import agentImage from '@/assets/images/agent_image.png';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { PublishStatusEnum } from '@/types/enums/common';
import { SkillDetailInfo } from '@/types/interfaces/skill';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  FormOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';
import MoreActionsMenu from './MoreActionsMenu';

const cx = classNames.bind(styles);

// 技能详情顶部header组件
export interface SkillHeaderProps {
  spaceId: number;
  skillInfo?: SkillDetailInfo | null;
  onEditAgent: () => void;
  onPublish: () => void;
  onToggleHistory: () => void;
  /** 导入项目回调 */
  onImportProject?: () => void;
  /** 导出项目回调 */
  onExportProject?: () => void;
  /** 全屏回调 */
  onFullscreen?: () => void;
}

/**
 * 技能详情顶部header
 */
const SkillHeader: React.FC<SkillHeaderProps> = ({
  spaceId,
  skillInfo,
  onEditAgent,
  onPublish,
  onToggleHistory,
  onImportProject,
  onExportProject,
  onFullscreen,
}) => {
  return (
    <header className={cx('flex', 'items-center', 'relative', styles.header)}>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={() => {
          history.push(`/space/${spaceId}/skill-manage`);
        }}
      />
      <img
        className={cx(styles.avatar)}
        src={skillInfo?.icon || (agentImage as string)}
        alt=""
      />
      <div className={cx('flex', 'items-center', styles['header-info'])}>
        <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
          {skillInfo?.name}
        </h3>

        <Button
          type="text"
          icon={<FormOutlined />}
          className={cx(styles['edit-ico'])}
          onClick={onEditAgent}
        />

        {skillInfo?.publishStatus === PublishStatusEnum.Published && (
          <TooltipIcon
            title="已发布"
            icon={<CheckCircleFilled className={cx(styles.circle)} />}
          />
        )}

        {/* 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布 */}
        {skillInfo?.publishDate !== null &&
          dayjs(skillInfo?.publishDate).isBefore(skillInfo?.modified) && (
            <Tag
              bordered={false}
              color="volcano"
              className={cx(styles['volcano'])}
            >
              有更新未发布
            </Tag>
          )}
      </div>
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <MoreActionsMenu
          onImportProject={onImportProject}
          onFullscreenPreview={onFullscreen}
          onExportProject={onExportProject}
        />
        {/* 版本历史 */}
        <Button
          type="text"
          icon={<ClockCircleOutlined />}
          onClick={onToggleHistory}
        />
        <Button
          type="primary"
          className={cx(styles['publish-btn'])}
          onClick={onPublish}
        >
          发布
        </Button>
      </div>
    </header>
  );
};

export default SkillHeader;
