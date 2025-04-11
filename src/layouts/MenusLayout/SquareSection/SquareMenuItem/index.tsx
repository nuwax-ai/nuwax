import ConditionRender from '@/components/ConditionRender';
import type { SquareMenuItemProps } from '@/types/interfaces/square';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 广场菜单项组件
const SquareMenuItem: React.FC<SquareMenuItemProps> = ({
  icon,
  name,
  isActive,
  isDown,
  onClick,
}) => {
  return (
    <div
      className={cx('flex', 'items-center', styles.row, 'hover-deep', {
        [styles.active]: isActive,
      })}
      onClick={onClick}
    >
      <span className={cx(styles['icon-box'])}>{icon}</span>
      <h4 className={cx('flex-1')}>{name}</h4>
      <ConditionRender condition={isDown}>
        <DownOutlined className={cx(styles['icon-dropdown'])} />
      </ConditionRender>
    </div>
  );
};

export default SquareMenuItem;
