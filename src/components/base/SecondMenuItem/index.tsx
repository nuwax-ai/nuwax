import { DownOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import SubItem from './SubItem';

const cx = classNames.bind(styles);

// 二级菜单项组件
export interface SecondMenuItemProps {
  icon?: React.ReactNode | string;
  isFirst?: boolean;
  isOpen?: boolean;
  name: string;
  isActive?: boolean;
  isDown?: boolean;
  onClick: () => void;
}

// 二级菜单项组件
const SecondMenuItem: React.FC<SecondMenuItemProps> = ({
  icon,
  name,
  isActive = false,
  isFirst = false,
  isDown,
  isOpen = false,
  onClick,
}) => {
  return (
    <div
      className={cx('flex', 'items-center', styles.row, styles.mainItem, {
        [styles.active]: isActive,
        [styles.first]: isFirst,
        [styles.open]: isOpen,
      })}
      onClick={onClick}
    >
      <span
        className={cx(
          styles['icon-box'],
          'flex',
          'items-center',
          'content-center',
        )}
      >
        {typeof icon === 'string' ? (
          <img className={cx(styles['icon-image'])} src={icon} alt={name} />
        ) : (
          icon
        )}
      </span>
      <Typography.Text className={cx('flex-1')}>{name}</Typography.Text>
      {isDown ? <DownOutlined className={cx(styles['icon-dropdown'])} /> : null}
    </div>
  );
};

// ================== 类型扩展：为 SecondMenuItem 添加 SubItem 静态属性 ==================
// 由于 TypeScript 默认不允许直接为函数组件添加自定义静态属性，
// 这里通过类型断言扩展 SecondMenuItem 的类型，确保类型安全和代码提示。

// 1. 定义带有 SubItem 静态属性的新类型
interface SecondMenuItemComponent extends React.FC<SecondMenuItemProps> {
  /**
   * SubItem 子菜单项组件
   * 用于在外部通过 SecondMenuItem.SubItem 方式访问
   */
  SubItem: typeof SubItem;
}

// 2. 类型断言，将 SecondMenuItem 转为扩展后的类型
const SecondMenuItemWithSub: SecondMenuItemComponent =
  SecondMenuItem as SecondMenuItemComponent;

// 3. 挂载子组件
SecondMenuItemWithSub.SubItem = SubItem;

// 4. 导出带有 SubItem 静态属性的组件
export default SecondMenuItemWithSub;
