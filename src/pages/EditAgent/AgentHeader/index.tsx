import { ICON_FOLD } from '@/constants/images.constants';
import {
  ClockCircleOutlined,
  FormOutlined,
  LeftOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface AgentHeaderProps {
  onToggleShowStand: () => void;
  handlerToggleVersionHistory: () => void;
  onEditAgent: () => void;
  onPublish: () => void;
}

/**
 * 编辑智能体顶部header
 */
const AgentHeader: React.FC<AgentHeaderProps> = ({
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
        src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon1.png?lk3s=50ccb0c5&x-expires=1736843305&x-signature=F2kCeZKTRHYR2lcW6F2Q%2FDUmXtQ%3D"
        alt=""
      />
      <div className={cx('flex', 'flex-col', styles['header-info'])}>
        <div className={cx('flex', 'items-center')}>
          <h3 className={cx(styles['h-title'])}>角色陪伴</h3>
          <FormOutlined
            className={cx(styles['edit-ico'])}
            onClick={onEditAgent}
          />
        </div>
        <div className={cx('flex', 'items-center', styles['agent-rel-info'])}>
          <UserDeleteOutlined />
          <span className={cx(styles['space-name'], 'text-ellipsis')}>
            个人空间
          </span>
          <span className={cx(styles['save-time'])}>草稿自动保存于17:06</span>
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
