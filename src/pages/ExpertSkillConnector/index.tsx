/**
 * 专家·技能·连接器框架页
 * @description 左侧分类菜单（菜单接口驱动/本地兜底）+ 右侧聚合内容。
 * 子页面（专家/技能/连接器/"更多"列表）均为扁平路由指向本组件，内部按路径解析渲染
 */

import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useLocation } from 'umi';
import CategorySidebar from './components/CategorySidebar';
import ResourceAggregation from './components/ResourceAggregation';
import { parseEscPath } from './constants';
import styles from './index.less';

const cx = classNames.bind(styles);

const ExpertSkillConnector: React.FC = () => {
  const location = useLocation();

  // 按路径解析资源类型与是否"更多"聚合列表页
  const { resourceType, isList } = useMemo(
    () => parseEscPath(location.pathname),
    [location.pathname],
  );

  return (
    <div className={cx(styles.container, 'flex', 'h-full')}>
      <CategorySidebar activeKey={resourceType} />
      <div className={cx(styles['content-wrapper'])}>
        {/* key 保证资源类型/页面模式切换时聚合内容区状态重置 */}
        <ResourceAggregation
          key={`${resourceType}-${isList ? 'list' : 'framework'}`}
          resourceType={resourceType}
          mode={isList ? 'list' : 'framework'}
        />
      </div>
    </div>
  );
};

export default ExpertSkillConnector;
