import classNames from 'classnames';
import React from 'react';
import MenuListItem from '../MenuListItem';
import styles from './index.less';

const cx = classNames.bind(styles);

// 二级菜单项下级组件
interface SubItemProps {
  icon?: React.ReactNode | string;
  isFirst?: boolean;
  name: string;
  isActive?: boolean;
  onClick: () => void;
}

// 二级菜单项下级组件
const SubItem: React.FC<SubItemProps> = ({
  icon,
  name,
  isActive = false,
  isFirst = false,
  onClick,
}) => {
  return (
    <MenuListItem
      icon={icon}
      name={name}
      className={cx(styles.secondMenuSubItem)}
      isActive={isActive}
      isFirst={isFirst}
      onClick={onClick}
    />
  );
};

export default SubItem;
