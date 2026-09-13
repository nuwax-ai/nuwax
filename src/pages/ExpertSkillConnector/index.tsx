/**
 * 专家·技能·连接器框架页
 * @description 左侧分类菜单（菜单接口驱动/本地兜底）+ 右侧聚合内容。
 * 子页面（专家/技能/连接器）均为扁平路由指向本组件，内部按路径解析渲染
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

  // 按路径解析资源类型
  const resourceType = useMemo(
    () => parseEscPath(location.pathname),
    [location.pathname],
  );

  /**
   * 导航重复点击的刷新令牌：主菜单（DynamicSecondMenu）与页内分类菜单
   * 点击都会带 _t: Date.now() 重新 push——重复点击当前项时路径不变但
   * state 变化，借此驱动下方内容区 remount 实现整区刷新（重拉数据、
   * 重置筛选与滚动）；跨类型点击本身换路径，_t 一并参与 key 无副作用
   */
  const refreshToken = (location.state as { _t?: number } | null)?._t ?? 0;

  return (
    <div className={cx(styles.container, 'flex', 'h-full')}>
      <CategorySidebar activeKey={resourceType} />
      <div className={cx(styles['content-wrapper'])}>
        {/* key 保证资源类型切换或导航重复点击时聚合内容区状态重置并刷新 */}
        <ResourceAggregation
          key={`${resourceType}-${refreshToken}`}
          resourceType={resourceType}
        />
      </div>
    </div>
  );
};

export default ExpertSkillConnector;
