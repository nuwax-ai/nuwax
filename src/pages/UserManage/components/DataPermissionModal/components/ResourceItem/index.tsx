import AgentImage from '@/assets/images/agent_image.png';
import ConditionRender from '@/components/ConditionRender';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ResourceItemProps {
  /** 资源图标 */
  icon?: string;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 资源名称 */
  name: string;
  /** 资源描述 */
  description: string;
}

/**
 * 资源列表组件
 * 用于渲染智能体或应用页面列表，支持选择功能
 */
const ResourceItem: React.FC<ResourceItemProps> = ({
  icon,
  showIcon = true,
  name,
  description,
}) => {
  return (
    <div className={cx(styles.listItem, 'flex', 'items-center')}>
      <ConditionRender condition={showIcon}>
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
      </ConditionRender>
      <div className={cx(styles.itemMain, 'flex-1')}>
        <div className={cx(styles.itemTitle, 'text-ellipsis')}>{name}</div>
        <ConditionRender condition={description}>
          <div className={cx(styles.itemDescription, 'text-ellipsis')}>
            {description}
          </div>
        </ConditionRender>
      </div>
    </div>
  );
};

export default ResourceItem;
