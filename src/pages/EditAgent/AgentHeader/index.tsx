import personal from '@/assets/images/personal.png';
import ConditionRender from '@/components/ConditionRender';
import { ICON_FOLD } from '@/constants/images.constants';
import type { AgentHeaderProps } from '@/types/interfaces/agentConfig';
import {
  ClockCircleOutlined,
  FormOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 编辑智能体顶部header
 */
const AgentHeader: React.FC<AgentHeaderProps> = ({
  agentConfigInfo,
  onToggleShowStand,
  handlerToggleVersionHistory,
  onEditAgent,
  onPublish,
}) => {
  return (
    <header
      className={cx(
        'flex',
        'items-center',
        'px-16',
        'py-16',
        'relative',
        styles.header,
      )}
    >
      <LeftOutlined />
      <img
        className={cx('radius-6', styles.avatar)}
        src={agentConfigInfo?.icon || (personal as string)}
        alt=""
      />
      <div className={cx('flex', 'flex-col', styles['header-info'])}>
        <div className={cx('flex', 'items-center')}>
          <h3 className={cx(styles['h-title'])}>{agentConfigInfo?.name}</h3>
          <FormOutlined
            className={cx(styles['edit-ico'])}
            onClick={onEditAgent}
          />
        </div>
        <div className={cx('flex', 'items-center', styles['agent-rel-info'])}>
          <ConditionRender condition={agentConfigInfo?.space?.icon}>
            <img src={agentConfigInfo?.space?.icon} alt="" />
          </ConditionRender>
          <span className={cx(styles['space-name'], 'text-ellipsis')}>
            {agentConfigInfo?.space?.name}
          </span>
          <span className={cx(styles['save-time'])}>
            草稿自动保存于{moment(agentConfigInfo?.modified).format('HH:mm')}
          </span>
        </div>
      </div>
      <h2 className={cx('absolute', styles['header-title'])}>编排</h2>
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <ICON_FOLD
          className={cx('cursor-pointer')}
          onClick={onToggleShowStand}
        />
        <ClockCircleOutlined
          className={cx(styles.ico, 'cursor-pointer')}
          onClick={handlerToggleVersionHistory}
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

export default AgentHeader;
