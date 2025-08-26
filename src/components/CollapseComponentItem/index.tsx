import ConditionRender from '@/components/ConditionRender';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { CollapseComponentItemProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { Link } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体模型组件，插件、工作流、触发器等组件通用显示组件
const CollapseComponentItem: React.FC<CollapseComponentItemProps> = ({
  className,
  showImage = true,
  agentComponentInfo,
  defaultImage,
  extra,
}) => {
  // 跳转链接
  const link = useMemo(() => {
    const { targetId, type, targetConfig, spaceId } = agentComponentInfo;
    // 判断是否在当前空间下
    if (targetConfig && spaceId === targetConfig.spaceId) {
      // 类型不同，跳转链接不同
      switch (type) {
        case AgentComponentTypeEnum.Plugin: {
          // 插件类型不同，跳转链接不同
          if (targetConfig?.type === PluginTypeEnum.HTTP) {
            return `/space/${spaceId}/plugin/${targetId}`;
          } else {
            return `/space/${spaceId}/plugin/${targetId}/cloud-tool`;
          }
        }
        // 工作流、表格、知识库等类型，跳转链接不同
        case AgentComponentTypeEnum.Workflow:
          return `/space/${spaceId}/workflow/${targetId}`;
        case AgentComponentTypeEnum.Table:
          return `/space/${spaceId}/table/${targetId}`;
        case AgentComponentTypeEnum.Knowledge:
          return `/space/${spaceId}/knowledge/${targetId}`;
      }
    }
  }, [agentComponentInfo]);

  const innerContent = (
    <>
      <span className={cx('radius-6', styles['img-box'])}>
        {showImage && (
          <img src={agentComponentInfo.icon || defaultImage} alt="" />
        )}
      </span>
      <div
        className={cx(
          'flex-1',
          'flex',
          'flex-col',
          'content-center',
          'overflow-hide',
          styles['content-box'],
        )}
      >
        <h3 className={cx('text-ellipsis', styles.name)}>
          {agentComponentInfo.name}
        </h3>
        <ConditionRender condition={agentComponentInfo.description}>
          <p className={cx('text-ellipsis', styles.desc)}>
            {agentComponentInfo.description}
          </p>
        </ConditionRender>
      </div>
    </>
  );

  return (
    <div className={cx('flex', 'items-center', styles.container, className)}>
      {link ? (
        <Link
          to={link}
          target="_blank"
          className={cx(
            'flex-1',
            'flex',
            'items-center',
            'overflow-hide',
            styles['gap-6'],
          )}
        >
          {innerContent}
        </Link>
      ) : (
        <div
          className={cx(
            'flex-1',
            'flex',
            'items-center',
            'overflow-hide',
            styles['gap-6'],
          )}
        >
          {innerContent}
        </div>
      )}
      <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
        {extra}
      </div>
    </div>
  );
};

export default CollapseComponentItem;
