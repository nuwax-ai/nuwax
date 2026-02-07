import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ResourceItemProps {
  /** 资源图标 */
  icon?: string;
  /** 资源名称 */
  name: string;
  /** 资源ID */
  targetId: number;
  /** 点击添加按钮的回调函数 */
  onAdd?: (targetId: number) => void;
  onDelete?: (targetId: number) => void;
  /** 是否已添加（用于显示已添加状态） */
  isAdded?: boolean;
}

/**
 * 资源列表组件
 * 用于渲染智能体或应用页面列表，支持选择功能
 */
const ResourceItem: React.FC<ResourceItemProps> = ({
  icon,
  name,
  targetId,
  onAdd,
  onDelete,
  isAdded = false,
}) => {
  return (
    <div className={cx(styles.listItem, 'flex', 'items-center')}>
      <div className={cx(styles.itemIcon)}>
        {icon ? (
          <img src={icon} alt="icon" className={cx(styles.iconImg)} />
        ) : (
          <div className={cx(styles.iconPlaceholder)} />
        )}
      </div>
      <div className={cx(styles.itemMain, 'flex-1')}>
        <div className={cx(styles.itemTitle, 'text-ellipsis')}>{name}</div>
      </div>
      <div className={cx(styles.itemExtra)}>
        {onAdd && (
          <Button
            type={'default'}
            size="small"
            disabled={isAdded}
            onClick={() => onAdd(targetId)}
          >
            {isAdded ? '已添加' : '添加'}
          </Button>
        )}
        {onDelete && (
          <Button
            type={'default'}
            size="small"
            onClick={() => onDelete(targetId)}
          >
            删除
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResourceItem;
