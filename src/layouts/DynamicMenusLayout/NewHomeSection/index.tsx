/**
 * NewHomeSection 分发器（2026-09-12 单栏/经典双形态拆分）。
 *
 * 数据层统一收在 useHomeSectionData（列表/搜索/事件/选中关系接线），本组件按形态
 * 分发表现层——两者互斥挂载（DynamicMenusLayout 按导航风格单挂其一）：
 * - 单栏（style3，不传 showSearchHeader）：SidebarNavHomeSection——项目/任务
 *   双分组折叠形态（原型同款），头部由 SidebarNavHeader 提供
 * - 经典（style1/2，传 showSearchHeader）：ClassicHomeSection——搜索头 + 任务/
 *   项目 tab 切换（改版前形态）
 */
import classNames from 'classnames';
import React from 'react';

import ClassicHomeSection from './ClassicHomeSection';
import styles from './index.less';
import SidebarNavHomeSection from './SidebarNavHomeSection';
import { useHomeSectionData } from './useHomeSectionData';

const cx = classNames.bind(styles);

const NewHomeSection: React.FC<{
  style?: React.CSSProperties;
  /** 经典布局（style1/2）：渲染顶部搜索框 + 新建会话入口 + 任务/项目 tab 切换；
   * 单栏（style3）不传：SidebarNavHeader 提供头部，列表区为「项目/任务」双分组折叠形态（原型同款） */
  showSearchHeader?: boolean;
}> = ({ style, showSearchHeader = false }) => {
  const shell = useHomeSectionData({ isSidebarNavMode: !showSearchHeader });

  return (
    <div style={style} className={cx(styles['new-home-section'])}>
      {showSearchHeader ? (
        <ClassicHomeSection shell={shell} />
      ) : (
        <SidebarNavHomeSection shell={shell} />
      )}
    </div>
  );
};

export default NewHomeSection;
