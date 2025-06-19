import ConditionRender from '@/components/ConditionRender';
import { McpCollapseComponentItemProps } from '@/types/interfaces/mcp';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// Mcp组件：插件、工作流、知识库、数据表等组件通用显示组件
const McpCollapseComponentItem: React.FC<McpCollapseComponentItemProps> = ({
  componentInfo,
  defaultImage,
  extra,
}) => {
  const innerContent = (
    <>
      <span className={cx('radius-6', styles['img-box'])}>
        <img src={componentInfo.icon || defaultImage} alt="" />
      </span>
      <div
        className={cx(
          'flex-1',
          'flex',
          'flex-col',
          'content-center',
          'overflow-hide',
        )}
      >
        <h3 className={cx('text-ellipsis', styles.name)}>
          {componentInfo.name}
        </h3>
        <ConditionRender condition={componentInfo.description}>
          <p className={cx('text-ellipsis', styles.desc)}>
            {componentInfo.description}
          </p>
        </ConditionRender>
      </div>
    </>
  );

  return (
    <div className={cx('flex', 'items-center', styles.container)}>
      <div className={cx('flex-1', 'flex', 'overflow-hide', styles['gap-6'])}>
        {innerContent}
      </div>
      <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
        {extra}
      </div>
    </div>
  );
};

export default McpCollapseComponentItem;
