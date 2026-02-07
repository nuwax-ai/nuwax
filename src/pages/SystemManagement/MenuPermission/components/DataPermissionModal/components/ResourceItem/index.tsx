import ConditionRender from '@/components/ConditionRender';
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
  /** 资源描述 */
  description?: string;
  /** 资源ID */
  targetId: number;
  /** 点击添加按钮的回调函数 */
  onAdd?: (targetId: number) => void;
  onDelete?: (targetId: number) => void;
}

/**
 * 资源列表组件
 * 用于渲染智能体或应用页面列表，支持选择功能
 */
const ResourceItem: React.FC<ResourceItemProps> = ({
  icon,
  name,
  description,
  targetId,
  onAdd,
  onDelete,
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
        <ConditionRender condition={description}>
          <div className={cx(styles.itemDesc, 'text-ellipsis')}>
            {description}
          </div>
        </ConditionRender>
      </div>
      <div className={cx(styles.itemExtra)}>
        {onAdd && (
          <Button type={'default'} size="small" onClick={() => onAdd(targetId)}>
            添加
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
