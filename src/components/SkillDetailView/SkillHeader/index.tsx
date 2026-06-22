import agentImage from '@/assets/images/agent_image.png';
import { t } from '@/services/i18nRuntime';
import type { SkillDetailInfo } from '@/types/interfaces/skill';
import { CheckCircleFilled, LeftOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 详情页模式：apply — 待审核 / published — 已发布 */
export type SkillDetailViewMode = 'apply' | 'published';

export interface SkillHeaderProps {
  skillInfo?: SkillDetailInfo | null;
  mode: SkillDetailViewMode;
}

/** mode 对应的配置 */
const modeConfig: Record<
  SkillDetailViewMode,
  {
    backPath: string;
    tagColor: string;
    tagIcon?: React.ReactNode;
    tagText: string;
  }
> = {
  apply: {
    backPath: '/system/publish/audit',
    tagColor: 'processing',
    tagText: t('PC.Pages.PublishAudit.statusApplying'),
  },
  published: {
    backPath: '/system/published/manage',
    tagColor: 'success',
    tagIcon: <CheckCircleFilled />,
    tagText: t('PC.Pages.SkillDetailsHeader.published'),
  },
};

/**
 * 技能详情顶部 header 组件（待审核 / 已发布 共用）
 */
const SkillHeader: React.FC<SkillHeaderProps> = ({ skillInfo, mode }) => {
  const config = modeConfig[mode];

  return (
    <header className={cx('flex', 'items-center', styles['header'])}>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={() => {
          if (window.history.length > 1) {
            history.back();
          } else {
            history.push(config.backPath);
          }
        }}
      />
      <img
        className={cx(styles['avatar'])}
        src={skillInfo?.icon || (agentImage as string)}
        alt=""
      />
      <div className={cx(styles['header-info'])}>
        {!!skillInfo && (
          <h3 className={cx(styles['title'], 'text-ellipsis')}>
            {skillInfo?.name}
          </h3>
        )}
      </div>

      <Tag
        className={cx(styles['status-tag'])}
        color={config.tagColor}
        bordered={false}
        icon={config.tagIcon}
      >
        {config.tagText}
      </Tag>
    </header>
  );
};

export default SkillHeader;
