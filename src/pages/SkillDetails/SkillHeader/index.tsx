import agentImage from '@/assets/images/agent_image.png';
import {
  ClockCircleOutlined,
  FormOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 技能详情顶部header组件
export interface SkillHeaderProps {
  spaceId: number;
  skillInfo?: any;
  onEditAgent: () => void;
  onPublish: () => void;
  onToggleHistory: () => void;
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
      </div>
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
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
