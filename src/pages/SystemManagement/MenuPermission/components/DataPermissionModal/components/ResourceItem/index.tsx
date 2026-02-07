import AgentImage from '@/assets/images/agent_image.png';
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
  description: string;
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
  description,
  targetId,
  onAdd,
  onDelete,
  isAdded = false,
}) => {
  return (
    <div className={cx(styles.listItem, 'flex', 'items-center')}>
      <div className={cx(styles['img-box'], 'radius-6')}>
        <img
          src={icon || AgentImage}
          alt="icon"
          className={cx(styles.iconImg)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = AgentImage;
          }}
        />
      </div>
      <div className={cx(styles.itemMain, 'flex-1')}>
        <div className={cx(styles.itemTitle, 'text-ellipsis')}>{name}</div>
        <ConditionRender condition={description}>
          <div className={cx(styles.itemDescription, 'text-ellipsis')}>
            {description}
          </div>
        </ConditionRender>
      </div>
      <div className={cx(styles.itemExtra)}>
        {onAdd && (
          <Button
            type="default"
            size="small"
            disabled={isAdded}
            className={cx(styles.btn)}
            onClick={() => onAdd(targetId)}
          >
            {isAdded ? '已添加' : '添加'}
          </Button>
        )}
        {onDelete && (
          <Button
            type="default"
            size="small"
            className={cx(styles.btn)}
            onClick={() => onDelete(targetId)}
          >
            移除
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResourceItem;
