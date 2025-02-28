import ConditionRender from '@/components/ConditionRender';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SquareMenuItemProps {
  icon?: React.ReactNode;
  name: string;
  isActive: boolean;
  isDown?: boolean;
  onClick: () => void;
}

const SquareMenuItem: React.FC<SquareMenuItemProps> = ({
  icon,
  name,
  isActive,
  isDown,
  onClick,
}) => {
  return (
    <div
      className={cx('flex', 'items-center', styles.row, {
        [styles.active]: isActive,
      })}
      onClick={onClick}
    >
      <span className={cx(styles['icon-box'])}>{icon}</span>
      <h4>{name}</h4>
      <ConditionRender condition={isDown}>
        <DownOutlined className={cx(styles['icon-dropdown'])} />
      </ConditionRender>
    </div>
  );
};

export default SquareMenuItem;
